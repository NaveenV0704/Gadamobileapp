import React, {
  useEffect,
  useState,
  useContext,
  createContext,
  useCallback,
  useRef,
} from "react";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { useEvent } from "expo";
import { Volume2, VolumeX } from "lucide-react-native";

type VideoSoundContextValue = {
  muted: boolean;
  toggleMuted: () => void;
};

const VideoSoundContext = createContext<VideoSoundContextValue | undefined>(
  undefined,
);

export const VideoSoundProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [muted, setMuted] = useState(true);
  const toggleMuted = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  return (
    <VideoSoundContext.Provider value={{ muted, toggleMuted }}>
      {children}
    </VideoSoundContext.Provider>
  );
};

const useVideoSound = (): VideoSoundContextValue => {
  const ctx = useContext(VideoSoundContext);
  if (!ctx) return { muted: true, toggleMuted: () => {} };
  return ctx;
};

interface PostVideoProps {
  uri: string;
  active?: boolean;
  onEnd?: () => void;
  loop?: boolean;
  fill?: boolean;
  fit?: "contain" | "cover";
  showProgress?: boolean; // ✅ NEW
}

export const PostVideo = ({
  uri,
  active,
  onEnd,
  loop = true,
  fill = false,
  fit = "contain",
  showProgress = false, // default false (for stories)
}: PostVideoProps) => {
  if (!uri) {
    return (
      <View style={styles.video}>
        <View style={styles.overlay}>
          <ActivityIndicator color="#ffffff" />
        </View>
      </View>
    );
  }

  const { muted, toggleMuted } = useVideoSound();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = loop;
    player.muted = muted;
    player.staysActiveInBackground = false;

    if (active) player.play();
    else player.pause();

    if (onEnd) {
      player.addListener("playToEnd", onEnd);
    }
  });

  // play / pause on active change
  useEffect(() => {
    if (!player || !isMounted.current) return;
    try {
      active ? player.play() : player.pause();
    } catch (e) {
      console.warn("[PostVideo] Failed to change playback state", e);
    }
  }, [active, player]);

  // mute sync
  useEffect(() => {
    if (player && isMounted.current) {
      try {
        player.muted = muted;
      } catch (e) {
        // ignore
      }
    }
  }, [muted, player]);

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  const isBuffering =
    status !== "readyToPlay" &&
    status !== "playing" &&
    status !== "paused" &&
    status !== "ended";

  // ✅ progress calculation
  const progress =
    typeof status === "object" && status?.duration && status?.currentTime
      ? status.currentTime / status.duration
      : 0;

  return (
    <View style={[styles.video, fill && styles.videoFill]}>
      <TouchableWithoutFeedback onPress={toggleMuted}>
        <View style={StyleSheet.absoluteFill}>
          <VideoView
            style={StyleSheet.absoluteFill}
            player={player}
            nativeControls={false} // ✅ fix prop name
            fullscreenOptions={{ enabled: false }}
            allowsPictureInPicture={false}
            contentFit={fit}
            pointerEvents="none" // ✅ block native interaction
          />
        </View>
      </TouchableWithoutFeedback>

      {/* ✅ Custom Progress Bar */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(progress * 100, 100)}%` },
            ]}
          />
        </View>
      )}

      {isBuffering && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#ffffff" />
        </View>
      )}

      <TouchableOpacity style={styles.muteButton} onPress={toggleMuted}>
        {muted ? (
          <VolumeX size={18} color="#111827" />
        ) : (
          <Volume2 size={18} color="#111827" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  video: {
    width: "100%",
    height: 256,
    backgroundColor: "black",
  },
  videoFill: {
    height: "100%",
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

  // ✅ NEW
  progressContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#ffffff",
  },
});
