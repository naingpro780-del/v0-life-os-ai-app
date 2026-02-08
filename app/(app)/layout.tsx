import React from "react";
import { AppShell } from "@/components/app-shell";
import { LocaleProvider } from "@/lib/locale-context";
import { AiChatPanel } from "@/components/ai-chat-panel";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AppShell>{children}</AppShell>
      <AiChatPanel />
    </LocaleProvider>
  );
}
