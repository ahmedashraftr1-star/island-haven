import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "آيلاند هيفن",
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: "#D8344F",
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
    const isPlaceholder = !projectId || /^0+(-0+)+$/.test(String(projectId));
    const tokenData = await Notifications.getExpoPushTokenAsync(
      isPlaceholder ? undefined : { projectId: String(projectId) },
    );
    const token = tokenData.data;

    try {
      await api("/push/register", {
        method: "POST",
        body: { token, platform: Platform.OS },
      });
    } catch {
      /* server may not be reachable; token still useful for retry */
    }

    return token;
  } catch {
    return null;
  }
}
