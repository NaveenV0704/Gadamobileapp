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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  Camera,
  Image as ImageIcon,
  MoreVertical,
  ThumbsUp,
  UserPlus,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import {
  getPage,
  fetchPagePosts,
  togglePageLike,
  updatePagePicture,
  updatePageCover,
} from "../../services/pagesService";
import { API_BASE_URL, ASSET_BASE_URL } from "../../constants/config";
import { PostCard } from "../../components/PostCard";
import { Button } from "../../components/ui/Button";
import type { ViewToken } from "react-native";

export default function PageView() {
  const { idOrName } = useLocalSearchParams<{ idOrName: string }>();
  const { accessToken, user: currentUser } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  const router = useRouter();

  const [page, setPage] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const [isLiking, setIsLiking] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
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

  const loadPageData = useCallback(async () => {
    if (!accessToken || !idOrName) return;
    try {
      const data = await getPage(idOrName, headersRef.current);
      setPage(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load page details");
    } finally {
      setLoading(false);
    }
  }, [idOrName, accessToken]);

  const loadPosts = useCallback(
    async (reset = false) => {
      if (!accessToken || !idOrName) return;
      if (!reset && (loadingPosts || done)) return;

      setLoadingPosts(true);
      try {
        const { items = [], nextCursor } = await fetchPagePosts(
          idOrName,
          { cursor: reset ? undefined : cursor, limit: 10 },
          headersRef.current,
        );

        if (reset) {
          setPosts(items);
        } else {
          setPosts((prev) => [...prev, ...items]);
        }

        setCursor(nextCursor ?? null);
        if (!nextCursor || items.length === 0) setDone(true);
        else setDone(false);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPosts(false);
        setRefreshing(false);
      }
    },
    [idOrName, accessToken, cursor, loadingPosts, done],
  );

  useEffect(() => {
    loadPageData();
    loadPosts(true);
  }, [idOrName, accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPageData();
    loadPosts(true);
  };

  const handleLike = async () => {
    if (isLiking || !page) return;
    setIsLiking(true);
    try {
      const res = await togglePageLike(page.page_id, headersRef.current);
      setPage((prev: any) => ({
        ...prev,
        isLiked: res.isLiked,
        page_likes: res.isLiked ? prev.page_likes + 1 : prev.page_likes - 1,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLiking(false);
    }
  };

  const pickImage = async (type: "picture" | "cover") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const file = result.assets[0];

    const fileData = {
      uri: file.uri,
      name: file.fileName || (type === "picture" ? "profile.jpg" : "cover.jpg"),
      type: file.mimeType || "image/jpeg",
    };

    if (type === "picture") {
      setUploadingPic(true);
      try {
        await updatePagePicture(page.page_id, fileData, headersRef.current);
        loadPageData();
      } catch (error) {
        Alert.alert("Error", "Failed to update profile picture");
      } finally {
        setUploadingPic(false);
      }
    } else {
      setUploadingCover(true);
      try {
        await updatePageCover(page.page_id, fileData, headersRef.current);
        loadPageData();
      } catch (error) {
        Alert.alert("Error", "Failed to update cover photo");
      } finally {
        setUploadingCover(false);
      }
    }
  };

  const isOwner =
    page && currentUser && String(page.user_id) === String(currentUser.id);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!page) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-4">
        <Text className="text-gray-500 mb-4">Page not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const renderHeader = () => (
    <View className="bg-white">
      {/* Cover Photo */}
      <View className="h-48 bg-gray-200 relative">
        {page.page_cover && (
          <Image
            source={{
              uri: `${ASSET_BASE_URL}/${page.page_cover.replace(/^\/+/, "")}`,
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
        )}
        {isOwner && (
          <TouchableOpacity
            onPress={() => pickImage("cover")}
            className="absolute bottom-3 right-3 bg-black/50 p-2 rounded-full"
          >
            {uploadingCover ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Camera size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-10 left-4 bg-black/30 p-2 rounded-full"
        >
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View className="px-4 pb-4 -mt-12">
        <View className="flex-row items-end justify-between">
          <View className="relative">
            <View className="h-24 w-24 rounded-full border-4 border-white bg-gray-300 overflow-hidden shadow-sm">
              {page.page_picture && (
                <Image
                  source={{
                    uri: `${ASSET_BASE_URL}/${page.page_picture.replace(/^\/+/, "")}`,
                  }}
                  className="w-full h-full"
                />
              )}
            </View>
            {isOwner && (
              <TouchableOpacity
                onPress={() => pickImage("picture")}
                className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white"
              >
                {uploadingPic ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Camera size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row mb-1">
            <TouchableOpacity
              onPress={handleLike}
              className={`flex-row items-center px-4 py-2 rounded-lg mr-2 ${
                page.isLiked ? "bg-gray-100" : "bg-blue-600"
              }`}
            >
              <ThumbsUp
                size={18}
                color={page.isLiked ? "#2563EB" : "#ffffff"}
              />
              <Text
                className={`ml-2 font-bold ${page.isLiked ? "text-blue-600" : "text-white"}`}
              >
                {page.isLiked ? "Liked" : "Like"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-100 p-2 rounded-lg">
              <UserPlus size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-3">
          <Text className="text-2xl font-bold text-gray-900">
            {page.page_title}
          </Text>
          <Text className="text-gray-500 font-medium">@{page.page_name}</Text>
          <View className="flex-row items-center mt-2">
            <Text className="text-gray-900 font-bold">{page.page_likes}</Text>
            <Text className="text-gray-500 ml-1">likes</Text>
          </View>
          {page.page_description ? (
            <Text className="text-gray-600 mt-2 text-sm leading-5">
              {page.page_description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Tabs / Actions */}
      <View className="border-t border-gray-100 px-4 py-3 flex-row">
        <TouchableOpacity className="mr-6 border-b-2 border-blue-600 pb-1">
          <Text className="font-bold text-blue-600">Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mr-6 pb-1">
          <Text className="font-medium text-gray-500">About</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mr-6 pb-1">
          <Text className="font-medium text-gray-500">Photos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            active={item.id != null && item.id === activePostId}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderHeader}
        onEndReached={() => loadPosts()}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        ListFooterComponent={
          loadingPosts ? (
            <ActivityIndicator size="small" color="#2563EB" className="py-6" />
          ) : (
            <View className="h-20" />
          )
        }
        ListEmptyComponent={
          !loadingPosts ? (
            <View className="items-center justify-center py-10 bg-white">
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
