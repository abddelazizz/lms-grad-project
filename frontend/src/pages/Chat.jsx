import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import { encryptMessage, decryptMessage } from '../utils/socketEncryption';
import '../styles/Dashboard.css';

const Chat = () => {
  const { user, accessToken, api, logout } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  // 1. Initialize Socket.io
  useEffect(() => {
    if (!accessToken) return;
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(API_BASE, {
      auth: { token: accessToken },
      withCredentials: true
    });

    socketRef.current.on('receive_message', async (data) => {
      // If we are currently chatting with this person, add message to list
      if (selectedContact && data.conversation_id === selectedContact.conversation_id) {
        const decryptedMsg = await decryptMessage(data.content, data.conversation_id);
        setMessages(prev => [...prev, { ...data, type: 'received', text: decryptedMsg }]);
      }
      // Re-fetch contacts to update last message preview
      fetchContacts();
    });

    socketRef.current.on('user_typing', (data) => {
      if (selectedContact && data.senderId === selectedContact.user_id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socketRef.current.on('token_revoked', () => {
      logout();
      window.location.href = '/login';
    });

    return () => socketRef.current.disconnect();
  }, [accessToken, selectedContact]);

  // 2. Fetch Contacts
  const fetchContacts = async () => {
    try {
      const res = await api.get('/chat/conversations');
      const convs = res.data?.data?.conversations || [];
      const formattedContacts = convs.map(c => ({
        conversation_id: c.conversation_id,
        user_id: c.otherUser.user_id,
        name: c.otherUser.name,
        picture: c.otherUser.picture,
        role: c.otherUser.role,
      }));
      setContacts(formattedContacts);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // 3. Fetch History when contact selected
  useEffect(() => {
    if (selectedContact && selectedContact.conversation_id) {
      const fetchHistory = async () => {
        try {
          const res = await api.get(`/chat/conversations/${selectedContact.conversation_id}/messages`);
          const history = res.data?.data?.messages || [];
          
          const decryptedHistory = await Promise.all(history.map(async m => {
             const text = await decryptMessage(m.content, selectedContact.conversation_id);
             return {
               ...m,
               type: m.sender_id === user?.user_id ? 'sent' : 'received',
               text
             }
          }));
          
          setMessages(decryptedHistory);
        } catch (err) {
          console.error("Failed to fetch history", err);
        }
      };
      fetchHistory();
    }
  }, [selectedContact, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const encryptedMsg = await encryptMessage(newMessage, selectedContact.conversation_id);
    const data = {
      conversationId: selectedContact.conversation_id,
      content: encryptedMsg
    };

    socketRef.current.emit('send_message', data);
    
    // Optimistic update
    setMessages(prev => [...prev, {
      sender_id: user.user_id,
      text: newMessage,
      type: 'sent',
      createdAt: new Date()
    }]);
    setNewMessage('');
  };

  const handleTyping = () => {
    if (selectedContact) {
      socketRef.current.emit('typing', { receiverId: selectedContact.user_id });
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard/chat" />

        <div className="main-dashboard-content w-100 p-4">
          <div className="container-fluid pt-5 mt-4 mx-auto" style={{ maxWidth: '1000px' }}>
            
            <div className="row g-0 rounded-4 overflow-hidden shadow-sm border" style={{ backgroundColor: '#fff', minHeight: '650px' }}>
              
              {/* Contacts Sidebar */}
              <div className="col-md-4 border-end bg-light">
                <div className="p-4 border-bottom bg-white">
                  <h5 className="fw-bold mb-0">Messages</h5>
                </div>
                <div className="overflow-auto" style={{ maxHeight: '580px' }}>
                  {loading ? (
                    <div className="text-center p-5 text-muted">Loading...</div>
                  ) : contacts.length === 0 ? (
                    <div className="text-center p-5 text-muted small">No active conversations.</div>
                  ) : contacts.map(c => (
                    <div 
                      key={c.user_id}
                      className={`d-flex align-items-center gap-3 p-3 border-bottom cursor-pointer transition-all ${selectedContact?.user_id === c.user_id ? 'bg-white shadow-sm' : 'hover-bg-gray'}`}
                      onClick={() => setSelectedContact(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="position-relative">
                        <img 
                          src={c.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`} 
                          className="rounded-circle" style={{ width: '45px', height: '45px', objectFit: 'cover' }} 
                          alt="" 
                        />
                        <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"></span>
                      </div>
                      <div className="overflow-hidden">
                        <div className="fw-bold text-dark small text-truncate">{c.name}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>{c.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="col-md-8 d-flex flex-column">
                {selectedContact ? (
                  <>
                    {/* Header */}
                    <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <img src={selectedContact.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContact.name)}&background=random`} className="rounded-circle" style={{ width: '40px', height: '40px' }} alt="" />
                        <div>
                          <div className="fw-bold small">{selectedContact.name}</div>
                          <div className="text-success" style={{ fontSize: '11px' }}>
                            {isTyping ? 'typing...' : 'online'}
                          </div>
                        </div>
                      </div>
                      <i className="fas fa-ellipsis-v text-muted cursor-pointer"></i>
                    </div>

                    {/* Messages */}
                    <div className="flex-grow-1 p-4 overflow-auto" style={{ backgroundColor: '#f8f9fa', maxHeight: '480px' }}>
                      <div className="d-flex flex-column gap-3">
                        {messages.map((m, i) => (
                          <div key={i} className={`d-flex ${m.type === 'sent' ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div 
                              className={`p-3 rounded-4 shadow-sm`} 
                              style={{ 
                                maxWidth: '75%', 
                                fontSize: '14px',
                                backgroundColor: m.type === 'sent' ? '#31506a' : '#fff',
                                color: m.type === 'sent' ? '#fff' : '#333',
                                borderRadius: m.type === 'sent' ? '18px 18px 2px 18px' : '18px 18px 18px 2px'
                              }}
                            >
                              {m.text}
                              <div className="text-end mt-1" style={{ fontSize: '10px', opacity: 0.6 }}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Input */}
                    <div className="p-3 border-top bg-white">
                      <div className="d-flex align-items-center gap-2 bg-light p-2 rounded-pill px-3">
                        <input 
                          type="text" 
                          className="form-control border-0 bg-transparent shadow-none" 
                          placeholder="Type your message..." 
                          value={newMessage}
                          onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button className="btn btn-primary rounded-circle p-0 d-flex align-items-center justify-content-center" 
                                style={{ width: '40px', height: '40px' }}
                                onClick={handleSend}>
                          <i className="fas fa-paper-plane" style={{ fontSize: '14px' }}></i>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                    <i className="fas fa-comments fs-1 mb-3 opacity-25"></i>
                    <p>Select a contact to start chatting</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default Chat;
