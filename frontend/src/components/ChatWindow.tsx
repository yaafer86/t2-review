import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChats';
import { useAppStore } from '../store/useAppStore';
import { Send, Upload, FileText, Code, Download, BarChart } from 'lucide-react';
import { marked } from 'marked';

interface ChatWindowProps {
  chatId: string | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId }) => {
  const { chat, sendMessage, uploadFiles, executeCode } = useChat(chatId);
  const { addMessage } = useAppStore();
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
      created_at: new Date().toISOString(),
    };

    addMessage(chatId, userMessage);
    setInput('');

    try {
      const response = await sendMessage(input);
      addMessage(chatId, response);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      await uploadFiles(Array.from(files));
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExecuteCode = async () => {
    if (!codeInput.trim() || !chatId) return;

    try {
      const result = await executeCode(codeInput);
      setCodeOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setCodeOutput(`Error: ${error}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chatId) {
    return (
      <div style={styles.emptyState}>
        <h2>Welcome to Ollama Chat</h2>
        <p>Select a chat or create a new one to get started</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.chatTitle}>{chat?.name}</h3>
        <span style={styles.chatType}>{chat?.chat_type}</span>
      </div>

      <div style={styles.messages}>
        {chat?.messages?.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.message,
              backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#fff',
            }}
          >
            <div style={styles.messageRole}>{msg.role}</div>
            <div
              style={styles.messageContent}
              dangerouslySetInnerHTML={{ __html: marked(msg.content) }}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {chat?.files && chat.files.length > 0 && (
        <div style={styles.filesSection}>
          <h4>Attached Files</h4>
          <div style={styles.filesList}>
            {chat.files.map((file) => (
              <div key={file.id} style={styles.fileItem}>
                <FileText size={16} />
                <span>{file.filename}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCodeEditor && (
        <div style={styles.codeEditor}>
          <div style={styles.codeHeader}>
            <h4>Code Interpreter</h4>
            <button onClick={() => setShowCodeEditor(false)} style={styles.closeButton}>
              ×
            </button>
          </div>
          <textarea
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Enter Python code..."
            style={styles.codeInput}
          />
          <button onClick={handleExecuteCode} style={styles.executeButton}>
            <Code size={16} /> Execute
          </button>
          {codeOutput && (
            <pre style={styles.codeOutput}>{codeOutput}</pre>
          )}
        </div>
      )}

      <div style={styles.inputArea}>
        <div style={styles.inputActions}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={styles.actionButton}
            disabled={isUploading}
          >
            <Upload size={20} />
          </button>
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            style={styles.actionButton}
          >
            <Code size={20} />
          </button>
          <button style={styles.actionButton}>
            <BarChart size={20} />
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          style={styles.textarea}
          rows={3}
        />
        <button onClick={handleSend} style={styles.sendButton}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
  },
  header: {
    padding: '16px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  chatTitle: {
    fontSize: '18px',
    fontWeight: '600',
  },
  chatType: {
    padding: '4px 12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#1976d2',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  },
  message: {
    marginBottom: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    maxWidth: '80%',
  },
  messageRole: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '8px',
    textTransform: 'uppercase',
    color: '#666',
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.6',
  },
  filesSection: {
    padding: '12px 24px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0',
  },
  filesList: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '13px',
  },
  codeEditor: {
    margin: '16px 24px',
    padding: '16px',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    color: '#fff',
  },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer',
  },
  codeInput: {
    width: '100%',
    minHeight: '150px',
    padding: '12px',
    backgroundColor: '#2d2d2d',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
    resize: 'vertical',
  },
  executeButton: {
    marginTop: '12px',
    padding: '8px 16px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  codeOutput: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#2d2d2d',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
    whiteSpace: 'pre-wrap',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  inputArea: {
    padding: '16px 24px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  },
  inputActions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '8px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textarea: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'none',
    fontFamily: 'inherit',
  },
  sendButton: {
    padding: '12px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
