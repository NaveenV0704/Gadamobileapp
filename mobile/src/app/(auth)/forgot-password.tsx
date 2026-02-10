import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Eye, EyeOff } from "lucide-react-native";

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

  // ---------------- cooldown timer ----------------

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  // ---------------- actions ----------------
  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const emailValid = isValidEmail(email);

  const handleSendOtp = async () => {
    if (!isValidEmail(email)) {
      Alert.alert("Error", "Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const ok = await sendOtp(email.trim());
      if (ok) {
        setStep(2);
        setCooldown(30);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) return;

    setLoading(true);
    try {
      const ok = await forgotpassword(email, otp);
      if (ok) setStep(3);
      else Alert.alert("Error", "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    setLoading(true);
    try {
      const ok = await resetpassword(email, otp, newPassword);
      if (ok) router.replace("/(auth)/login");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    await resendOtp(email);
    setCooldown(30);
  };

  // ---------------- UI ----------------

  return (
    <SafeAreaView className="flex-1 bg-cardBg">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        {/* ---------- Brand Header ---------- */}

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

        {/* ---------- Card ---------- */}

        <View className="w-full border border-borderDefault rounded-xl p-5 bg-cardBg shadow-sm">
          {/* ================= STEP 1 ================= */}

          {step === 1 && (
            <>
              <Text className="text-brand text-2xl font-bold mb-2">
                Forgot Password
              </Text>

              <Text className="text-textMuted mb-4">
                Enter your email to receive OTP
              </Text>

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Button
                onPress={handleSendOtp}
                disabled={loading || !emailValid}
                className="mt-3"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Send OTP</Text>
                )}
              </Button>
            </>
          )}

          {/* ================= STEP 2 ================= */}

          {step === 2 && (
            <>
              <View className="items-center mb-4">
                <Text className="text-brand text-2xl font-bold mb-2 text-center">
                  Forgot Password
                </Text>

                <Text className="text-textMuted text-center">
                  Enter the OTP sent to your email
                </Text>
              </View>

              <Input label="Email" value={email} editable={false} />

              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-textPrimary font-medium">
                  4-Digit OTP
                </Text>

                {cooldown > 0 && (
                  <Text className="text-textMuted text-sm">
                    Resend in {cooldown}s
                  </Text>
                )}
              </View>

              <Input
                value={otp}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9]/g, "");
                  setOtp(cleaned.slice(0, 4));
                }}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="1234"
              />

              <Button
                onPress={handleVerifyOtp}
                disabled={loading || otp.length !== 4}
                className="mt-3"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Verify OTP</Text>
                )}
              </Button>

              {cooldown === 0 && (
                <TouchableOpacity onPress={handleResend}>
                  <Text className="text-brand text-center mt-3 font-medium">
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* ================= STEP 3 ================= */}

          {step === 3 && (
            <>
              <Text className="text-brand text-2xl font-bold mb-2">
                Reset Password
              </Text>

              <Text className="text-textMuted mb-4">Create a new password</Text>

              <Input
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
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

              <Button onPress={handleResetPassword} className="mt-3">
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">
                    Reset Password
                  </Text>
                )}
              </Button>
            </>
          )}

          {/* ---------- Footer ---------- */}

          <View className="border-t border-borderDefault mt-6 pt-4">
            <View className="flex-row justify-center">
              <Text className="text-textMuted mr-1">Back to</Text>
              <Link href="/(auth)/login" asChild>
                <Text className="text-brand font-semibold">Login</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
