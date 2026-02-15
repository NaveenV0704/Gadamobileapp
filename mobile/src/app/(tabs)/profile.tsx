import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../../constants/config";
import { useEffect, useState, useCallback } from "react";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import {
  fetchProfilePosts,
  fetchProfileSummary,
} from "../../services/postService";
import { Post } from "../../types";
import { PostCard } from "../../components/PostCard";
import { Avatar } from "../../components/ui/Avatar";
import {
  EditProfilePayload,
  updateProfileDetails,
  uploadAvatar,
  fetchMyProfile,
} from "../../services/userServices";
import { Camera } from "lucide-react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

export default function Profile() {
  const { user, logout, accessToken } = useAuth();
  const router = useRouter();
  const authHeader = useAuthHeader(accessToken);

  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editTab, setEditTab] = useState<
    "basic" | "about" | "social" | "privacy"
  >("basic");
  const [activeTab, setActiveTab] = useState<"posts" | "friends" | "photos">(
    "posts",
  );

  const [form, setForm] = useState<EditProfilePayload>({
    firstName: "",
    lastName: "",
    gender: "",
    birthdate: "",
    bio: "",
    currentCity: "",
    hometown: "",
    privacyChat: "public",
    privacyPhotos: "public",
    privacyWall: "friends",
    socialFacebook: "",
    socialInstagram: "",
    socialLinkedin: "",
    socialTwitter: "",
    socialYoutube: "",
    website: "",
    workPlace: "",
    workTitle: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);

  const loadProfilePosts = useCallback(async () => {
    if (!user?.id || !accessToken) return;
    try {
      setLoading(true);
      const res = await fetchProfilePosts(user.id, authHeader, { limit: 10 });
      const items = Array.isArray(res?.items) ? res.items : [];
      setPosts(items as Post[]);
    } catch (e) {
      console.error("Failed to load profile posts", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, accessToken, authHeader]);

  const loadProfileSummary = useCallback(async () => {
    if (!user?.id || !accessToken) return;
    try {
      setSummaryLoading(true);
      const data = await fetchProfileSummary(user.id, authHeader);
      setSummary(data);
      if (data?.user) {
        const full = data.user.fullName || "";
        const [firstName, ...rest] = full.split(" ");
        const lastName = rest.join(" ");
        setForm((prev) => ({
          ...prev,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          bio: data.user.bio ?? prev.bio,
        }));
      }
    } catch (e) {
      console.error("Failed to load profile summary", e);
    } finally {
      setSummaryLoading(false);
    }
  }, [user?.id, accessToken, authHeader]);

  const loadProfileDetails = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await fetchMyProfile(authHeader);
      setForm((prev) => {
        const next = { ...prev };
        const keys: (keyof EditProfilePayload)[] = [
          "firstName",
          "lastName",
          "gender",
          "birthdate",
          "bio",
          "currentCity",
          "hometown",
          "privacyChat",
          "privacyPhotos",
          "privacyWall",
          "socialFacebook",
          "socialInstagram",
          "socialLinkedin",
          "socialTwitter",
          "socialYoutube",
          "website",
          "workPlace",
          "workTitle",
        ];
        keys.forEach((k) => {
          if (data[k] !== undefined && data[k] !== null) {
            // @ts-ignore
            next[k] = String(data[k]);
          }
        });
        return next;
      });
    } catch (e) {
      console.error("Failed to load profile details", e);
    }
  }, [accessToken, authHeader]);

  useEffect(() => {
    loadProfileSummary();
    loadProfilePosts();
    loadProfileDetails();
  }, [loadProfileSummary, loadProfilePosts, loadProfileDetails]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const coverPath = summary?.user?.cover || user?.coverImage || null;
  const avatarPath = summary?.user?.avatar || user?.profileImage || null;
  const fullName =
    summary?.user?.fullName ||
    (user ? `${user.firstname} ${user.lastname}`.trim() : "") ||
    user?.username ||
    "";
  const username = summary?.user?.username || user?.username || "";
  const friendsCount = summary?.counts?.friends ?? 0;
  const postsCount = summary?.counts?.posts ?? 0;
  const photosCount = summary?.counts?.photos ?? 0;
  const bio =
    (summary?.user?.bio && summary.user.bio.trim().length > 0
      ? summary.user.bio
      : "") || "";

  const friendPreviews = summary?.previews?.friends ?? [];
  const photoPreviews = summary?.previews?.photos ?? [];

  const buildProfileUrl = (path?: string | null) => {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
    return `${API_BASE_URL}/${path}`;
  };

  const handleChange = (key: keyof EditProfilePayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    if (!accessToken) return;
    try {
      setSavingProfile(true);
      await updateProfileDetails(form, authHeader);
      setEditVisible(false);
      await loadProfileSummary();
    } catch (e) {
      console.error("Failed to update profile", e);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePickCover = async () => {
    if (!user?.id || !accessToken) return;
    try {
      setUploadingCover(true);
      const ImagePicker = require("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      const userHash = user.id;
      await uploadAvatar(
        userHash,
        {
          uri: file.uri,
          name: (file as any).fileName || "cover.jpg",
          type: (file as any).mimeType || "image/jpeg",
        },
        authHeader,
        "cover",
      );
      await loadProfileSummary();
    } catch (e) {
      console.error("Failed to upload cover", e);
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!user?.id || !accessToken) return;
    try {
      setUploadingAvatar(true);
      const ImagePicker = require("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      const userHash = user.id;
      await uploadAvatar(
        userHash,
        {
          uri: file.uri,
          name: (file as any).fileName || "avatar.jpg",
          type: (file as any).mimeType || "image/jpeg",
        },
        authHeader,
        "avatar",
      );
      await loadProfileSummary();
    } catch (e) {
      console.error("Failed to upload avatar", e);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openEditProfile = () => {
    void loadProfileDetails();
    setEditVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={activeTab === "posts" ? posts : []}
        keyExtractor={(item, index) => String(item.id || index)}
        ListHeaderComponent={
          <ScrollView className="flex-1">
            {/* Cover Image */}
            <View className="h-40 bg-gray-200 w-full relative">
              {coverPath ? (
                <Image
                  source={{
                    uri: buildProfileUrl(coverPath),
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : null}
              <TouchableOpacity
                onPress={handlePickCover}
                disabled={uploadingCover}
                className="absolute bottom-3 right-3 bg-white/90 rounded-full p-2"
              >
                {uploadingCover ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Camera size={18} color="#111827" />
                )}
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View className="px-4 -mt-12 mb-4">
              <View className="w-24 h-24 bg-white rounded-full p-1 shadow-sm">
                <View className="w-full h-full rounded-full bg-gray-300 overflow-hidden relative">
                  {avatarPath && (
                    <Image
                      source={{
                        uri: buildProfileUrl(avatarPath),
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  )}
                  <TouchableOpacity
                    onPress={handlePickAvatar}
                    disabled={uploadingAvatar}
                    className="absolute bottom-3 right-3 bg-white/90 rounded-full p-1"
                  >
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color="#111827" />
                    ) : (
                      <Camera size={14} color="#111827" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mt-3">
                <Text className="text-2xl font-bold">{fullName}</Text>
                <Text className="text-gray-500">@{username}</Text>
              </View>

              <View className="mt-2">
                <Text className="text-gray-600 text-sm">
                  {friendsCount} friends · {postsCount} posts
                </Text>
              </View>

              <View className="mt-4 border-b border-gray-200">
                <View className="flex-row">
                  {["posts", "friends", "photos"].map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      onPress={() =>
                        setActiveTab(tab as "posts" | "friends" | "photos")
                      }
                      className={`flex-1 py-2 ${
                        activeTab === tab ? "border-b-2 border-blue-600" : ""
                      }`}
                    >
                      <Text
                        className={`text-center text-sm ${
                          activeTab === tab
                            ? "text-blue-600 font-semibold"
                            : "text-gray-600"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {activeTab === "posts" && (
                <View className="mt-4">
                  <Text className="font-semibold text-sm mb-1">About</Text>
                  <Text className="text-gray-600 text-sm">
                    {bio || "No bio yet"}
                  </Text>
                </View>
              )}

              {activeTab === "friends" && (
                <View className="mt-4">
                  {friendPreviews.length === 0 ? (
                    <Text className="text-gray-500 text-sm">
                      No friends to show
                    </Text>
                  ) : (
                    <View className="flex-row flex-wrap -mx-1">
                      {friendPreviews.map((f: any) => (
                        <View
                          key={f.id}
                          className="w-1/2 px-1 mb-3 flex-row items-center"
                        >
                          <Avatar
                            source={f.avatar}
                            size="md"
                            className="mr-2"
                          />
                          <View className="flex-1">
                            <Text
                              numberOfLines={1}
                              className="font-semibold text-sm"
                            >
                              {f.fullName || f.username}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              @{f.username}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {activeTab === "photos" && (
                <View className="mt-4">
                  {photoPreviews.length === 0 ? (
                    <Text className="text-gray-500 text-sm">
                      No photos to show
                    </Text>
                  ) : (
                    <View className="flex-row flex-wrap -mx-1">
                      {photoPreviews.map((p: string, index: number) => (
                        <View key={index} className="w-1/3 px-1 mb-2">
                          <Image
                            source={{ uri: buildProfileUrl(p) }}
                            className="w-full aspect-square rounded-md bg-gray-200"
                            resizeMode="cover"
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            <View className="px-4 mt-4 space-y-3">
              <Button
                variant="outline"
                label="Edit Profile"
                onPress={openEditProfile}
              />
              <Button
                variant="destructive"
                label="Logout"
                onPress={handleLogout}
              />
            </View>
          </ScrollView>
        }
        renderItem={({ item }) => (
          <View className="bg-white border-y border-gray-200">
            <PostCard post={item as Post} />
          </View>
        )}
        ListEmptyComponent={
          activeTab === "posts" ? (
            loading ? (
              <View className="py-6">
                <ActivityIndicator size="small" color="#1877F2" />
              </View>
            ) : (
              <Text className="text-center text-gray-500 mt-4">
                No posts yet
              </Text>
            )
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <Modal visible={editVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-center items-center">
          <View className="bg-white w-11/12 max-h-[90%] rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold">Edit profile</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Text className="text-blue-600">Close</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row mb-4 border-b border-gray-200">
              {["basic", "about", "social", "privacy"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() =>
                    setEditTab(tab as "basic" | "about" | "social" | "privacy")
                  }
                  className={`flex-1 py-2 ${
                    editTab === tab ? "border-b-2 border-blue-600" : ""
                  }`}
                >
                  <Text
                    className={`text-center text-sm ${
                      editTab === tab
                        ? "text-blue-600 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {editTab === "basic" && (
                <View className="space-y-3">
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">
                      First name
                    </Text>
                    <TextInput
                      value={form.firstName}
                      onChangeText={(v) => handleChange("firstName", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">
                      Last name
                    </Text>
                    <TextInput
                      value={form.lastName}
                      onChangeText={(v) => handleChange("lastName", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">Gender</Text>
                    <TextInput
                      value={form.gender}
                      onChangeText={(v) => handleChange("gender", v)}
                      placeholder="Male / Female / Other"
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">
                      Birthdate
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowBirthdatePicker(true)}
                      className="border border-gray-300 rounded-md px-3 py-2"
                    >
                      <Text className="text-sm text-gray-900">
                        {form.birthdate || "Select date"}
                      </Text>
                    </TouchableOpacity>
                    {showBirthdatePicker && (
                      <DateTimePicker
                        value={
                          form.birthdate ? new Date(form.birthdate) : new Date()
                        }
                        mode="date"
                        display="default"
                        onChange={(
                          event: DateTimePickerEvent,
                          selectedDate?: Date,
                        ) => {
                          if (event.type === "set" && selectedDate) {
                            const year = selectedDate.getFullYear();
                            const month =
                              `${selectedDate.getMonth() + 1}`.padStart(2, "0");
                            const day = `${selectedDate.getDate()}`.padStart(
                              2,
                              "0",
                            );
                            handleChange(
                              "birthdate",
                              `${year}-${month}-${day}`,
                            );
                          }
                          if (Platform.OS === "android") {
                            setShowBirthdatePicker(false);
                          }
                        }}
                      />
                    )}
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">Bio</Text>
                    <TextInput
                      value={form.bio}
                      onChangeText={(v) => handleChange("bio", v)}
                      multiline
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[80]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">Website</Text>
                    <TextInput
                      value={form.website}
                      onChangeText={(v) => handleChange("website", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                </View>
              )}

              {editTab === "about" && (
                <View className="space-y-3">
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">
                      Work title
                    </Text>
                    <TextInput
                      value={form.workTitle}
                      onChangeText={(v) => handleChange("workTitle", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">
                      Work place
                    </Text>
                    <TextInput
                      value={form.workPlace}
                      onChangeText={(v) => handleChange("workPlace", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">
                      Current city
                    </Text>
                    <TextInput
                      value={form.currentCity}
                      onChangeText={(v) => handleChange("currentCity", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">Hometown</Text>
                    <TextInput
                      value={form.hometown}
                      onChangeText={(v) => handleChange("hometown", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                </View>
              )}

              {editTab === "social" && (
                <View className="space-y-3">
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">Facebook</Text>
                    <TextInput
                      value={form.socialFacebook}
                      onChangeText={(v) => handleChange("socialFacebook", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">
                      Twitter / X
                    </Text>
                    <TextInput
                      value={form.socialTwitter}
                      onChangeText={(v) => handleChange("socialTwitter", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">
                      Instagram
                    </Text>
                    <TextInput
                      value={form.socialInstagram}
                      onChangeText={(v) => handleChange("socialInstagram", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">YouTube</Text>
                    <TextInput
                      value={form.socialYoutube}
                      onChangeText={(v) => handleChange("socialYoutube", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">LinkedIn</Text>
                    <TextInput
                      value={form.socialLinkedin}
                      onChangeText={(v) => handleChange("socialLinkedin", v)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </View>
                </View>
              )}

              {editTab === "privacy" && (
                <View className="space-y-4">
                  <View>
                    <Text className="text-xs text-gray-600 mb-2">
                      Who can chat with me?
                    </Text>
                    <View className="flex-row gap-2">
                      {["onlyme", "friends", "public"].map((value) => (
                        <TouchableOpacity
                          key={value}
                          onPress={() => handleChange("privacyChat", value)}
                          className={`px-3 py-2 rounded-md border ${
                            form.privacyChat === value
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              form.privacyChat === value
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {value === "onlyme"
                              ? "Only me"
                              : value.charAt(0).toUpperCase() + value.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs text-gray-600 mb-2">
                      Who can post on my wall?
                    </Text>
                    <View className="flex-row gap-2">
                      {["onlyme", "friends", "public"].map((value) => (
                        <TouchableOpacity
                          key={value}
                          onPress={() => handleChange("privacyWall", value)}
                          className={`px-3 py-2 rounded-md border ${
                            form.privacyWall === value
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              form.privacyWall === value
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {value === "onlyme"
                              ? "Only me"
                              : value.charAt(0).toUpperCase() + value.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs text-gray-600 mb-2">
                      Who can see my photos?
                    </Text>
                    <View className="flex-row gap-2">
                      {["onlyme", "friends", "public"].map((value) => (
                        <TouchableOpacity
                          key={value}
                          onPress={() => handleChange("privacyPhotos", value)}
                          className={`px-3 py-2 rounded-md border ${
                            form.privacyPhotos === value
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              form.privacyPhotos === value
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {value === "onlyme"
                              ? "Only me"
                              : value.charAt(0).toUpperCase() + value.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View className="mt-4 flex-row justify-end space-x-2">
              <Button
                variant="outline"
                label="Cancel"
                onPress={() => setEditVisible(false)}
              />
              <Button
                label={savingProfile ? "Saving..." : "Save changes"}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
