import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
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
    <SafeAreaView className="flex-1 bg-white px-6 justify-center">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-blue-600 mb-2">
          Welcome Back
        </Text>
        <Text className="text-gray-500">Sign in to continue</Text>
      </View>

      <View className="space-y-4 w-full">
        <Input
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email/Username"
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          label="Password"
          rightElement={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={20} color="#6b7280" />
              ) : (
                <Eye size={20} color="#6b7280" />
              )}
            </TouchableOpacity>
          }
        />

        <View className="flex-row justify-end">
          <Link href="/(auth)/forgot-password" asChild>
            <Text className="text-blue-600 text-sm font-semibold">
              Forgot Password?
            </Text>
          </Link>
        </View>

        <Button
          onPress={handleLogin}
          className="w-full mt-4"
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Login</Text>
          )}
        </Button>

        <View className="flex-row justify-center mt-4 gap-1">
          <Text className="text-gray-600">Don't have an account?</Text>
          <Link href="/(auth)/register" asChild>
            <Text className="text-blue-600 font-bold">Sign Up</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
