import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Camera,
  UserPlus,
  Users,
  LogOut,
  Shield,
  MessageSquare,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import {
  getGroup,
  fetchGroupPosts,
  joinGroup,
  leaveGroup,
  createGroupPost,
  updateGroupPicture,
  updateGroupCover,
} from "../../services/groupsService";
import { ASSET_BASE_URL } from "../../constants/config";
import { PostCard } from "../../components/PostCard";
import { Button } from "../../components/ui/Button";
import type { ViewToken } from "react-native";

export default function GroupView() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { accessToken, user: currentUser } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  const router = useRouter();

  const [summary, setSummary] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [content, setContent] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
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

  const loadGroupData = useCallback(async () => {
    if (!accessToken || !handle) return;
    try {
      const data = await getGroup(handle, headersRef.current);
      setSummary(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load group details");
    } finally {
      setLoading(false);
    }
  }, [handle, accessToken]);

  const loadPosts = useCallback(
    async (reset = false) => {
      if (!accessToken || !handle) return;
      if (!reset && (loadingPosts || done)) return;

      setLoadingPosts(true);
      try {
        const { items = [], nextCursor } = await fetchGroupPosts(
          handle,
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
    [handle, accessToken, cursor, loadingPosts, done],
  );

  useEffect(() => {
    loadGroupData();
    loadPosts(true);
  }, [handle, accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGroupData();
    loadPosts(true);
  };

  const handleJoinLeave = async () => {
    if (isJoining || !summary) return;
    setIsJoining(true);
    try {
      if (summary.isMember) {
        await leaveGroup(handle!, headersRef.current);
        setSummary((prev: any) => ({
          ...prev,
          isMember: false,
          group: {
            ...prev.group,
            members: Math.max(0, prev.group.members - 1),
          },
        }));
      } else {
        const res = await joinGroup(handle!, headersRef.current);
        setSummary((prev: any) => ({
          ...prev,
          isMember: res.isMember,
          isPending: res.isPending,
          group: {
            ...prev.group,
            members: prev.group.members + (res.isMember ? 1 : 0),
          },
        }));
        if (res.isPending) {
          Alert.alert(
            "Request Sent",
            "Your request to join this group has been sent to admins.",
          );
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsJoining(false);
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
      name:
        file.fileName ||
        (type === "picture" ? "group_profile.jpg" : "group_cover.jpg"),
      type: file.mimeType || "image/jpeg",
    };

    if (type === "picture") {
      setUploadingPic(true);
      try {
        await updateGroupPicture(handle!, fileData, headersRef.current);
        loadGroupData();
      } catch (error) {
        Alert.alert("Error", "Failed to update group picture");
      } finally {
        setUploadingPic(false);
      }
    } else {
      setUploadingCover(true);
      try {
        await updateGroupCover(handle!, fileData, headersRef.current);
        loadGroupData();
      } catch (error) {
        Alert.alert("Error", "Failed to update group cover photo");
      } finally {
        setUploadingCover(false);
      }
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() || submittingPost) return;
    setSubmittingPost(true);
    try {
      const { hidden } = await createGroupPost(
        handle!,
        { content: content.trim() },
        headersRef.current,
      );
      setContent("");
      if (!hidden) {
        loadPosts(true);
      } else {
        Alert.alert(
          "Post Submitted",
          "Your post has been submitted for review.",
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create post");
    } finally {
      setSubmittingPost(false);
    }
  };

  const isAdmin =
    summary &&
    (summary.admins?.some(
      (a: any) => String(a.id) === String(currentUser?.id),
    ) ||
      summary.group?.adminId === currentUser?.id);
  const isMember = summary?.isMember;
  const isPending = summary?.isPending;
  const canPost = isMember && summary?.group?.privacy !== "secret";

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!summary) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-4">
        <Text className="text-gray-500 mb-4">Group not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const renderHeader = () => (
    <View className="bg-white">
      {/* Cover Photo */}
      <View className="h-48 bg-gray-200 relative">
        {summary.group.cover && (
          <Image
            source={{
              uri: `${ASSET_BASE_URL}/${summary.group.cover.replace(/^\/+/, "")}`,
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
        )}
        {isAdmin && (
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
            <View className="h-24 w-24 rounded-2xl border-4 border-white bg-gray-300 overflow-hidden shadow-sm">
              {summary.group.picture && (
                <Image
                  source={{
                    uri: `${ASSET_BASE_URL}/${summary.group.picture.replace(/^\/+/, "")}`,
                  }}
                  className="w-full h-full"
                />
              )}
            </View>
            {isAdmin && (
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
              onPress={handleJoinLeave}
              disabled={isPending}
              className={`flex-row items-center px-4 py-2 rounded-lg ${
                isMember
                  ? "bg-gray-100"
                  : isPending
                    ? "bg-gray-200"
                    : "bg-blue-600"
              }`}
            >
              {isMember ? (
                <>
                  <LogOut size={18} color="#4B5563" />
                  <Text className="ml-2 font-bold text-gray-700">Leave</Text>
                </>
              ) : isPending ? (
                <Text className="font-bold text-gray-500">Pending</Text>
              ) : (
                <>
                  <UserPlus size={18} color="#ffffff" />
                  <Text className="ml-2 font-bold text-white">Join</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-3">
          <Text className="text-2xl font-bold text-gray-900">
            {summary.group.title}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-gray-500 font-medium">
              @{summary.group.name}
            </Text>
            <View className="mx-2 h-1 w-1 rounded-full bg-gray-300" />
            <Text className="text-gray-500 font-medium capitalize">
              {summary.group.privacy}
            </Text>
          </View>
          <View className="flex-row items-center mt-2">
            <Users size={16} color="#6B7280" />
            <Text className="text-gray-900 font-bold ml-1.5">
              {summary.group.members}
            </Text>
            <Text className="text-gray-500 ml-1">members</Text>
          </View>
          {summary.group.description ? (
            <Text className="text-gray-600 mt-2 text-sm leading-5">
              {summary.group.description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Composer if member */}
      {canPost && (
        <View className="px-4 py-4 border-t border-gray-100">
          <View className="flex-row bg-gray-50 rounded-xl p-3 border border-gray-100">
            <TextInput
              className="flex-1 text-gray-900 text-sm min-h-[40px]"
              placeholder="Post something to the group..."
              multiline
              value={content}
              onChangeText={setContent}
            />
            <TouchableOpacity
              onPress={handleCreatePost}
              disabled={!content.trim() || submittingPost}
              className={`ml-2 self-end p-2 rounded-lg ${
                content.trim() ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              {submittingPost ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MessageSquare
                  size={20}
                  color={content.trim() ? "#ffffff" : "#9CA3AF"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View className="border-t border-gray-100 px-4 py-3 flex-row">
        <TouchableOpacity className="mr-6 border-b-2 border-blue-600 pb-1">
          <Text className="font-bold text-blue-600">Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mr-6 pb-1">
          <Text className="font-medium text-gray-500">Members</Text>
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
