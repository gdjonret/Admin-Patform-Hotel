import React, { useMemo, useState, useEffect, useRef } from 'react';
import './Messages.css';
import { MdEmail, MdMarkEmailUnread, MdDone, MdPending, MdFilterList, MdSearch, MdRefresh, MdDelete, MdMoreVert } from 'react-icons/md';
import { useMessagesContext } from '../../context/MessagesContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/admin';

const STATUS_META = {
  new: {
    label: 'Nouveau',
    icon: <MdMarkEmailUnread />,
    className: 'status-new'
  },
  replied: {
    label: 'Traité',
    icon: <MdDone />,
    className: 'status-replied'
  }
};

const statusFilters = [
  { id: 'all', label: 'Tous' },
  { id: 'new', label: 'Nouveaux' },
  { id: 'replied', label: 'Traités' }
];

// Helper function to decode HTML entities
const decodeHtmlEntities = (text) => {
  if (!text) return text;
  
  // Create a textarea element to decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

// Helper function to format relative time with proper timezone handling
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  // Parse the ISO 8601 date string with timezone
  const date = new Date(dateString);
  const now = new Date();
  
  // Validate date
  if (isNaN(date.getTime())) return 'Date invalide';
  
  // Calculate difference in milliseconds
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Handle negative differences (future dates)
  if (diffMs < 0) return 'À l\'instant';
  
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR', { timeZone: 'Africa/Ndjamena' });
};

