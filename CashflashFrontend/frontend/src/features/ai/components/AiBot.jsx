import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircleMore,
  SendHorizontal,
  X,
  Loader2,
  Bot,
  Eraser,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { askAiChat, warmAiChat } from "../services/ai_chat.services";
import { generateClientUuid } from "@/lib/uuid";

const SESSION_KEY = "cashflash_ai_chat_session_v1";

const DEFAULT_MESSAGES = [
  {
    id: "welcome-message",
    role: "assistant",
    text: "Hi! I’m your CashFlash AI assistant. Ask me about users, wallets, merchants, transactions, audit logs, cards, or bank accounts.",
    responseType: "text",
    columns: [],
    rows: [],
  },
];

const QUICK_PROMPTS = [
  "How many users are in total?",
  "Show the latest 5 transactions",
];

function safeSetSessionMessages(messages) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  } catch {
    // keep silent
  }
}

function safeRemoveSessionMessages() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // keep silent
  }
}

function normalizeStoredMessage(message, index) {
  return {
    id: message?.id || `stored-message-${index}`,
    role: message?.role === "user" ? "user" : "assistant",
    text: typeof message?.text === "string" ? message.text : "",
    responseType: message?.responseType === "table" ? "table" : "text",
    columns: Array.isArray(message?.columns) ? message.columns : [],
    rows: Array.isArray(message?.rows) ? message.rows : [],
  };
}

function readSessionMessages() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      return DEFAULT_MESSAGES;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_MESSAGES;
    }

    return parsed.map(normalizeStoredMessage);
  } catch {
    return DEFAULT_MESSAGES;
  }
}

function buildMessage(role, payload) {
  const content =
    typeof payload === "string"
      ? {
          text: payload,
          responseType: "text",
          columns: [],
          rows: [],
        }
      : {
          text: typeof payload?.text === "string" ? payload.text : "",
          responseType: payload?.responseType === "table" ? "table" : "text",
          columns: Array.isArray(payload?.columns) ? payload.columns : [],
          rows: Array.isArray(payload?.rows) ? payload.rows : [],
        };

  return {
    id: generateClientUuid(),
    role,
    text: content.text,
    responseType: content.responseType,
    columns: content.columns,
    rows: content.rows,
  };
}

function humanizeLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  if (typeof value === "string") {
    const looksLikeIsoDate =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) ||
      /^\d{4}-\d{2}-\d{2}$/.test(value);

    if (looksLikeIsoDate) {
      const parsedDate = new Date(value);

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleString();
      }
    }

    return value;
  }

  return String(value);
}

