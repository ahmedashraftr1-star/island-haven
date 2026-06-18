import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from "@expo-google-fonts/ibm-plex-sans-arabic";
import React, { useCallback, useEffect } from "react";
import { I18nManager, Linking, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/lib/auth-context";
import { registerForPushNotifications } from "@/lib/push";

if (!I18nManager.isRTL && Platform.OS !== "web") {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch {
    /* no-op */
  }
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

// ─── Deep-link handler ────────────────────────────────────────────────────────
// Rendered as a null component so it runs inside the router + provider context.

function DeepLinkHandler() {
  const router = useRouter();

  const handleUrl = useCallback(
    (url: string) => {
      try {
        const parsed = new URL(url);
        const path = parsed.pathname;
        const token = parsed.searchParams.get("token");

        if (path === "/reset-password" || path.startsWith("/reset-password/")) {
          router.push({
            pathname: "/reset-password",
            params: token ? { token } : {},
          });
        } else if (path === "/book" || path.startsWith("/book/")) {
          router.push("/book");
        } else if (path === "/" || path === "") {
          router.replace("/(tabs)");
        }
        // All other paths fall through; expo-router's +not-found handles them
      } catch {
        // Ignore malformed URLs
      }
    },
    [router],
  );

  useEffect(() => {
    // Cold-start: app opened via a link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Foreground: link received while app is running
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [handleUrl]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "رجوع" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ presentation: "modal", title: "تسجيل الدخول" }} />
      <Stack.Screen name="register" options={{ presentation: "modal", title: "حساب جديد" }} />
      <Stack.Screen name="admin" options={{ presentation: "modal", title: "لوحة الإدارة" }} />
      <Stack.Screen name="forgot-password" options={{ presentation: "modal", title: "نسيت كلمة السرّ" }} />
      <Stack.Screen name="reset-password" options={{ presentation: "modal", title: "استعادة كلمة السرّ" }} />
      <Stack.Screen name="change-password" options={{ presentation: "modal", title: "تغيير كلمة السرّ" }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="member/[id]" options={{ title: "" }} />
      <Stack.Screen name="work/[id]" options={{ title: "" }} />
      <Stack.Screen name="experts" options={{ title: "الخبراء" }} />
      <Stack.Screen name="expert/[id]" options={{ title: "" }} />
      <Stack.Screen name="programs" options={{ title: "البرامج" }} />
      <Stack.Screen name="program/[id]" options={{ title: "" }} />
      <Stack.Screen name="ventures" options={{ title: "المشاريع" }} />
      <Stack.Screen name="venture/[id]" options={{ title: "" }} />
      <Stack.Screen name="courses" options={{ title: "الكورسات والورشات" }} />
      <Stack.Screen name="course/[id]" options={{ title: "" }} />
      <Stack.Screen name="cohorts" options={{ title: "الدّفعات" }} />
      <Stack.Screen name="cohort/[slug]" options={{ title: "" }} />
      <Stack.Screen name="resources" options={{ title: "دليل الرّائد" }} />
      <Stack.Screen name="team" options={{ title: "فريق آيلاند" }} />
      <Stack.Screen name="press" options={{ title: "المركز الإعلاميّ" }} />
      <Stack.Screen name="apply" options={{ title: "طلب الانتساب", presentation: "modal" }} />
      <Stack.Screen name="about" options={{ title: "من نحن" }} />
      <Stack.Screen name="numbers" options={{ title: "أرقامنا" }} />
      <Stack.Screen name="book" options={{ title: "حجز جلسة إرشاد", presentation: "modal" }} />
      <Stack.Screen name="expert-dashboard" options={{ title: "لوحة الخبير" }} />
      <Stack.Screen name="work/edit" options={{ title: "تحرير العمل", presentation: "modal" }} />
      <Stack.Screen name="search" options={{ title: "البحث" }} />
      <Stack.Screen name="sessions/[id]/rate" options={{ title: "تقييم الجلسة", presentation: "modal" }} />
      <Stack.Screen name="become-mentor" options={{ title: "انضم كمرشد", presentation: "modal" }} />
      <Stack.Screen name="story-form" options={{ title: "قصتي", presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      registerForPushNotifications().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <DeepLinkHandler />
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
