import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  UserPlus,
  UserCheck,
  MessageCircle,
  MoreVertical,
} from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import {
  fetchProfilePosts,
  fetchProfileSummary,
  checkFollowingStatus,
  toggleFollowUser,
} from "../../services/postService";
import { API_BASE_URL, ASSET_BASE_URL } from "../../constants/config";
import { PostCard } from "../../components/PostCard";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Post } from "../../types";
import type { ViewToken } from "react-native";

export default function UserProfileView() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { accessToken, user: currentUser } = useAuth();
  const headers = useAuthHeader(accessToken);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "friends" | "photos">(
    "posts",
  );
  const [activePostId, setActivePostId] = useState<number | null>(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisible = viewableItems.find((v) => v.isViewable);
      if (!firstVisible) {
        setActivePostId(null);
        return;
      }
      const id = firstVisible.item?.id;
      if (id) setActivePostId(id);
    },
  ).current;

  const loadData = useCallback(async () => {
    if (!userId || !accessToken) return;
    try {
      setLoading(true);
      const [summaryData, postsData, followingData] = await Promise.all([
        fetchProfileSummary(userId, headers),
        fetchProfilePosts(userId, headers, { limit: 10 }),
        checkFollowingStatus(userId, headers),
      ]);
      setSummary(summaryData);
      setPosts((postsData.items || []) as Post[]);
      setIsFollowing(followingData.isFollowing);
    } catch (error) {
      console.error("[UserProfile] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, headers]);

  useEffect(() => {
    loadData();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!userId || !accessToken) return;
    try {
      const res = await toggleFollowUser(userId, headers);
      setIsFollowing(res.isFollowing);
    } catch (error) {
      console.error("[UserProfile] Follow error:", error);
    }
  };

  const buildProfileUrl = (path?: string | null) => {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return `${ASSET_BASE_URL}${path}`;
    return `${ASSET_BASE_URL}/${path}`;
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  const user = summary?.user;
  const counts = summary?.counts || { friends: 0, posts: 0, photos: 0 };
  const friendPreviews = summary?.previews?.friends || [];
  const photoPreviews = summary?.previews?.photos || [];

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
          {user?.fullName || user?.username || "Profile"}
        </Text>
        <TouchableOpacity className="p-1">
          <MoreVertical size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === "posts" ? posts : []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Cover */}
            <View className="h-40 bg-gray-200">
              {user?.cover && (
                <Image
                  source={{ uri: buildProfileUrl(user.cover) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Profile Info */}
            <View className="px-4 -mt-12 mb-4">
              <View className="w-24 h-24 bg-white rounded-full p-1 shadow-sm">
                <View className="w-full h-full rounded-full bg-gray-300 overflow-hidden">
                  {user?.avatar && (
                    <Image
                      source={{ uri: buildProfileUrl(user.avatar) }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  )}
                </View>
              </View>

              <View className="mt-3">
                <Text className="text-2xl font-bold text-gray-900">
                  {user?.fullName}
                </Text>
                <Text className="text-gray-500">@{user?.username}</Text>

                {user?.bio && (
                  <Text className="mt-2 text-gray-700 leading-5">
                    {user.bio}
                  </Text>
                )}

                <View className="flex-row mt-3 items-center">
                  <View className="mr-4">
                    <Text className="font-bold text-gray-900">
                      {counts.friends}
                    </Text>
                    <Text className="text-gray-500 text-xs">Friends</Text>
                  </View>
                  <View className="mr-4">
                    <Text className="font-bold text-gray-900">
                      {counts.posts}
                    </Text>
                    <Text className="text-gray-500 text-xs">Posts</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-gray-900">
                      {counts.photos}
                    </Text>
                    <Text className="text-gray-500 text-xs">Photos</Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row mt-4 space-x-2">
                  <TouchableOpacity
                    onPress={handleFollow}
                    className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${
                      isFollowing ? "bg-gray-100" : "bg-blue-600"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck size={18} color="#374151" className="mr-2" />
                        <Text className="text-gray-700 font-semibold">
                          Following
                        </Text>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} color="white" className="mr-2" />
                        <Text className="text-white font-semibold">Follow</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg bg-gray-100">
                    <MessageCircle size={18} color="#374151" className="mr-2" />
                    <Text className="text-gray-700 font-semibold">Message</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tabs */}
              <View className="mt-4 border-b border-gray-100">
                <View className="flex-row">
                  {["posts", "friends", "photos"].map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      onPress={() =>
                        setActiveTab(tab as "posts" | "friends" | "photos")
                      }
                      className={`flex-1 py-3 items-center ${
                        activeTab === tab ? "border-b-2 border-blue-600" : ""
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          activeTab === tab ? "text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tab Content */}
              {activeTab === "friends" && (
                <View className="mt-4">
                  <View className="flex-row flex-wrap -mx-1">
                    {friendPreviews.map((f: any) => (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() =>
                          router.push({
                            pathname: "/profile/[userId]",
                            params: { userId: f.id },
                          })
                        }
                        className="w-1/3 px-1 mb-4 items-center"
                      >
                        <View className="w-20 h-20 rounded-xl bg-gray-200 overflow-hidden mb-1">
                          {f.avatar && (
                            <Image
                              source={{ uri: buildProfileUrl(f.avatar) }}
                              className="w-full h-full"
                            />
                          )}
                        </View>
                        <Text
                          numberOfLines={1}
                          className="text-xs font-semibold text-center"
                        >
                          {f.fullName || f.username}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {activeTab === "photos" && (
                <View className="mt-4">
                  <View className="flex-row flex-wrap -mx-0.5">
                    {photoPreviews.map((p: string, idx: number) => (
                      <View key={idx} className="w-1/3 p-0.5 aspect-square">
                        <Image
                          source={{ uri: buildProfileUrl(p) }}
                          className="w-full h-full rounded-sm"
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white border-b border-gray-100">
            <PostCard
              post={item}
              active={String(item.id) === String(activePostId)}
              onComment={() => {}}
            />
          </View>
        )}
        ListEmptyComponent={
          activeTab === "posts" && !loading ? (
            <View className="py-20 items-center">
              <Text className="text-gray-400">No posts yet</Text>
            </View>
          ) : null
        }
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </SafeAreaView>
  );
}
