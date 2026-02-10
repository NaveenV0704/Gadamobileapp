import { View, Text, Image, TouchableOpacity } from "react-native";
import { Post, User } from "../types";
import { Avatar } from "./ui/Avatar";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2 } from "lucide-react-native";
import { API_BASE_URL } from "../constants/config";
import { useState, useEffect, useCallback } from "react";

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
}

const CollapsibleText = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    setExpanded(false);
    setCanExpand(false);
  }, [text]);

  // Initial check: if text is clearly long, we assume it needs truncation to avoid layout jump.
  // If it's short but wraps, onTextLayout will catch it.
  const isLikelyLong = text.length > 80 || (text.match(/\n/g) || []).length > 2;

  const onTextLayout = useCallback(
    (e: any) => {
      // If we already know we can expand, no need to check again (unless text changes)
      if (canExpand) return;

      if (e.nativeEvent.lines.length > 3) {
        setCanExpand(true);
      }
    },
    [canExpand],
  );

  const showButton = canExpand || isLikelyLong;

  return (
    <View className="mb-3">
      <Text
        className="text-gray-800 text-base leading-6"
        numberOfLines={expanded || !showButton ? undefined : 3}
        onTextLayout={onTextLayout}
      >
        {text}
      </Text>
      {showButton && (
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          className="mt-1"
        >
          <Text className="text-blue-600 font-semibold">
            {expanded ? "See less" : "See more"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export function PostCard({ post, onLike, onComment }: PostCardProps) {
  const author = post.author || {}; // Fallback if author is missing (shouldn't happen with correct API)
  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "just now";
  const isLive = post.live?.isLive;

  return (
    <View className="bg-white p-4">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <Avatar source={author.profileImage} size="md" />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text className="font-semibold text-gray-900">
              {author.firstname} {author.lastname}
            </Text>
            {isLive && (
              <View className="bg-red-500 px-2 py-0.5 rounded ml-2">
                <Text className="text-white text-[10px] font-bold">LIVE</Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-gray-500">
            @{author.username} • {timeAgo}
          </Text>
        </View>
      </View>

      {/* Content */}
      <CollapsibleText text={post.content} />

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <View className="mb-3 rounded-lg overflow-hidden">
          {post.images.map((img, idx) => (
            <Image
              key={idx}
              source={{
                uri: img.startsWith("http") ? img : `${API_BASE_URL}${img}`,
              }}
              className="w-full h-64 bg-gray-100"
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-gray-100">
        <TouchableOpacity
          onPress={onLike}
          className="flex-row items-center space-x-2"
        >
          <Heart
            size={20}
            color={post.likes.length > 0 ? "#ef4444" : "#6b7280"}
            fill={post.likes.length > 0 ? "#ef4444" : "transparent"}
          />
          <Text className="text-gray-600 ml-1">{post.likes.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onComment}
          className="flex-row items-center space-x-2"
        >
          <MessageCircle size={20} color="#6b7280" />
          <Text className="text-gray-600 ml-1">{post.comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center space-x-2">
          <Share2 size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
