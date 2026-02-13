import React, { useState, useEffect, useRef, useMemo } from "react";
import { ActivityIndicator } from "react-native";
import { useEvent } from "expo";
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import Constants from "expo-constants";
import { Story, StoryItem } from "../types";
import { Avatar } from "./ui/Avatar";
import { X, Heart, Send, Users } from "lucide-react-native";
import { API_BASE_URL } from "../constants/config";
import { stripUploads } from "../lib/url";
import {
  reactToStory,
  replyToStory,
  markStoryAsViewed,
  fetchStoryViewers,
} from "../services/storyService";
import { useAuthHeader } from "../hooks/useAuthHeader";
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

interface StoryViewerProps {
  visible: boolean;
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const REACTION_EMOJIS = [
  { emoji: "👍", code: 1 },
  { emoji: "❤️", code: 2 },
  { emoji: "😂", code: 3 },
  { emoji: "😲", code: 4 },
  { emoji: "😢", code: 5 },
  { emoji: "😡", code: 6 },
];

export default function StoryViewer({
  visible,
  stories,
  initialIndex,
  onClose,
}: StoryViewerProps) {
  const [userIndex, setUserIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [viewersCount, setViewersCount] = useState(0);
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const getUrl = (url: string | undefined) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;

    // Ensure we don't have double uploads/ or leading slashes
    const cleanPath = stripUploads(url).replace(/^\/+/, "");
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  const currentUserStory = stories[userIndex];
  const currentItem = currentUserStory?.stories[itemIndex];
  const isMyStory = Number(currentUserStory?.userId) === Number(user?.id);

  const handleNext = React.useCallback(() => {
    if (!currentUserStory) return;
    if (itemIndex < currentUserStory.stories.length - 1) {
      setItemIndex((prev) => prev + 1);
    } else {
      if (userIndex < stories.length - 1) {
        setUserIndex((prev) => prev + 1);
        setItemIndex(0);
      } else {
        onClose();
      }
    }
  }, [userIndex, itemIndex, stories, currentUserStory, onClose]);

  const handlePrev = React.useCallback(() => {
    if (itemIndex > 0) {
      setItemIndex((prev) => prev - 1);
    } else {
      if (userIndex > 0) {
        const prevUserIndex = userIndex - 1;
        setUserIndex(prevUserIndex);
        setItemIndex(stories[prevUserIndex].stories.length - 1);
      } else {
        setItemIndex(0);
      }
    }
  }, [userIndex, itemIndex, stories]);

  const textStoryData = useMemo(() => {
    // Check content, url, or caption for JSON
    const rawContent =
      (currentItem as any)?.content ||
      currentItem?.url ||
      currentItem?.meta?.caption ||
      "";
    if (!rawContent) return null;

    const content = typeof rawContent === "string" ? rawContent.trim() : "";

    // If it looks like JSON, try to parse it
    if (content.startsWith("{") && content.endsWith("}")) {
      try {
        const parsed = JSON.parse(content);
        // Sometimes the JSON is nested or has different fields
        const text = parsed.text || parsed.content || "";
        const bg = parsed.bg || parsed.background || "#111111";
        const color = parsed.color || "#ffffff";

        if (text || bg !== "#111111") {
          return { text, bg, color };
        }
      } catch (e) {
        console.error("[StoryViewer] JSON parse error:", e);
      }
    }

    // Only fallback to text view if type is explicitly "text"
    if (currentItem?.type === "text") {
      return { text: content, bg: "#6366f1", color: "white" };
    }

    return null;
  }, [currentItem]);

  const mediaUrl = useMemo(() => {
    // If it's a text story, we don't need a media URL
    if (textStoryData) return "";

    if (!currentItem?.url) return "";

    // If the URL itself looks like JSON, it's not a media URL
    if (currentItem.url.trim().startsWith("{")) return "";

    const url = getUrl(currentItem.url);
    return url;
  }, [currentItem?.url, currentItem?.type, textStoryData]);

  const player = useVideoPlayer(
    currentItem?.type === "video" && mediaUrl ? mediaUrl : null,
    (player) => {
      player.loop = false;
      player.staysActiveInBackground = false;

      // Add a direct listener for completion as a fallback
      player.addListener("playToEnd", () => {
        console.log("[StoryViewer] Video finished (playToEnd event)");
        handleNext();
      });

      if (mediaUrl) {
        console.log(`[StoryViewer] Video player initialized for: ${mediaUrl}`);
      }
    },
  );

  // Auto-play/pause when currentItem changes or visibility changes
  useEffect(() => {
    if (currentItem?.type === "video" && player) {
      if (visible && !isPaused) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [currentItem, player, isPaused, visible]);

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  const duration = useEvent(player, "durationChange", {
    duration: player.duration,
  });

  const timeUpdate = useEvent(player, "timeUpdate", {
    currentTime: player.currentTime,
  });

  useEffect(() => {
    if (currentItem?.type === "video" && timeUpdate && duration?.duration) {
      const progress = timeUpdate.currentTime / duration.duration;
      progressAnim.setValue(progress);
    }
  }, [timeUpdate, duration?.duration, currentItem?.type]);

  useEffect(() => {
    console.log(
      `[StoryViewer] Video status: ${status}, duration: ${duration?.duration}, currentTime: ${timeUpdate?.currentTime}`,
    );
  }, [status, duration, timeUpdate]);

  // Handle video status and mark as viewed
  // (Video auto-advance is now handled by the playToEnd listener in player setup)

  // Mark as viewed when story changes
  useEffect(() => {
    if (visible && currentItem) {
      markStoryAsViewed(currentItem.id, headers).catch(console.error);

      // If it's my story, fetch viewers
      if (isMyStory) {
        fetchStoryViewers(currentItem.id, headers)
          .then((data) => {
            setViewers(data.items || []);
            setViewersCount(data.count || 0);
          })
          .catch(console.error);
      }
    }
  }, [currentItem?.id, visible]);

  // Progress Bar Animation & Auto-advance
  useEffect(() => {
    if (!visible || !currentUserStory || !currentItem || isPaused) {
      progressAnim.stopAnimation();
      return;
    }

    // For videos, the progress is handled by the timeUpdate effect above
    if (currentItem.type === "video") {
      return;
    }

    let displayDuration = 10000; // Default 10s for photos
    if (textStoryData || currentItem.type === "text") {
      displayDuration = 5000; // Text stories 5s
    }

    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: displayDuration,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => animation.stop();
  }, [userIndex, itemIndex, visible, isPaused]);

  useEffect(() => {
    if (visible) {
      setUserIndex(initialIndex);
      setItemIndex(0);
      setReplyText("");
      setIsPaused(false);
      // Reset player state if it exists
      if (player && currentItem?.type === "video") {
        player.seekBy(0); // seekTo is not in expo-video, seekBy(0) can reset or just rely on player recreation
        player.play();
      }
    }
  }, [visible, initialIndex]);

  useEffect(() => {
    if (player) {
      if (visible && !isPaused) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [visible, isPaused, player]);

  if (!visible || !stories[userIndex]) return null;

  const handleReaction = async (emojiCode: number) => {
    if (!currentItem || !currentUserStory) return;
    try {
      await reactToStory(
        currentItem.id,
        currentUserStory.userId,
        emojiCode,
        headers,
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !currentItem || !currentUserStory) return;
    const text = replyText;
    setReplyText("");
    setIsPaused(false);
    try {
      await replyToStory(
        currentItem.id,
        currentUserStory.userId,
        text,
        headers,
      );
    } catch (e) {
      console.error(e);
    }
  };

  const renderOverlays = () => {
    if (!currentItem?.meta?.overlays) return null;
    return currentItem.meta.overlays.map((overlay: any) => (
      <View
        key={overlay.id}
        style={{
          position: "absolute",
          left: `${overlay.xPct}%`,
          top: `${overlay.yPct}%`,
          transform: [
            { translateX: -overlay.fontSize / 2 },
            { translateY: -overlay.fontSize / 2 },
            { rotate: `${overlay.rotateDeg || 0}deg` },
          ],
        }}
      >
        <Text
          style={{
            fontSize: overlay.fontSize || 24,
            color: overlay.color || "white",
            fontWeight: overlay.weight?.toString() || "normal",
          }}
        >
          {overlay.text}
        </Text>
      </View>
    ));
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
            <View className="absolute inset-0 bg-black">
              {/* Media Content */}
              <View className="flex-1 w-full h-full">
                {currentItem?.type === "video" && mediaUrl ? (
                  <View className="flex-1 w-full h-full items-center justify-center">
                    <VideoView
                      key={`video-${currentItem.id}-${mediaUrl}`}
                      player={player}
                      style={{ width: width, height: height }}
                      contentFit="contain"
                      useNativeControls={false}
                    />
                  </View>
                ) : textStoryData ? (
                  <View
                    className="flex-1 w-full h-full items-center justify-center px-10"
                    style={{ backgroundColor: textStoryData.bg }}
                  >
                    <View
                      className="w-full"
                      style={{
                        marginTop: Constants.statusBarHeight + 80,
                        marginBottom: 150,
                      }}
                    >
                      <Text
                        className="text-4xl font-bold text-center leading-tight"
                        style={{ color: textStoryData.color }}
                      >
                        {textStoryData.text}
                      </Text>
                    </View>
                  </View>
                ) : currentItem && mediaUrl ? (
                  <View className="flex-1 w-full h-full items-center justify-center">
                    <Image
                      source={{ uri: mediaUrl }}
                      className="w-full h-full"
                      resizeMode="contain"
                      style={{ width: width, height: height }}
                      onError={(e) =>
                        console.error(
                          "[StoryViewer] Image load error:",
                          e.nativeEvent.error,
                        )
                      }
                    />
                  </View>
                ) : (
                  <View className="flex-1 w-full h-full items-center justify-center">
                    <ActivityIndicator color="white" />
                    <Text className="text-white/50 text-xs mt-2">
                      Loading...
                    </Text>
                  </View>
                )}
              </View>
              {renderOverlays()}
            </View>

            {/* Touch Zones - Transparent Overlay */}
            <View
              className="absolute inset-0 flex-row z-10"
              pointerEvents="box-none"
            >
              <Pressable
                className="flex-1 h-full"
                onPress={handlePrev}
                style={{ backgroundColor: "transparent" }}
              />
              <Pressable
                className="flex-[2] h-full"
                onPressIn={() => setIsPaused(true)}
                onPressOut={() => setIsPaused(false)}
                style={{ backgroundColor: "transparent" }}
              />
              <Pressable
                className="flex-1 h-full"
                onPress={handleNext}
                style={{ backgroundColor: "transparent" }}
              />
            </View>

            {/* Top UI Layer - Progress and Header */}
            <View
              className="absolute top-0 left-0 right-0 z-20 px-4"
              style={{ paddingTop: Constants.statusBarHeight + 10 }}
            >
              {/* Progress Bars */}
              <View className="flex-row gap-1 mb-4">
                {currentUserStory.stories.map((_, idx) => (
                  <View
                    key={idx}
                    className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                  >
                    <Animated.View
                      style={{
                        height: "100%",
                        backgroundColor: "white",
                        width:
                          idx < itemIndex
                            ? "100%"
                            : idx === itemIndex
                              ? progressAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0%", "100%"],
                                })
                              : "0%",
                      }}
                    />
                  </View>
                ))}
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Avatar source={currentUserStory.avatar} size="sm" />
                  <View className="ml-2">
                    <Text className="text-white font-bold shadow-sm">
                      {currentUserStory.username}
                    </Text>
                    {currentItem?.created_at && (
                      <Text className="text-white/70 text-[10px]">
                        {new Date(currentItem.created_at).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} className="p-2">
                  <X color="white" size={24} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Middle UI - Caption */}
            {currentItem?.meta?.caption &&
              !textStoryData &&
              !currentItem.meta.caption.trim().startsWith("{") && (
                <View className="absolute bottom-40 left-4 right-4 z-20">
                  <Text className="text-white text-lg font-medium shadow-lg">
                    {currentItem.meta?.caption}
                  </Text>
                </View>
              )}

            {/* Bottom UI Layer - Reply Box & Reactions */}
            <View className="absolute bottom-0 left-0 right-0 z-30">
              <SafeAreaView edges={["bottom"]}>
                <View className="px-4 pb-4">
                  {/* Reply Input */}
                  <View className="flex-row items-center gap-2 mb-4">
                    <View className="flex-1 flex-row items-center bg-transparent border border-white/50 rounded-full px-4 py-1">
                      <TextInput
                        className="flex-1 py-2 text-white placeholder:text-white/70 h-10"
                        placeholder="Reply..."
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        value={replyText}
                        onChangeText={setReplyText}
                        onFocus={() => setIsPaused(true)}
                        onBlur={() => setIsPaused(false)}
                        onSubmitEditing={handleReply}
                        blurOnSubmit={true}
                      />
                      {replyText.trim() ? (
                        <TouchableOpacity onPress={handleReply}>
                          <Text className="text-blue-400 font-bold ml-2">
                            Send
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  {/* Reactions */}
                  <View className="flex-row justify-between px-2">
                    {REACTION_EMOJIS.map((item) => (
                      <TouchableOpacity
                        key={item.code}
                        onPress={() => handleReaction(item.code)}
                        className="p-1"
                      >
                        <Text className="text-2xl">{item.emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text className="text-white/60 text-[10px] text-center mt-4">
                    Typing pauses the story. Close when you're done.
                  </Text>

                  {/* Viewer Count for My Story */}
                  {isMyStory && viewersCount > 0 && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center mt-4 bg-white/10 py-2 rounded-lg"
                      onPress={() => {
                        /* Show viewers list modal */
                      }}
                    >
                      <Users color="white" size={16} />
                      <Text className="text-white ml-2 text-xs">
                        {viewersCount} viewers
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </SafeAreaView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
