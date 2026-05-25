"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "./markdown-renderer";
import { cn } from "@/lib/utils";
import { extractFriendlyError } from "@/lib/format-error";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  streaming?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const STORAGE_KEY = "insightx-chat-sessions";

const suggestedPrompts = [
  "What's at risk this week?",
  "Summarize my week",
  "Find my blockers",
  "Top priorities for tomorrow",
];

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function newSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    updatedAt: Date.now(),
  };
}

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [unread, setUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load sessions on mount
  useEffect(() => {
    const loaded = loadSessions();
    if (loaded.length === 0) {
      const initial = newSession();
      setSessions([initial]);
      setActiveId(initial.id);
    } else {
      setSessions(loaded);
      setActiveId(loaded[0].id);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    if (sessions.length > 0) saveSessions(sessions);
  }, [sessions]);

  const activeSession =
    sessions.find((s) => s.id === activeId) || sessions[0];
  const messages = activeSession?.messages || [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages.length, open, scrollToBottom]);

  const updateSession = useCallback(
    (id: string, fn: (s: ChatSession) => ChatSession) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...fn(s), updatedAt: Date.now() } : s))
      );
    },
    []
  );

  const handleSend = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      streaming: true,
    };

    // Optimistic update
    updateSession(activeId, (s) => ({
      ...s,
      title:
        s.messages.length === 0 ? content.slice(0, 40) : s.title,
      messages: [...s.messages, userMessage, assistantMessage],
    }));
    setInput("");
    setIsStreaming(true);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No response body");

      // If the server returned a JSON error body, surface a friendly
      // message instead of rendering the JSON verbatim.
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || contentType.includes("application/json")) {
        const text = await res.text();
        const friendly = extractFriendlyError(text);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: friendly, streaming: false }
                      : m
                  ),
                }
              : s
          )
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });

        // Update streaming message in place
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: accumulated }
                      : m
                  ),
                }
              : s
          )
        );
      }

      // Mark streaming complete
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, streaming: false }
                    : m
                ),
              }
            : s
        )
      );

      if (!open) setUnread(true);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      // Show error in assistant bubble
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMessage.id
                    ? {
                        ...m,
                        content:
                          "Sorry, I couldn't reach the AI just now. Try again?",
                        streaming: false,
                      }
                    : m
                ),
              }
            : s
        )
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleNewChat = () => {
    const s = newSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setHistoryOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh = newSession();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const togglePanel = () => {
    setOpen((v) => !v);
    if (!open) setUnread(false);
  };

  return (
    <>
      {/* Floating launcher button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={togglePanel}
            className="fixed bottom-6 right-6 z-50 group"
            aria-label="Open AI assistant"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
              {/* Button */}
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30">
                <Sparkles className="w-6 h-6 text-white" />
                {unread && (
                  <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 ring-2 ring-background" />
                )}
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Assistant panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />

            <motion.div
              initial={{ opacity: 0, x: 30, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, y: 30, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                "fixed z-50 flex flex-col overflow-hidden",
                // Mobile: full bottom sheet
                "inset-x-2 bottom-2 top-16 rounded-2xl",
                // Desktop: floating panel
                "md:inset-auto md:bottom-6 md:right-6 md:top-auto md:left-auto md:w-[420px] md:h-[640px]"
              )}
            >
              {/* Glow border effect */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 opacity-60 blur-md pointer-events-none" />

              <div className="relative flex flex-col h-full rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    {historyOpen ? (
                      <button
                        onClick={() => setHistoryOpen(false)}
                        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                        aria-label="Back to chat"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold leading-tight">
                        {historyOpen ? "Chat history" : "InsightX Assistant"}
                      </p>
                      {!historyOpen && (
                        <p className="text-[10px] text-muted-foreground">
                          Connected to your workspace
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!historyOpen && (
                      <>
                        <button
                          onClick={() => setHistoryOpen(true)}
                          className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                          aria-label="Chat history"
                          title="Chat history"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleNewChat}
                          className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                          aria-label="New chat"
                          title="New chat"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setOpen(false)}
                      className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                      aria-label="Close assistant"
                      title="Minimize"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    {historyOpen ? (
                      <motion.div
                        key="history"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full overflow-y-auto p-3 space-y-1"
                      >
                        <button
                          onClick={handleNewChat}
                          className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-primary/30 hover:bg-muted/50 transition-colors text-left"
                        >
                          <Plus className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">New chat</span>
                        </button>
                        {sessions.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setActiveId(s.id);
                              setHistoryOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 p-3 rounded-lg transition-colors text-left group",
                              s.id === activeId
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate">
                                {s.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(s.updatedAt).toLocaleString()}
                              </p>
                            </div>
                            {sessions.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(s.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                                aria-label="Delete chat"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center px-2">
                              <motion.div
                                animate={{
                                  scale: [1, 1.05, 1],
                                  rotate: [0, 6, -6, 0],
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4"
                              >
                                <Sparkles className="w-6 h-6 text-primary" />
                              </motion.div>
                              <h4 className="text-base font-semibold mb-1">
                                How can I help today?
                              </h4>
                              <p className="text-xs text-muted-foreground max-w-xs mb-6">
                                I have full context of your Notion workspace.
                                Ask anything about your projects, tasks, or
                                productivity.
                              </p>
                              <div className="grid grid-cols-2 gap-2 w-full">
                                {suggestedPrompts.map((prompt, i) => (
                                  <motion.button
                                    key={prompt}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.06 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSend(prompt)}
                                    className="text-left p-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-[11px] text-muted-foreground hover:text-foreground"
                                  >
                                    {prompt}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <>
                              {messages.map((m) => (
                                <MessageBubble key={m.id} message={m} />
                              ))}
                              <div ref={messagesEndRef} />
                            </>
                          )}
                        </div>

                        {/* Input */}
                        <div className="border-t border-border p-3 shrink-0">
                          <div className="flex items-center gap-2">
                            <input
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSend();
                                }
                              }}
                              placeholder="Ask about your workspace..."
                              disabled={isStreaming}
                              className="flex-1 h-10 rounded-xl border border-border bg-muted/40 px-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-60"
                            />
                            <Button
                              size="icon"
                              onClick={() => handleSend()}
                              disabled={!input.trim() || isStreaming}
                              className="h-10 w-10 shrink-0 rounded-xl"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            Responses may reference Notion pages from your
                            workspace
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isAssistant = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex gap-2.5 max-w-full",
        !isAssistant && "flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isAssistant
            ? "bg-gradient-to-br from-primary/20 to-accent/20"
            : "bg-muted"
        )}
      >
        {isAssistant ? (
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        ) : (
          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-primary to-accent" />
        )}
      </div>
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 max-w-[85%]",
          isAssistant
            ? "bg-muted/40 border border-border"
            : "bg-primary text-primary-foreground"
        )}
      >
        {isAssistant ? (
          message.content ? (
            <>
              <MarkdownRenderer content={message.content} />
              {message.streaming && (
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-block w-1.5 h-3.5 bg-primary rounded-sm ml-0.5 align-middle"
                />
              )}
            </>
          ) : (
            <TypingIndicator />
          )
        ) : (
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.18,
          }}
          className="w-1.5 h-1.5 rounded-full bg-primary"
        />
      ))}
    </div>
  );
}
