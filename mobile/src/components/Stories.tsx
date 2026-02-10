import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useStories } from "../contexts/StoryContext";
import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "./ui/Avatar";
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import { API_BASE_URL } from "../constants/config";
import { stripUploads } from "../lib/url";
import { Story } from "../types";

export function Stories() {
  const { stories } = useStories();
  const { user } = useAuth();

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

  const getThumb = (g: Story) => {
    const last = g.stories?.[g.stories.length - 1];
    if (!last) return null;
    if (last.type === "text") return null;
    if (last.url.startsWith("http")) return last.url;
    return API_BASE_URL + "/uploads/" + stripUploads(last.url);
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

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="py-4"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
    >
      {/* Create Story Tile */}
      {user && (
        <TouchableOpacity className="items-center space-y-1 relative">
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
          <Text className="text-xs text-gray-700 font-medium">Your Story</Text>
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
          >
            <View
              className={`p-[2px] rounded-full border-2 ${isMe ? "border-gray-300" : "border-blue-500"}`}
            >
              {last?.type === "text" ? (
                <View
                  className="w-16 h-16 rounded-full overflow-hidden items-center justify-center border-2 border-white"
                  style={{ backgroundColor: bg }}
                >
                  <Text
                    style={{ color }}
                    className="text-[8px] font-bold text-center px-1"
                    numberOfLines={3}
                  >
                    {text}
                  </Text>
                </View>
              ) : (
                <Image
                  source={{
                    uri:
                      thumb ||
                      `${API_BASE_URL}/uploads/profile/defaultavatar.png`,
                  }}
                  className="w-16 h-16 rounded-full border-2 border-white"
                />
              )}
            </View>
            <Text
              className="text-xs text-gray-700 w-16 text-center"
              numberOfLines={1}
            >
              {isMe ? "Your story" : story.username}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
