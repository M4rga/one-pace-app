import { View, StyleSheet, Text } from "react-native";
import React, { useRef } from 'react';
import { useLocalSearchParams, useRouter  } from "expo-router";
import { Video, VideoFullscreenUpdateEvent } from 'expo-av';

const VideoPlayer = () => {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const params = useLocalSearchParams();
  const { id = null } = params;

  const handleEnterFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.presentFullscreenPlayer();
    }
  };

  const handleFullscreenUpdate = (status: VideoFullscreenUpdateEvent) => {
    if (status.fullscreenUpdate == 2 ) {
      router.back()
    }
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: 'https://pixeldrain.com/api/file/WU4Vk7Sn' }}
        useNativeControls={true}
        shouldPlay={true}
        onLoad={handleEnterFullscreen}
        onFullscreenUpdate={handleFullscreenUpdate}
      />
      <Text>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }
});

export default VideoPlayer;
