import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { FiSearch, FiMessageSquare } from 'react-icons/fi';
import './HomePage.css';

const HomePage = ({ setActivePage, setTargetUser, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Kuzana abakoresha bose
  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const usersList = [];

      if (data) {
        for (let phone in data) {
          usersList.push({ id: phone, phone, ...data[phone] });
        }
      }

      setUsers(usersList);
    });
  }, []);

  // Kubara ubutumwa butarasomwa kuri buri chat ifitanye na currentUser
  useEffect(() => {
    if (!currentUser?.phone) return;

    const chatsRef = ref(db, 'chats');
    onValue(chatsRef, (snapshot) => {
      const chatsData = snapshot.val() || {};
      const counts = {};

      Object.keys(chatsData).forEach((chatId) => {
        // split kuri underscore "_"
        const [phone1, phone2] = chatId.split('_');
        if (phone1 === currentUser.phone || phone2 === currentUser.phone) {
          const messages = chatsData[chatId].messages || {};
          const otherUser = phone1 === currentUser.phone ? phone2 : phone1;

          let unread = 0;
          Object.values(messages).forEach((msg) => {
            if (msg.to === currentUser.phone && !msg.read) {
              unread++;
            }
          });

          counts[otherUser] = unread;
        }
      });

      setUnreadCounts(counts);
    });
  }, [currentUser]);

  // Filtering users: search + kurenga currentUser
  const filteredUsers = users
    .filter((user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((user) =>
      currentUser?.phone ? user.phone !== currentUser.phone : true
    );

  const handleChatClick = (user) => {
    setTargetUser(user);
    setActivePage('chat');
  };

  return (
    <div className="home-container">
      <div className="search-bar-container">
        <div className="search-bar">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Shaka ukoresha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="user-list">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <img
                  src={user.profilePic || 'https://via.placeholder.com/50'}
                  alt="avatar"
                  className="avatar"
                  onClick={() => setSelectedUser(user)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="user-text">
                  <h4>{user.username || 'Izina ritabashije kuboneka'}</h4>
                  <p className="bio">{user.bio || 'Nta bio.'}</p>
                </div>
              </div>
              <button
                className="chat-btn"
                onClick={() => handleChatClick(user)}
              >
                <FiMessageSquare size={18} /> Chat
                {unreadCounts[user.phone] > 0 && (
                  <span className="unread-badge">{unreadCounts[user.phone]}</span>
                )}
              </button>
            </div>
          ))
        ) : (
          <p className="no-users">Nta mukoresha wabonetse.</p>
        )}
      </div>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-card">
            <img
              src={selectedUser.profilePic || 'https://via.placeholder.com/150'}
              alt="avatar"
              className="modal-avatar"
            />
            <h2>{selectedUser.username}</h2>
            <p>{selectedUser.bio || 'Nta bio ihari.'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
