import { useState, useEffect } from 'react';
import { chatApi } from '../services/api';

export const useChats = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await chatApi.listChats();
      setChats(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (name: string, type: string, model: string) => {
    const response = await chatApi.createChat({ name, chat_type: type, model_name: model });
    setChats((prev) => [response.data, ...prev]);
    return response.data;
  };

  const deleteChat = async (chatId: string) => {
    await chatApi.deleteChat(chatId);
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return { chats, loading, error, refetch: fetchChats, createChat, deleteChat };
};

export const useChat = (chatId: string | null) => {
  const [chat, setChat] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChat = async () => {
    if (!chatId) return;
    try {
      setLoading(true);
      const response = await chatApi.getChat(chatId);
      setChat(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!chatId) return;
    const response = await chatApi.sendMessage(chatId, content);
    setChat((prev: any) => ({
      ...prev,
      messages: [...(prev?.messages || []), response.data],
    }));
    return response.data;
  };

  const uploadFiles = async (files: File[]) => {
    if (!chatId) return;
    const response = await chatApi.uploadFiles(chatId, files);
    setChat((prev: any) => ({
      ...prev,
      files: [...(prev?.files || []), ...response.data.files],
    }));
    return response.data;
  };

  const executeCode = async (code: string) => {
    if (!chatId) return;
    const response = await chatApi.executeCode(chatId, code);
    return response.data;
  };

  useEffect(() => {
    if (chatId) {
      fetchChat();
    }
  }, [chatId]);

  return { chat, loading, error, refetch: fetchChat, sendMessage, uploadFiles, executeCode };
};
