import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import { fetchWatchFeed } from "../../services/watchService";
import WatchVideoCard from "../../components/WatchVideoCard";

export default function Watch() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  const [items, setItems] = useState<any[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeId, setActiveId] = useState<string | number | null>(null);

  const loadMore = async (reset = false) => {
    if (loading) return;
    if (!accessToken) return;
    if (!reset && done) return;
    setLoading(true);
    try {
      const { items: page, nextCursor } = await fetchWatchFeed(
        { limit: 8, cursor: reset ? null : cursor },
        headersRef.current,
      );
      setItems((prev) => (prev ? [...prev, ...page] : page));
      setCursor(nextCursor ?? null);
      if (!nextCursor || page.length === 0) setDone(true);
    } catch (e) {
      console.error("Failed to load watch feed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) return;
    setItems(null);
    setCursor(null);
    setDone(false);
    setRefreshing(false);
    loadMore(true);
  }, [authLoading, accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    setDone(false);
    setCursor(null);
    loadMore(true);
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      if (!viewableItems.length) return;
      const first = viewableItems[0];
      const id = first.item?.id ?? first.index;
      setActiveId(id);
    },
  ).current;

  if (authLoading || items === null) {
    return (
      <SafeAreaView className="flex-1 bg-[#f0f2f5]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#1877F2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f0f2f5]">
      <View className="px-4 py-3 border-b border-gray-200 bg-white">
        <Text className="text-lg font-semibold">Watch</Text>
        <Text className="text-xs text-gray-500 mt-1">
          Videos from people and pages you follow.
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) => String(item.id ?? index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1877F2"
          />
        }
        renderItem={({ item, index }) => (
          <WatchVideoCard
            post={item}
            active={(item.id ?? index) === activeId}
          />
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!loading && !done) {
            loadMore(false);
          }
        }}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </SafeAreaView>
  );
}
