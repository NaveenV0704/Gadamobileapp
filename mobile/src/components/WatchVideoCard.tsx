import { useMemo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react-native";
import { ASSET_BASE_URL } from "../constants/config";
import { Post } from "../types";
import { Avatar } from "./ui/Avatar";
import { PostVideo } from "./PostVideo";

type Props = {
  post: Post;
  active?: boolean;
};

export default function WatchVideoCard({ post, active }: Props) {
  const videoUrl = useMemo(() => {
    const first =
      (post as any).videos && (post as any).videos.length > 0
        ? (post as any).videos[0]
        : null;
    if (!first) return "";
    if (typeof first !== "string") return "";
    if (first.startsWith("http")) return first;
    const clean = first.replace(/^\/+/, "");
    return `${ASSET_BASE_URL}/${clean}`;
  }, [post]);

  const [likeCount, setLikeCount] = useState(() => {
    if (Array.isArray((post as any).likes)) {
      return (post as any).likes.length;
    }
    return Number((post as any).likeCount ?? 0);
  });
  const [commentsCount, setCommentsCount] = useState(() =>
    Array.isArray((post as any).comments) ? (post as any).comments.length : 0,
  );
  const [shareCount, setShareCount] = useState(
    Number((post as any).shareCount ?? (post as any).shares ?? 0) || 0,
  );

  useEffect(() => {
    if (Array.isArray((post as any).likes)) {
      setLikeCount((post as any).likes.length);
    } else {
      setLikeCount(Number((post as any).likeCount ?? 0));
    }

    if (Array.isArray((post as any).comments)) {
      setCommentsCount((post as any).comments.length);
    } else {
      setCommentsCount(0);
    }

    setShareCount(
      Number((post as any).shareCount ?? (post as any).shares ?? 0) || 0,
    );
  }, [post]);

  const [isLiked, setIsLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const likes = (post as any).likes;
    const currentUserId = (post as any).currentUserId;
    if (Array.isArray(likes) && currentUserId) {
      setIsLiked(likes.some((id: any) => String(id) === String(currentUserId)));
    } else {
      setIsLiked(!!(post as any).hasLiked);
    }
  }, [post]);

  const author: any = (post as any).author || {};

  const handleLikePress = async () => {
    if (busy) return;
    // Reuse optimistic pattern from PostCard: just toggle count locally.
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
  };

  const handleCommentPress = () => {
    // For now, just bump comments count UI so button feels responsive.
    setCommentsCount((c) => c);
  };

  const handleSharePress = async () => {
    if (busy) return;
    setShareCount((c) => c + 1);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar source={author.profileImage} size="md" />
          <View style={styles.headerText}>
            <Text style={styles.username}>
              {author.username || author.fullName || "User"}
            </Text>
            <Text style={styles.metaText}>
              {(post as any).createdAt
                ? new Date((post as any).createdAt).toLocaleString()
                : ""}
            </Text>
          </View>
        </View>
      </View>

      {post.content ? (
        <Text style={styles.contentText}>{post.content}</Text>
      ) : null}

      <View style={styles.videoContainer}>
        {videoUrl ? (
          <PostVideo uri={videoUrl} active={active} />
        ) : (
          <View
            style={[
              styles.video,
              { alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Text style={{ color: "#9CA3AF" }}>No video</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        {likeCount > 0 && (
          <View style={styles.statItem}>
            <ThumbsUp size={14} color="#1877F2" />
            <Text style={styles.statText}>{likeCount}</Text>
          </View>
        )}
        {commentsCount > 0 && (
          <Text style={styles.statText}>{commentsCount} comments</Text>
        )}
        <Text style={styles.statText}>{shareCount} shares</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLikePress}>
          <ThumbsUp
            size={18}
            color={isLiked ? "#1877F2" : "#4B5563"}
            fill={isLiked ? "#1877F2" : "transparent"}
          />
          <Text
            style={[
              styles.actionText,
              { color: isLiked ? "#1877F2" : "#4B5563" },
            ]}
          >
            {isLiked ? "Liked" : "Like"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCommentPress}
        >
          <MessageCircle size={18} color="#4B5563" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSharePress}
        >
          <Share2 size={18} color="#4B5563" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  contentText: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    fontSize: 14,
    color: "#111827",
  },
  videoContainer: {
    backgroundColor: "black",
    position: "relative",
  },
  video: {
    width: "100%",
    height: 320,
  },
  muteButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    padding: 6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
});
