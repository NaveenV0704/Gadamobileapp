import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { PostCard } from "../../components/PostCard";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Post } from "../../types";
import { fetchPosts } from "../../services/postService";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import { StoryProvider } from "../../contexts/StoryContext";
import { Stories } from "../../components/Stories";
import { CreatePostInput } from "../../components/CreatePostInput";
import { API_BASE_URL } from "../../constants/config";

// --- Helpers from Web Feed.tsx ---

/** Normalize backend -> { promotedPost, list } */
function normalizePosts(raw: any): { promotedPost: any | null; list: any[] } {
  if (Array.isArray(raw)) return { promotedPost: null, list: raw };
  if (raw && typeof raw === "object") {
    return {
      promotedPost: raw.promoted ?? null,
      list: Array.isArray(raw.items) ? raw.items : [],
    };
  }
  return { promotedPost: null, list: [] };
}

/** Extract numeric post id from row */
function getPostId(p: any): number | null {
  const id = p?.post_id ?? p?.id;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function Feed() {
  const { user, accessToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [rawPosts, setRawPosts] = useState<any>([]); // Store raw response
  const [loading, setLoading] = useState(true);

  // Live status map: postId -> { isLive, channelId?, viewers? }
  const [liveMap, setLiveMap] = useState<
    Record<number, { isLive: boolean; channelId?: string; viewers?: number }>
  >({});

  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const authHeader = useAuthHeader(accessToken);
  const lastIdsStrRef = useRef<string>("");
  const loadingRef = useRef(false);

  const loadPosts = useCallback(
    async (isRefresh = false) => {
      if (!accessToken) return;

      // Use ref for synchronous check to prevent race conditions
      if (!isRefresh && (loadingRef.current || !hasMore)) {
        return;
      }

      try {
        setLoading(true);
        loadingRef.current = true;

        const currentOffset = isRefresh ? 0 : offset;
        const data = await fetchPosts(authHeader, {
          offset: currentOffset,
          limit: LIMIT,
          withPromoted: isRefresh ? 1 : 0, // Only fetch promoted on first page
        });

        const { promotedPost: newPromoted, list: newItems } =
          normalizePosts(data);

        if (isRefresh) {
          setRawPosts({ promoted: newPromoted, items: newItems });
          setOffset(LIMIT);
          setHasMore(newItems.length >= LIMIT);
        } else {
          setRawPosts((prev: any) => {
            const prevItems = prev?.items || [];
            // De-duplicate items just in case
            const existingIds = new Set(
              prevItems.map((p: any) => getPostId(p)),
            );
            const uniqueNewItems = newItems.filter(
              (p: any) => !existingIds.has(getPostId(p)),
            );

            return {
              promoted: prev?.promoted,
              items: [...prevItems, ...uniqueNewItems],
            };
          });
          setOffset((prev) => prev + LIMIT);
          setHasMore(newItems.length >= LIMIT);
        }
      } catch (error) {
        console.error("Failed to load posts", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        loadingRef.current = false;
      }
    },
    [accessToken, authHeader, hasMore, offset],
  );

  useEffect(() => {
    if (accessToken) {
      loadPosts(true);
    }
  }, [accessToken]); // Initial load

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts(true);
  };

  const onLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts(false);
    }
  };

  // --- Normalization & Live Logic ---

  // normalize posts shape
  const { promotedPost, list } = useMemo(
    () => normalizePosts(rawPosts),
    [rawPosts],
  );

  // visible post ids (for live-status batch call)
  const visibleIds = useMemo(() => {
    const ids: number[] = [];
    const pid = promotedPost ? getPostId(promotedPost) : null;
    if (pid) ids.push(pid);
    for (const p of list) {
      const id = getPostId(p);
      if (id) ids.push(id);
    }
    return Array.from(new Set(ids));
  }, [promotedPost, list]);

  // single batched poll for live status
  useEffect(() => {
    const idsStr = visibleIds.join(",");
    if (!idsStr || idsStr === lastIdsStrRef.current) return;
    lastIdsStrRef.current = idsStr;

    let cancelled = false;
    let timer: NodeJS.Timeout | undefined;

    const fetchOnce = async () => {
      try {
        // Construct headers manually or use authHeader
        // We need to make sure we don't cause infinite loops if authHeader changes
        // But authHeader is stable from useAuthHeader hook
        const url = `${API_BASE_URL}/api/live/for-posts?ids=${encodeURIComponent(idsStr)}`;
        const res = await fetch(url, { headers: authHeader });
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body && typeof body === "object") {
          setLiveMap(body.data);
        }
      } catch (e) {
        // console.error("Live poll failed", e);
      }
    };

    void fetchOnce();
    timer = setInterval(fetchOnce, 12000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [authHeader, visibleIds]);

  // attach live info to each post
  const promotedWithLive = useMemo(() => {
    if (!promotedPost) return null;
    const pid = getPostId(promotedPost);
    return pid ? { ...promotedPost, live: liveMap[pid] || null } : promotedPost;
  }, [promotedPost, liveMap]);

  const listWithLive = useMemo(() => {
    if (!list?.length) return [];
    return list.map((p: any) => {
      const pid = getPostId(p);
      return pid ? { ...p, live: liveMap[pid] || null } : p;
    });
  }, [list, liveMap]);

  return (
    <StoryProvider>
      <SafeAreaView className="flex-1 bg-[#f0f2f5]" edges={["top"]}>
        <FlatList
          data={listWithLive}
          keyExtractor={(item, index) =>
            String(item.id || item.post_id || index)
          }
          renderItem={({ item }) => (
            <View className="bg-white mb-2 border-y border-gray-200 shadow-sm">
              <PostCard post={item as Post} />
            </View>
          )}
          ListHeaderComponent={
            <View>
              {/* Create Post Section */}
              <View className="bg-white mb-2">
                <CreatePostInput onPostSuccess={() => loadPosts(true)} />
              </View>

              {/* Stories Section */}
              <View className="bg-white mb-2 py-4">
                <Text className="px-4 text-lg font-bold text-gray-900 mb-2">
                  Stories
                </Text>
                <Stories />
              </View>

              {/* Promoted Post */}
              {promotedWithLive && (
                <View className="bg-white mb-2 border-y border-gray-200">
                  <View className="px-4 py-2 border-b border-gray-100">
                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Promoted
                    </Text>
                  </View>
                  <PostCard post={promotedWithLive as Post} />
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <Text className="text-center text-gray-500 mt-10">
                No posts found
              </Text>
            ) : null
          }
          ListFooterComponent={
            loading && !refreshing ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#1877F2" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.8}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </SafeAreaView>
    </StoryProvider>
  );
}
