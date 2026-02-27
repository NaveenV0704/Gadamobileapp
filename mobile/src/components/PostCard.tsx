import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Share,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Post, User, Comment } from "../types";
import { Avatar } from "./ui/Avatar";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, Send } from "lucide-react-native";
import { API_BASE_URL, ASSET_BASE_URL } from "../constants/config";
import { useState, useEffect, useCallback, useMemo } from "react";
import { PostVideo } from "./PostVideo";
import { useAuth } from "../contexts/AuthContext";
import { useAuthHeader } from "../hooks/useAuthHeader";
import { reactToPost, commentOnPost } from "../services/postService";
import ReactionPicker from "./ReactionPicker";

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  active?: boolean;
}

const REACTION_EMOJIS: Record<string, string> = {
  like: "👍",
  love: "❤️",
  care: "🥰",
  haha: "😆",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

const CollapsibleText = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    setExpanded(false);
    setCanExpand(false);
  }, [text]);

  const isLikelyLong = text.length > 80 || (text.match(/\n/g) || []).length > 2;

  const onTextLayout = useCallback(
    (e: any) => {
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

const buildUrl = (path?: string) => {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  const clean = path.replace(/^\/+/, "");
  return `${ASSET_BASE_URL}/${clean}`;
};

const PostImage = ({ uri, index }: { uri: string; index: number }) => {
  const [loading, setLoading] = useState(true);
  const sourceUri = buildUrl(uri);

  return (
    <View className="w-full h-64 bg-gray-200 overflow-hidden rounded-lg items-center justify-center">
      <Image
        source={{ uri: sourceUri }}
        className="w-full h-64"
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          console.log("Image failed:", sourceUri);
          setLoading(false);
        }}
      />
      {loading && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(229,231,235,0.8)",
          }}
        >
          <ActivityIndicator color="#6b7280" />
        </View>
      )}
    </View>
  );
};

