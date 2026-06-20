import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { T, Card, Btn, Field, Empty } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type SessionMode = "online" | "onsite";
type SessionStatus = "requested" | "confirmed" | "completed" | "declined" | "cancelled";
type SlotStatus = "available" | "booked" | "cancelled";

interface BookingNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

const SESSION_STATUS_AR: Record<SessionStatus, string> = {
  requested: "بانتظار",
  confirmed: "مؤكّدة",
  completed: "تمّت",
  declined: "مرفوضة",
  cancelled: "ملغاة",
};
const MODE_AR: Record<SessionMode, string> = { online: "عن بُعد", onsite: "في المساحة" };
const SLOT_STATUS_AR: Record<SlotStatus, string> = { available: "متاح", booked: "محجوز", cancelled: "ملغى" };

interface ExpertProfile {
  id: number;
  headline: string;
  expertise: string;
  bio: string;
  languages: string;
  sessionMinutes: number;
  availabilityNote: string;
  acceptingSessions: boolean;
  status: string;
}
interface SessionRow {
  session: {
    id: number;
    topic: string;
    message: string;
    mode: SessionMode;
    preferredAt: string | null;
    status: SessionStatus;
    createdAt: string;
  };
  menteeName: string;
  menteeAvatar: string | null;
}
interface Slot {
  id: number;
  startAt: string;
  endAt: string;
  mode: SessionMode;
  location: string;
  status: SlotStatus;
  note: string;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ar-EG-u-ca-gregory", {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ExpertDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"sessions" | "slots" | "profile" | "notifications">("sessions");
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [notExpert, setNotExpert] = useState(false);
  const [checking, setChecking] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const r = await api<{ profile: ExpertProfile }>("/experts/me/profile");
      setProfile(r.profile);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotExpert(true);
    } finally {
      setChecking(false);
    }
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const r = await api<{ notifications: BookingNotification[] }>("/me/notifications?type=booking_confirmed");
      setUnreadCount(r.notifications.filter((n) => !n.readAt).length);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    void loadProfile();
    void refreshUnread();
  }, [user, loading, router, loadProfile, refreshUnread]);

  if (loading || checking) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (notExpert) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Empty icon="award" title="هذه اللوحة للخبراء فقط" hint="إن رغبت بالانضمام كمرشد في آيلاند، تواصل مع الإدارة." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 4 }}>
          أهلًا {user?.fullName ?? ""}
        </T>
        <T size={24} weight="bold">لوحة الخبير</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row-reverse", gap: 8 }}>
          {([
            { k: "sessions", label: "الجلسات", badge: 0 },
            { k: "slots", label: "مواعيدي", badge: 0 },
            { k: "notifications", label: "الإشعارات", badge: unreadCount },
            { k: "profile", label: "ملفّي", badge: 0 },
          ] as const).map((t) => {
            const active = tab === t.k;
            return (
              <Pressable
                key={t.k}
                onPress={() => setTab(t.k)}
                style={{ position: "relative" }}
              >
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primarySoft : "transparent",
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <T size={12.5} weight="medium" color={active ? colors.primary : colors.foreground}>
                    {t.label}
                  </T>
                  {t.badge > 0 ? (
                    <View
                      style={{
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 4,
                      }}
                    >
                      <T size={9} weight="bold" color={colors.primaryForeground}>
                        {t.badge > 9 ? "9+" : String(t.badge)}
                      </T>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {tab === "sessions" ? (
        <SessionsPanel colors={colors} />
      ) : tab === "slots" ? (
        <SlotsPanel colors={colors} sessionMinutes={profile?.sessionMinutes ?? 45} />
      ) : tab === "notifications" ? (
        <NotificationsPanel
          colors={colors}
          onRead={() => refreshUnread()}
          onNavigateSessions={() => setTab("sessions")}
        />
      ) : (
        <ProfilePanel colors={colors} profile={profile} onSaved={setProfile} />
      )}
    </View>
  );
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

function SessionsPanel({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ sessions: SessionRow[] }>("/experts/me/sessions");
      setRows(r.sessions);
    } catch {
      setRows([]);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: number, status: SessionStatus) {
    setBusyId(id);
    try {
      await api(`/experts/me/sessions/${id}`, { method: "PATCH", body: { status } });
      await load();
    } catch (e) {
      Alert.alert("تعذّر", e instanceof ApiError ? e.message : "حاول لاحقًا");
    } finally {
      setBusyId(null);
    }
  }

  if (rows === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (rows.length === 0) {
    return <Empty icon="inbox" title="لا طلبات بعد" hint="ستظهر هنا طلبات الجلسات من أعضاء المجتمع." />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 110, gap: 12 }}>
      {rows.map((row) => {
        const s = row.session;
        const pending = s.status === "requested";
        const confirmed = s.status === "confirmed";
        return (
          <Card key={s.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 }}>
                {row.menteeAvatar ? (
                  <Image source={{ uri: resolveMedia(row.menteeAvatar) }} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.muted }} />
                ) : (
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="user" size={16} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <T size={14} weight="bold">{row.menteeName}</T>
                  <T size={11} color={colors.mutedForeground}>{fmtDateTime(s.createdAt)}</T>
                </View>
              </View>
              <SessionBadge status={s.status} colors={colors} />
            </View>

            <T size={14.5} weight="bold">{s.topic}</T>
            {s.message ? (
              <T size={13} color={colors.mutedForeground} style={{ lineHeight: 21 }}>{s.message}</T>
            ) : null}
            <T size={12} color={colors.mutedForeground}>
              النوع: {MODE_AR[s.mode]}
              {s.preferredAt ? ` · مقترح: ${fmtDateTime(s.preferredAt)}` : ""}
            </T>

            {pending || confirmed ? (
              <View style={{ flexDirection: "row-reverse", gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                {pending ? (
                  <>
                    <Btn title="تأكيد" loading={busyId === s.id} onPress={() => act(s.id, "confirmed")} style={{ flex: 1 }} />
                    <Btn title="رفض" variant="ghost" onPress={() => act(s.id, "declined")} style={{ flex: 1, borderColor: colors.border }} />
                  </>
                ) : (
                  <Btn title="تمّت الجلسة" loading={busyId === s.id} onPress={() => act(s.id, "completed")} fullWidth />
                )}
              </View>
            ) : null}
          </Card>
        );
      })}
    </ScrollView>
  );
}

function SessionBadge({ status, colors }: { status: SessionStatus; colors: ReturnType<typeof useColors> }) {
  const map: Record<SessionStatus, { bg: string; fg: string }> = {
    requested: { bg: "rgba(251,191,36,0.14)", fg: "#b45309" },
    confirmed: { bg: "rgba(16,185,129,0.14)", fg: "#059669" },
    completed: { bg: colors.primarySoft, fg: colors.primary },
    declined: { bg: colors.muted, fg: colors.mutedForeground },
    cancelled: { bg: colors.muted, fg: colors.mutedForeground },
  };
  const c = map[status];
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: c.bg }}>
      <T size={10.5} weight="bold" color={c.fg}>{SESSION_STATUS_AR[status]}</T>
    </View>
  );
}

// ─── Office hours (slots) ─────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function SlotsPanel({ colors, sessionMinutes }: { colors: ReturnType<typeof useColors>; sessionMinutes: number }) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [dayIdx, setDayIdx] = useState<number | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [mode, setMode] = useState<SessionMode>("online");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<{ slots: Slot[] }>("/experts/me/slots");
      setSlots(r.slots);
    } catch {
      setSlots([]);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const today = startOfDay(new Date());
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
  const hours = Array.from({ length: 12 }, (_, i) => 9 + i); // 9..20

  function dayLabel(d: Date, i: number): string {
    if (i === 0) return "اليوم";
    if (i === 1) return "غدًا";
    return d.toLocaleDateString("ar-EG-u-ca-gregory", { weekday: "short", day: "numeric" });
  }

  async function add() {
    if (dayIdx == null || hour == null) {
      Alert.alert("ناقص", "اختر اليوم والساعة");
      return;
    }
    const start = new Date(days[dayIdx]);
    start.setHours(hour, 0, 0, 0);
    if (start.getTime() < Date.now()) {
      Alert.alert("غير صالح", "اختر وقتًا في المستقبل");
      return;
    }
    const end = new Date(start.getTime() + (sessionMinutes || 45) * 60000);
    setBusy(true);
    try {
      await api("/experts/me/slots", {
        method: "POST",
        body: { startAt: start.toISOString(), endAt: end.toISOString(), mode, location: "", note: "" },
      });
      setDayIdx(null);
      setHour(null);
      await load();
    } catch (e) {
      Alert.alert("تعذّر الإضافة", e instanceof ApiError ? e.message : "حاول لاحقًا");
    } finally {
      setBusy(false);
    }
  }

  function remove(id: number) {
    Alert.alert("حذف الموعد؟", "", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/experts/me/slots/${id}`, { method: "DELETE" });
            await load();
          } catch (e) {
            Alert.alert("تعذّر الحذف", e instanceof ApiError ? e.message : "حاول لاحقًا");
          }
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 110, gap: 16 }}>
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
          <Feather name="plus-circle" size={16} color={colors.primary} />
          <T size={15} weight="bold">أضِف موعدًا متاحًا</T>
        </View>

        <T size={12} color={colors.mutedForeground} weight="medium">اليوم</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row-reverse", gap: 8 }}>
          {days.map((d, i) => {
            const active = dayIdx === i;
            return (
              <Pressable
                key={i}
                onPress={() => setDayIdx(i)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : "transparent",
                }}
              >
                <T size={12.5} weight={active ? "bold" : "medium"} color={active ? colors.primary : colors.foreground}>
                  {dayLabel(d, i)}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>

        <T size={12} color={colors.mutedForeground} weight="medium">الساعة</T>
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          {hours.map((h) => {
            const active = hour === h;
            return (
              <Pressable
                key={h}
                onPress={() => setHour(h)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : "transparent",
                }}
              >
                <T size={12.5} weight={active ? "bold" : "medium"} color={active ? colors.primary : colors.foreground}>
                  {`${h}:00`}
                </T>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: "row-reverse", gap: 8 }}>
          {(["online", "onsite"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 10,
                borderWidth: 1,
                alignItems: "center",
                borderColor: mode === m ? colors.primary : colors.border,
                backgroundColor: mode === m ? colors.primarySoft : "transparent",
              }}
            >
              <T size={12.5} weight="medium" color={mode === m ? colors.primary : colors.foreground}>{MODE_AR[m]}</T>
            </Pressable>
          ))}
        </View>

        <Btn title="إضافة الموعد" loading={busy} onPress={add} fullWidth />
        <T size={11} color={colors.mutedForeground} align="center">المدّة {sessionMinutes || 45} دقيقة (من ملفّك).</T>
      </Card>

      <View style={{ gap: 10 }}>
        <T size={15} weight="bold">مواعيدي</T>
        {slots === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : slots.length === 0 ? (
          <Empty icon="calendar" title="لا مواعيد بعد" hint="أضف أوّل موعد ليحجزه المنتسبون." />
        ) : (
          slots.map((s) => {
            const booked = s.status === "booked";
            return (
              <Card key={s.id} style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <T size={13.5} weight="bold">{fmtDateTime(s.startAt)}</T>
                  <T size={11.5} color={colors.mutedForeground}>
                    {MODE_AR[s.mode]}{s.location ? ` · ${s.location}` : ""}
                  </T>
                </View>
                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: booked ? colors.primarySoft : "rgba(16,185,129,0.14)",
                  }}
                >
                  <T size={10} weight="bold" color={booked ? colors.primary : "#059669"}>{SLOT_STATUS_AR[s.status]}</T>
                </View>
                {!booked ? (
                  <Pressable onPress={() => remove(s.id)} hitSlop={8}>
                    <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                  </Pressable>
                ) : null}
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

// ─── Booking Notifications ────────────────────────────────────────────────────

function NotificationsPanel({
  colors,
  onRead,
  onNavigateSessions,
}: {
  colors: ReturnType<typeof useColors>;
  onRead: () => void;
  onNavigateSessions: () => void;
}) {
  const [items, setItems] = useState<BookingNotification[] | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<{ notifications: BookingNotification[] }>("/me/notifications?type=booking_confirmed");
      setItems(r.notifications);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markOneRead(id: number) {
    try {
      await api(`/me/notifications/${id}/read`, { method: "POST" });
      setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)) ?? null);
      onRead();
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await api("/me/notifications/read-all", { method: "POST" });
      setItems((prev) => prev?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? null);
      onRead();
    } catch {
      Alert.alert("تعذّر", "حاول لاحقًا");
    } finally {
      setMarkingAll(false);
    }
  }

  if (items === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const hasUnread = items.some((n) => !n.readAt);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 110, gap: 10 }}>
      {items.length > 0 && hasUnread ? (
        <Btn
          title="تعليم الكلّ كمقروء"
          variant="ghost"
          loading={markingAll}
          onPress={markAllRead}
          fullWidth
        />
      ) : null}

      {items.length === 0 ? (
        <Empty icon="bell" title="لا إشعارات بعد" hint="ستظهر هنا إشعارات الحجوزات الجديدة." />
      ) : (
        items.map((n) => {
          const unread = !n.readAt;
          return (
            <Pressable
              key={n.id}
              onPress={async () => {
                if (unread) await markOneRead(n.id);
                onNavigateSessions();
              }}
            >
              <Card
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "flex-start",
                  gap: 12,
                  backgroundColor: unread ? colors.primarySoft : undefined,
                  borderColor: unread ? colors.primary : undefined,
                  borderWidth: unread ? 1 : undefined,
                  opacity: unread ? 1 : 0.75,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: unread ? colors.primary : colors.muted,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Feather name="calendar" size={18} color={unread ? colors.primaryForeground : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
                    <T size={13.5} weight="bold" color={unread ? colors.primary : colors.foreground}>
                      {n.title}
                    </T>
                    {unread ? (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: colors.primary,
                        }}
                      />
                    ) : null}
                  </View>
                  {n.body ? (
                    <T size={13} color={colors.foreground} style={{ lineHeight: 20 }}>
                      {n.body}
                    </T>
                  ) : null}
                  <T size={11} color={colors.mutedForeground}>{fmtDateTime(n.createdAt)}</T>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Feather name="arrow-left" size={11} color={colors.primary} />
                    <T size={11} color={colors.primary} weight="medium">عرض الجلسات</T>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfilePanel({
  colors,
  profile,
  onSaved,
}: {
  colors: ReturnType<typeof useColors>;
  profile: ExpertProfile | null;
  onSaved: (p: ExpertProfile) => void;
}) {
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [note, setNote] = useState(profile?.availabilityNote ?? "");
  const [accepting, setAccepting] = useState(profile?.acceptingSessions ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline);
      setBio(profile.bio);
      setNote(profile.availabilityNote);
      setAccepting(profile.acceptingSessions);
    }
  }, [profile]);

  if (!profile) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  async function save() {
    setBusy(true);
    try {
      const r = await api<{ profile: ExpertProfile }>("/experts/me/profile", {
        method: "PATCH",
        body: {
          headline,
          expertise: profile!.expertise,
          bio,
          languages: profile!.languages,
          sessionMinutes: profile!.sessionMinutes,
          availabilityNote: note,
          acceptingSessions: accepting,
        },
      });
      onSaved(r.profile);
      Alert.alert("تمّ", "تمّ حفظ ملفّك.");
    } catch (e) {
      Alert.alert("تعذّر الحفظ", e instanceof ApiError ? e.message : "حاول لاحقًا");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 110, gap: 14 }}>
      {profile.status !== "active" ? (
        <Card style={{ backgroundColor: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.3)" }}>
          <T size={12.5} color="#b45309" style={{ lineHeight: 20 }}>
            ملفّك قيد المراجعة ولن يظهر للعامّة حتى يُفعَّل.
          </T>
        </Card>
      ) : null}

      <Field label="المسمّى التعريفيّ" value={headline} onChangeText={setHeadline} maxLength={160} />
      <Field label="نبذة تعريفيّة" value={bio} onChangeText={setBio} maxLength={4000} multiline numberOfLines={5} />
      <Field
        label="ملاحظة عن التوفّر (اختياري)"
        value={note}
        onChangeText={setNote}
        maxLength={300}
        placeholder="متاح مساء الأحد والثلاثاء"
      />

      <Pressable
        onPress={() => setAccepting((v) => !v)}
        style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingVertical: 4 }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: accepting ? colors.primary : colors.border,
            backgroundColor: accepting ? colors.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {accepting ? <Feather name="check" size={14} color={colors.primaryForeground} /> : null}
        </View>
        <T size={13.5}>أستقبل طلبات جلسات إرشاد جديدة</T>
      </Pressable>

      <Btn title="حفظ الملف" loading={busy} onPress={save} fullWidth />
    </ScrollView>
  );
}
