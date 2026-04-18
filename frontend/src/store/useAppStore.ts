import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface Chat {
  id: string;
  name: string;
  chat_type: 'free' | 'file_aware' | 'code_interpreter';
  model_name: string;
  messages: Message[];
  files: Array<{ id: string; filename: string; uploaded_at: string }>;
}

interface AppState {
  chats: Chat[];
  currentChat: Chat | null;
  isLoading: boolean;
  settings: {
    ollamaHost: string;
    useCloud: boolean;
  };
  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chat: Chat | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  createChat: (name: string, type: string, model: string) => void;
  deleteChat: (chatId: string) => void;
  setLoading: (loading: boolean) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  chats: [],
  currentChat: null,
  isLoading: false,
  settings: {
    ollamaHost: 'http://localhost:11434',
    useCloud: false,
  },
  setChats: (chats) => set({ chats }),
  setCurrentChat: (chat) => set({ currentChat: chat }),
  addMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      ),
      currentChat:
        state.currentChat?.id === chatId
          ? { ...state.currentChat, messages: [...state.currentChat.messages, message] }
          : state.currentChat,
    })),
  createChat: (name, type, model) =>
    set((state) => ({
      chats: [
        {
          id: Date.now().toString(),
          name,
          chat_type: type as any,
          model_name: model,
          messages: [],
          files: [],
        },
        ...state.chats,
      ],
    })),
  deleteChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((chat) => chat.id !== chatId),
      currentChat: state.currentChat?.id === chatId ? null : state.currentChat,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  updateSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),
}));
