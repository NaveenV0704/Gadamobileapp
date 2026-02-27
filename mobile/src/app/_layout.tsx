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
            <Stack.Screen name="reels-create" />
            <Stack.Screen
              name="representative"
              options={{ title: "Representative" }}
            />
            <Stack.Screen name="pages/index" options={{ headerShown: false }} />
            <Stack.Screen
              name="pages/create"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="pages/invites"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="pages/[idOrName]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="groups/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="groups/create"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="groups/invites"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="groups/[handle]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(auth)/login"
              options={{ headerShown: false }}
            />
          </Stack>
          <StatusBar style="dark" backgroundColor="#ffffff" />
        </VideoSoundProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
