import React, {
  useEffect,
  useState,
  useContext,
  createContext,
  useCallback,
} from "react";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
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
  if (!ctx) {
    return { muted: true, toggleMuted: () => {} };
  }
  return ctx;
};

interface PostVideoProps {
  uri: string;
  active?: boolean;
  onEnd?: () => void;
  loop?: boolean;
}

export const PostVideo = ({ uri, active, onEnd, loop = true }: PostVideoProps) => {
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
  const player = useVideoPlayer(uri, (player) => {
    player.loop = loop;
    player.muted = muted;
    player.play();

    if (onEnd) {
      player.addListener("playToEnd", () => {
        onEnd();
      });
    }
  });

  useEffect(() => {
    if (active === undefined) return;
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  const isBuffering =
    status !== "readyToPlay" &&
    status !== "playing" &&
    status !== "paused" &&
    status !== "ended";

  return (
    <View style={styles.video}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        fullscreenOptions={{ enabled: false }}
        allowsPictureInPicture={false}
        useNativeControls={false}
        contentFit="contain"
      />
      {isBuffering && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#ffffff" />
        </View>
      )}
      <TouchableOpacity style={styles.muteButton} onPress={toggleMuted}>
        {muted ? <VolumeX size={18} color="#111827" /> : <Volume2 size={18} color="#111827" />}
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
});
