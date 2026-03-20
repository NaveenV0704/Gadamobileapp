import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  CreditCard,
  Landmark,
  Coins,
  Search,
  Calendar as CalendarIcon,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useAuthHeader } from "../hooks/useAuthHeader";
import { Button } from "./ui/Button";
import {
  fetchWithdrawals,
  createWithdrawal,
  type WithdrawRow,
} from "../services/withdrawService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";

const MIN_WITHDRAW = 10000;

type Props = {
  balance: number;
  refreshBalance?: () => void;
};

export default function ManualWithdrawal({ balance, refreshBalance }: Props) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  // --- Withdrawal Form state ---
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<"bank" | "gada_token">("bank");
  const [transferTo, setTransferTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- History state ---
  const [list, setList] = useState<WithdrawRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [q, setQ] = useState<string>("");

  // Date Picker visibility
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loadWithdrawals = useCallback(
    async (isFirstPage = true) => {
      if (!accessToken) return;
      try {
        setLoadingList(isFirstPage);
        const currentPage = isFirstPage ? 1 : page + 1;
        const resp = await fetchWithdrawals(headers as any, {
          page: currentPage,
          pageSize: 10,
          startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          status: filterStatus,
          method: filterMethod,
          q: q || undefined,
        });

        if (isFirstPage) {
          setList(resp.data);
        } else {
          setList((prev) => [...prev, ...resp.data]);
        }
        setPage(resp.page);
        setHasMore(resp.hasMore);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingList(false);
      }
    },
    [
      accessToken,
      headers,
      page,
      startDate,
      endDate,
      filterStatus,
      filterMethod,
      q,
    ],
  );

  useEffect(() => {
    loadWithdrawals(true);
  }, [accessToken, filterStatus, filterMethod, startDate, endDate]);

  // Debounce search
  const searchTimeout = useRef<any>(null);
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadWithdrawals(true);
    }, 500);
    return () => clearTimeout(searchTimeout.current);
  }, [q]);

  const handleWithdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return Alert.alert("Error", "Enter a valid amount");
    if (amt < MIN_WITHDRAW)
      return Alert.alert("Error", `Minimum withdrawal is ₦${MIN_WITHDRAW}`);
    if (!transferTo.trim())
      return Alert.alert("Error", "Please fill ‘Transfer To’");

    try {
      setSubmitting(true);
      await createWithdrawal(headers as any, {
        amount: amt,
        method,
        transferTo: transferTo.trim(),
      });
      Alert.alert("Success", "Withdrawal request submitted");
      setAmount("");
      setTransferTo("");
      refreshBalance?.();
      loadWithdrawals(true);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setFilterStatus("all");
    setFilterMethod("all");
    setQ("");
  };

  const fmt = (v: number) =>
    `₦${(isNaN(v) ? 0 : v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return {
          label: "Approved",
          bg: "bg-emerald-100",
          text: "text-emerald-700",
        };
      case 0:
        return { label: "Pending", bg: "bg-amber-100", text: "text-amber-700" };
      case -1:
        return { label: "Declined", bg: "bg-rose-100", text: "text-rose-700" };
      default:
        return { label: "Unknown", bg: "bg-gray-100", text: "text-gray-700" };
    }
  };

  return (
    <View className="flex-1">
      {/* Withdrawal Form */}
      <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <Text className="text-gray-700 font-semibold mb-3">
          Withdrawal Method
        </Text>
        <View className="flex-row gap-2 mb-4">
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
              className={`font-medium ${method === "bank" ? "text-blue-600" : "text-gray-700"}`}
            >
              Bank
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMethod("gada_token")}
            className={`flex-1 flex-row items-center p-3 rounded-xl border ${
              method === "gada_token"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <View className="h-8 w-8 rounded-lg bg-yellow-100 items-center justify-center mr-2">
              <Coins size={18} color="#a16207" />
            </View>
            <Text
              className={`font-medium ${method === "gada_token" ? "text-blue-600" : "text-gray-700"}`}
            >
              Token
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-gray-600 text-sm mb-1">Amount (₦)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-1"
        />
        <Text className="text-gray-400 text-xs mb-4">
          Minimum withdrawal is ₦{MIN_WITHDRAW.toLocaleString()}
        </Text>

        <Text className="text-gray-600 text-sm mb-1">Transfer To</Text>
        <TextInput
          value={transferTo}
          onChangeText={setTransferTo}
          placeholder={
            method === "bank" ? "Account No, Bank, Name" : "0xYourTokenAddress"
          }
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
        />

        <Button
          onPress={handleWithdraw}
          disabled={
            submitting ||
            !amount ||
            Number(amount) < MIN_WITHDRAW ||
            !transferTo.trim()
          }
          className={submitting ? "bg-gray-400" : "bg-blue-600"}
        >
          {submitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white font-bold">Make a withdrawal</Text>
          )}
        </Button>
      </View>

      {/* Filters */}
      <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <Text className="text-gray-700 font-semibold mb-3">
          History Filters
        </Text>

        <View className="flex-row gap-2 mb-3">
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
          >
            <Text className="text-gray-600 text-xs">
              {startDate ? format(startDate, "dd/MM/yy") : "Start"}
            </Text>
            <CalendarIcon size={14} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
          >
            <Text className="text-gray-600 text-xs">
              {endDate ? format(endDate, "dd/MM/yy") : "End"}
            </Text>
            <CalendarIcon size={14} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}

        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-2">
            <Text className="text-[10px] text-gray-400 ml-2 mt-1">Status</Text>
            <TextInput
              className="px-2 py-1 text-xs text-gray-700"
              value={filterStatus}
              onChangeText={setFilterStatus}
              placeholder="all/0/1/-1"
            />
          </View>
          <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-2">
            <Text className="text-[10px] text-gray-400 ml-2 mt-1">Method</Text>
            <TextInput
              className="px-2 py-1 text-xs text-gray-700"
              value={filterMethod}
              onChangeText={setFilterMethod}
              placeholder="all/bank/token"
            />
          </View>
        </View>

        <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center mb-3">
          <Search size={16} color="#9ca3af" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search Transfer To"
            className="flex-1 ml-2 text-sm text-gray-700"
          />
        </View>

        <TouchableOpacity onPress={clearFilters} className="items-center py-2">
          <Text className="text-blue-600 font-medium">Clear Filters</Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <View className="bg-white rounded-2xl p-4 shadow-sm mb-10">
        <Text className="text-gray-700 font-semibold mb-4">
          Withdrawal History
        </Text>

        {loadingList ? (
          <ActivityIndicator size="large" color="#2563eb" className="py-10" />
        ) : list.length === 0 ? (
          <Text className="text-gray-400 text-center py-10">
            No history found
          </Text>
        ) : (
          <View>
            {list.map((item) => {
              const badge = getStatusBadge(item.status);
              return (
                <View key={item.id} className="border-b border-gray-100 py-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="text-gray-900 font-bold">
                        {fmt(Number(item.amount))}
                      </Text>
                      <Text className="text-gray-400 text-[10px] mt-0.5">
                        ID: {item.id}
                      </Text>
                    </View>
                    <View className={`${badge.bg} px-2 py-1 rounded`}>
                      <Text className={`${badge.text} text-[10px] font-bold`}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-xs capitalize">
                      {item.method.replace("_", " ")}
                    </Text>
                    <Text className="text-gray-400 text-[10px]">
                      {format(new Date(item.time), "dd MMM yyyy, HH:mm")}
                    </Text>
                  </View>

                  <Text
                    className="text-gray-600 text-[10px] mt-2 bg-gray-50 p-2 rounded"
                    numberOfLines={1}
                  >
                    To: {item.transferTo}
                  </Text>
                </View>
              );
            })}

            {hasMore && (
              <TouchableOpacity
                onPress={() => loadWithdrawals(false)}
                className="mt-4 items-center py-3 bg-gray-50 rounded-xl"
              >
                <Text className="text-blue-600 font-bold">Load More</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
