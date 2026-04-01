"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useAppStore } from "@/store";
import { aiAPI, modulesAPI } from "@/services/api";
import { isDemoModeSync } from "@/lib/demo-mode";
import { getMockOnboardingResponse, getMockModuleExpansion, MOCK_MODULES } from "@/lib/mock-data";
import type { ChatMessage } from "@/types";
import ParticleBurst from "@/components/effects/ParticleBurst";

export default function OnboardingChat() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    chatMessages,
    addChatMessage,
    setOnboardingComplete,
    setActiveModules,
    addModule,
  } = useAppStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (chatMessages.length === 0) {
      addChatMessage({
        role: "assistant",
        content:
          "Willkommen bei **Calace**! 👋\n\nIch bin Ihr KI-Assistent und richte die App perfekt auf Ihre Branche ein.\n\n**Was machen Sie beruflich?**\n\n_(z.B. \"Ich bin Dellendrücker\", \"Wir sind eine Lackiererei\" oder \"KFZ-Werkstatt\")_",
      });
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    addChatMessage({ role: "user", content: userMessage });
    setLoading(true);

    // Small delay for realism in demo
    await new Promise((r) => setTimeout(r, isDemoModeSync() ? 800 : 0));

    try {
      let reply: string;
      let modulesActivated: string[] = [];
      let onboardingComplete = false;
      let moduleActivated = false;
      let moduleName: string | undefined;

      if (isDemoModeSync()) {
        // --- DEMO MODE ---
        const onboardingResult = getMockOnboardingResponse(userMessage);

        if (onboardingResult.onboarding_complete) {
          reply = onboardingResult.reply;
          modulesActivated = onboardingResult.modules_activated;
          onboardingComplete = true;
          setActiveModules(MOCK_MODULES);
        } else {
          // Check if it's a module expansion request
          const expansionKeywords = ["brauche", "tool", "modul", "funktion", "hätte gerne"];
          const isExpansion = expansionKeywords.some((kw) => userMessage.toLowerCase().includes(kw));

          if (isExpansion) {
            const expansion = getMockModuleExpansion(userMessage);
            reply = expansion.reply;
            moduleActivated = expansion.module_activated;
            moduleName = expansion.module_name;

            if (expansion.module_activated) {
              addModule({
                slug: expansion.module_slug,
                name: expansion.module_name,
                description: null,
                icon: "puzzle",
                category: "custom",
                component_path: expansion.component_path,
                config: null,
                is_builtin: false,
              });
            }
          } else {
            reply = onboardingResult.reply;
          }
        }
      } else {
        // --- LIVE API ---
        const response = await aiAPI.onboarding(userMessage);
        reply = response.reply;
        modulesActivated = response.modules_activated;
        onboardingComplete = response.onboarding_complete;

        if (response.modules_activated.length > 0) {
          const modules = await modulesAPI.getActive();
          setActiveModules(modules);
        }
      }

      const msg: ChatMessage = {
        role: "assistant",
        content: reply,
        modules_activated: modulesActivated.length > 0 ? modulesActivated : undefined,
        module_activated: moduleActivated || undefined,
        module_name: moduleName,
      };
      addChatMessage(msg);

      if (modulesActivated.length > 0 || moduleActivated) {
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 2000);
      }

      if (onboardingComplete) {
        setOnboardingComplete(true);
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
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-3xl mx-auto">
      {showParticles && <ParticleBurst />}

      {/* Demo Banner */}
      {isDemoModeSync() && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 text-center text-sm text-amber-700">
          Demo-Modus – Tipp: Schreibe <strong>&quot;Ich bin Dellendrücker&quot;</strong> zum Testen
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        <AnimatePresence>
          {chatMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-primary-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-surface-200 text-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                {msg.modules_activated && msg.modules_activated.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-primary-200">
                    <div className="flex items-center gap-1 text-xs font-medium text-primary-600 mb-2">
                      <Sparkles size={14} />
                      Aktivierte Module:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.modules_activated.map((mod) => (
                        <span
                          key={mod}
                          className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium animate-module-appear"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {msg.module_activated && msg.module_name && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <Sparkles size={14} />
                      Neues Modul: {msg.module_name}
                    </div>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-gray-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <Bot size={16} className="text-primary-600" />
            </div>
            <div className="bg-white border border-surface-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface-200 pt-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Beschreiben Sie Ihre Branche oder fordern Sie ein neues Tool an..."
            className="flex-1 px-4 py-3 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-surface-300 mt-2 text-center">
          Tippe z.B. &quot;Ich brauche ein Tool für Farbmischverhältnisse&quot; um neue Module hinzuzufügen
        </p>
      </div>
    </div>
  );
}
