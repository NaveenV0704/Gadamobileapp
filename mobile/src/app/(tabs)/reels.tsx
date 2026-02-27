import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ViewToken,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import {
  fetchReels,
  toggleReelLike,
  shareReel,
  type Reel,
} from "../../services/reelService";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import ReelCard from "../../components/ReelCard";

export default function Reels() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);

  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  const [reels, setReels] = useState<Reel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { height: windowHeight } = Dimensions.get("window");
  const [flatListHeight, setFlatListHeight] = useState(windowHeight - 150);

  const loadReels = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchReels(headersRef.current);
      setReels(Array.isArray(data) ? data : []);
      setActiveIndex(0);
    } catch (e) {
      console.error("Failed to load reels", e);
      setReels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) return;
    loadReels();
  }, [authLoading, accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReels();
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      if (!viewableItems.length) {
        setActiveIndex(-1);
        return;
      }
      const first = viewableItems[0];
      if (typeof first.index === "number") {
        setActiveIndex(first.index);
      }
    },
  ).current;

  const like = async (id: number) => {
    if (!accessToken || !reels) return;
    try {
      const { liked } = await toggleReelLike(id, headersRef.current);
      setReels((prev) =>
        prev
          ? prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    hasLiked: liked,
                    likeCount: r.likeCount + (liked ? 1 : -1),
                  }
                : r,
            )
          : prev,
      );
    } catch (e) {
      console.error("Failed to toggle reel like", e);
    }
  };

  const share = async (id: number) => {
    if (!accessToken || !reels) return;
    try {
      await shareReel(id, headersRef.current);
      setReels((prev) =>
        prev
          ? prev.map((r) =>
              r.id === id ? { ...r, shareCount: r.shareCount + 1 } : r,
            )
          : prev,
      );
    } catch (e) {
      console.error("Failed to share reel", e);
    }
  };

  const onEndedNext = (id: number) => {
    if (!reels || reels.length === 0) return;
    const i = reels.findIndex((r) => r.id === id);
    if (i === -1) return;
    const next = i + 1 < reels.length ? i + 1 : 0;
    setActiveIndex(next);
  };

  if (authLoading || reels === null || loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      </SafeAreaView>
    );
  }

  const { height } = Dimensions.get("window");

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 py-3 border-b border-gray-900 bg-black flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-semibold text-white">Reels</Text>
          <Text className="text-xs text-gray-400 mt-1">
            Short vertical videos from people on Gada.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/reels-create")}
          className="flex-row items-center bg-white/10 px-3 py-1.5 rounded-full"
        >
          <Plus size={16} color="#ffffff" />
          <Text className="text-xs text-white ml-1 font-medium">
            Create reel
          </Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 py-1">
        <Text className="text-[10px] text-gray-500">{reels.length} reels</Text>
      </View>

      <View
        className="flex-1"
        onLayout={(e) => setFlatListHeight(e.nativeEvent.layout.height)}
      >
        {reels.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-gray-400 text-sm text-center mb-2">
              No reels available yet.
            </Text>
            <Text className="text-gray-400 text-xs text-center">
              Tap Create reel to upload the first one.
            </Text>
          </View>
        ) : (
          <FlatList
            data={reels}
            keyExtractor={(item, index) => String(item.id ?? index)}
            pagingEnabled
            snapToInterval={flatListHeight}
            decelerationRate="fast"
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#ffffff"
              />
            }
            renderItem={({ item, index }) => (
              <View
                style={{
                  height: flatListHeight,
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ReelCard
                  reel={item}
                  active={index === activeIndex}
                  onLike={like}
                  onShare={share}
                  onEndedNext={onEndedNext}
                />
              </View>
            )}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            contentContainerStyle={{ paddingBottom: 0 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
