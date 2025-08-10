import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
  ref,
  onChildAdded,
  push,
  set,
  off,
  onValue,
  update
} from "firebase/database";
import "./ChatWindow.css";

function ChatWindow({ currentUser, targetUser }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTargetOnline, setIsTargetOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const isValidChat =
    currentUser && targetUser && currentUser.phone && targetUser.phone;

  const chatId = isValidChat
    ? currentUser.phone < targetUser.phone
      ? `${currentUser.phone}_${targetUser.phone}`
      : `${targetUser.phone}_${currentUser.phone}`
    : null;

  // Handle messages
  useEffect(() => {
    if (!isValidChat) return;

    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const listener = onChildAdded(messagesRef, (snapshot) => {
      const msg = snapshot.val();
      setMessages((prev) => {
        if (!prev.some((m) => m.timestamp === msg.timestamp)) {
          return [...prev, msg];
        }
        return prev;
      });
    });

    return () => off(messagesRef, "child_added", listener);
  }, [chatId, isValidChat]);

  // Update read status
  useEffect(() => {
    if (!isValidChat) return;

    const lastSeenRef = ref(db, `chats/${chatId}/lastSeenBy/${currentUser.phone}`);
    set(lastSeenRef, Date.now());
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if target user is online
  useEffect(() => {
    if (!targetUser?.phone) return;
    const presenceRef = ref(db, `presence/${targetUser.phone}/isOnline`);
    const unsub = onValue(presenceRef, (snapshot) => {
      setIsTargetOnline(snapshot.val() === true);
    });
    return () => off(presenceRef, "value", unsub);
  }, [targetUser]);

  const handleSend = async () => {
    if (text.trim() === "" || !isValidChat) return;

    const newMessage = {
      text,
      sender: currentUser.phone,
      timestamp: Date.now()
    };

    const newMsgRef = push(ref(db, `chats/${chatId}/messages`));
    await set(newMsgRef, newMessage);
    setText("");
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "30px";
      el.style.height = Math.min(el.scrollHeight, 100) + "px";
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const lastSeenBy = ref(db, `chats/${chatId}/lastSeenBy/${targetUser.phone}`);
  const [seenTimestamp, setSeenTimestamp] = useState(0);

  useEffect(() => {
    if (!isValidChat) return;
    const seenListener = onValue(lastSeenBy, (snap) => {
      setSeenTimestamp(snap.val() || 0);
    });
    return () => off(lastSeenBy, "value", seenListener);
  }, [chatId]);

  return (
    <div className="chat-window">
      {!isValidChat ? (
        <div>Loading chat...</div>
      ) : (
        <>
          <div className="chat-header">
            <h3>{targetUser.username || "User"}</h3>
            <span className={`status-dot ${isTargetOnline ? "online" : "offline"}`}>
              {isTargetOnline ? "Online" : "Offline"}
            </span>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => {
              const isSender = msg.sender === currentUser.phone;
              const isSeen = !isSender || msg.timestamp <= seenTimestamp;

              return (
                <div key={idx} className={`message-row ${isSender ? "sent" : "received"}`}>
                  <div className="message-bubble">
                    <div>{msg.text}</div>
                    <div className="message-meta">
                      <span>{formatTime(msg.timestamp)}</span>
                      {isSender && (
                        <span className="seen-status">
                          {isSeen ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <textarea
              ref={textareaRef}
              className="chat-input-field"
              value={text}
              onChange={handleInputChange}
              placeholder="Andika ubutumwa..."
              rows={1}
              style={{ height: "30px", backgroundColor: "#fff", padding: "5px", resize: "none" }}
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatWindow;
