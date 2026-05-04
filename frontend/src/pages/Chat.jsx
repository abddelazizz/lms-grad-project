import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services';
import { io } from 'socket.io-client';
import '../styles/Dashboard.css';

const Chat = () => {
  const { user, accessToken } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef();

  // 1. Initialize Socket.io
  useEffect(() => {
    if (!accessToken) return;
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    socketRef.current = io(API_BASE, {
      auth: { token: accessToken },
      withCredentials: true
    });

    // Handle incoming messages
    socketRef.current.on('new_message', (msg) => {
      if (selectedConv && msg.conversation_id === selectedConv.conversation_id) {
        setMessages(prev => [...prev, msg]);
        // Auto mark as read if we are looking at the chat
        socketRef.current.emit('mark_read', { conversationId: selectedConv.conversation_id });
      }
    });

    // Handle conversation updates (for the sidebar list)
    socketRef.current.on('conversation_updated', (update) => {
      setConversations(prev => {
        const index = prev.findIndex(c => c.conversation_id === update.conversation_id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...update };
          // Move to top
          const item = updated.splice(index, 1)[0];
          return [item, ...updated];
        }
        return [update, ...prev];
      });
    });

    // Handle typing status
    socketRef.current.on('typing', (data) => {
      if (selectedConv && data.conversationId === selectedConv.conversation_id && data.userId !== user.user_id) {
        setIsTyping(true);
      }
    });

    socketRef.current.on('stop_typing', (data) => {
      if (selectedConv && data.conversationId === selectedConv.conversation_id && data.userId !== user.user_id) {
        setIsTyping(false);
      }
    });

    // Handle read receipts
    socketRef.current.on('messages_read', (data) => {
      if (selectedConv && data.conversationId === selectedConv.conversation_id) {
        setMessages(prev => prev.map(m => m.sender_id === user.user_id ? { ...m, is_read: true } : m));
      }
    });

    // Handle online status
    socketRef.current.on('online_status', ({ userId, isOnline }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (isOnline) newSet.add(userId);
        else newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [accessToken, selectedConv, user.user_id]);

  // 2. Fetch Conversations
  const fetchConversations = async () => {
    try {
      const res = await chatService.getConversations();
      setConversations(res.data.data.conversations || []);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    setSearching(true);
    try {
      // Get users to chat with (if student, get instructors; if instructor, get students)
      const res = user.role === 'student' ? await chatService.api.get('/admin/instructors') : await chatService.api.get('/admin/students');
      const users = res.data?.data?.data || res.data?.data || [];
      setAvailableUsers(users.filter(u => (u.user_id || u.id) !== user.user_id));
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateChat = async (otherUserId) => {
    try {
      const res = await chatService.createConversation(otherUserId);
      const newConv = res.data?.data?.conversation || res.data?.conversation;
      if (newConv) {
        setConversations(prev => [newConv, ...prev]);
        setSelectedConv(newConv);
        setShowNewChatModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Fetch History when conversation selected
  useEffect(() => {
    if (selectedConv) {
      const fetchHistory = async () => {
        try {
          const res = await chatService.getMessages(selectedConv.conversation_id);
          setMessages(res.data.data.messages.reverse() || []);
          // Join conversation room
          socketRef.current.emit('join_conversation', { conversationId: selectedConv.conversation_id });
          // Mark as read
          socketRef.current.emit('mark_read', { conversationId: selectedConv.conversation_id });
        } catch (err) {
          console.error("Failed to fetch history", err);
        }
      };
      fetchHistory();

      return () => {
        socketRef.current.emit('leave_conversation', { conversationId: selectedConv.conversation_id });
      };
    }
  }, [selectedConv]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConv) return;

    socketRef.current.emit('send_message', {
      conversationId: selectedConv.conversation_id,
      content: newMessage
    });

    setNewMessage('');
    handleStopTyping();
  };

  const handleStartTyping = () => {
    if (!selectedConv) return;
    socketRef.current.emit('typing', { conversationId: selectedConv.conversation_id });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleStopTyping, 3000);
  };

  const handleStopTyping = () => {
    if (!selectedConv) return;
    socketRef.current.emit('stop_typing', { conversationId: selectedConv.conversation_id });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard/chat" />

        <div className="main-dashboard-content w-100 p-4">
          <div className="container-fluid pt-5 mt-4 mx-auto" style={{ maxWidth: '1100px' }}>

            <div className="row g-0 rounded-4 overflow-hidden shadow-sm border bg-white" style={{ minHeight: '700px' }}>

              {/* Sidebar: Conversations List */}
              <div className="col-md-4 border-end bg-light-gray d-flex flex-column">
                <div className="p-4 border-bottom bg-white d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">Chat</h5>
                  <i className="fas fa-edit text-primary-custom cursor-pointer" onClick={openNewChatModal}></i>
                </div>
                
                <div className="flex-grow-1 overflow-auto">
                  {loading ? (
                    <div className="text-center p-5"><i className="fas fa-circle-notch fa-spin text-muted"></i></div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center p-5 text-muted small">No conversations yet.</div>
                  ) : conversations.map(c => (
                    <div
                      key={c.conversation_id}
                      className={`d-flex align-items-center gap-3 p-3 border-bottom cursor-pointer transition-all ${selectedConv?.conversation_id === c.conversation_id ? 'bg-white shadow-sm border-start border-primary border-4' : 'hover-bg-gray'}`}
                      onClick={() => setSelectedConv(c)}
                    >
                      <div className="position-relative">
                        <img
                          src={c.otherUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.otherUser.name)}&background=random`}
                          className="rounded-circle" style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          alt=""
                        />
                        {onlineUsers.has(c.otherUser.user_id) && (
                          <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"></span>
                        )}
                      </div>
                      <div className="overflow-hidden flex-grow-1">
                        <div className="d-flex justify-content-between align-items-baseline">
                          <div className="fw-bold text-dark small text-truncate">{c.otherUser.name}</div>
                          {c.lastMessage && (
                            <div className="text-muted" style={{ fontSize: '10px' }}>
                              {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className={`text-truncate ${c.unreadCount > 0 ? 'fw-bold text-dark' : 'text-muted'}`} style={{ fontSize: '12px' }}>
                            {c.lastMessage?.content || 'No messages yet'}
                          </div>
                          {c.unreadCount > 0 && (
                            <span className="badge rounded-pill bg-primary" style={{ fontSize: '10px' }}>{c.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main: Chat View */}
              <div className="col-md-8 d-flex flex-column bg-white">
                {selectedConv ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white">
                      <div className="d-flex align-items-center gap-3">
                        <div className="position-relative">
                           <img src={selectedConv.otherUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConv.otherUser.name)}&background=random`} className="rounded-circle" style={{ width: '45px', height: '45px', objectFit: 'cover' }} alt="" />
                           {onlineUsers.has(selectedConv.otherUser.user_id) && (
                             <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"></span>
                           )}
                        </div>
                        <div>
                          <div className="fw-bold small">{selectedConv.otherUser.name}</div>
                          <div className="text-success" style={{ fontSize: '11px', fontWeight: '500' }}>
                            {isTyping ? 'Typing...' : onlineUsers.has(selectedConv.otherUser.user_id) ? 'Online' : 'Offline'}
                          </div>
                        </div>
                      </div>
                      <div className="hstack gap-3 text-muted">
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-grow-1 p-4 overflow-auto bg-light" style={{ maxHeight: '520px' }}>
                      <div className="d-flex flex-column gap-3">
                        {messages.map((m, i) => (
                          <div key={m.message_id || i} className={`d-flex ${m.sender_id === user.user_id ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div className="d-flex flex-column" style={{ maxWidth: '75%' }}>
                               <div
                                 className={`p-3 rounded-4 shadow-sm ${m.sender_id === user.user_id ? 'bg-primary-custom text-white' : 'bg-white text-dark'}`}
                                 style={{
                                   fontSize: '14px',
                                   borderRadius: m.sender_id === user.user_id ? '18px 18px 2px 18px' : '18px 18px 18px 2px'
                                 }}
                               >
                                 {m.content}
                               </div>
                               <div className={`d-flex align-items-center gap-1 mt-1 ${m.sender_id === user.user_id ? 'justify-content-end' : 'justify-content-start'}`} style={{ fontSize: '10px', opacity: 0.6 }}>
                                 {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 {m.sender_id === user.user_id && (
                                   <i className={`fas fa-check-double ${m.is_read ? 'text-info' : ''}`}></i>
                                 )}
                               </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 border-top bg-white">
                      <div className="d-flex align-items-center gap-3 bg-light-gray p-2 rounded-pill px-3">
                        <button className="btn btn-link text-muted p-0"><i className="far fa-grin fs-5"></i></button>
                        <input
                          type="text"
                          className="form-control border-0 bg-transparent shadow-none"
                          placeholder="Write a message..."
                          value={newMessage}
                          onChange={(e) => { setNewMessage(e.target.value); handleStartTyping(); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button 
                          className="btn btn-primary-custom rounded-circle p-0 d-flex align-items-center justify-content-center shadow"
                          style={{ width: '45px', height: '45px' }}
                          onClick={handleSend}
                        >
                          <i className="fas fa-paper-plane text-white" style={{ fontSize: '16px' }}></i>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted bg-light">
                    <div className="bg-white p-5 rounded-circle shadow-sm mb-4">
                      <i className="fas fa-comments fs-1 text-primary-custom opacity-50"></i>
                    </div>
                    <h5 className="fw-bold text-dark">Your Messages</h5>
                    <p className="small">Select a conversation to start chatting with your instructor or student.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ProfileSidebar />
      </div>

      {showNewChatModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="bg-white p-5 rounded-4 shadow-lg border" style={{ maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold mb-0">New Conversation</h4>
              <button className="btn-close" onClick={() => setShowNewChatModal(false)}></button>
            </div>
            
            <div className="vstack gap-3 mt-3">
              {searching ? (
                <div className="text-center p-4"><div className="spinner-border text-primary"></div></div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center p-4 text-muted">No users found to chat with.</div>
              ) : availableUsers.map(u => (
                <div 
                  key={u.user_id || u.id} 
                  className="d-flex align-items-center gap-3 p-3 border rounded-3 hover-bg-gray cursor-pointer"
                  onClick={() => handleCreateChat(u.user_id || u.id)}
                >
                  <img src={u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`} className="rounded-circle" style={{ width: '40px', height: '40px', objectFit: 'cover' }} alt="" />
                  <div>
                    <div className="fw-bold small">{u.name || u.User?.name}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>{u.role || (user.role === 'student' ? 'Instructor' : 'Student')}</div>
                  </div>
                  <i className="fas fa-chevron-right ms-auto text-muted opacity-50"></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
