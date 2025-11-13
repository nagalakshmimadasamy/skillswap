// src/Pages/ChatBot.jsx
import { useState } from 'react';
import { fetchAIResponse } from './chatService';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

   const botReply = await fetchAIResponse(input);

// Start with empty bot message
const animatedBotMessage = { role: 'bot', content: '' };
setMessages(prev => [...prev, animatedBotMessage]);

let i = 0;
const interval = setInterval(() => {
  if (i < botReply.length) {
    animatedBotMessage.content += botReply[i];
    // Update last message only
    setMessages(prev => [...prev.slice(0, -1), animatedBotMessage]);
    i++;
  } else {
    clearInterval(interval);
  }
}, 30); // 30ms per character

  };

  return (
    <div className="fixed bottom-4 right-4 w-80">
      <button
        onClick={() => setOpen(!open)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg"
      >
        SkillBot {open ? '✖️' : '🤖'}
      </button>

      {open && (
        <div className="mt-2 bg-white border rounded shadow-lg flex flex-col h-96">
          <div className="p-2 border-b font-semibold bg-indigo-50">SkillBot 🤖</div>
          <div className="flex-1 p-2 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`my-1 p-1 rounded ${msg.role === 'bot' ? 'bg-gray-200 text-gray-900' : 'bg-indigo-600 text-white'}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="flex border-t p-2 gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded px-2 py-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="bg-indigo-600 text-white px-3 rounded">Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
