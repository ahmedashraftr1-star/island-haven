import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { T, Field, Btn, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError, getAdminToken, setAdminToken } from "@/lib/api";

export default function AdminScreen() {
  const colors = useColors();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Push form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [stats, setStats] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const t = await getAdminToken();
      if (!t) {
        setAuthed(false);
        return;
      }
      try {
        await api("/admin/ping", { admin: true });
        setAuthed(true);
      } catch {
        await setAdminToken(null);
        setAuthed(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (authed) loadStats();
  }, [authed]);

  async function loadStats() {
    try {
      const r = await api<{ tokens: number }>("/admin/push/stats", { admin: true });
      setStats(r.tokens);
    } catch {
      setStats(null);
    }
  }

  async function login() {
    setError(null);
    setLoading(true);
    try {
      const r = await api<{ token: string }>("/admin/login", { method: "POST", body: { password } });
      await setAdminToken(r.token);
      setAuthed(true);
      setPassword("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await api("/admin/logout", { method: "POST", admin: true });
    } catch {
      /* server may have already invalidated; clear local regardless */
    }
    await setAdminToken(null);
    setAuthed(false);
  }

  async function broadcast() {
    setResult(null);
    setSending(true);
    try {
      const r = await api<{ sent: number; failed: number; total: number }>("/admin/push/broadcast", {
        method: "POST",
        admin: true,
        body: { title: title.trim(), body: body.trim() },
      });
      setResult(`أُرسلت لـ ${r.sent} من ${r.total} (فشل: ${r.failed}).`);
      setTitle("");
      setBody("");
    } catch (e) {
      setResult(e instanceof ApiError ? e.message : "تعذّر الإرسال");
    } finally {
      setSending(false);
    }
  }

  if (authed === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!authed) {
    return (
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 16 }}>
        <T size={22} weight="bold">دخول الإدارة</T>
        <Card style={{ gap: 12 }}>
          <Field
            label="كلمة سرّ المسؤول"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={error ?? undefined}
          />
          <Btn title="دخول" loading={loading} onPress={login} fullWidth />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}>
      <T size={22} weight="bold">لوحة الإدارة</T>
      <Card style={{ gap: 6 }}>
        <T size={13} color={colors.mutedForeground}>الأجهزة المسجّلة للإشعارات</T>
        <T size={28} weight="bold" color={colors.primary}>{stats ?? "—"}</T>
      </Card>
      <Card style={{ gap: 12 }}>
        <T size={16} weight="bold">إرسال إشعار جماعي</T>
        <T size={12} color={colors.mutedForeground}>سيصل لكلّ مستخدم نشّط الإشعارات على هاتفه.</T>
        <Field label="العنوان" value={title} onChangeText={setTitle} />
        <Field label="الرسالة" value={body} onChangeText={setBody} multiline numberOfLines={4} />
        <Btn title="إرسال للجميع" loading={sending} onPress={broadcast} fullWidth disabled={!title.trim() || !body.trim()} />
        {result ? <T size={13} color={colors.foreground}>{result}</T> : null}
      </Card>
      <Btn title="خروج الإدارة" variant="ghost" onPress={logout} fullWidth />
    </ScrollView>
  );
}