export function PostCard({ post, active }: PostCardProps) {
  const { user, accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const author = post.author || {};
  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "just now";
  const isLive = post.live?.isLive;

  // State
  const [likes, setLikes] = useState<string[]>(post.likes || []);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(
    post.myReaction || null,
  );

  const { mediaImages, mediaVideos } = useMemo(() => {
    const images: string[] = [];
    const videos: string[] = [];

    const addMedia = (url: any, type?: string) => {
      if (!url || typeof url !== "string") return;

      if (type === "video") videos.push(url);
      else images.push(url);
    };

    const rawMedia = (post as any).media;

    if (Array.isArray((post as any).images)) {
      (post as any).images.forEach((u: any) => addMedia(u, "image"));
    }

    if (Array.isArray((post as any).videos)) {
      (post as any).videos.forEach((u: any) => addMedia(u, "video"));
    }

    if (Array.isArray(rawMedia)) {
      rawMedia.forEach((m: any) => addMedia(m?.url, m?.type));
    } else if (rawMedia && typeof rawMedia === "object") {
      if (Array.isArray(rawMedia.images)) {
        rawMedia.images.forEach((m: any) =>
          addMedia(typeof m === "string" ? m : m?.url, "image"),
        );
      }

      if (Array.isArray(rawMedia.videos)) {
        rawMedia.videos.forEach((m: any) =>
          addMedia(typeof m === "string" ? m : m?.url, "video"),
        );
      }

      if (rawMedia.url) {
        addMedia(rawMedia.url, rawMedia.type);
      }
    }

    return { mediaImages: images, mediaVideos: videos };
  }, [post]);

  const isLiked = user ? likes.includes(user.id) : false;

  useEffect(() => {
    setLikes(post.likes || []);
    setComments(post.comments || []);
    setMyReaction(post.myReaction || null);
  }, [post.id]); // 👈 only depend on post.id

  const handleReaction = async (reaction: string) => {
    if (!user) return;

    setReactionPickerVisible(false);

    try {
      const res: any = await reactToPost(post.id, reaction, headers);

      if (res?.liked) {
        setMyReaction(reaction); // 👈 FIX
        setLikes((prev) =>
          prev.includes(user.id) ? prev : [...prev, user.id],
        );
      } else {
        setMyReaction(null);
        setLikes((prev) => prev.filter((id) => id !== user.id));
      }
    } catch (error) {
      console.error("Failed to react", error);
    }
  };

  const toggleLike = async () => {
    if (!user) return;
    try {
      const res: any = await reactToPost(post.id, "like", headers);
      const liked = !!res?.liked;
      setMyReaction(liked ? "like" : null);
      setLikes((prev) => {
        const has = prev.includes(user.id);
        if (liked && !has) return [...prev, user.id];
        if (!liked && has) return prev.filter((id) => id !== user.id);
        return prev;
      });
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post from ${author.firstname}: ${post.content}`,
        url: `${API_BASE_URL}/posts/${post.id}`, // Hypothetical web URL
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setSubmittingComment(true);

    try {
      const res = await commentOnPost(post.id, newComment.trim(), headers);

      const serverComment: any = res || {};

      const newCommentObj: Comment = {
        id: String(serverComment.id),
        userId: String(serverComment.userId),
        content: serverComment.content,
        createdAt: serverComment.createdAt,
        user: {
          id: String(serverComment.userId),
          firstname: serverComment.username, // 👈 map username
          lastname: "",
          profileImage: serverComment.profileImage,
        },
      };

      setComments((prev) => [...prev, newCommentObj]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to comment", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <View className="bg-white p-4 mb-2">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <Avatar source={buildUrl(author?.profileImage)} />

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

      {/* Media (Images & Videos) */}
      <View className="mb-3 rounded-lg overflow-hidden gap-y-2">
        {/* Images */}
        {mediaImages.length > 0 &&
          mediaImages.map((img, idx) => (
            <PostImage key={`img-${idx}`} uri={img} index={idx} />
          ))}

        {/* Videos */}
        {mediaVideos.length > 0 &&
          mediaVideos.map((vid, idx) => (
            <PostVideo
              key={`vid-${idx}`}
              uri={buildUrl(vid)}
              active={active}
              showProgress
            />
          ))}
      </View>

      {/* Actions */}
      <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-gray-100 relative z-10">
        <TouchableOpacity
          onPress={toggleLike}
          onLongPress={() => setReactionPickerVisible(true)}
          className="flex-row items-center space-x-2 px-2 py-1 rounded-md active:bg-gray-100"
        >
          {isLiked ? (
            <View className="flex-row items-center">
              {myReaction && REACTION_EMOJIS[myReaction] ? (
                <Text className="text-xl mr-1">
                  {REACTION_EMOJIS[myReaction]}
                </Text>
              ) : (
                <Heart
                  size={20}
                  color="#ef4444"
                  fill="#ef4444"
                  className="mr-1"
                />
              )}
              <Text
                className={`font-semibold ${myReaction ? "text-blue-600" : "text-red-500"}`}
              >
                {myReaction
                  ? myReaction.charAt(0).toUpperCase() + myReaction.slice(1)
                  : "Liked"}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Heart size={20} color="#6b7280" className="mr-1" />
              <Text className="text-gray-600 font-medium">Like</Text>
            </View>
          )}
          <View className="bg-gray-100 px-2 py-0.5 rounded-full">
            <Text className="text-gray-600 text-xs">{likes.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowComments(!showComments)}
          className="flex-row items-center space-x-2 px-2 py-1 rounded-md active:bg-gray-100"
        >
          <MessageCircle size={20} color="#6b7280" />
          <Text className="text-gray-600 font-medium">Comment</Text>
          <View className="bg-gray-100 px-2 py-0.5 rounded-full">
            <Text className="text-gray-600 text-xs">{comments.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          className="flex-row items-center space-x-2 px-2 py-1 rounded-md active:bg-gray-100"
        >
          <Share2 size={20} color="#6b7280" />
          <Text className="text-gray-600 font-medium">Share</Text>
        </TouchableOpacity>
      </View>

      {/* Reaction Picker Modal */}
      <ReactionPicker
        visible={reactionPickerVisible}
        onSelect={handleReaction}
        onClose={() => setReactionPickerVisible(false)}
      />

      {/* Comments Section */}
      {showComments && (
        <View className="mt-4 border-t border-gray-100 pt-3">
          {comments.map((comment, idx) => {
            const avatarSrc =
              (comment as any).user?.profileImage ??
              (comment as any).profileImage ??
              "";
            const displayName = (comment as any).user
              ? `${(comment as any).user.firstname} ${(comment as any).user.lastname}`
              : (comment as any).username || "User";
            return (
              <View key={comment.id || idx} className="mb-3 flex-row">
                <Avatar source={buildUrl(avatarSrc)} size="sm" />
                <View className="ml-2 bg-gray-100 p-2 rounded-lg flex-1">
                  <Text className="font-bold text-xs">{displayName}</Text>
                  <Text className="text-gray-800 text-sm">
                    {comment.content}
                  </Text>
                </View>
              </View>
            );
          })}

          <View className="flex-row items-center mt-2">
            <TextInput
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              onSubmitEditing={handleSubmitComment}
            />
            <TouchableOpacity
              onPress={handleSubmitComment}
              disabled={submittingComment}
              className="bg-blue-500 p-2 rounded-full"
            >
              {submittingComment ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Send size={16} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
