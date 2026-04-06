"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, MessageCircle, X } from "lucide-react";
import { useAppStore } from "@/store";
import { aiAPI, modulesAPI } from "@/services/api";
import type { ChatMessage } from "@/types";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { chatMessages, addChatMessage, setActiveModules, onboardingComplete } = useAppStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isOpen]);

  // Wait for client to mount before checking localStorage-based state
  if (!mounted || !onboardingComplete) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    addChatMessage({ role: "user", content: userMessage });
    setLoading(true);

    try {
      // In gadget mode, we likely use the same /onboarding endpoint for continuity, 
      // or we could use another API. Let's stick with onboarding API as per the logic.
      const response = await aiAPI.onboarding(userMessage);
      const msg: ChatMessage = {
        role: "assistant",
        content: response.reply,
        modules_activated: response.modules_activated,
      };
      addChatMessage(msg);

      if (response.modules_activated.length > 0) {
        // Refresh active modules
        const modules = await modulesAPI.getActive();
        setActiveModules(modules);
      }
    } catch {
      addChatMessage({
        role: "assistant",
        content: "Entschuldigung, da ist etwas schiefgegangen. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border border-surface-200 mb-4 w-[350px] overflow-hidden flex flex-col"
            style={{ height: "450px" }}
          >
            {/* Header */}
            <div className="bg-primary-600 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="bg-primary-500 p-1.5 rounded-full">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Calace Assistent</h3>
                  <p className="text-xs text-primary-100">Immer für Sie da</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-primary-100 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50">
              <AnimatePresence>
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 mt-1 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Bot size={12} className="text-primary-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                        msg.role === "user"
                          ? "bg-primary-600 text-white rounded-tr-sm"
                          : "bg-white border border-surface-200 text-gray-800 rounded-tl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</p>

                      {/* Show activated modules */}
                      {msg.modules_activated && msg.modules_activated.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-primary-200">
                          <div className="flex flex-wrap gap-1">
                            {msg.modules_activated.map((mod) => (
                              <span
                                key={mod}
                                className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-[10px] font-medium"
                              >
                                {mod}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.module_activated && msg.module_name && (
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <div className="flex items-center gap-1 text-[10px] font-medium text-green-600">
                            <Sparkles size={10} />
                            Neues Modul: {msg.module_name}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={12} className="text-primary-600" />
                  </div>
                  <div className="bg-white border border-surface-200 rounded-2xl px-3 py-2">
                    <div className="flex gap-1 items-center h-full">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-surface-200">
              <div className="flex gap-2 relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Fragen Sie etwas..."
                  className="flex-1 px-3 py-2 rounded-xl border border-surface-200 bg-surface-50 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 focus:outline-none"
        aria-label="Toggle chat"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
