import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image as RNImage,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "./ui/Avatar";
import { Image, Video as VideoIcon, Radio, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { createPost, uploadMedia } from "../services/postService";
import { useAuthHeader } from "../hooks/useAuthHeader";

interface CreatePostInputProps {
  onPostSuccess?: () => void;
}

export function CreatePostInput({ onPostSuccess }: CreatePostInputProps) {
  const { user, accessToken } = useAuth();
  const authHeader = useAuthHeader(accessToken);

  const [content, setContent] = useState("");
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setMedia((prev) => [...prev, ...result.assets]);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMedia((prev) => [...prev, ...result.assets]);
    }
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && media.length === 0) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      // 1. Upload media if any
      let uploadedMedia: { url: string; type: "image" | "video" }[] = [];
      if (media.length > 0) {
        uploadedMedia = await uploadMedia(media, authHeader);
      }

      // 2. Create post
      await createPost(user.id, content, uploadedMedia, authHeader);

      // 3. Reset and notify
      setContent("");
      setMedia([]);
      Alert.alert("Success", "Post created successfully");
      onPostSuccess?.();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="bg-white p-4 mx-4 mt-4 mb-4 rounded-xl shadow-sm border border-gray-100">
      <View className="flex-row items-start space-x-3 mb-4">
        <Avatar source={user?.profileImage} size="md" />
        <View className="flex-1">
          <TextInput
            placeholder={`What's on your mind, ${user?.firstname || user?.username}?`}
            placeholderTextColor="#6b7280"
            multiline
            value={content}
            onChangeText={setContent}
            className="text-base text-gray-900 min-h-[40px]"
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Media Previews */}
      {media.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-4">
          {media.map((item, index) => (
            <View key={index} className="relative">
              <RNImage
                source={{ uri: item.uri }}
                className="w-20 h-20 rounded-md bg-gray-100"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => removeMedia(index)}
                className="absolute -top-1 -right-1 bg-gray-900/50 rounded-full p-1"
              >
                <X size={12} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={pickImage}
          className="flex-1 flex-row items-center justify-center space-x-2 py-2 border border-gray-200 rounded-lg mr-2"
        >
          <Image size={20} color="#4ade80" />
          <Text className="text-gray-700 font-medium">Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={pickVideo}
          className="flex-1 flex-row items-center justify-center space-x-2 py-2 border border-gray-200 rounded-lg mr-2"
        >
          <VideoIcon size={20} color="#f472b6" />
          <Text className="text-gray-700 font-medium">Video</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center space-x-2 py-2 border border-gray-200 rounded-lg"
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "Live streaming is coming soon to mobile!",
            )
          }
        >
          <Radio size={20} color="#ef4444" />
          <Text className="text-gray-700 font-medium">Go Live</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handlePost}
        disabled={isSubmitting || (!content.trim() && media.length === 0)}
        className={`rounded-lg py-3 items-center ${isSubmitting || (!content.trim() && media.length === 0) ? "bg-blue-300" : "bg-blue-500"}`}
      >
        {isSubmitting ? (
          <View className="flex-row items-center space-x-2">
            <ActivityIndicator color="white" size="small" />
            <Text className="text-white font-bold text-base">Posting...</Text>
          </View>
        ) : (
          <Text className="text-white font-bold text-base">Post</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
