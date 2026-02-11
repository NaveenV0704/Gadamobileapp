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
import { API_BASE_URL } from "../constants/config";
import { useState, useEffect, useCallback, useRef } from "react";
import { Video, ResizeMode } from "expo-av";
import { useAuth } from "../contexts/AuthContext";
import { useAuthHeader } from "../hooks/useAuthHeader";
import { reactToPost, commentOnPost } from "../services/postService";
import ReactionPicker from "./ReactionPicker";

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
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

export function PostCard({ post }: PostCardProps) {
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

  const videoRef = useRef<Video>(null);

  const isLiked = user ? likes.includes(user.id) : false;

  useEffect(() => {
    // If post data changes, sync local state
    if (post.likes) setLikes(post.likes);
    if (post.comments) setComments(post.comments);
    if (post.myReaction) setMyReaction(post.myReaction);
  }, [post]);

  const handleReaction = async (reaction: string) => {
    if (!user) return;
    setReactionPickerVisible(false);

    // Optimistic update
    const alreadyLiked = likes.includes(user.id);
    let newLikes = [...likes];

    setMyReaction(reaction);

    if (!alreadyLiked) {
      newLikes.push(user.id);
    }
    setLikes(newLikes);

    try {
      await reactToPost(post.id, reaction, headers);
    } catch (error) {
      console.error("Failed to react", error);
      // We could revert here, but simpler to just log for now
    }
  };

  const toggleLike = async () => {
    if (!user) return;
    const alreadyLiked = likes.includes(user.id);

    if (alreadyLiked) {
      // Unlike
      const newLikes = likes.filter((id) => id !== user.id);
      setLikes(newLikes);
      setMyReaction(null);
      try {
        await reactToPost(post.id, "like", headers);
      } catch (error) {
        setLikes(likes);
      }
    } else {
      // Like
      const newLikes = [...likes, user.id];
      setLikes(newLikes);
      setMyReaction("like");
      try {
        await reactToPost(post.id, "like", headers);
      } catch (error) {
        setLikes(likes);
        setMyReaction(null);
      }
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
      const res = await commentOnPost(post.id, newComment, headers);
      // Optimistic add
      const newCommentObj: Comment = {
        id: Date.now().toString(), // Temp ID
        userId: user.id,
        user: user, // Attach current user
        content: newComment,
        createdAt: new Date().toISOString(),
      };
      setComments([...comments, newCommentObj]);
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

      {/* Media (Images & Videos) */}
      <View className="mb-3 rounded-lg overflow-hidden gap-y-2">
        {/* Images */}
        {post.images &&
          post.images.map((img, idx) => (
            <Image
              key={`img-${idx}`}
              source={{
                uri: img.startsWith("http") ? img : `${API_BASE_URL}${img}`,
              }}
              className="w-full h-64 bg-gray-100"
              resizeMode="cover"
            />
          ))}

        {/* Videos */}
        {post.videos &&
          post.videos.map((vid, idx) => (
            <Video
              key={`vid-${idx}`}
              ref={videoRef}
              source={{
                uri: vid.startsWith("http") ? vid : `${API_BASE_URL}${vid}`,
              }}
              className="w-full h-64 bg-black"
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
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
          {comments.map((comment, idx) => (
            <View key={comment.id || idx} className="mb-3 flex-row">
              <Avatar source={comment.user?.profileImage || ""} size="sm" />
              <View className="ml-2 bg-gray-100 p-2 rounded-lg flex-1">
                <Text className="font-bold text-xs">
                  {comment.user
                    ? `${comment.user.firstname} ${comment.user.lastname}`
                    : "User"}
                </Text>
                <Text className="text-gray-800 text-sm">{comment.content}</Text>
              </View>
            </View>
          ))}

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
