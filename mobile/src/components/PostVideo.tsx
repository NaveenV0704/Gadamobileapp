import React from "react";
import { VideoView, useVideoPlayer } from "expo-video";
import { StyleSheet } from "react-native";

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

  return (
    <VideoView
      style={styles.video}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
      contentFit="contain"
    />
  );
};

const styles = StyleSheet.create({
  video: {
    width: "100%",
    height: 256, // matches h-64
    backgroundColor: "black",
  },
});
