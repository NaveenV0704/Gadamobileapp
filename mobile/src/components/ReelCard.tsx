import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Heart, MessageCircle, Share2 } from "lucide-react-native";
import { ASSET_BASE_URL } from "../constants/config";
import { Avatar } from "./ui/Avatar";
import { PostVideo } from "./PostVideo";
import type { Reel } from "../services/reelService";

type Props = {
  reel: Reel;
  active: boolean;
  onLike: (id: number) => Promise<void> | void;
  onShare: (id: number) => Promise<void> | void;
  onEndedNext: (id: number) => void;
};

export default function ReelCard({
  reel,
  active,
  onLike,
  onShare,
  onEndedNext,
}: Props) {
  const videoUrl = useMemo(() => {
    if (!reel.videoUrl) return "";
    if (reel.videoUrl.startsWith("http")) return reel.videoUrl;
    const clean = reel.videoUrl.replace(/^\/+/, "");
    return `${ASSET_BASE_URL}/${clean}`;
  }, [reel.videoUrl]);

  const [likeCount, setLikeCount] = useState<number>(() => reel.likeCount);
  const [shareCount, setShareCount] = useState<number>(() => reel.shareCount);
  const [isLiked, setIsLiked] = useState<boolean>(() => !!reel.hasLiked);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLikeCount(reel.likeCount);
    setShareCount(reel.shareCount);
    setIsLiked(!!reel.hasLiked);
  }, [reel.id, reel.likeCount, reel.shareCount, reel.hasLiked]);

  const handleLikePress = async () => {
    if (busy) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    try {
      setBusy(true);
      await onLike(reel.id);
    } catch (e) {
      setIsLiked(!nextLiked);
      setLikeCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  };

  const handleSharePress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onShare(reel.id);
      setShareCount((c) => c + 1);
    } finally {
      setBusy(false);
    }
  };

  if (!videoUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.videoContainer}>
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>Video unavailable</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <PostVideo
          showProgress
          uri={videoUrl}
          active={active}
          onEnd={() => onEndedNext(reel.id)}
          fill
          fit="cover"
        />
        <View style={styles.rightRail}>
          <TouchableOpacity onPress={handleLikePress} activeOpacity={0.8}>
            <View style={styles.statButton}>
              <Heart
                size={30}
                color={isLiked ? "#fb7185" : "#ffffff"}
                fill={isLiked ? "#fb7185" : "transparent"}
              />
              <Text style={styles.statText}>{likeCount}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}} activeOpacity={0.8}>
            <View style={styles.statButton}>
              <MessageCircle size={28} color="#ffffff" />
              <Text style={styles.statText}>{reel.commentCount}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSharePress} activeOpacity={0.8}>
            <View style={styles.statButton}>
              <Share2 size={26} color="#ffffff" />
              <Text style={styles.statText}>{shareCount}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomMeta}>
          <View style={styles.authorRow}>
            <Avatar source={reel.authorProfileImage || undefined} />
            <View style={styles.authorText}>
              <Text style={styles.username}>@{reel.authorUsername}</Text>
            </View>
          </View>
          {reel.caption ? (
            <Text numberOfLines={3} style={styles.caption}>
              {reel.caption}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  videoContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "black",
    borderRadius: 24,
    overflow: "hidden",
  },
  inactivePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  inactiveText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  fallbackText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  muteButton: {
    position: "absolute",
    right: 12,
    bottom: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    padding: 6,
  },
  rightRail: {
    position: "absolute",
    right: 8,
    top: "35%",
    alignItems: "center",
  },
  statButton: {
    alignItems: "center",
    marginBottom: 16,
  },
  statText: {
    marginTop: 4,
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  bottomMeta: {
    position: "absolute",
    left: 12,
    right: 60,
    bottom: 24,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  authorText: {
    marginLeft: 8,
  },
  username: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  caption: {
    color: "#e5e7eb",
    fontSize: 13,
  },
});
