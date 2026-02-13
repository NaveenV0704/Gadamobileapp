import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CreditCard, Landmark, RotateCcw, Coins } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { getUserBalance } from "../../services/pointsServcice";
import { Button } from "../../components/ui/Button";

export default function WalletScreen() {
  const { user, accessToken, logout } = useAuth();
  const [tab, setTab] = useState<"wallet" | "payments">("wallet");
  const [wallet, setWallet] = useState<number>(Number(user?.walletBalance ?? 0));
  const [method, setMethod] = useState<"paystack" | "bank">("paystack");
  const [withdrawMethod, setWithdrawMethod] = useState<"bank" | "token">("bank");
  const [amount, setAmount] = useState<string>("");
  const parsedAmount = Math.max(0, parseInt(amount || "0", 10) || 0);
  const canPay = parsedAmount > 0;
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [transferTo, setTransferTo] = useState<string>("");
  const parsedWithdraw = Math.max(0, parseInt(withdrawAmount || "0", 10) || 0);
  const canWithdraw = parsedWithdraw >= 1000 && transferTo.trim().length > 0;
  const [pStart, setPStart] = useState<string>("");
  const [pEnd, setPEnd] = useState<string>("");
  const [pMethod, setPMethod] = useState<"All" | "Bank Transfer" | "gada token">("All");
  const [pStatus, setPStatus] = useState<"All" | "Pending" | "Success" | "Failed">("All");
  const [pSearch, setPSearch] = useState<string>("");
  const [methodOpen, setMethodOpen] = useState<boolean>(false);
  const [statusOpen, setStatusOpen] = useState<boolean>(false);
  type WHistory = { id: string; amount: number; method: string; to: string; time: string; status: string };
  const [withdrawals] = useState<WHistory[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  type WTx = { date: string; type: "In" | "Out"; amount: number };
  const [tx] = useState<WTx[]>([
    { date: "2025-12-29", type: "In", amount: 1 },
    { date: "2025-12-29", type: "In", amount: 1 },
    { date: "2025-12-29", type: "In", amount: 1 },
    { date: "2025-12-29", type: "In", amount: 1 },
    { date: "2025-12-29", type: "In", amount: 1 },
    { date: "2025-08-22", type: "In", amount: 10 },
  ]);
  const parseDMY = (v: string): Date | null => {
    const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(v.trim());
    if (!m) return null;
    const d = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const y = Number(m[3]);
    const dt = new Date(y, mo, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
    return dt;
  };
  const inRange = (iso: string) => {
    const dt = new Date(iso);
    const s = startDate ? parseDMY(startDate) : null;
    const e = endDate ? parseDMY(endDate) : null;
    if (s && dt < s) return false;
    if (e) {
      const ee = new Date(e);
      ee.setHours(23, 59, 59, 999);
      if (dt > ee) return false;
    }
    return true;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!accessToken) return;
        const balance = await getUserBalance(accessToken);
        if (cancelled) return;
        setWallet(Number(balance?.user_wallet_balance ?? 0));
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          logout?.();
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 py-4 bg-white">
        <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">Wallet</Text>
      </View>
      <View className="flex-1" style={{ backgroundColor: "#8e4de0" }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
        >
          <View className="px-4">
            <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
              <View className="flex-row items-start">
                <View style={{ marginRight: 28 }}>
                  <TouchableOpacity onPress={() => setTab("wallet")}>
                    <Text className={tab === "wallet" ? "text-blue-600 font-semibold" : "text-gray-700"}>
                      Wallet
                    </Text>
                  </TouchableOpacity>
                  {tab === "wallet" ? (
                    <View style={{ height: 2, width: 40, backgroundColor: "#2563eb", marginTop: 6 }} />
                  ) : null}
                </View>
                <View>
                  <TouchableOpacity onPress={() => setTab("payments")}>
                    <Text className={tab === "payments" ? "text-blue-600 font-semibold" : "text-gray-700"}>
                      Payments
                    </Text>
                  </TouchableOpacity>
                  {tab === "payments" ? (
                    <View style={{ height: 2, width: 60, backgroundColor: "#2563eb", marginTop: 6 }} />
                  ) : null}
                </View>
              </View>
            </View>
            {tab === "wallet" ? (
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#F3F4F6",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      marginRight: 12,
                    }}
                  >
                    <CreditCard size={18} color="#6B7280" />
                  </View>
                  <View>
                    <Text className="text-gray-500">Your Credit</Text>
                    <Text className="text-2xl font-extrabold text-gray-900">
                      ₦{Number(wallet).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
            {tab === "payments" ? (
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#F3F4F6",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      marginRight: 12,
                    }}
                  >
                    <CreditCard size={18} color="#6B7280" />
                  </View>
                  <View>
                    <Text className="text-gray-500">Your Balance</Text>
                    <Text className="text-2xl font-extrabold text-gray-900">
                      ₦{Number(wallet).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
            {tab === "payments" ? (
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <Text className="text-gray-500 mb-3">Withdrawal Method</Text>
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    onPress={() => setWithdrawMethod("bank")}
                    style={{
                      width: "48%",
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: withdrawMethod === "bank" ? "#93C5FD" : "#E5E7EB",
                      backgroundColor: withdrawMethod === "bank" ? "#EFF6FF" : "#FFFFFF",
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#DCFCE7",
                          borderWidth: 1,
                          borderColor: "#86EFAC",
                          marginRight: 10,
                        }}
                      >
                        <Landmark size={16} color="#059669" />
                      </View>
                      <Text className={withdrawMethod === "bank" ? "text-blue-600 font-semibold" : "text-gray-800 font-semibold"}>
                        Bank Transfer
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setWithdrawMethod("token")}
                    style={{
                      width: "48%",
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: withdrawMethod === "token" ? "#93C5FD" : "#E5E7EB",
                      backgroundColor: withdrawMethod === "token" ? "#EFF6FF" : "#FFFFFF",
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#FEF9C3",
                          borderWidth: 1,
                          borderColor: "#FDE68A",
                          marginRight: 10,
                        }}
                      >
                        <Coins size={16} color="#D97706" />
                      </View>
                      <Text className={withdrawMethod === "token" ? "text-blue-600 font-semibold" : "text-gray-800 font-semibold"}>
                        gada token
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {tab === "payments" ? (
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <Text className="text-gray-500 mb-2">Amount (₦)</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                />
                <Text className="text-gray-400 mt-2">The minimum withdrawal request amount is ₦1,000</Text>
              </View>
            ) : null}
            {tab === "payments" ? (
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <Text className="text-gray-500 mb-2">Transfer To</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 mb-3"
                  placeholder="e.g., 2027267123, Kuda Bank, Account Name"
                  placeholderTextColor="#9CA3AF"
                  value={transferTo}
                  onChangeText={setTransferTo}
                />
                <Button
                  onPress={() => {}}
                  disabled={!canWithdraw}
                  className={`${canWithdraw ? "bg-slate-900" : "bg-gray-400"}`}
                >
                  <Text className="text-white font-semibold">Make a withdrawal</Text>
                </Button>
              </View>
            ) : null}
            {tab === "payments" ? (
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <Text className="text-gray-500 mb-2">Start Date</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 mb-3"
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor="#9CA3AF"
                  value={pStart}
                  onChangeText={setPStart}
                />
                <Text className="text-gray-500 mb-2">End Date</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 mb-3"
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor="#9CA3AF"
                  value={pEnd}
                  onChangeText={setPEnd}
                />
                <Text className="text-gray-500 mb-2">Method</Text>
                <View style={{ position: "relative" }}>
                  <TouchableOpacity
                    onPress={() => {
                      setMethodOpen((v) => !v);
                      setStatusOpen(false);
                    }}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 mb-3"
                  >
                    <Text className="text-gray-800">{pMethod}</Text>
                  </TouchableOpacity>
                  {methodOpen ? (
                    <View
                      className="bg-white border border-gray-200 rounded-lg"
                      style={{ position: "absolute", top: 46, left: 0, width: "100%", zIndex: 20, elevation: 6 }}
                    >
                      {["All", "Bank Transfer", "gada token"].map((label) => (
                        <TouchableOpacity
                          key={label}
                          onPress={() => {
                            setPMethod(label as any);
                            setMethodOpen(false);
                          }}
                          style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                        >
                          <Text className="text-gray-800">{label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
                <Text className="text-gray-500 mb-2">Status</Text>
                <View style={{ position: "relative" }}>
                  <TouchableOpacity
                    onPress={() => {
                      setStatusOpen((v) => !v);
                      setMethodOpen(false);
                    }}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 mb-3"
                  >
                    <Text className="text-gray-800">{pStatus}</Text>
                  </TouchableOpacity>
                  {statusOpen ? (
                    <View
                      className="bg-white border border-gray-200 rounded-lg"
                      style={{ position: "absolute", top: 46, left: 0, width: "100%", zIndex: 20, elevation: 6 }}
                    >
                      {["All", "Pending", "Success", "Failed"].map((label) => (
                        <TouchableOpacity
                          key={label}
                          onPress={() => {
                            setPStatus(label as any);
                            setStatusOpen(false);
                          }}
                          style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                        >
                          <Text className="text-gray-800">{label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
                <Text className="text-gray-500 mb-2">Search (Transfer To)</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="e.g., bank name / address"
                  placeholderTextColor="#9CA3AF"
                  value={pSearch}
                  onChangeText={setPSearch}
                />
                <View className="flex-row justify-end mt-3">
                  <TouchableOpacity
                    onPress={() => {
                      setPStart("");
                      setPEnd("");
                      setPMethod("All");
                      setPStatus("All");
                      setPSearch("");
                      setMethodOpen(false);
                      setStatusOpen(false);
                    }}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      backgroundColor: "#E5E7EB",
                      borderRadius: 10,
                    }}
                  >
                    <Text className="text-gray-800 font-semibold">Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {tab === "wallet" ? (
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <Text className="text-gray-500 mb-3">Payment Method</Text>
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    onPress={() => setMethod("paystack")}
                    style={{
                      width: "48%",
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: method === "paystack" ? "#93C5FD" : "#E5E7EB",
                      backgroundColor: method === "paystack" ? "#EFF6FF" : "#FFFFFF",
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: method === "paystack" ? "#DBEAFE" : "#F3F4F6",
                          borderWidth: 1,
                          borderColor: method === "paystack" ? "#93C5FD" : "#E5E7EB",
                          marginRight: 10,
                        }}
                      >
                        <CreditCard size={16} color={method === "paystack" ? "#2563EB" : "#6B7280"} />
                      </View>
                      <Text className={method === "paystack" ? "text-blue-600 font-semibold" : "text-gray-800 font-semibold"}>
                        Paystack
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setMethod("bank")}
                    style={{
                      width: "48%",
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: method === "bank" ? "#86EFAC" : "#E5E7EB",
                      backgroundColor: method === "bank" ? "#ECFDF5" : "#FFFFFF",
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: method === "bank" ? "#DCFCE7" : "#F3F4F6",
                          borderWidth: 1,
                          borderColor: method === "bank" ? "#86EFAC" : "#E5E7EB",
                          marginRight: 10,
                        }}
                      >
                        <Landmark size={16} color={method === "bank" ? "#059669" : "#6B7280"} />
                      </View>
                      <Text className={method === "bank" ? "text-emerald-700 font-semibold" : "text-gray-800 font-semibold"}>
                        Bank Transfer
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {tab === "wallet" ? (
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <Text className="text-gray-500 mb-2">Amount (₦)</Text>
                <View className="flex-row items-center">
                  <View style={{ flex: 1 }}>
                    <TextInput
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter amount"
                      placeholderTextColor="#9CA3AF"
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ width: 10 }} />
                  <Button
                    onPress={() => {
                      if (!canPay) return;
                      Alert.alert(
                        "Proceed to Pay",
                        `Method: ${method === "paystack" ? "Paystack" : "Bank Transfer"}\nAmount: ₦${parsedAmount.toLocaleString()}`
                      );
                    }}
                    disabled={!canPay}
                    className={`px-4 ${canPay ? "bg-slate-900" : "bg-gray-400"}`}
                  >
                    <Text className="text-white font-semibold">Pay ₦</Text>
                  </Button>
                </View>
              </View>
            ) : null}
            {tab === "wallet" ? (
              <>
                <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                  <View className="flex-row items-end justify-between" style={{ flexWrap: "wrap", rowGap: 12 }}>
                    <View style={{ width: "42%" }}>
                      <Text className="text-gray-500 mb-2">Start Date</Text>
                      <TextInput
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                        placeholder="dd-mm-yyyy"
                        placeholderTextColor="#9CA3AF"
                        value={startDate}
                        onChangeText={setStartDate}
                      />
                    </View>
                    <View style={{ width: "42%" }}>
                      <Text className="text-gray-500 mb-2">End Date</Text>
                      <TextInput
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                        placeholder="dd-mm-yyyy"
                        placeholderTextColor="#9CA3AF"
                        value={endDate}
                        onChangeText={setEndDate}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#E5E7EB",
                        borderRadius: 10,
                        marginLeft: 12,
                      }}
                    >
                      <RotateCcw size={18} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                  <View className="flex-row px-2 py-2 border-b border-gray-200">
                    <Text style={{ width: "50%" }} className="text-gray-500 font-semibold">
                      Date
                    </Text>
                    <Text style={{ width: "20%" }} className="text-gray-500 font-semibold">
                      Type
                    </Text>
                    <Text style={{ width: "30%", textAlign: "right" }} className="text-gray-500 font-semibold">
                      Amount (₦)
                    </Text>
                  </View>
                  {tx.filter(t => inRange(t.date)).map((t, idx) => {
                    const dateLabel = new Date(t.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    });
                    return (
                      <View key={idx} className="flex-row px-2 py-3 border-b border-gray-100">
                        <Text style={{ width: "50%" }} className="text-gray-800">
                          {dateLabel}
                        </Text>
                        <Text style={{ width: "20%" }} className="text-gray-800">
                          {t.type}
                        </Text>
                        <Text style={{ width: "30%", textAlign: "right" }} className="text-gray-800">
                          {t.amount}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}
            {tab === "payments" ? (
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <Text className="text-gray-900 font-semibold mb-3">Withdrawal History</Text>
                <View className="flex-row px-2 py-2 border-b border-gray-200">
                  <Text style={{ width: 80 }} className="text-gray-500 font-semibold">
                    ID
                  </Text>
                  <Text style={{ width: 100 }} className="text-gray-500 font-semibold">
                    Amount
                  </Text>
                  <Text style={{ width: 140 }} className="text-gray-500 font-semibold">
                    Method
                  </Text>
                  <Text style={{ flex: 1 }} className="text-gray-500 font-semibold">
                    Transfer To
                  </Text>
                  <Text style={{ width: 140 }} className="text-gray-500 font-semibold">
                    Time
                  </Text>
                  <Text style={{ width: 100 }} className="text-gray-500 font-semibold">
                    Status
                  </Text>
                </View>
                {withdrawals.length === 0 ? (
                  <View className="py-6 items-center">
                    <Text className="text-gray-500">No withdrawal requests found.</Text>
                  </View>
                ) : (
                  withdrawals.map((w) => (
                    <View key={w.id} className="flex-row px-2 py-3 border-b border-gray-100">
                      <Text style={{ width: 80 }} className="text-gray-800">
                        {w.id}
                      </Text>
                      <Text style={{ width: 100 }} className="text-gray-800">
                        ₦{Number(w.amount).toLocaleString()}
                      </Text>
                      <Text style={{ width: 140 }} className="text-gray-800">
                        {w.method}
                      </Text>
                      <Text style={{ flex: 1 }} className="text-gray-800">
                        {w.to}
                      </Text>
                      <Text style={{ width: 140 }} className="text-gray-800">
                        {new Date(w.time).toLocaleString()}
                      </Text>
                      <Text style={{ width: 100 }} className="text-gray-800">
                        {w.status}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
