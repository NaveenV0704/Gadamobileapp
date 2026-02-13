import { View, Text, ScrollView, TextInput, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { Info, Link2, Eye, MessageSquare, UserPlus, RefreshCcw } from "lucide-react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from "react-native-svg";
import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { getPointsOverview, getUserBalance, getPointsLogs } from "../../services/pointsServcice";

export default function PointsScreen() {
  const { user, accessToken, logout } = useAuth();
  const [points, setPoints] = useState<number>(
    // @ts-ignore
    (user?.points as number | undefined) ?? 0,
  );
  const [wallet, setWallet] = useState<number>(
    Number(user?.walletBalance ?? 0),
  );
  const [dailyLimit, setDailyLimit] = useState<number>(15000);
  const [remainingToday, setRemainingToday] = useState<number>(15000);
  const [windowHours, setWindowHours] = useState<number>(24);
  const [rules, setRules] = useState<{
    post_create: number;
    post_view: number;
    post_comment: number;
    follow: number;
    refer: number;
  }>({
    post_create: 50,
    post_view: 10,
    post_comment: 10,
    follow: 10,
    refer: 5,
  });

  const [convertInput, setConvertInput] = useState("");
  const parsedConvert = Math.max(0, parseInt(convertInput || "0", 10) || 0);
  const [rate, setRate] = useState<number>(10); // points per ₦1
  const previewNaira = Math.floor(parsedConvert / rate);
  const canTransfer = parsedConvert >= rate && parsedConvert <= points;

  type Tx = { id: string | number; points: number; from: string; time: Date };
  const [txPageItems, setTxPageItems] = useState<Tx[]>([]);
  const [txTotal, setTxTotal] = useState<number>(0);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [query, setQuery] = useState<string>("");
  const [pageSizeOpen, setPageSizeOpen] = useState<boolean>(false);
  const safePage = Math.max(1, page);
  const totalPages = Math.max(1, Math.ceil((txTotal || 0) / pageSize));
  const startIdx = (safePage - 1) * pageSize;

  const CardGradient = ({
    variant,
    children,
  }: {
    variant: "primary" | "wallet";
    children: React.ReactNode;
  }) => {
    const colors =
      variant === "primary"
        ? ["#1ea3ff", "#2563eb"]
        : ["#7c3aed", "#e879f9"];
    return (
      <View
        className="rounded-2xl overflow-hidden"
        style={{
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.6)",
          marginBottom: 12,
        }}
      >
        <View style={{ position: "absolute", inset: 0 }}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id={`grad-${variant}`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors[0]} stopOpacity="1" />
                <Stop offset="1" stopColor={colors[1]} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill={`url(#grad-${variant})`} />
          </Svg>
        </View>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, position: "relative" }}>
          {children}
        </View>
      </View>
    );
  };

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [overview, balance] = await Promise.all([
          getPointsOverview(accessToken),
          getUserBalance(accessToken),
        ]);
        if (cancelled) return;
        setPoints(Number(balance.user_points ?? 0));
        setWallet(Number(balance.user_wallet_balance ?? 0));
        setRate(
          Number(overview?.rules?.conversion?.pointsPerNaira ?? 10),
        );
        setDailyLimit(Number(overview?.rules?.daily_limit ?? 15000));
        setRemainingToday(Number(overview?.remainingToday ?? 15000));
        setWindowHours(Number(overview?.windowHours ?? 24));
        setRules({
          post_create: Number(overview?.rules?.post_create ?? 50),
          post_view: Number(overview?.rules?.post_view ?? 10),
          post_comment: Number(overview?.rules?.post_comment ?? 10),
          follow: Number(overview?.rules?.follow ?? 10),
          refer: Number(overview?.rules?.refer ?? 5),
        });
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          logout?.();
        } else {
          console.warn("Failed to load points overview/balance:", msg);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    const loadTx = async () => {
      setTxLoading(true);
      try {
        const res = await getPointsLogs(accessToken, {
          page: safePage,
          limit: pageSize,
          q: query,
          sort: "time",
          dir: "desc",
        });
        if (cancelled) return;
        const mapped: Tx[] = (res?.rows ?? []).map((row: any) => ({
          id: row?.id ?? "",
          points: Number(row?.points ?? 0),
          from: String(row?.from ?? ""),
          time: new Date(row?.time ?? Date.now()),
        }));
        setTxPageItems(mapped);
        setTxTotal(Number(res?.total ?? 0));
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          logout?.();
        } else {
          console.warn("Failed to load transactions (posts):", msg);
        }
      } finally {
        if (!cancelled) setTxLoading(false);
      }
    };
    loadTx();
    return () => {
      cancelled = true;
    };
  }, [accessToken, pageSize, safePage, query]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 py-4 bg-white">
        <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">Points</Text>
      </View>

      <View className="flex-1" style={{ backgroundColor: "#8e4de0" }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
        >
          <View className="px-4">
            <CardGradient variant="primary">
              <View className="flex-row items-center gap-2 mb-2">
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  <Info color="#ffffff" size={16} />
                </View>
                <Text className="text-white font-bold text-base">Points System</Text>
              </View>
              <Text className="text-white">
                Each <Text className="font-bold">{rate}</Text> points equal <Text className="font-bold">₦1</Text>.{" "}
                <Text className="font-bold">Daily limit:</Text> {dailyLimit.toLocaleString()} •{" "}
                <Text className="font-bold">Remaining today:</Text> {remainingToday.toLocaleString()}
              </Text>
              <Text className="text-white/90 mt-2">
                Your daily points limit resets ~ every {windowHours}h after your last valid earn.
              </Text>
              <Text className="text-white/90 mt-1">You can transfer your money to your wallet.</Text>
            </CardGradient>

            <CardGradient variant="primary">
              <Text className="text-white font-semibold">Points Balance</Text>
              <View className="pt-3">
                <Text className="text-3xl font-extrabold text-white">
                  {points.toLocaleString()} Points
                </Text>
              </View>
            </CardGradient>

            <CardGradient variant="wallet">
              <Text className="text-white font-semibold">Wallet Balance</Text>
              <View className="pt-3">
                <Text className="text-3xl font-extrabold text-white">
                  ₦{Number(wallet).toLocaleString()}
                </Text>
              </View>
            </CardGradient>

            <View className="flex-row flex-wrap justify-between mt-2">
              {[
                { value: rules.post_create, text: "For creating a new post", Icon: Link2 },
                { value: rules.post_view, text: "For each post view", Icon: Eye },
                { value: rules.post_comment, text: "For any comment on your post", Icon: MessageSquare },
                { value: rules.follow, text: "For each follower you got", Icon: UserPlus },
                { value: rules.refer, text: "For referring user", Icon: RefreshCcw },
              ].map(({ value, text, Icon }, idx) => (
                <View
                  key={`${text}-${idx}`}
                  className="bg-white rounded-2xl border border-gray-200 p-4 mb-3"
                  style={{ width: "48%" }}
                >
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="text-3xl font-extrabold text-gray-900">{value}</Text>
                      <Text className="text-gray-500 font-semibold mt-0.5">Points</Text>
                    </View>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#F9FAFB",
                      }}
                    >
                      <Icon size={16} color="#6B7280" />
                    </View>
                  </View>
                  <Text className="text-gray-500 mt-3">{text}</Text>
                </View>
              ))}

              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3" style={{ width: "100%" }}>
                <Text className="text-gray-900 font-semibold mb-2">Points to convert</Text>
                <View className="flex-row items-center gap-3">
                  <View style={{ flex: 1 }}>
                    <TextInput
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                      placeholder="e.g. 100"
                      placeholderTextColor="#9CA3AF"
                      value={convertInput}
                      onChangeText={setConvertInput}
                      keyboardType="numeric"
                    />
                  </View>
                  <Button
                    onPress={() => {
                      if (!canTransfer) {
                        return Alert.alert(
                          "Invalid amount",
                          `Enter at least ${rate} points and not more than your balance.`,
                        );
                      }
                      Alert.alert(
                        "Transfer to Wallet",
                        `Preview: ₦${previewNaira.toLocaleString()}. This will be implemented with the API.`,
                      );
                    }}
                    disabled={!canTransfer}
                    className={`px-4 ${canTransfer ? "bg-slate-900" : "bg-gray-400"}`}
                  >
                    <Text className="text-white font-semibold">Transfer to Wallet</Text>
                  </Button>
                </View>
                <Text className="text-gray-500 mt-2">
                  Preview: ₦{previewNaira.toLocaleString()} • Rate: {rate} pts = ₦1
                </Text>
              </View>
            </View>
            
            <CardGradient variant="primary">
              <Text className="text-white font-semibold">Points Balance</Text>
              <View className="pt-3">
                <Text className="text-3xl font-extrabold text-white">
                  {Number(points).toLocaleString()} Points
                </Text>
              </View>
            </CardGradient>

            <CardGradient variant="wallet">
              <Text className="text-white font-semibold">Points Money Balance</Text>
              <View className="pt-3">
                <Text className="text-3xl font-extrabold text-white">
                  ₦{Number(wallet).toLocaleString()}
                </Text>
              </View>
            </CardGradient>

            <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
              <Text className="text-gray-900 font-semibold mb-3">Points Transactions</Text>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Text className="text-gray-600 mr-2">Show</Text>
                  <View style={{ position: "relative" }}>
                    <TouchableOpacity
                      onPress={() => setPageSizeOpen((v) => !v)}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2"
                    >
                      <Text className="text-gray-800">{pageSize}</Text>
                    </TouchableOpacity>
                    {pageSizeOpen ? (
                      <View
                        className="bg-white border border-gray-200 rounded-lg"
                        style={{
                          position: "absolute",
                          top: 42,
                          left: 0,
                          width: 100,
                          zIndex: 20,
                          elevation: 6,
                        }}
                      >
                        {[10, 25, 50].map((n) => (
                          <TouchableOpacity
                            key={n}
                            onPress={() => {
                              setPageSize(n);
                              setPage(1);
                              setPageSizeOpen(false);
                            }}
                            style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                          >
                            <Text className="text-gray-800">{n}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  <Text className="text-gray-600 ml-2">entries</Text>
                </View>
                <View style={{ width: 160 }}>
                  <TextInput
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Search..."
                    placeholderTextColor="#9CA3AF"
                    value={query}
                    onChangeText={(t) => {
                      setQuery(t);
                      setPage(1);
                    }}
                  />
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
                contentContainerStyle={{ minWidth: 720 }}
              >
                <View style={{ width: "100%" }}>
                  <View className="flex-row px-2 py-2 border-b border-gray-200">
                    <Text style={{ width: 160 }} className="text-gray-500 font-semibold">
                      ID
                    </Text>
                    <Text style={{ width: 100 }} className="text-gray-500 font-semibold">
                      Points
                    </Text>
                    <Text style={{ width: 200 }} className="text-gray-500 font-semibold">
                      From
                    </Text>
                    <Text style={{ width: 240 }} className="text-gray-500 font-semibold">
                      Time
                    </Text>
                  </View>

                  {txPageItems.map((t) => (
                    <View key={t.id} className="flex-row px-2 py-3 border-b border-gray-100">
                      <Text style={{ width: 160 }} className="text-blue-700 font-semibold">
                        {t.id}
                      </Text>
                      <Text style={{ width: 100 }} className="text-gray-800">
                        {t.points}
                      </Text>
                      <Text style={{ width: 200 }} className="text-gray-800">
                        {t.from}
                      </Text>
                      <Text style={{ width: 240 }} className="text-gray-800">
                        {t.time.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View className="mt-4">
                <View className="flex-row items-center justify-center" style={{ gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setPage(1)}
                    disabled={safePage === 1}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      backgroundColor: safePage === 1 ? "#E5E7EB" : "#F3F4F6",
                      borderRadius: 8,
                    }}
                  >
                    <Text className="text-gray-700">{"<<"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      backgroundColor: safePage === 1 ? "#E5E7EB" : "#F3F4F6",
                      borderRadius: 8,
                    }}
                  >
                    <Text className="text-gray-700">{"<"}</Text>
                  </TouchableOpacity>

                  <Text className="text-gray-700">
                    Page {safePage} of {totalPages}
                  </Text>

                  <TouchableOpacity
                    onPress={() => setPage(Math.min(totalPages, safePage + 1))}
                    disabled={safePage >= totalPages}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      backgroundColor: safePage >= totalPages ? "#E5E7EB" : "#F3F4F6",
                      borderRadius: 8,
                    }}
                  >
                    <Text className="text-gray-700">{">"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPage(totalPages)}
                    disabled={safePage >= totalPages}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      backgroundColor: safePage >= totalPages ? "#E5E7EB" : "#F3F4F6",
                      borderRadius: 8,
                    }}
                  >
                    <Text className="text-gray-700">{">>"}</Text>
                  </TouchableOpacity>
                </View>

                <View className="mt-2">
                  <Text className="text-gray-500">
                    Showing {txPageItems.length === 0 ? 0 : startIdx + 1} to{" "}
                    {startIdx + txPageItems.length} of {txTotal} entries
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