const AiBot = ({ className = "" }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() =>
    typeof window === "undefined" ? DEFAULT_MESSAGES : readSessionMessages(),
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [warming, setWarming] = useState(true);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const focusTimerRef = useRef(null);
  const warmTimerRef = useRef(null);

  useEffect(() => {
    safeSetSessionMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (open) {
      focusTimerRef.current = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }

    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, open]);

  useEffect(() => {
    warmTimerRef.current = setTimeout(async () => {
      try {
        await warmAiChat();
      } finally {
        setWarming(false);
      }
    }, 900);

    return () => {
      if (warmTimerRef.current) {
        clearTimeout(warmTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const canSend = input.trim().length > 0 && !sending;

  const openChat = () => setOpen(true);
  const closeChat = () => setOpen(false);

  const clearChat = () => {
    setMessages(DEFAULT_MESSAGES);
    safeRemoveSessionMessages();
  };

  const handleSend = async (forcedText) => {
    const text = String(forcedText ?? input).trim();

    if (!text || sending) {
      return;
    }

    const userMessage = buildMessage("user", text);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await askAiChat(text, controller.signal);

      const reply = buildMessage("assistant", {
        text: res?.answer || "I couldn’t generate a response just now.",
        responseType: res?.responseType || "text",
        columns: res?.columns || [],
        rows: res?.rows || [],
      });

      setMessages((prev) => [...prev, reply]);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      const reply = buildMessage(
        "assistant",
        error?.message ||
          "Something went wrong while getting the response. Please try again.",
      );

      setMessages((prev) => [...prev, reply]);
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showQuickPrompts = useMemo(
    () => messages.length <= 1,
    [messages.length],
  );

  const renderAssistantMessage = (msg) => {
    const shouldRenderTable =
      msg.responseType === "table" &&
      msg.role === "assistant" &&
      msg.columns.length > 0 &&
      msg.rows.length > 0;

    if (!shouldRenderTable) {
      return (
        <div className="whitespace-pre-wrap wrap-break-word">{msg.text}</div>
      );
    }

    return (
      <div className="space-y-3">
        {msg.text ? (
          <div className="whitespace-pre-wrap wrap-break-word">{msg.text}</div>
        ) : null}

        <div className="overflow-hidden rounded-xl border">
          <ScrollArea className="h-49 w-100">
            <div className="min-w-max">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                  <tr>
                    {msg.columns.map((column) => (
                      <th
                        key={column}
                        className="border-b px-3 py-2 font-semibold whitespace-nowrap"
                      >
                        {humanizeLabel(column)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {msg.rows.map((row, index) => (
                    <tr
                      key={`${msg.id}-row-${index}`}
                      className="border-b last:border-b-0"
                    >
                      {msg.columns.map((column) => (
                        <td
                          key={`${msg.id}-${index}-${column}`}
                          className="px-3 py-2 align-top whitespace-nowrap"
                        >
                          {formatCellValue(row?.[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ScrollBar orientation="horizontal" />
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={`pointer-events-none absolute z-41 select-none ${className}`}
      >
        <div className="relative">
          <div className="ai-bot-shadow absolute left-1/2 top-full h-4 w-16 -translate-x-1/2 rounded-full bg-black/25 blur-md dark:bg-black/40" />

          <div className="absolute -inset-3 flex items-center justify-center">
            <span className="ai-bot-pulse absolute h-20 w-20 rounded-full bg-cyan-400/20 dark:bg-cyan-300/15" />
            <span className="ai-bot-ring absolute h-22 w-22 rounded-full border border-cyan-400/20 dark:border-cyan-300/20" />
          </div>

          <div className="ai-bot-float relative">
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={openChat}
                    className="ai-bot-launcher pointer-events-auto group relative flex h-20 w-20 items-center justify-center rounded-full border border-white/60 bg-linear-to-br from-slate-900 via-slate-800 to-slate-950 outline-none transition-all duration-300 hover:scale-105 focus-visible:ring-4 focus-visible:ring-cyan-400/30 dark:border-white/10"
                    aria-label="Open AI chat assistant"
                  >
                    <div className="absolute inset-1.25 rounded-full bg-linear-to-br from-cyan-400/20 via-sky-400/10 to-transparent opacity-80" />

                    <div className="ai-bot-tilt relative flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/30 bg-linear-to-br from-slate-100 via-white to-slate-300 shadow-inner">
                      <div className="ai-bot-visor absolute inset-x-2 top-3 h-6 rounded-full bg-slate-900" />

                      <div className="absolute left-3.75 top-4.5">
                        <div className="ai-bot-eye ai-bot-blink h-2.5 w-2.5 rounded-full bg-cyan-300" />
                      </div>

                      <div className="absolute right-3.75 top-4.5">
                        <div className="ai-bot-eye ai-bot-blink-delay h-2.5 w-2.5 rounded-full bg-cyan-300" />
                      </div>

                      <div
                        className="absolute bottom-1 w-8 h-5"
                        style={{
                          borderBottom: "8px solid rgba(51,65,85,0.8)",
                          borderBottomLeftRadius: "999px",
                          borderBottomRightRadius: "999px",
                        }}
                      />

                      <div className="absolute -left-1 top-4 h-2 w-2 rounded-full bg-cyan-300/80 blur-[1px]" />
                      <div className="absolute -right-1 top-6 h-2 w-2 rounded-full bg-sky-300/80 blur-[1px]" />
                    </div>

                    <div className="absolute -right-1 -top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-cyan-400 px-2 text-[10px] font-bold text-background">
                      AI
                    </div>

                    <div className="ai-bot-orbit-fast absolute -right-2 top-16 h-4 w-4 -translate-y-1/2 rounded-full bg-cyan-300" />
                    <div className="ai-bot-orbit-slow absolute right-20 top-16 h-3 w-3 -translate-y-1/2 rounded-full bg-cyan-300" />

                    <div className="absolute inset-0 rounded-full ring-1 ring-white/10 transition-all duration-300 group-hover:ring-cyan-300/30" />
                  </button>
                </TooltipTrigger>

                <TooltipContent side="bottom" sideOffset={12}>
                  <p>{warming ? "Starting AI..." : "Ask Me Anything!"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="pointer-events-none absolute -left-4 -top-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/95 shadow-md ring-1 ring-border">
                <MessageCircleMore className="h-5 w-5 font-bold text-background" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-100 overflow-hidden items-center justify-center overscroll-none bg-background/25 backdrop-blur-sm">
          <div className="absolute right-4 bottom-4 h-155 w-lg max-w-[calc(100vw-2rem)]">
            <div className="relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in slide-in-from-right-5 duration-200">
              <Button
                size="icon"
                variant="ghost"
                onClick={closeChat}
                className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
              >
                <X className="h-6 w-6" />
              </Button>

              <div className="mb-4 flex items-center gap-3 pr-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                  <Bot className="h-6 w-6" />
                </div>

                <div className="flex-1">
                  <h2 className="flex items-center text-lg font-semibold">
                    CashFlash AI
                    <Badge
                      variant="outline"
                      className="mx-4 border-green-600 px-2 py-1 text-[10px] font-medium text-green-600"
                    >
                      {warming ? "Starting..." : "Ready"}
                    </Badge>
                  </h2>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Ask questions about your dashboard data
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mr-15 text-red-600 hover:text-white"
                      onClick={clearChat}
                      disabled={sending}
                    >
                      <Eraser className="mr-1 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-muted/30">
                <ScrollArea className="h-full">
                  <div className="space-y-4 p-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                            msg.role === "user"
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md border bg-background text-foreground"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            renderAssistantMessage(msg)
                          ) : (
                            <div className="whitespace-pre-wrap wrap-break-word">
                              {msg.text}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {showQuickPrompts && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((prompt) => (
                          <Button
                            key={prompt}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-auto whitespace-normal bg-foreground p-2 text-left text-background"
                            onClick={() => handleSend(prompt)}
                            disabled={sending}
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    )}

                    {sending && (
                      <div className="flex justify-start">
                        <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-md border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking...
                        </div>
                      </div>
                    )}

                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
              </div>

              <div className="mt-4 space-y-3 pt-4">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    disabled={sending}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask something..."
                  />

                  <Button onClick={() => handleSend()} disabled={!canSend}>
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Info className="h-4 w-4 text-yellow-400" />
                  <p className="text-xs text-yellow-400">
                    Session-only chat. It will be cleared on logout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiBot;
