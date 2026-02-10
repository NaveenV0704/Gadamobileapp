import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Eye, EyeOff } from "lucide-react-native";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        // Navigate to main app
        router.replace("/(tabs)");
      } else {
        Alert.alert("Login Failed", "Invalid email or password");
      }
    } catch (error: any) {
      // Show specific error message from API if available
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cardBg px-6 justify-center">
      {/* Logo + Title */}
      <View className="items-center mb-6">
        <View className="flex-row items-center">
          <Image
            source={{
              uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}/uploads/gadalogo.png`,
            }}
            className="w-12 h-12 mr-2"
            resizeMode="contain"
          />

          <Text className="text-brand text-4xl font-bold">Gada.chat</Text>
        </View>

        <Text className="text-textPrimary text-base text-center mt-1">
          Connect with friends and the world around you
        </Text>
      </View>

      {/* Card */}
      <View className="w-full border border-borderDefault rounded-xl p-5 bg-cardBg shadow-sm">
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-brand mb-2">
            Login to Gada
          </Text>

          <Text className="text-textMuted text-center">
            Enter your credentials to access your account
          </Text>
        </View>

        <View className="mb-4">
          <Input
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email/Username"
          />
        </View>

        <View className="mb-3">
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            label="Password"
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            }
          />
        </View>

        <View className="flex-row justify-end mb-4">
          <Link href="/(auth)/forgot-password" asChild>
            <Text className="text-brand text-sm font-semibold">
              Forgot Password?
            </Text>
          </Link>
        </View>

        <Button onPress={handleLogin} className="w-full" disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Login</Text>
          )}
        </Button>

        <View className="flex-row justify-center mt-4">
          <Text className="text-textMuted mr-1">Don't have an account?</Text>
          <Link href="/(auth)/register" asChild>
            <Text className="text-brand font-bold">Sign Up</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
