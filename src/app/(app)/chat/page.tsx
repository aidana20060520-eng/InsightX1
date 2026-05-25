"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  User,
  Plus,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { MarkdownRenderer } from "@/components/assistant/markdown-renderer";
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
  updatedAt: string;
}

const suggestedPrompts = [
  "Summarize my workspace",
  "Which pages have I neglected?",
  "What did I work on most recently?",
  "Give me a productivity check-in",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load session list + most recent session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat/sessions");
        if (!res.ok) return;
        const json = await res.json();
        const list: ChatSession[] = (json.sessions || []).map(
          (s: { id: string; title: string; updatedAt: string }) => ({
            id: s.id,
            title: s.title,
            updatedAt: s.updatedAt,
          })
        );
        if (cancelled) return;
        setSessions(list);
        if (list.length > 0) {
          loadSession(list[0].id);
        }
      } catch {
        /* ignore — fresh empty state is fine */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSession = async (sessionId: string) => {
    setIsLoadingSession(true);
    setDrawerOpen(false);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Couldn't load chat");
      const json = await res.json();
      const loaded: Message[] = (json.messages || []).map(
        (m: {
          id: string;
          role: "user" | "assistant";
          content: string;
          createdAt: string;
        }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt).getTime(),
        })
      );
      setMessages(loaded);
      setCurrentSessionId(sessionId);
    } catch {
      // Quietly fail — user can start fresh
      setMessages([]);
      setCurrentSessionId(null);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleNewChat = () => {
    if (isStreaming) abortRef.current?.abort();
    setMessages([]);
    setCurrentSessionId(null);
    setInput("");
    setDrawerOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (sessionId === currentSessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
    try {
      await fetch(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
    } catch {
      /* swallow */
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
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

    const prevMessages = messages;
    setMessages([...prevMessages, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: [...prevMessages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortRef.current.signal,
      });

      // Capture session ID returned by server (created on first message)
      const returnedSessionId = res.headers.get("X-Session-Id");
      if (returnedSessionId && returnedSessionId !== currentSessionId) {
        setCurrentSessionId(returnedSessionId);
        // Optimistically prepend to session list
        setSessions((prev) => {
          if (prev.find((s) => s.id === returnedSessionId)) return prev;
          return [
            {
              id: returnedSessionId,
              title:
                content.length > 40 ? content.slice(0, 40) + "…" : content,
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      }

      if (!res.body) throw new Error("No response body");

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || contentType.includes("application/json")) {
        const text = await res.text();
        const friendly = extractFriendlyError(text);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: friendly, streaming: false }
              : m
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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, content: accumulated } : m
          )
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id ? { ...m, streaming: false } : m
        )
      );
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content:
                  "Sorry, I couldn't reach the AI just now. Check your connection and try again.",
                streaming: false,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <PageTransition className="flex h-[calc(100vh-4rem)]">
      {/* Sessions sidebar (desktop) */}
      <aside className="hidden md:flex w-64 border-r border-border flex-col">
        <div className="p-3 border-b border-border">
          <Button
            onClick={handleNewChat}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Plus className="w-4 h-4 mr-2" />
            New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 text-center">
              No chats yet. Start one below.
            </p>
          ) : (
            sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                active={session.id === currentSessionId}
                onSelect={() => loadSession(session.id)}
                onDelete={() => handleDeleteSession(session.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile session drawer trigger */}
        <div className="md:hidden border-b border-border p-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDrawerOpen(true)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chats
          </Button>
          <Button variant="ghost" size="sm" onClick={handleNewChat}>
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
                className="absolute left-0 top-0 bottom-0 w-72 bg-background border-r border-border flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-semibold">Chats</span>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {sessions.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      active={session.id === currentSessionId}
                      onSelect={() => loadSession(session.id)}
                      onDelete={() => handleDeleteSession(session.id)}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation */}
        {messages.length === 0 && !isLoadingSession ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">AI Assistant</h1>
              <p className="text-muted-foreground text-sm mb-8">
                Ask anything about your Notion workspace. I have context of
                your pages, databases, and recent activity.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedPrompts.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(prompt)}
                    className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all text-sm text-muted-foreground hover:text-foreground"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {isLoadingSession ? (
              <div className="flex justify-center py-8">
                <TypingIndicator />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex gap-3 max-w-3xl",
                      message.role === "user" ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        message.role === "assistant"
                          ? "bg-gradient-to-br from-primary/20 to-accent/20"
                          : "bg-muted"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <Sparkles className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        message.role === "assistant"
                          ? "bg-card border border-border"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {message.role === "assistant" ? (
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
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask InsightX anything about your Notion workspace..."
                disabled={isStreaming}
                className="w-full h-11 rounded-xl border border-border bg-muted/50 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-60"
              />
            </div>
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function SessionRow({
  session,
  active,
  onSelect,
  onDelete,
}: {
  session: ChatSession;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer transition-colors",
        active ? "bg-muted text-foreground" : "hover:bg-muted/50 text-muted-foreground"
      )}
      onClick={onSelect}
    >
      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 truncate">{session.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
        aria-label="Delete chat"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
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
