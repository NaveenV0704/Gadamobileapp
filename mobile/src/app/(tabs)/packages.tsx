import React from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Shield } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { fetchAvailableBalance, fetchPackages, type PackageItem, type ActivePlan } from "../../services/packageServices";

export default function Packages() {
  const { accessToken, logout } = useAuth();
  const [balance, setBalance] = React.useState<number>(0);
  const [searchUser, setSearchUser] = React.useState("");
  const [packages, setPackages] = React.useState<PackageItem[]>([]);
  const [activePlan, setActivePlan] = React.useState<ActivePlan | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!accessToken) return;
        const [bal, pk] = await Promise.all([
          fetchAvailableBalance(accessToken),
          fetchPackages(accessToken),
        ]);
        if (cancelled) return;
        setBalance(
          Number(pk?.walletBalance ?? bal?.user_wallet_balance ?? 0),
        );
        setPackages(pk?.data ?? []);
        setActivePlan(pk?.activePlan ?? null);
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View className="px-4 py-3 border-b border-gray-200 bg-white">
          <Text className="text-xl font-bold text-gray-900">Packages</Text>
        </View>

        <View style={{ backgroundColor: "#8e4de0" }} className="pt-4 flex-1">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
          >
            <View className="px-4">
              <View className="rounded-2xl px-4 py-6 bg-white border border-purple-200">
                <Text className="text-gray-900 text-2xl font-bold text-center">
                  Pro Packages
                </Text>
                <Text className="text-gray-900 text-center mt-1">
                  Choose the Plan That's Right for You{" "}
                  <Text className="font-semibold">
                    ( Available Balance : ₦{balance.toLocaleString()} )
                  </Text>
                </Text>
              </View>
            </View>

            <View className="px-4 pt-4">
              <View className="bg-white rounded-2xl border border-purple-200 p-4">
                <Text className="text-gray-900 font-semibold mb-3">
                  Purchase package for another user
                </Text>
                <View className="flex-row items-center">
                  <TextInput
                    className="flex-1 bg-white rounded-xl px-3 py-3 text-gray-900 border border-gray-200"
                    placeholder="Search by username..."
                    placeholderTextColor="#9CA3AF"
                    value={searchUser}
                    onChangeText={setSearchUser}
                  />
                  <TouchableOpacity
                    className="ml-3 bg-[#6f3bd1] rounded-xl px-4 py-3 active:opacity-90"
                    onPress={() => {}}
                  >
                    <Text className="text-white font-semibold">Search</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="px-4 pt-4">
              {packages.map((p) => {
                const purchased = activePlan?.package_name === p.name;
                const desc = String(p.custom_description || "").replace(/&#039;/g, "'");
                return (
                  <View key={p.package_id} className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                    <Text className="text-red-600 font-bold mb-2">{p.name}</Text>
                    <Text className="text-gray-900 text-2xl font-extrabold">₦{Number(p.price).toLocaleString()}</Text>
                    <Text className="text-gray-500 mb-3">
                      for {p.period_num} {p.period === "day" && p.period_num > 30 ? "days" : p.period + (p.period_num > 1 ? "s" : "")}
                    </Text>
                    <View className="space-y-2 mb-3">
                      {p.verification_badge_enabled === "1" ? (
                        <View className="flex-row items-center">
                          <Check size={18} color="#10B981" />
                          <Text className="ml-2 text-gray-900">Verified badge</Text>
                        </View>
                      ) : null}
                      <View className="flex-row items-center">
                        <Check size={18} color="#10B981" />
                        <Text className="ml-2 text-gray-900">Boost up to {p.boost_posts} Posts</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Check size={18} color="#10B981" />
                        <Text className="ml-2 text-gray-900">Boost up to {p.boost_pages} Pages</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Shield size={18} color="#3B82F6" />
                        <Text className="ml-2 text-gray-900 font-semibold">All Permissions</Text>
                      </View>
                    </View>
                    <Text className="text-gray-500 mb-4">{desc}</Text>
                    <View className="flex-row mb-2">
                      <TouchableOpacity
                        className={`${purchased ? "bg-gray-300" : "bg-red-500"} rounded-2xl px-4 py-3 active:opacity-90 flex-1`}
                        disabled={purchased}
                      >
                        <Text className={`${purchased ? "text-gray-700" : "text-white"} font-semibold text-center`}>
                          {purchased ? "Purchased" : "Buy Now"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row">
                      <TouchableOpacity className="bg-gray-300 rounded-2xl px-4 py-3 active:opacity-90 flex-1">
                        <Text className="text-gray-700 font-semibold text-center">
                          Select user to buy for
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
