import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from "@expo-google-fonts/ibm-plex-sans-arabic";
import React, { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
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

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "رجوع" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ presentation: "modal", title: "تسجيل الدخول" }} />
      <Stack.Screen name="register" options={{ presentation: "modal", title: "حساب جديد" }} />
      <Stack.Screen name="admin" options={{ presentation: "modal", title: "لوحة الإدارة" }} />
      <Stack.Screen name="member/[id]" options={{ title: "" }} />
      <Stack.Screen name="work/[id]" options={{ title: "" }} />
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
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
