"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getMessages, sendMessage, type Message } from "@/lib/messages";
import { searchUsersByName, type UserProfile } from "@/lib/profile";
import { listApprovedProviders, type ProviderListItem } from "@/lib/patient";
import { extractApiErrorMessage } from "@/lib/api";
import { getDashboardPathForRole, getRoleFromUser } from "@/lib/auth";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, ArrowLeft, Loader, Search } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [counterpartId, setCounterpartId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [providers, setProviders] = useState<ProviderListItem[]>([]);
  const [showProviderList, setShowProviderList] = useState(true);
  // Load providers for patient
  useEffect(() => {
    listApprovedProviders()
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  const loadMessages = () => {
    if (!counterpartId.trim()) {
      setMessages([]);
      return;
    }
    setLoading(true);
    getMessages({ counterpart_id: counterpartId.trim(), limit: 50 })
      .then(setMessages)
      .catch((e) => toast.error(extractApiErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchUsersByName(searchQuery.trim());
      setSearchResults(results);
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectUser = (userId: string) => {
    setCounterpartId(userId);
    setSearchQuery("");
    setSearchResults([]);
    setShowProviderList(false);
  };

  useEffect(() => {
    loadMessages();
  }, [counterpartId]);

  const handleSend = async () => {
    if (!counterpartId.trim() || !messageText.trim()) return;
    setSending(true);
    try {
      await sendMessage(counterpartId.trim(), messageText.trim());
      setMessageText("");
      loadMessages();
      toast.success("Message sent");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const dashboardPath = getDashboardPathForRole(getRoleFromUser(user));

  return (
    <MainLayout>
      <div className="min-h-screen w-full bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href={dashboardPath}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="size-6 text-primary" />
                Messages
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
               Chat securely with your healthcare providers. Select a provider to view past conversations or start a new one. Your messages are private and encrypted for your security.
              </p>
            </div>
          </div>

          {/* Provider List (stacked above chat, full width chat) */}
          <div className="space-y-6">
            <Card className="mb-4">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base">Providers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {providers.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No providers available.
                    </div>
                  ) : (
                    providers.map((prov) => (
                      <button
                        key={prov.id}
                        className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors flex flex-col ${counterpartId === prov.user_id ? "bg-muted" : ""}`}
                        onClick={() => selectUser(prov.user_id)}
                      >
                        <span className="font-medium text-foreground">
                          {prov.specialization || "Provider"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {prov.license_number}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Conversation Card - now full width */}
            <Card className="flex flex-col h-[calc(100vh-200px)] sm:h-96">
              <CardHeader className="border-b border-border">
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-6 space-y-4 overflow-hidden">
                {/* Selected User Info */}
                {counterpartId && (
                  <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Chatting with:
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCounterpartId("")}
                    >
                      Change
                    </Button>
                  </div>
                )}
                {/* Recipient Search/Input (optional, keep for flexibility) */}
                
                  
                
                {/* Messages Display */}
                <div className="flex-1 overflow-y-auto bg-muted/30 rounded-lg p-4 space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-sm">
                        Loading conversation...
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-sm text-center">
                        {counterpartId.trim()
                          ? "No messages yet. Send one to start!"
                          : "Enter a recipient ID to load conversation."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...messages].reverse().map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`rounded-lg px-4 py-2 max-w-xs sm:max-w-sm text-sm ${
                              m.sender_id === user?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border text-foreground"
                            }`}
                          >
                            <p className="wrap-break-word">{m.message_text}</p>
                            <p className={`text-xs mt-1 opacity-70`}>
                              {new Date(m.created_at).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message…"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSend()
                    }
                    disabled={!counterpartId.trim()}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={
                      sending || !messageText.trim() || !counterpartId.trim()
                    }
                    size="icon"
                    className="gap-1"
                  >
                    {sending ? (
                      <Loader className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
