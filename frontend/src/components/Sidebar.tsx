import React, { useState } from 'react';
import { useChats } from '../hooks/useChats';
import { useAppStore } from '../store/useAppStore';
import { Plus, MessageSquare, Code, FileText, Trash2, Settings } from 'lucide-react';

interface SidebarProps {
  onSelectChat: (chatId: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, onOpenSettings }) => {
  const { chats, createChat, deleteChat } = useChats();
  const { currentChat, setCurrentChat } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'free' | 'file_aware' | 'code_interpreter'>('free');

  const handleCreateChat = async () => {
    if (!newChatName.trim()) return;
    
    try {
      const chat = await createChat(newChatName, newChatType, 'llama3.2');
      onSelectChat(chat.id);
      setIsCreating(false);
      setNewChatName('');
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      await deleteChat(chatId);
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
    }
  };

  const getChatIcon = (type: string) => {
    switch (type) {
      case 'code_interpreter':
        return <Code size={18} />;
      case 'file_aware':
        return <FileText size={18} />;
      default:
        return <MessageSquare size={18} />;
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <h2 style={styles.title}>Ollama Chat</h2>
        <button onClick={onOpenSettings} style={styles.iconButton}>
          <Settings size={20} />
        </button>
      </div>

      <button onClick={() => setIsCreating(true)} style={styles.newChatButton}>
        <Plus size={20} />
        New Chat
      </button>

      {isCreating && (
        <div style={styles.createForm}>
          <input
            type="text"
            placeholder="Chat name..."
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <select
            value={newChatType}
            onChange={(e) => setNewChatType(e.target.value as any)}
            style={styles.select}
          >
            <option value="free">Free Chat</option>
            <option value="file_aware">File-Aware Chat</option>
            <option value="code_interpreter">Code Interpreter</option>
          </select>
          <div style={styles.formActions}>
            <button onClick={handleCreateChat} style={styles.confirmButton}>
              Create
            </button>
            <button onClick={() => setIsCreating(false)} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={styles.chatList}>
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            style={{
              ...styles.chatItem,
              backgroundColor: currentChat?.id === chat.id ? '#e3f2fd' : 'transparent',
            }}
          >
            <span style={styles.chatIcon}>{getChatIcon(chat.chat_type)}</span>
            <span style={styles.chatName}>{chat.name}</span>
            <button
              onClick={(e) => handleDeleteChat(e, chat.id)}
              style={styles.deleteButton}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: '280px',
    height: '100vh',
    backgroundColor: '#fff',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1976d2',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '16px',
  },
  createForm: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '8px',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '8px',
    fontSize: '14px',
  },
  formActions: {
    display: 'flex',
    gap: '8px',
  },
  confirmButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cancelButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  chatList: {
    flex: 1,
    overflowY: 'auto',
  },
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '4px',
    transition: 'background-color 0.2s',
  },
  chatIcon: {
    display: 'flex',
    alignItems: 'center',
    color: '#666',
  },
  chatName: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
};
