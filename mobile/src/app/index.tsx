import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}
