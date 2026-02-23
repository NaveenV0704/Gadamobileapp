import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Rocket,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import {
  affTransfer,
  getAffOverview,
  getAffReferrals,
  type AffiliateOverview,
  type AffiliateReferralItem,
} from "../../services/affiliateService";
import ShareStrip from "../../components/ShareStrip";
import { API_BASE_URL } from "../../constants/config";
import { Avatar } from "../../components/ui/Avatar";
 

const initials = (n: string) =>
  (n || "?")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0]!.toUpperCase())
    .slice(0, 2)
    .join("");

const fmt = (v: number) =>
  `₦${(isNaN(v) ? 0 : v).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;

export default function Mine() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const section =
    typeof params.section === "string" ? params.section : undefined;
  const title =
    section === "popular"
      ? "Popular"
      : section === "offers"
        ? "My Offers"
        : section === "blogs"
          ? "My Blogs"
          : section === "scheduled"
            ? "Scheduled"
            : section === "packages"
              ? "Packages"
              : section === "affiliates"
                ? "Affiliates"
                : section === "ads"
                  ? "Ads Manager"
                  : "Mine";

  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [over, setOver] = useState<AffiliateOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [level, setLevel] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");

  const [refRows, setRefRows] = useState<{
    items: AffiliateReferralItem[];
    total: number;
  } | null>(null);

  const pages = useMemo(() => {
    if (!refRows) return 1;
    return Math.max(1, Math.ceil((refRows.total || 0) / limit));
  }, [refRows, limit]);

  useEffect(() => {
    if (!accessToken || section !== "affiliates") return;
    setBusy(true);
    setErr(null);
    getAffOverview(headers)
      .then(setOver)
      .catch((e) => setErr(String(e?.message || "Failed to load")))
      .finally(() => setBusy(false));
  }, [accessToken, headers, section]);

  useEffect(() => {
    if (!accessToken || section !== "affiliates") return;
    getAffReferrals(headers, { page, limit, level, search: q })
      .then((d) =>
        setRefRows({ items: d.items || [], total: d.total || 0 }),
      )
      .catch(() => {});
  }, [accessToken, headers, section, page, limit, level, q]);

  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    if (!over?.shareLink) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [over?.shareLink]);

  const [amt, setAmt] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);

  const doTransfer = useCallback(async () => {
    if (!over) return;
    try {
      const n = Number(amt);
      if (!Number.isFinite(n) || n <= 0) return;
      setTransferError(null);
      await affTransfer(headers, n);
      const fresh = await getAffOverview(headers);
      setOver(fresh);
      setAmt("");
    } catch (e: any) {
      setTransferError(e?.message || "Transfer failed");
    }
  }, [amt, headers, over]);

  const renderAffiliates = () => {
    if (!over && busy) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#1877F2" />
        </View>
      );
    }

    if (err) {
      return (
        <View className="px-4 pt-4">
          <Text className="text-red-500 text-sm">{err}</Text>
        </View>
      );
    }

    if (!over) {
      return null;
    }

    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          <View className="rounded-2xl bg-cyan-50 border border-cyan-200 p-4">
            <Text className="font-semibold text-cyan-900">
              Affiliates System
            </Text>
            <Text className="text-sm text-cyan-900 mt-1 opacity-90">
              Earn up to multi-level commissions when people join via your
              link.
            </Text>
          </View>
        </View>

        <View className="px-4 pt-4">
          <View className="bg-white rounded-2xl shadow border border-gray-100 p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm text-gray-700">
                Your affiliate link
              </Text>
              <Text className="text-xs text-gray-500">
                Affiliates Money Balance
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <View className="flex-1 bg-gray-50 rounded-full px-3 py-2">
                <Text
                  numberOfLines={1}
                  className="text-xs text-gray-700"
                >
                  {over.shareLink}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onCopy}
                className="ml-2 px-3 py-2 rounded-full border border-gray-300"
              >
                <Text className="text-xs text-gray-700">
                  {copied ? "Copied" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="mb-3">
              <ShareStrip
                url={over.shareLink || ""}
                title="Join me on Gada Chat"
                text="Sign up using my invitation link!"
              />
            </View>
            <Text className="text-2xl font-semibold text-right text-gray-900">
              {fmt(Number(over.balance.affiliate || 0))}
            </Text>
          </View>
        </View>

        <View className="px-4 pt-4">
          <View className="bg-white rounded-2xl shadow border border-gray-100 p-4">
            <View className="flex-row items-end gap-3">
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-1">
                  Amount (₦)
                </Text>
                <TextInput
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  value={amt}
                  onChangeText={setAmt}
                  className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900"
                />
              </View>
              <Button
                className="h-11 px-6"
                disabled={
                  !over.settings.transferEnabled ||
                  !amt ||
                  Number(amt) <= 0
                }
                onPress={doTransfer}
              >
                <Text className="text-white font-semibold text-sm">
                  Transfer to Wallet
                </Text>
              </Button>
            </View>
            {!over.settings.transferEnabled && (
              <Text className="mt-2 text-xs text-gray-500">
                Transfers are currently disabled by admin.
              </Text>
            )}
            {transferError ? (
              <Text className="mt-2 text-xs text-red-500">
                {transferError}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="px-4 pt-4 pb-4">
          <View className="flex-row flex-wrap -mx-1">
            {over.referrals.perLevel.map((v, i) => (
              <View
                key={i}
                className="w-1/3 px-1 mb-2"
              >
                <View className="rounded-xl bg-white shadow border border-gray-100 p-3 items-center">
                  <Text className="text-xs text-gray-500">
                    Level {i + 1}
                  </Text>
                  <Text className="text-lg font-semibold text-gray-900 mt-1">
                    {v}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="px-4 pt-4">
          <View className="bg-white rounded-2xl shadow border border-gray-100 p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3">
                <Text className="text-sm text-gray-600">Show</Text>
                <View className="flex-row items-center">
                  {[10, 20, 50].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => {
                        setPage(1);
                        setLimit(n);
                      }}
                      className={`px-2 py-1 rounded-full border ${
                        limit === n
                          ? "bg-blue-50 border-blue-500"
                          : "border-gray-300"
                      } mr-1`}
                    >
                      <Text className="text-xs text-gray-700">
                        {n}/page
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View className="flex-row items-center">
                {Array.from({
                  length: Math.max(1, over.settings.levels || 1),
                }).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setPage(1);
                      setLevel(i + 1);
                    }}
                    className={`px-2 py-1 rounded-full border ml-1 ${
                      level === i + 1
                        ? "bg-blue-50 border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    <Text className="text-xs text-gray-700">
                      L{i + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-2 mb-3">
              <Search size={14} color="#9CA3AF" />
              <TextInput
                placeholder="Search by name or username"
                value={q}
                onChangeText={(text) => {
                  setPage(1);
                  setQ(text);
                }}
                className="flex-1 ml-2 text-sm text-gray-900"
              />
            </View>

            {!refRows ? (
              <View className="py-4 flex-row items-center">
                <ActivityIndicator size="small" color="#6b7280" />
                <Text className="ml-2 text-sm text-gray-500">
                  Loading…
                </Text>
              </View>
            ) : refRows.items.length === 0 ? (
              <View className="py-4">
                <Text className="text-sm text-gray-500">
                  No referrals found
                </Text>
              </View>
            ) : (
              <View style={{ maxHeight: 420 }}>
                <FlatList
                  data={refRows.items}
                  keyExtractor={(u) => String(u.id)}
                  renderItem={({ item }) => (
                    <View className="flex-row items-center py-2 border-b border-gray-100">
                      <Avatar
                        size="sm"
                        source={
                          item.avatar
                            ? `${API_BASE_URL}/uploads/${item.avatar}`
                            : undefined
                        }
                      />
                      <View className="flex-1 ml-3">
                        <Text
                          className="font-medium text-sm text-gray-900"
                          numberOfLines={1}
                        >
                          {item.fullName || item.username}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          @{item.username}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-500">
                        {item.joinedAt
                          ? new Date(item.joinedAt).toLocaleDateString()
                          : ""}
                      </Text>
                    </View>
                  )}
                />
              </View>
            )}

            <View className="flex-row items-center justify-center mt-3">
              <TouchableOpacity
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                className={`h-8 w-8 rounded-full border items-center justify-center mr-2 ${
                  page <= 1 ? "opacity-40" : ""
                }`}
              >
                <ChevronLeft size={16} color="#111827" />
              </TouchableOpacity>
              <Text className="text-xs text-gray-700">
                {Math.min(page, pages)} / {pages}
              </Text>
              <TouchableOpacity
                disabled={page >= pages}
                onPress={() => setPage((p) => p + 1)}
                className={`h-8 w-8 rounded-full border items-center justify-center ml-2 ${
                  page >= pages ? "opacity-40" : ""
                }`}
              >
                <ChevronRight size={16} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View className="px-4 py-3 border-b border-gray-200 bg-white flex-row items-center">
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            className="mr-3"
          >
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1">
            {title}
          </Text>
        </View>

        {section === "affiliates" ? (
          renderAffiliates()
        ) : (
          <View className="flex-1">
            <View className="px-4 pt-4">
              <View className="bg-white rounded-2xl overflow-hidden border border-purple-200">
                <View
                  className="rounded-2xl px-4 py-5"
                  style={{ backgroundColor: "#7b47d6" }}
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: "#9b69ff" }}
                    >
                      <Rocket size={20} color="#ffffff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-xl font-bold">
                        Something exciting is on the way
                      </Text>
                      <Text className="text-white/90 mt-1">
                        We're polishing the last bits. Stay tuned!
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View className="px-4 py-4">
              <View className="bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-3">
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 8,
                      backgroundColor: "#F59E0B",
                      marginRight: 8,
                    }}
                  />
                  <Text className="text-gray-800">Launching soon</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
