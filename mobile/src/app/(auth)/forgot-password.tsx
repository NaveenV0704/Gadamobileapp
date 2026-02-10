import React, { useState, useEffect } from "react";
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
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";

export default function ForgotPassword() {
  const router = useRouter();
  const { sendOtp, forgotpassword, resetpassword, resendOtp } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const success = await sendOtp(email);
      if (success) {
        Alert.alert("Success", "OTP sent to your email");
        setStep(2);
        setCooldown(30);
      } else {
        Alert.alert("Error", "Failed to send OTP. Please check your email.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email first");
      return;
    }

    setLoading(true);
    try {
      const success = await resendOtp(email);
      if (success) {
        Alert.alert("Success", "OTP resent successfully");
        setCooldown(30);
      } else {
        Alert.alert("Error", "Failed to resend OTP");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }

    if (!/^\d{4}$/.test(otp)) {
      Alert.alert("Error", "OTP must be a 4-digit number");
      return;
    }

    setLoading(true);
    try {
      // Note: In some implementations, verification happens locally or simply proceeds.
      // Assuming forgotpassword(email, otp) verifies the OTP with the backend.
      const success = await forgotpassword(email, otp);
      if (success) {
        setStep(3);
      } else {
        Alert.alert("Error", "Invalid OTP");
      }
    } catch (error) {
      Alert.alert("Error", "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const success = await resetpassword(email, otp, newPassword);
      if (success) {
        Alert.alert("Success", "Password reset successfully", [
          { text: "Login", onPress: () => router.replace("/(auth)/login") },
        ]);
      } else {
        Alert.alert("Error", "Failed to reset password");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View className="space-y-4 w-full">
      <Text className="text-gray-500 mb-4 text-center">
        Enter your email address and we'll send you an OTP to reset your
        password.
      </Text>
      <Input
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        label="Email"
      />
      <Button onPress={handleSendOtp} disabled={loading} className="mt-4">
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">Send OTP</Text>
        )}
      </Button>
    </View>
  );

  const renderStep2 = () => (
    <View className="space-y-4 w-full">
      <Text className="text-gray-500 mb-4 text-center">
        Enter the OTP sent to {email}
      </Text>
      <Input
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        label="OTP"
      />
      <Button onPress={handleVerifyOtp} disabled={loading} className="mt-4">
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">Verify OTP</Text>
        )}
      </Button>

      <Button
        onPress={handleResendOtp}
        disabled={loading || cooldown > 0}
        variant="ghost"
        className="mt-2"
      >
        <Text className={cooldown > 0 ? "text-gray-400" : "text-blue-600"}>
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
        </Text>
      </Button>

      <Button onPress={() => setStep(1)} variant="ghost" className="mt-2">
        <Text className="text-gray-500">Wrong email? Go back</Text>
      </Button>
    </View>
  );

  const renderStep3 = () => (
    <View className="space-y-4 w-full">
      <Text className="text-gray-500 mb-4 text-center">
        Create a new password
      </Text>
      <Input
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry={!showPassword}
        label="New Password"
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
      <Button onPress={handleResetPassword} disabled={loading} className="mt-4">
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">Reset Password</Text>
        )}
      </Button>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="pt-4 mb-6">
        <Link href="/(auth)/login" asChild>
          <Button variant="ghost" className="self-start p-0">
            <ArrowLeft size={24} color="#4b5563" />
          </Button>
        </Link>
      </View>

      <View className="items-center mb-8">
        <Text className="text-2xl font-bold text-blue-600 mb-2">
          {step === 1
            ? "Forgot Password"
            : step === 2
              ? "Verification"
              : "Reset Password"}
        </Text>
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </SafeAreaView>
  );
}
