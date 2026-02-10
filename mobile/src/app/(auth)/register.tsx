import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Eye, EyeOff } from "lucide-react-native";

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (
      !email ||
      !password ||
      !firstname ||
      !lastname ||
      !username ||
      !confirmPassword
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const success = await register(
        firstname,
        lastname,
        username,
        email,
        password,
        referral,
      );
      if (success) {
        Alert.alert(
          "Success",
          "Registration completed successfully, Please check your email and activate the account",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
        );
      } else {
        Alert.alert(
          "Registration Failed",
          "Could not create account or email already in use",
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-blue-600 mb-2">
            Create Account
          </Text>
          <Text className="text-gray-500">Join Gada Mobile today</Text>
        </View>

        <View className="w-full">
          {/* First + Last Name Row */}
          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Input
                placeholder="First Name"
                value={firstname}
                onChangeText={setFirstname}
                label="First Name"
              />
            </View>

            <View className="flex-1 ml-2">
              <Input
                placeholder="Last Name"
                value={lastname}
                onChangeText={setLastname}
                label="Last Name"
              />
            </View>
          </View>

          {/* Username */}
          <View className="mb-4">
            <Input
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              label="Username"
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
            />
          </View>

          {/* Password */}
          <View className="mb-4">
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              label="Password"
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              }
            />
          </View>

          {/* Confirm Password */}
          <View className="mb-4">
            <Input
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              label="Confirm Password"
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              }
            />
          </View>

          {/* Button */}
          <Button
            onPress={handleRegister}
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Sign Up</Text>
            )}
          </Button>

          {/* Login Link */}
          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-600 mr-1">Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Text className="text-blue-600 font-bold">Login</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
