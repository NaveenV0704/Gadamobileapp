import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contexts/AuthContext";
import { VideoSoundProvider } from "../components/PostVideo";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <VideoSoundProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
          </Stack>
          <StatusBar style="dark" backgroundColor="#ffffff" />
        </VideoSoundProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
