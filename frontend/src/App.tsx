import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { SettingsModal } from './components/SettingsModal';

function App() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar
        onSelectChat={setSelectedChatId}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <ChatWindow chatId={selectedChatId} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
