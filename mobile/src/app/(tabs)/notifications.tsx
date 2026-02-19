import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import { API_BASE_URL, ASSET_BASE_URL } from "../../constants/config";
import { useRouter } from "expo-router";
import { Post } from "../../types";
import { PostCard } from "../../components/PostCard";

type NotificationItem = {
  id: number;
  type: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string | null;
  createdAt: string;
  readAt: string | null;
  seenAt: string | null;
  message?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  href?: string | null;
  meta?: Record<string, any> | null;
};

export default function Notifications() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const router = useRouter();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const pageSize = 20;

  const fetchUnreadCount = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/notifications/unread-count`,
        {
          headers,
          credentials: "include",
        },
      );
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(Number(data?.count ?? 0));
    } catch {}
  }, [accessToken, headers]);

  const fetchNotifications = useCallback(
    async (reset: boolean) => {
      if (!accessToken) return;
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      try {
        const offset = reset ? 0 : cursor;
        const res = await fetch(
          `${API_BASE_URL}/api/notifications?cursor=${offset}&limit=${pageSize}`,
          {
            headers,
            credentials: "include",
          },
        );
        if (!res.ok) {
          throw new Error("Failed to load notifications");
        }
        const data: NotificationItem[] = await res.json();
        if (reset) {
          setItems(data);
        } else if (data.length) {
          setItems((prev) => [...prev, ...data]);
        }
        const nextCursor = offset + data.length;
        setCursor(nextCursor);
      } catch (e) {
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [accessToken, headers, cursor],
  );

  const markAllRead = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/notifications/mark-all-read`,
        {
          method: "POST",
          headers,
          credentials: "include",
        },
      );
      if (!res.ok) return;
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch {}
  }, [accessToken, headers]);

  const markSeenNow = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/mark-seen`, {
        method: "POST",
        headers,
        credentials: "include",
      });
      if (!res.ok) return;
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          seenAt: n.seenAt ?? new Date().toISOString(),
        })),
      );
    } catch {}
  }, [accessToken, headers]);

  useEffect(() => {
    if (!accessToken) return;
    fetchNotifications(true);
    fetchUnreadCount();
  }, [accessToken, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (!items.length) return;
    markSeenNow();
  }, [items, markSeenNow]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCursor(0);
    fetchNotifications(true);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const loadMore = () => {
    if (loadingMore || loading) return;
    if (items.length < pageSize) return;
    fetchNotifications(false);
  };

  const renderText = useCallback((n: NotificationItem) => {
    switch (n.type) {
      case "post_like":
        return "liked your post.";
      case "post_comment":
        return "commented on your post.";
      case "post_share":
        return "shared your post.";
      case "friend_request":
        return "sent you a friend request.";
      case "friend_accept":
        return "accepted your friend request.";
      case "reel_like":
        return "liked your reel.";
      case "reel_comment":
        return "commented on your reel.";
      case "group_post":
        return "posted in your group.";
      case "new_message":
        return "sent new message.";
      case "live_start":
        return "Started live.";
      default:
        return "sent you a notification.";
    }
  }, []);

  const navigateTo = (n: NotificationItem) => {
    const meta = n.meta || {};
    const postId = (meta as any).postId || n.entityId;
    if (n.entityType === "post" && postId) {
      const idStr = String(postId);
      setPostModalVisible(true);
      setPostLoading(true);
      setSelectedPost(null);
      setPostError(null);

      (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/posts/${idStr}`, {
            headers,
            credentials: "include",
          });
          if (!res.ok) {
            if (res.status === 401) {
              setPostError("Session expired. Please sign in again.");
            } else {
              setPostError("Failed to load post");
            }
            return;
          }
          const data = await res.json();
          setSelectedPost(data as Post);
        } catch {
          setPostError("Failed to load post");
        } finally {
          setPostLoading(false);
        }
      })();
      return;
    }
  };

  const data = useMemo(() => items, [items]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-lg font-semibold">Notifications</Text>
        <View className="flex-row items-center">
          <Text className="text-xs text-gray-500 mr-3">
            {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
          </Text>

          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text className="text-xs text-blue-600">Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refreshing && items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#1877F2" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1877F2"
            />
          }
          renderItem={({ item }) => {
            const unread = !item.readAt;
            const avatarUri = item.actorAvatar
              ? item.actorAvatar.startsWith("http")
                ? item.actorAvatar
                : `${ASSET_BASE_URL}/${item.actorAvatar.replace(/^\/+/, "")}`
              : `${ASSET_BASE_URL}/uploads/profile/defaultavatar.png`;
            return (
              <TouchableOpacity
                onPress={() => navigateTo(item)}
                className={`flex-row px-4 py-3 items-start ${
                  unread ? "bg-blue-50" : "bg-white"
                }`}
              >
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
                <View className="flex-1 ml-3">
                  <Text className="text-sm">
                    <Text className="font-semibold">
                      {item.actorName || "Someone"}{" "}
                    </Text>
                    {renderText(item)}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                {unread && (
                  <View className="mt-2 h-2 w-2 bg-blue-600 rounded-full" />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <View className="flex-1 items-center justify-center mt-20">
                <Text className="text-gray-500">No notifications</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-3 items-center">
                <ActivityIndicator size="small" color="#1877F2" />
              </View>
            ) : null
          }
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
        />
      )}
      {error && (
        <View className="px-4 py-2">
          <Text className="text-xs text-red-600">{error}</Text>
        </View>
      )}

      <Modal
        visible={postModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setPostModalVisible(false);
          setSelectedPost(null);
          setPostError(null);
          setPostLoading(false);
        }}
      >
        <SafeAreaView className="flex-1 bg-[#f0f2f5]">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <Text className="text-lg font-semibold">Post</Text>
            <TouchableOpacity
              onPress={() => {
                setPostModalVisible(false);
                setSelectedPost(null);
                setPostError(null);
                setPostLoading(false);
              }}
            >
              <Text className="text-blue-600 text-sm">Close</Text>
            </TouchableOpacity>
          </View>

          {postLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" color="#1877F2" />
            </View>
          ) : postError ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-red-600 text-sm">
                {postError}
              </Text>
            </View>
          ) : selectedPost ? (
            <FlatList
              data={[selectedPost]}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View className="bg-white mb-2 border-y border-gray-200">
                  <PostCard post={item as Post} />
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500 text-sm">
                No post data available.
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
