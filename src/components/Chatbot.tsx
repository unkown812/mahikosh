import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Leaf, AlertCircle, Sparkles } from "lucide-react";
import { ChatMessage, TripLog, EnergyLog, MealLog } from "../types";

interface ChatbotProps {
  trips: TripLog[];
  energyLogs: EnergyLog[];
  meals: MealLog[];
  userName: string;
}

export default function Chatbot({ trips, energyLogs, meals, userName }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi ${userName || "there"}! I'm EcoBot, your sustainability assistant. Ask me about your carbon footprint, get eco tips, or learn how to reduce your environmental impact.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          trips,
          energyLogs,
          meals,
          userName,
        }),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `m-${Date.now()}-reply`,
        role: "assistant",
        content: data.response || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toISOString(),
        suggestedTipId: data.suggestedTipId,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `m-${Date.now()}-error`,
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Here's a quick tip: try walking or biking for short trips — it's zero-emission and earns the most EcoBucks!",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="clay-card p-0 overflow-hidden flex flex-col min-h-[350px] h-[75vh] max-h-[600px]">
      <div className="p-4 border-b border-border-soft bg-surface-warm/20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <Leaf className="w-5 h-5 text-white fill-white/20" />
        </div>
        <div>
          <h2 className="text-sm font-bold font-display text-fg">EcoBot</h2>
          <p className="text-[10px] text-muted font-medium">AI Sustainability Assistant</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-success font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === "user"
                  ? "bg-accent text-white"
                  : "bg-surface border border-border"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Leaf className="w-4 h-4 text-accent fill-accent/20" />
              )}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-white rounded-tr-md"
                  : "bg-surface border border-border-soft rounded-tl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-[9px] mt-1.5 ${msg.role === "user" ? "text-white/60" : "text-muted"}`}>
                {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-accent fill-accent/20" />
            </div>
            <div className="bg-surface border border-border-soft rounded-2xl rounded-tl-md p-4">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border-soft bg-surface">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask EcoBot anything about your sustainability..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-xs"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-accent hover:bg-accent-hover text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
