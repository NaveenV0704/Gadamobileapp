import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { useStories } from "../contexts/StoryContext";
import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "./ui/Avatar";
import { Plus } from "lucide-react-native";
import { useMemo, useCallback, useState, useRef } from "react";
import { ASSET_BASE_URL } from "../constants/config";
import { stripUploads } from "../lib/url";
import { Story } from "../types";
import StoryViewer from "./StoryViewer";
import * as ImagePicker from "expo-image-picker";

import Slider from "@react-native-community/slider";

export function Stories() {
  const { stories, addTextStory, addStory } = useStories();
  const { user } = useAuth();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);
  const [composerVisible, setComposerVisible] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [emoji, setEmoji] = useState("");
  const [bgColor, setBgColor] = useState("#111111");
  const [textColor, setTextColor] = useState("#ffffff");
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"bg" | "text">("bg");

  const [emojiPosPct, setEmojiPosPct] = useState({ xPct: 50, yPct: 60 });
  const [textPosPct, setTextPosPct] = useState({ xPct: 50, yPct: 30 });
  const previewSizeRef = useRef({ width: 0, height: 0 });
  const emojiStartPosRef = useRef({ xPct: 50, yPct: 60 });
  const textStartPosRef = useRef({ xPct: 50, yPct: 30 });

  const emojiPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        emojiStartPosRef.current = { ...emojiPosPct };
      },
      onPanResponderMove: (_, gesture) => {
        const { dx, dy } = gesture;
        const { width, height } = previewSizeRef.current;
        if (!width || !height) return;
        const start = emojiStartPosRef.current;
        const startXpx = (start.xPct / 100) * width;
        const startYpx = (start.yPct / 100) * height;
        const newXPx = startXpx + dx;
        const newYPx = startYpx + dy;
        const nextX = Math.min(100, Math.max(0, (newXPx / width) * 100));
        const nextY = Math.min(100, Math.max(0, (newYPx / height) * 100));
        setEmojiPosPct({ xPct: nextX, yPct: nextY });
      },
    }),
  ).current;

  const textPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        textStartPosRef.current = { ...textPosPct };
      },
      onPanResponderMove: (_, gesture) => {
        const { dx, dy } = gesture;
        const { width, height } = previewSizeRef.current;
        if (!width || !height) return;
        const start = textStartPosRef.current;
        const startXpx = (start.xPct / 100) * width;
        const startYpx = (start.yPct / 100) * height;
        const newXPx = startXpx + dx;
        const newYPx = startYpx + dy;
        const nextX = Math.min(100, Math.max(0, (newXPx / width) * 100));
        const nextY = Math.min(100, Math.max(0, (newYPx / height) * 100));
        setTextPosPct({ xPct: nextX, yPct: nextY });
      },
    }),
  ).current;

  const ordered = useMemo(() => {
    if (!user) return stories || [];
    const mineIdx = (stories || []).findIndex(
      (g: Story) => Number(g.userId) === Number(user.id),
    );
    if (mineIdx < 0) return stories || [];
    const copy = [...stories];
    const [mine] = copy.splice(mineIdx, 1);
    copy.unshift(mine);
    return copy;
  }, [stories, user]);

  const handleOpenStory = (index: number) => {
    setInitialStoryIndex(index);
    setViewerVisible(true);
  };

  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.length) return;
    setMedia(result.assets[0]);
  };

  const handlePublish = async () => {
    if (!storyText.trim() && !emoji.trim() && !media) {
      setComposerVisible(false);
      return;
    }
    try {
      setSubmitting(true);
      const emojiLabel = emoji.trim();
      const textLabel = storyText.trim();
      const overlaysArray: any[] = [];

      if (textLabel.length > 0) {
        overlaysArray.push({
          id: String(Date.now()) + "-text",
          type: "text",
          text: textLabel,
          xPct: textPosPct.xPct,
          yPct: textPosPct.yPct,
          fontSize: 24,
          color: textColor,
          weight: 700,
          rotateDeg: 0,
        });
      }

      if (emojiLabel.length > 0) {
        overlaysArray.push({
          id: String(Date.now()) + "-emoji",
          type: "emoji",
          text: emojiLabel,
          xPct: emojiPosPct.xPct,
          yPct: emojiPosPct.yPct,
          fontSize: 48,
          color: textColor,
          weight: 700,
          rotateDeg: 0,
        });
      }

      const overlays = overlaysArray.length > 0 ? overlaysArray : null;

      if (media) {
        const file = {
          uri: media.uri,
          name: (media as any).fileName || "story",
          type:
            (media as any).mimeType ||
            (media.type === "video" ? "video/mp4" : "image/jpeg"),
        };
        await addStory(file, {
          caption: storyText || "",
          overlays,
          musicUrl: null,
          musicVolume: 0.8,
        });
      } else {
        await addTextStory({
          text: storyText,
          bg: bgColor,
          color: textColor,
          overlays,
          musicUrl: null,
          musicVolume: 0.8,
        });
      }

      setComposerVisible(false);
      setStoryText("");
      setEmoji("");
      setBgColor("#111111");
      setTextColor("#ffffff");
      setMedia(null);
    } catch (e) {
      Alert.alert("Error", "Failed to publish story");
    } finally {
      setSubmitting(false);
    }
  };

  const getThumb = (g: Story) => {
    const last = g.stories?.[g.stories.length - 1];
    if (!last) return null;
    if (last.type === "text") return null;
    if (last.url.startsWith("http")) return last.url;
    const cleanPath = stripUploads(last.url).replace(/^\/+/, "");
    return `${ASSET_BASE_URL}/${cleanPath}`;
  };

  const parseMetaSafe = (meta: any) => {
    if (!meta) return {};
    if (typeof meta === "string") {
      try {
        return JSON.parse(meta);
      } catch {
        try {
          const m = JSON.parse((meta as any)?.caption ?? "{}");
          return m || {};
        } catch {
          return {};
        }
      }
    }
    if (meta.caption && typeof meta.caption === "string") {
      try {
        return JSON.parse(meta.caption);
      } catch {
        return meta;
      }
    }
    return meta;
  };

  const overlayEmoji = emoji.trim();
  const overlayText = storyText.trim();

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="py-4"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {/* Create Story Tile */}
        {user && (
          <TouchableOpacity
            className="items-center space-y-1 relative"
            onPress={() => setComposerVisible(true)}
          >
            <View className="relative">
              <Avatar
                source={user?.profileImage}
                size="lg"
                className="border-2 border-white"
              />
              <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-white">
                <Plus size={12} color="white" strokeWidth={4} />
              </View>
            </View>
            <Text className="text-xs text-gray-700 font-medium">
              Your Story
            </Text>
          </TouchableOpacity>
        )}

        {ordered.map((story, index) => {
          const isMe = Number(story.userId) === Number(user?.id);
          const thumb = getThumb(story);
          const last = story.stories?.[story.stories.length - 1];
          const meta = last?.type === "text" ? parseMetaSafe(last.meta) : null;
          const bg = meta?.bg || "#111";
          const color = meta?.color || "#fff";
          const text = (meta?.text || meta?.caption || "Story").toString();

          return (
            <TouchableOpacity
              key={story.userId || index}
              className="items-center space-y-1"
              onPress={() => handleOpenStory(index)}
            >
              <View
                className={`p-[2px] rounded-full border-2 ${isMe ? "border-gray-300" : "border-blue-500"}`}
              >
                {last?.type === "text" ? (
                  <View
                    className="w-[60px] h-[60px] rounded-full justify-center items-center"
                    style={{ backgroundColor: bg }}
                  >
                    <Text
                      style={{ color, fontSize: 10, textAlign: "center" }}
                      numberOfLines={2}
                    >
                      {text}
                    </Text>
                  </View>
                ) : (
                  <Avatar source={thumb || story.avatar} size="lg" />
                )}
              </View>
              <Text
                className="text-xs text-gray-700 font-medium max-w-[70px] truncate"
                numberOfLines={1}
              >
                {isMe ? "Your Story" : story.username}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
        visible={composerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (submitting) return;
          setComposerVisible(false);
        }}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className="w-full max-h-[85%] bg-white rounded-2xl p-4">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <Text className="text-lg font-semibold mb-3 text-gray-900">
                Create story
              </Text>

              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: 16,
                    backgroundColor: bgColor,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    previewSizeRef.current = { width, height };
                  }}
                >
                  {media && (
                    <Image
                      source={{ uri: media.uri }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 16,
                      }}
                      resizeMode="cover"
                    />
                  )}

                  {overlayText.length > 0 && (
                    <View
                      {...textPanResponder.panHandlers}
                      style={{
                        position: "absolute",
                        left:
                          (textPosPct.xPct / 100) *
                          (previewSizeRef.current.width || 1),
                        top:
                          (textPosPct.yPct / 100) *
                          (previewSizeRef.current.height || 1),
                        transform: [{ translateX: -40 }, { translateY: -20 }],
                      }}
                    >
                      <Text
                        style={{
                          color: textColor,
                          fontSize: 22,
                          fontWeight: "700",
                        }}
                      >
                        {overlayText}
                      </Text>
                    </View>
                  )}

                  {overlayEmoji.length > 0 && (
                    <View
                      {...emojiPanResponder.panHandlers}
                      style={{
                        position: "absolute",
                        left:
                          (emojiPosPct.xPct / 100) *
                          (previewSizeRef.current.width || 1),
                        top:
                          (emojiPosPct.yPct / 100) *
                          (previewSizeRef.current.height || 1),
                        transform: [{ translateX: -24 }, { translateY: -24 }],
                      }}
                    >
                      <Text style={{ fontSize: 48 }}>{overlayEmoji}</Text>
                    </View>
                  )}
                </View>
              </View>

              <TextInput
                placeholder="Write something..."
                value={storyText}
                onChangeText={setStoryText}
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm"
                placeholderTextColor="#9CA3AF"
              />

              <TextInput
                placeholder="Emoji (optional)"
                value={emoji}
                onChangeText={setEmoji}
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm"
                placeholderTextColor="#9CA3AF"
              />

              <View className="mb-4">
                <Text className="text-xs text-gray-500 mb-2">
                  Background and text color
                </Text>
                <View className="flex-row mb-3">
                  <TouchableOpacity
                    onPress={() => setPickerTarget("bg")}
                    className={`flex-1 mr-1 py-2 rounded-lg border ${
                      pickerTarget === "bg"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300"
                    } flex-row items-center justify-center`}
                  >
                    <View
                      className="w-4 h-4 rounded-full mr-2 "
                      style={{ backgroundColor: bgColor }}
                    />
                    <Text className="text-xs font-medium text-gray-800">
                      Background
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPickerTarget("text")}
                    className={`flex-1 ml-1 py-2 rounded-lg border ${
                      pickerTarget === "text"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300"
                    } flex-row items-center justify-center`}
                  >
                    <View
                      className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                      style={{ backgroundColor: textColor }}
                    />
                    <Text className="text-xs font-medium text-gray-800">
                      Text
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="bg-gray-50 border border-gray-200 rounded-xl p-3 items-center">
                  <Text className="text-xs text-gray-500 mb-2">
                    {pickerTarget === "bg"
                      ? "Select Background Color"
                      : "Select Text Color"}
                  </Text>

                  {/* <TriangleColorPicker
                    style={{ width: 220, height: 220 }}
                    color={pickerTarget === "bg" ? bgColor : textColor}
                    onColorChange={(color) => {
                      const hex = color; // already hex string

                      if (pickerTarget === "bg") {
                        setBgColor(hex);
                      } else {
                        setTextColor(hex);
                      }
                    }}
                    noSnap
                    row={false}
                    sliderHidden
                    swatches={false}
                    style={{ width: 200, height: 200 }}
                    thumbSize={14}
                  /> */}
                  <Slider
                    style={{ width: "100%", height: 40 }}
                    minimumValue={0}
                    maximumValue={360}
                    minimumTrackTintColor="#000"
                    maximumTrackTintColor="#ccc"
                    thumbTintColor="#000"
                    value={0}
                    onValueChange={(value) => {
                      const color = `hsl(${value}, 100%, 50%)`;

                      if (pickerTarget === "bg") {
                        setBgColor(color);
                      } else {
                        setTextColor(color);
                      }
                    }}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handlePickMedia}
                className="mb-3 py-2 px-3 rounded-lg border border-gray-300 items-center"
                disabled={submitting}
              >
                <Text className="text-sm text-gray-700">
                  {media ? "Change photo/video" : "Add photo or video"}
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-end mt-1">
                <TouchableOpacity
                  onPress={() => {
                    if (submitting) return;
                    setComposerVisible(false);
                    setMedia(null);
                    setStoryText("");
                    setEmoji("");
                    setBgColor("#111111");
                    setTextColor("#ffffff");
                  }}
                  className="px-4 py-2 mr-2"
                  disabled={submitting}
                >
                  <Text className="text-sm text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePublish}
                  className="px-4 py-2 rounded-lg bg-blue-600 flex-row items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">
                      Publish
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <StoryViewer
        visible={viewerVisible}
        stories={ordered}
        initialIndex={initialStoryIndex}
        onClose={() => setViewerVisible(false)}
      />
    </>
  );
}
