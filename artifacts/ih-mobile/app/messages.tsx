import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { T, Empty } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Conversation {
  id: number;
  otherUserId: number;
  otherFullName: string;
  otherAvatarUrl: string | null;
  lastMessageAt: string;
  lastMessage: string | null;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-SA", { day: "numeric", month: "short" });
}

function ConversationThread({
  conv,
  onBack,
}: {
  conv: Conversation;
  onBack: () => void;
}) {
  const colors = useColors();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<{ messages: Message[] }>(`/messages/${conv.id}`);
      setMessages(r.messages);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [conv.id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    try {
      const r = await api<{ message: Message }>(`/messages/${conv.id}`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setMessages((prev) => [...prev, r.message]);
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          padding: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 10,
        }}
      >
        <Pressable onPress={onBack}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </Pressable>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.primary + "25",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T style={{ color: colors.primary, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 13 }}>
            {initials(conv.otherFullName)}
          </T>
        </View>
        <T style={{ flex: 1, fontSize: 15, fontFamily: "IBMPlexSansArabic_600SemiBold", color: colors.foreground, textAlign: "right" }}>
          {conv.otherFullName}
        </T>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <Empty icon="message-circle" title="لا توجد رسائل بعد. ابدأ المحادثة!" />
          )}
          {messages.map((msg) => {
            const mine = msg.senderId === user?.id;
            return (
              <View
                key={msg.id}
                style={{
                  alignSelf: mine ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                }}
              >
                <View
                  style={{
                    backgroundColor: mine ? colors.primary : colors.card,
                    borderRadius: 16,
                    borderBottomRightRadius: mine ? 4 : 16,
                    borderBottomLeftRadius: mine ? 16 : 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: mine ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  <T
                    style={{
                      fontSize: 14,
                      color: mine ? "#fff" : colors.foreground,
                      lineHeight: 21,
                      textAlign: mine ? "left" : "right",
                    }}
                  >
                    {msg.body}
                  </T>
                </View>
                <T
                  style={{
                    fontSize: 10,
                    color: colors.mutedForeground,
                    marginTop: 3,
                    textAlign: mine ? "left" : "right",
                    marginHorizontal: 4,
                  }}
                >
                  {formatTime(msg.createdAt)}
                </T>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: 10,
          padding: 12,
          paddingBottom: Platform.OS === "ios" ? 4 : 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="اكتب رسالتك..."
          placeholderTextColor={colors.mutedForeground}
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: colors.foreground,
            fontFamily: "IBMPlexSansArabic_400Regular",
            fontSize: 14,
            textAlign: "right",
            borderWidth: 1,
            borderColor: colors.border,
            maxHeight: 100,
          }}
          multiline
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable
          onPress={send}
          disabled={!text.trim() || sending}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: text.trim() ? colors.primary : colors.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="send" size={18} color={text.trim() ? "#fff" : colors.mutedForeground} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function MessagesScreen() {
  const colors = useColors();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api<{ conversations: Conversation[] }>("/messages"),
    enabled: !!user,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (selected) {
    return <ConversationThread conv={selected} onBack={() => setSelected(null)} />;
  }

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, alignItems: "center", justifyContent: "center" }}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <T style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 16, fontSize: 15, lineHeight: 24 }}>
          يجب تسجيل الدخول للوصول إلى الرسائل.
        </T>
        <Pressable
          onPress={() => router.push("/login")}
          style={{ marginTop: 20, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <T style={{ color: "#fff", fontFamily: "IBMPlexSansArabic_600SemiBold", fontSize: 14 }}>دخول</T>
        </Pressable>
      </View>
    );
  }

  const conversations = data?.conversations ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <T style={{ fontSize: 26, fontFamily: "IBMPlexSansArabic_700Bold", color: colors.foreground, textAlign: "right" }}>
          الرسائل
        </T>
        <T style={{ fontSize: 13, color: colors.mutedForeground, textAlign: "right", marginTop: 4 }}>
          محادثاتك مع أعضاء المجتمع.
        </T>
      </View>

      {isLoading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      )}

      {error && <Empty icon="alert-circle" title="تعذّر تحميل الرسائل" />}

      {!isLoading && conversations.length === 0 && !error && (
        <Empty icon="message-circle" title="لا توجد محادثات بعد" />
      )}

      {conversations.map((conv) => (
        <Pressable
          key={conv.id}
          onPress={() => setSelected(conv)}
          style={({ pressed }) => ({
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: pressed ? colors.muted : "transparent",
          })}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: colors.primary + "25",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T style={{ color: colors.primary, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 15 }}>
              {initials(conv.otherFullName)}
            </T>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
              <T style={{ fontSize: 15, fontFamily: "IBMPlexSansArabic_600SemiBold", color: colors.foreground }}>
                {conv.otherFullName}
              </T>
              <T style={{ fontSize: 11, color: colors.mutedForeground }}>
                {formatDate(conv.lastMessageAt)}
              </T>
            </View>
            {conv.lastMessage && (
              <T style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }} numberOfLines={1}>
                {conv.lastMessage}
              </T>
            )}
          </View>

          <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
