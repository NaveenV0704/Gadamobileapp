import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CreditCard, Landmark, RotateCcw } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { getUserBalance } from "../../services/pointsServcice";
import { Button } from "../../components/ui/Button";
import ManualWithdrawal from "../../components/ManualWithdrawal";

export default function WalletScreen() {
  const { accessToken, logout, user } = useAuth();
  const [tab, setTab] = useState<"wallet" | "withdraw">("wallet");
  const [balance, setBalance] = useState<number>(Number(user?.walletBalance ?? 0));
  const [method, setMethod] = useState<"paystack" | "bank">("paystack");
  const [amount, setAmount] = useState<string>("");

  const refreshBalance = useCallback(async () => {
    try {
      if (!accessToken) return;
      const data = await getUserBalance(accessToken);
      setBalance(Number(data?.user_wallet_balance ?? 0));
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        logout?.();
      }
    }
  }, [accessToken, logout]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const canPay = Number(amount) > 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Wallet
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-100">
        <TouchableOpacity
          onPress={() => setTab("wallet")}
          className={`flex-1 py-4 items-center ${
            tab === "wallet" ? "border-b-2 border-blue-600" : ""
          }`}
        >
          <Text
            className={`font-bold ${
              tab === "wallet" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            Deposit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("withdraw")}
          className={`flex-1 py-4 items-center ${
            tab === "withdraw" ? "border-b-2 border-blue-600" : ""
          }`}
        >
          <Text
            className={`font-bold ${
              tab === "withdraw" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            Withdrawal
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
      >
        <View className="p-4">
          {/* Balance Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex-row items-center border border-gray-100">
            <View className="h-12 w-12 rounded-xl bg-blue-50 items-center justify-center mr-4">
              <CreditCard size={24} color="#2563eb" />
            </View>
            <View>
              <Text className="text-gray-500 text-sm">Your Balance</Text>
              <Text className="text-2xl font-bold text-gray-900">
                ₦{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {tab === "wallet" ? (
            <View>
              {/* Deposit Form */}
              <View className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100">
                <Text className="text-gray-700 font-semibold mb-3">
                  Payment Method
                </Text>
                <View className="flex-row gap-2 mb-4">
                  <TouchableOpacity
                    onPress={() => setMethod("paystack")}
                    className={`flex-1 flex-row items-center p-3 rounded-xl border ${
                      method === "paystack"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <View className="h-8 w-8 rounded-lg bg-blue-100 items-center justify-center mr-2">
                      <RotateCcw size={18} color="#2563eb" />
                    </View>
                    <Text
                      className={`font-medium ${
                        method === "paystack" ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      Paystack
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setMethod("bank")}
                    className={`flex-1 flex-row items-center p-3 rounded-xl border ${
                      method === "bank"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <View className="h-8 w-8 rounded-lg bg-emerald-100 items-center justify-center mr-2">
                      <Landmark size={18} color="#059669" />
                    </View>
                    <Text
                      className={`font-medium ${
                        method === "bank" ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      Bank
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-gray-600 text-sm mb-1">Amount (₦)</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
                />

                <Button
                  onPress={() => {
                    Alert.alert(
                      "Deposit",
                      `Proceed with ${
                        method === "paystack" ? "Paystack" : "Bank Transfer"
                      } deposit of ₦${Number(amount).toLocaleString()}?`
                    );
                  }}
                  disabled={!canPay}
                  className={!canPay ? "bg-gray-400" : "bg-blue-600"}
                >
                  <Text className="text-white font-bold">Add money</Text>
                </Button>
              </View>
            </View>
          ) : (
            <ManualWithdrawal
              balance={balance}
              refreshBalance={refreshBalance}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
