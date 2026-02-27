import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useAuthHeader, useAuthHeaderupload } from "../hooks/useAuthHeader";
import { Button } from "../components/ui/Button";
import { uploadMedia } from "../services/postService";
import { createReel } from "../services/reelService";
import { PostVideo } from "../components/PostVideo";

export default function ReelsCreate() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const uploadHeaders = useAuthHeaderupload(accessToken);

  const [videoAsset, setVideoAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setVideoAsset(asset);
    setPreviewUrl(asset.uri);
  };

  const submit = async () => {
    if (!videoAsset) return;
    if (!accessToken) {
      Alert.alert("Login required", "Please login to create a reel.");
      return;
    }

    setSubmitting(true);
    try {
      const media = await uploadMedia([videoAsset], uploadHeaders);
      const first = media[0];
      if (!first || !first.url) {
        throw new Error("Upload failed");
      }
      await createReel({ videoUrl: first.url, caption }, headers);
      Alert.alert("Success", "Your reel has been created.", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/reels"),
        },
      ]);
    } catch (e: any) {
      const msg = e?.message || "Failed to create reel";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 py-3 border-b border-gray-900 bg-black flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="px-2 py-1">
          <Text className="text-sm text-gray-300">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-white">Create reel</Text>
        <TouchableOpacity
          onPress={submit}
          disabled={!videoAsset || submitting}
          className={`px-3 py-1.5 rounded-full ${
            !videoAsset || submitting ? "bg-gray-600" : "bg-blue-600"
          }`}
        >
          <Text className="text-xs font-semibold text-white">
            {submitting ? "Uploading..." : "Upload"}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4 py-4">
        <TouchableOpacity
          onPress={pickVideo}
          className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-4 items-center justify-center"
          disabled={submitting}
        >
          <Text className="text-gray-100 font-medium mb-1">
            {videoAsset ? "Change video" : "Pick a video"}
          </Text>
          <Text className="text-xs text-gray-400 text-center">
            Select a vertical video from your gallery to use as a reel.
          </Text>
        </TouchableOpacity>

        <View className="mt-4">
          <Text className="text-sm text-gray-200 mb-2">Preview</Text>
          <View className="w-full max-w-[260px] aspect-[9/16] rounded-2xl overflow-hidden bg-black self-center">
            {previewUrl ? (
              <PostVideo
                uri={previewUrl}
                active
                fill
                fit="cover"
                showProgress
              />
            ) : (
              <View className="flex-1 items-center justify-center px-4">
                <Text className="text-gray-500 text-xs text-center">
                  Pick a video to see the preview here.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="mt-4">
          <Text className="text-sm text-gray-200 mb-1">Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Say something…"
            placeholderTextColor="#6B7280"
            multiline
            className="min-h-[80px] rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100"
          />
        </View>

        <Button
          onPress={submit}
          disabled={!videoAsset || submitting}
          className="mt-4"
        >
          {submitting ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="#ffffff" size="small" />
              <Text className="text-white font-semibold text-sm ml-2">
                Uploading…
              </Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-sm">
              Create reel
            </Text>
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
}
