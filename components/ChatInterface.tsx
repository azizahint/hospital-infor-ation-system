import React, { useRef, useEffect } from 'react';
import { Send, Bot, User, Cpu, Loader2 } from 'lucide-react';
import { ChatMessage, AgentType } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isThinking: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, input, setInput, onSend, isThinking }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl w-full md:w-[450px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-medical-500 p-2 rounded-lg shadow-sm">
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Orchestrator</h2>
            <p className="text-xs text-medical-600 font-medium">Gemini Powered • All Agents Active</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8 opacity-60">
            <Bot size={48} className="mb-4 text-slate-300" />
            <p className="text-sm">Welcome to ICAM. I can help manage records, billing, registration, and scheduling.</p>
            <p className="text-xs mt-2">Try: "Register John Doe" or "Schedule an appointment for Jane"</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-medical-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
              }`}
            >
              {msg.agentName && msg.role === 'model' && (
                <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {msg.agentName}
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <div className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
              <Loader2 className="animate-spin text-medical-500" size={16} />
              <span className="text-xs text-slate-500">Processing request...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your request here..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 transition-all placeholder:text-slate-400"
            disabled={isThinking}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-medical-500 text-white rounded-lg hover:bg-medical-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-400">AI can make mistakes. Verify clinical data.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
