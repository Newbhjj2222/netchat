import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { ref, onChildAdded, push, set, off, onValue, update } from "firebase/database";
import { FiPaperclip } from "react-icons/fi";
import "./ChatWindow.css";

function ChatWindow({ currentUser, targetUser }) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null); // Base64
  const [messages, setMessages] = useState([]);
  const [isTargetOnline, setIsTargetOnline] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const isValidChat = currentUser && targetUser && currentUser.phone && targetUser.phone;
  const chatId = isValidChat
    ? currentUser.phone < targetUser.phone
      ? `${currentUser.phone}_${targetUser.phone}`
      : `${targetUser.phone}_${currentUser.phone}`
    : null;

  // Listen messages
  useEffect(() => {
    if (!isValidChat) return;
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const listener = onChildAdded(messagesRef, (snapshot) => {
      const msg = snapshot.val();
      setMessages((prev) => (!prev.some((m) => m.timestamp === msg.timestamp) ? [...prev, msg] : prev));
    });
    return () => off(messagesRef, "child_added", listener);
  }, [chatId, isValidChat]);

  // Update last seen
  useEffect(() => {
    if (!isValidChat) return;
    const lastSeenRef = ref(db, `chats/${chatId}/lastSeenBy/${currentUser.phone}`);
    set(lastSeenRef, Date.now());
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check target online
  useEffect(() => {
    if (!targetUser?.phone) return;
    const presenceRef = ref(db, `presence/${targetUser.phone}/isOnline`);
    const unsub = onValue(presenceRef, (snap) => setIsTargetOnline(snap.val() === true));
    return () => off(presenceRef, "value", unsub);
  }, [targetUser]);

  // Mark current user as online
  useEffect(() => {
    if (!currentUser?.phone) return;
    const myPresenceRef = ref(db, `presence/${currentUser.phone}`);
    set(myPresenceRef, { isOnline: true });
    const handleDisconnect = () => set(myPresenceRef, { isOnline: false });
    window.addEventListener("beforeunload", handleDisconnect);
    return () => {
      handleDisconnect();
      window.removeEventListener("beforeunload", handleDisconnect);
    };
  }, [currentUser]);

  const handleSend = async () => {
    if (!isValidChat) return;
    if (!text.trim() && !imageFile) return;

    const newMessage = {
      text: text || "",
      sender: currentUser.phone,
      to: targetUser.phone,
      read: false,
      timestamp: Date.now(),
      image: imageFile || null,
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text } : null
    };

    const newMsgRef = push(ref(db, `chats/${chatId}/messages`));
    await set(newMsgRef, newMessage);

    setText("");
    setImageFile(null);
    setReplyTo(null);
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "30px";
      el.style.height = Math.min(el.scrollHeight, 100) + "px";
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageFile(reader.result);
    reader.readAsDataURL(file);
  };

  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const lastSeenBy = ref(db, `chats/${chatId}/lastSeenBy/${targetUser.phone}`);
  const [seenTimestamp, setSeenTimestamp] = useState(0);
  useEffect(() => {
    if (!isValidChat) return;
    const listener = onValue(lastSeenBy, (snap) => setSeenTimestamp(snap.val() || 0));
    return () => off(lastSeenBy, "value", listener);
  }, [chatId]);

  const startReply = (msg) => setReplyTo({ id: msg.timestamp, text: msg.text });

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
            {messages.map((msg) => {
              const isSender = msg.sender === currentUser.phone;
              const isSeen = !isSender || msg.timestamp <= seenTimestamp;
              return (
                <div
                  key={msg.timestamp}
                  className={`message-row ${isSender ? "sent" : "received"}`}
                  onDoubleClick={() => !isSender && startReply(msg)}
                >
                  <div className="message-bubble">
                    {msg.replyTo && <div className="reply-preview">Reply to: {msg.replyTo.text}</div>}
                    {msg.image && <img src={msg.image} alt="sent" className="chat-image" />}
                    <div>{msg.text}</div>
                    <div className="message-meta">
                      <span>{formatTime(msg.timestamp)}</span>
                      {isSender && <span className="seen-status">{isSeen ? "✓✓" : "✓"}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Preview y'ifoto */}
          {imageFile && (
            <div className="image-preview">
              <img src={imageFile} alt="preview" />
              <button onClick={() => setImageFile(null)}>Remove</button>
            </div>
          )}

          {replyTo && (
            <div className="replying-info">
              Replying to: {replyTo.text}{" "}
              <button onClick={() => setReplyTo(null)}>Cancel</button>
            </div>
          )}

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
            <label className="image-upload-label">
              <FiPaperclip size={20} />
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </label>
            <button onClick={handleSend}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatWindow;
