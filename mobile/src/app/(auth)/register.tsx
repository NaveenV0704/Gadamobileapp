import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
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
          "Registration completed. Please verify your email.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cardBg">
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        {/* Brand Header */}
        <View className="items-center mb-8">
          <View className="flex-row items-center mb-2">
            <Image
              source={{
                uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}/uploads/gadalogo.png`,
              }}
              className="w-12 h-12 mr-2"
              resizeMode="contain"
            />
            <Text className="text-brand text-4xl font-bold">Gada.chat</Text>
          </View>

          <Text className="text-textPrimary text-center">
            Connect with friends and the world around you
          </Text>
        </View>

        {/* Form Card */}
        <View className="w-full border border-borderDefault rounded-xl p-5 bg-cardBg shadow-sm">
          <View className="items-center mb-6">
            <Text className="text-2xl font-bold text-brand mb-1">
              Create Account
            </Text>
            <Text className="text-textMuted text-center">Join Gada today</Text>
          </View>

          {/* Name Row */}
          <View className="flex-row mb-2">
            <View className="flex-1 mr-2">
              <Input
                label="First Name"
                value={firstname}
                onChangeText={setFirstname}
              />
            </View>

            <View className="flex-1 ml-2">
              <Input
                label="Last Name"
                value={lastname}
                onChangeText={setLastname}
              />
            </View>
          </View>

          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
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

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            }
          />

          <Button
            onPress={handleRegister}
            className="w-full mt-3"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Sign Up</Text>
            )}
          </Button>

          <View className="flex-row justify-center mt-4">
            <Text className="text-textMuted mr-1">
              Already have an account?
            </Text>
            <Link href="/(auth)/login" asChild>
              <Text className="text-brand font-bold">Login</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
