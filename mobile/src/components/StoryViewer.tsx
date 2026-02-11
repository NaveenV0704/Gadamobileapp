import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Story } from "../types";
import { Avatar } from "./ui/Avatar";
import { X, Heart, Send } from "lucide-react-native";
import { API_BASE_URL } from "../constants/config";
import { stripUploads } from "../lib/url";
import ReactionPicker from "./ReactionPicker";
import { reactToStory, replyToStory } from "../services/storyService";
import { useAuthHeader } from "../hooks/useAuthHeader";
import { useAuth } from "../contexts/AuthContext";

interface StoryViewerProps {
  visible: boolean;
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export default function StoryViewer({
  visible,
  stories,
  initialIndex,
  onClose,
}: StoryViewerProps) {
  const [userIndex, setUserIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [reactionVisible, setReactionVisible] = useState(false);
  const [replyText, setReplyText] = useState("");
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  // Auto-advance logic
  useEffect(() => {
    if (!visible) return;
    const currentUserStory = stories[userIndex];
    if (!currentUserStory) return;
    const currentItem = currentUserStory.stories[itemIndex];
    if (!currentItem) return;

    if (currentItem.type !== "video") {
      const timer = setTimeout(() => {
        handleNext();
      }, 5000); // 5 seconds per story
      return () => clearTimeout(timer);
    }
  }, [userIndex, itemIndex, visible, stories]);

  useEffect(() => {
    if (visible) {
      setUserIndex(initialIndex);
      setItemIndex(0);
      setReplyText("");
    }
  }, [visible, initialIndex]);

  if (!visible || !stories[userIndex]) return null;

  const currentUserStory = stories[userIndex];
  const currentItem = currentUserStory.stories[itemIndex];

  const handleNext = () => {
    if (itemIndex < currentUserStory.stories.length - 1) {
      setItemIndex(itemIndex + 1);
    } else {
      if (userIndex < stories.length - 1) {
        setUserIndex(userIndex + 1);
        setItemIndex(0);
      } else {
        onClose();
      }
    }
  };

  const handlePrev = () => {
    if (itemIndex > 0) {
      setItemIndex(itemIndex - 1);
    } else {
      if (userIndex > 0) {
        setUserIndex(userIndex - 1);
        setItemIndex(stories[userIndex - 1].stories.length - 1);
      } else {
        onClose();
      }
    }
  };

  const handleReaction = async (reaction: string) => {
    setReactionVisible(false);
    try {
      await reactToStory(currentItem.id, reaction, headers);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    const text = replyText;
    setReplyText("");
    try {
      await replyToStory(currentUserStory.stories[itemIndex].id, text, headers);
    } catch (e) {
      console.error(e);
    }
  };

  const getUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}/uploads/${stripUploads(url)}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <View className="flex-1 relative">
            {/* Content Layer - Full Screen */}
            <View className="absolute inset-0 bg-black items-center justify-center">
              {currentItem.type === "video" ? (
                <Video
                  source={{ uri: getUrl(currentItem.url) }}
                  className="w-full h-full"
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping={false}
                  onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded && status.didJustFinish) {
                      handleNext();
                    }
                  }}
                />
              ) : (
                <Image
                  source={{ uri: getUrl(currentItem.url) }}
                  className="w-full h-full"
                  resizeMode={ResizeMode.CONTAIN}
                />
              )}
            </View>

            {/* Touch Zones - Transparent Overlay */}
            <View
              className="absolute inset-0 flex-row z-10"
              pointerEvents="box-none"
            >
              <Pressable className="w-1/3 h-full" onPress={handlePrev} />
              <Pressable className="w-1/3 h-full" onPress={() => {}} />
              <Pressable className="w-1/3 h-full" onPress={handleNext} />
            </View>

            {/* Top UI Layer - Progress and Header */}
            <SafeAreaView className="z-20">
              <View className="px-4 pt-4">
                {/* Progress Bars */}
                <View className="flex-row gap-1 mb-4">
                  {currentUserStory.stories.map((_, idx) => (
                    <View
                      key={idx}
                      className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                    >
                      <View
                        className={`h-full bg-white ${idx < itemIndex ? "w-full" : idx === itemIndex ? "w-full" : "w-0"}`}
                        // Note: To show real progress we'd need an animated value,
                        // but for now let's just highlight the current one fully
                      />
                    </View>
                  ))}
                </View>

                {/* Header */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Avatar source={currentUserStory.avatar} size="sm" />
                    <Text className="text-white font-bold ml-2 shadow-sm">
                      {currentUserStory.username}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onClose} className="p-2">
                    <X color="white" size={24} />
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>

            {/* Bottom UI Layer - Reply Box */}
            <View className="absolute bottom-0 left-0 right-0 z-30">
              <SafeAreaView edges={["bottom"]}>
                <View className="flex-row items-center gap-2 px-4 py-4 bg-gradient-to-t from-black/50 to-transparent">
                  <View className="flex-1 flex-row items-center bg-transparent border border-white/50 rounded-full px-4 py-1">
                    <TextInput
                      className="flex-1 py-2 text-white placeholder:text-white/70 h-10"
                      placeholder="Send message"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={replyText}
                      onChangeText={setReplyText}
                      onSubmitEditing={handleReply}
                      blurOnSubmit={false}
                    />
                  </View>

                  {replyText.trim() ? (
                    <TouchableOpacity
                      onPress={handleReply}
                      className="p-2 bg-blue-500 rounded-full"
                    >
                      <Send color="white" size={20} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setReactionVisible(true)}
                      className="p-2"
                    >
                      <Heart color="white" size={28} />
                    </TouchableOpacity>
                  )}
                </View>
              </SafeAreaView>
            </View>
          </View>
        </KeyboardAvoidingView>

        <ReactionPicker
          visible={reactionVisible}
          onSelect={handleReaction}
          onClose={() => setReactionVisible(false)}
        />
      </View>
    </Modal>
  );
}
