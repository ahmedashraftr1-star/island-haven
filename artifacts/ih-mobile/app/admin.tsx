import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { T, Field, Btn, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError, getAdminToken, setAdminToken } from "@/lib/api";

type AdminEmailInfo = { value: string; source: "db" | "env" };

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

  // Admin email settings
  const [emailInfo, setEmailInfo] = useState<AdminEmailInfo | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailClearing, setEmailClearing] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

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
    if (authed) {
      loadStats();
      loadEmail();
    }
  }, [authed]);

  async function loadStats() {
    try {
      const r = await api<{ tokens: number }>("/admin/push/stats", { admin: true });
      setStats(r.tokens);
    } catch {
      setStats(null);
    }
  }

  async function loadEmail() {
    try {
      const r = await api<AdminEmailInfo>("/admin/settings/admin-email", { admin: true });
      setEmailInfo(r);
      setEmailDraft(r.value);
    } catch {
      setEmailInfo(null);
    }
  }

  async function saveEmail() {
    setEmailMsg(null);
    setEmailSaving(true);
    try {
      const r = await api<{ ok: boolean; value: string; source: "db" | "env" }>(
        "/admin/settings/admin-email",
        { method: "PUT", admin: true, body: { value: emailDraft.trim() } },
      );
      setEmailInfo({ value: r.value, source: r.source });
      setEmailDraft(r.value);
      setEmailMsg("تمّ الحفظ");
    } catch (e) {
      setEmailMsg(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setEmailSaving(false);
    }
  }

  async function clearEmail() {
    setEmailMsg(null);
    setEmailClearing(true);
    try {
      const r = await api<{ ok: boolean; value: string; source: "db" | "env" }>(
        "/admin/settings/admin-email",
        { method: "DELETE", admin: true },
      );
      setEmailInfo({ value: r.value, source: r.source });
      setEmailDraft(r.value);
      setEmailMsg("تمّ مسح تجاوز قاعدة البيانات");
    } catch (e) {
      setEmailMsg(e instanceof ApiError ? e.message : "تعذّر المسح");
    } finally {
      setEmailClearing(false);
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

      <Card style={{ gap: 12 }}>
        <T size={16} weight="bold">بريد المسؤول للإشعارات</T>
        {emailInfo ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: emailInfo.source === "db" ? colors.primary : colors.mutedForeground,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <T size={11} weight="bold" color="#fff">
                {emailInfo.source === "db" ? "قاعدة البيانات" : "متغيّر البيئة"}
              </T>
            </View>
            <T size={13} color={colors.foreground} style={{ flex: 1 }}>
              {emailInfo.value || "—"}
            </T>
          </View>
        ) : (
          <T size={13} color={colors.mutedForeground}>جارٍ التحميل…</T>
        )}
        <Field
          label="البريد الجديد"
          value={emailDraft}
          onChangeText={(v) => { setEmailDraft(v); setEmailMsg(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Btn
          title="حفظ البريد"
          loading={emailSaving}
          onPress={saveEmail}
          fullWidth
          disabled={!emailDraft.trim() || emailDraft.trim() === emailInfo?.value}
        />
        {emailInfo?.source === "db" ? (
          <Btn
            title="مسح تجاوز قاعدة البيانات"
            variant="ghost"
            loading={emailClearing}
            onPress={clearEmail}
            fullWidth
          />
        ) : null}
        {emailMsg ? (
          <T size={13} color={colors.foreground}>{emailMsg}</T>
        ) : null}
      </Card>

      <Btn title="خروج الإدارة" variant="ghost" onPress={logout} fullWidth />
    </ScrollView>
  );
}