const formatFullDate = (dateString) => {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Date invalide';
  
  return date.toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Africa/Ndjamena'
  });
};

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const { refreshUnreadCount } = useMessagesContext();

  // Fetch messages from backend
  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/contact-messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      
      // Transform backend data to match frontend format
      const transformedMessages = data.map(msg => ({
        id: msg.id,
        sender: decodeHtmlEntities(msg.senderName),
        senderEmail: msg.senderEmail,
        subject: decodeHtmlEntities(msg.subject),
        snippet: decodeHtmlEntities(msg.message.substring(0, 100) + (msg.message.length > 100 ? '...' : '')),
        message: decodeHtmlEntities(msg.message),
        time: formatRelativeTime(msg.createdAt),
        status: msg.status.toLowerCase(),
        channel: msg.channel.toLowerCase(),
        isRead: msg.isRead,
        createdAt: msg.createdAt
      }));
      
      setMessages(transformedMessages);
      refreshUnreadCount();

      if (transformedMessages.length > 0) {
        setSelectedMessageId((prev) => {
          if (!prev) {
            return transformedMessages[0].id;
          }

          const stillExists = transformedMessages.some((msg) => msg.id === prev);
          return stillExists ? prev : transformedMessages[0].id;
        });
      } else {
        setSelectedMessageId(null);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load messages on component mount
  useEffect(() => {
    fetchMessages();
  }, []);

  const unreadCount = useMemo(() => messages.filter((msg) => msg.status === 'new').length, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        msg.sender.toLowerCase().includes(term) ||
        msg.subject.toLowerCase().includes(term) ||
        msg.snippet.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [messages, statusFilter, searchTerm]);

  useEffect(() => {
    if (filteredMessages.length === 0) {
      setSelectedMessageId(null);
      return;
    }

    setSelectedMessageId((prev) => {
      if (!prev) {
        return filteredMessages[0].id;
      }

      const exists = filteredMessages.some((msg) => msg.id === prev);
      return exists ? prev : filteredMessages[0].id;
    });
  }, [filteredMessages]);

  const selectedMessage = useMemo(
    () => (selectedMessageId ? messages.find((msg) => msg.id === selectedMessageId) || null : null),
    [messages, selectedMessageId]
  );

  const handleRefresh = () => {
    fetchMessages();
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/contact-messages/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id
            ? {
                ...msg,
                isRead: true
              }
            : msg
        )
      );
      refreshUnreadCount();
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/contact-messages/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id
            ? {
                ...msg,
                status: newStatus.toLowerCase()
              }
            : msg
        )
      );
      refreshUnreadCount();
    } catch (err) {
      console.error('Error updating message status:', err);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/contact-messages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Remove from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      setSelectedMessageId(null);
      refreshUnreadCount();
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Erreur lors de la suppression du message');
    }
  };

  useEffect(() => {
    if (selectedMessage && !selectedMessage.isRead) {
      handleMarkAsRead(selectedMessage.id);
    }
  }, [selectedMessage]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="messages-page">
      <header className="messages-header">
        <div>
          <h1>Messages du site web</h1>
          <p>Messages reçus via le formulaire de contact du site public.</p>
        </div>
        <div className="messages-header-actions">
          <div className="unread-pill">
            <MdMarkEmailUnread />
            <span>{unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}</span>
          </div>
          <button type="button" className="refresh-button" onClick={handleRefresh}>
            <MdRefresh size={20} />
            Actualiser
          </button>
        </div>
      </header>

      <section className="messages-toolbar">
        <div className="search-bar">
          <MdSearch />
          <input
            type="search"
            placeholder="Rechercher un nom, un sujet ou un mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <span><MdFilterList /> Filtrer par statut</span>
            <div className="filter-chips">
              {statusFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`chip ${statusFilter === filter.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="messages-content">
        {loading ? (
          <div className="messages-empty">
            <div className="empty-icon">⏳</div>
            <h3>Chargement des messages...</h3>
          </div>
        ) : error ? (
          <div className="messages-empty">
            <div className="empty-icon">⚠️</div>
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button onClick={handleRefresh} className="refresh-button">Réessayer</button>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="messages-empty">
            <div className="empty-icon">📭</div>
            <h3>Aucun message trouvé</h3>
            <p>Essayez de modifier vos filtres ou votre recherche.</p>
          </div>
        ) : (
          <div className="messages-layout">
            <div className="messages-list-panel">
              <header className="list-panel-header">
                <h2>Conversations</h2>
                <span>{filteredMessages.length} message{filteredMessages.length > 1 ? 's' : ''}</span>
              </header>
              <div className="messages-list">
                {filteredMessages.map((msg) => {
                  const statusMeta = STATUS_META[msg.status] || STATUS_META.new;
                  const isActive = selectedMessageId === msg.id;

                  return (
                    <button
                      key={msg.id}
                      type="button"
                      className={`message-summary ${msg.status} ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedMessageId(msg.id)}
                    >
                      <div className="summary-top">
                        <div className="summary-sender">
                          <span className="summary-name">{msg.sender}</span>
                          {!msg.isRead && <span className="summary-badge">●</span>}
                        </div>
                        <span className="summary-time">{msg.time}</span>
                      </div>
                      <p className="summary-subject">{msg.subject}</p>
                      <p className="summary-snippet">{msg.snippet || msg.message}</p>
                      <div className="summary-meta">
                        <span className={`summary-status ${statusMeta.className}`}>{statusMeta.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="message-detail-panel">
              {selectedMessage ? (
                <div className="message-detail">
                  <header className="detail-header">
                    <div className="detail-title">
                      <div className="detail-avatar">
                        {selectedMessage.sender.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2>{selectedMessage.sender}</h2>
                        <a className="detail-email" href={`mailto:${selectedMessage.senderEmail}`}>
                          {selectedMessage.senderEmail}
                        </a>
                      </div>
                    </div>
                    <div className="detail-meta">
                      <span className="detail-date">Envoyé le {formatFullDate(selectedMessage.createdAt)}</span>
                      <span className={`message-status ${STATUS_META[selectedMessage.status]?.className || STATUS_META.new.className}`}>
                        {STATUS_META[selectedMessage.status]?.icon || STATUS_META.new.icon}
                        <span>{STATUS_META[selectedMessage.status]?.label || STATUS_META.new.label}</span>
                      </span>
                      <div ref={menuRef} style={{position: 'relative'}}>
                        <button
                          className="dots-menu-btn"
                          onClick={() => setShowMenu(!showMenu)}
                        >
                          ⋮
                        </button>
                        {showMenu && (
                          <div className="dots-menu">
                            <button onClick={() => {
                              setShowMenu(false);
                              handleDeleteMessage(selectedMessage.id);
                            }}>
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </header>

                  <section className="detail-body">
                    <h3>Objet</h3>
                    <p>{selectedMessage.subject}</p>

                    <h3>Message</h3>
                    <article className="detail-message">
                      <p>{selectedMessage.message}</p>
                    </article>
                  </section>

                  <footer className="detail-footer">
                    <div className="detail-actions">
                      <button
                        type="button"
                        className="message-action primary"
                        onClick={() => window.open(`mailto:${selectedMessage.senderEmail}?subject=Re: ${selectedMessage.subject}`, '_blank')}
                      >
                        Répondre par email
                      </button>

                      {selectedMessage.status !== 'replied' && (
                        <button
                          type="button"
                          className="message-action"
                          onClick={() => handleUpdateStatus(selectedMessage.id, 'REPLIED')}
                        >
                          Marquer comme traité
                        </button>
                      )}
                    </div>
                  </footer>
                </div>
              ) : (
                <div className="message-detail-empty">
                  <div className="empty-icon">💬</div>
                  <h3>Sélectionnez un message</h3>
                  <p>Choisissez une conversation dans la liste pour afficher son contenu.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Messages;
