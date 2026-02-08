"use client";

import React from "react"

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Sparkles, User } from "lucide-react";

export function AiChatPanel() {
  const { t } = useLocale();
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all"
        >
          <Sparkles className="h-6 w-6" />
          <span className="sr-only">{t("aiAssistant")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:w-[420px] p-0 flex flex-col bg-background"
      >
        <SheetHeader className="px-4 py-3 border-b bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <SheetTitle className="text-base">{t("aiAssistant")}</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{t("aiAssistant")}</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-[260px]">
                {t("aiDescription")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2 max-w-[80%] text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <span key={index} className="whitespace-pre-wrap">
                            {part.text}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  {message.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-accent" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl px-3.5 py-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <form
          onSubmit={handleSubmit}
          className="p-4 border-t flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("askAnything")}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
