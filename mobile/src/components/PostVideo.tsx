import React, { useState } from "react";
import { VideoView, useVideoPlayer } from "expo-video";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { useEvent } from "expo";

interface PostVideoProps {
  uri: string;
}

export const PostVideo = ({ uri }: PostVideoProps) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    // We don't auto-play here to save data/battery unless in view
    // But for simplicity in migration:
    player.play();
  });

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
        fullscreenOptions={{ enabled: true }}
        allowsPictureInPicture
        contentFit="contain"
      />
      {isBuffering && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#ffffff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  video: {
    width: "100%",
    height: 256,
    backgroundColor: "black",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
