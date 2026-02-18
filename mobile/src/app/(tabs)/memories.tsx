import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import { API_BASE_URL } from "../../constants/config";
import { Post } from "../../types";
import { PostCard } from "../../components/PostCard";

export default function Memories() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading, logout } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMemories = useCallback(
    async (isRefresh = false) => {
      if (!accessToken) return;
      try {
        if (!isRefresh) setLoading(true);
        const requestHeaders = { ...headers };
        delete requestHeaders["Content-Type"];

        const res = await fetch(`${API_BASE_URL}/api/memories`, {
          headers: requestHeaders,
          credentials: "include",
        });

        const text = await res.text().catch(() => "");
        if (!res.ok) {
          const msg =
            text && text.trim().length
              ? text
              : `Request failed with status ${res.status}`;
          if (
            res.status === 401 ||
            msg.includes("Unauthorized") ||
            msg.toLowerCase().includes("unauthorized")
          ) {
            await logout();
            router.replace("/(auth)/login");
            return;
          }
          throw new Error(msg);
        }

        let data: any = [];
        try {
          data = text ? JSON.parse(text) : [];
        } catch {
          data = [];
        }

        const list: Post[] = Array.isArray(data)
          ? (data as Post[])
          : Array.isArray((data as any)?.data)
            ? ((data as any).data as Post[])
            : [];

        setPosts(list);
      } catch (e) {
        console.error("Failed to load memories", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, headers, logout, router],
  );

  useEffect(() => {
    if (!authLoading && !accessToken) {
      router.replace("/(auth)/login");
    }
  }, [authLoading, accessToken, router]);

  useEffect(() => {
    if (!accessToken) return;
    loadMemories(false);
  }, [accessToken, loadMemories]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMemories(true);
  };

  if (authLoading || (loading && !refreshing)) {
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
        <Text className="text-lg font-semibold">On This Day</Text>
        <Text className="text-xs text-gray-500 mt-1">
          Your posts from this date in previous years.
        </Text>
      </View>

      {posts.length === 0 && !loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-lg shadow px-5 py-6 w-full max-w-md">
            <Text className="text-xl font-semibold text-gray-700 text-center mb-1">
              No memories today
            </Text>
            <Text className="text-gray-500 text-center">
              Come back tomorrow!
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item, index) => String(item.id ?? index)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1877F2"
            />
          }
          renderItem={({ item }) => (
            <View className="bg-white border-b border-gray-200">
              <PostCard post={item} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </SafeAreaView>
  );
}
