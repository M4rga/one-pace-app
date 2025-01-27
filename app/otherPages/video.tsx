import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  Video,
  VideoFullscreenUpdateEvent,
  Audio,
  AVPlaybackStatus,
} from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

const VideoPlayer = () => {
  const videoRef = useRef<Video>(null);
  const params = useLocalSearchParams();
  const { id = null } = params;
  const [silentMode, setSilentMode] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);

  // useEffect to load the settings from AsyncStorage
  useEffect(() => {
    const loadAsync = async () => {
      try {
        // loades savedStates from AsyncStorage
        const savedStates = await AsyncStorage.getItem("switchStates");
        if (savedStates) {
          const parsedStates = JSON.parse(savedStates);
          setSilentMode(parsedStates.silentmode || false);
        }
        // loades video progress from AsyncStorage
        if (id) {
          const savedProgress = await AsyncStorage.getItem(`progress_${id}`);
          if (savedProgress) {
            setVideoProgress(Number(savedProgress));
          }
        }
      } catch (error) {
        console.error("Error: can't load settins");
      }
    };

    loadAsync();
  }, [id]);

  // useEffect to configure the audio settings
  useEffect(() => {
    const configureAudio = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: silentMode,
      });
    };
    configureAudio();
  }, [silentMode]);

  // Seek video to saved progress when loaded
  const handleVideoLoad = () => {
    if (videoRef.current && videoProgress > 0) {
      videoRef.current.setPositionAsync(videoProgress);
    }
    handleEnterFullscreen();
  };

  // Function to enter fullscreen mode on load
  const handleEnterFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.presentFullscreenPlayer();
    }
  };

  // Function to go bach to episode list on exit fullscreen
  const handleFullscreenUpdate = (status: VideoFullscreenUpdateEvent) => {
    if (status.fullscreenUpdate === 3) {
      router.replace({
        pathname: "../(tabs)",
        params: { prevId: id },
      });
    }
  };

  // Function to handle video error
  const handleVideoError = () => {
    Alert.alert(
      "Error",
      "Error link not found",
      [
        {
          text: "OK",
          onPress: () => {
            router.replace({
              pathname: "../(tabs)",
              params: { prevId: id },
            });
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Function to handle playback status updates
  const handlePlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.positionMillis !== undefined) {
      const currentProgress = status.positionMillis; // Progress in milliseconds
      setVideoProgress(currentProgress);

      // Save progress to AsyncStorage every second
      if (id) {
        try {
          // prettier-ignore
          await AsyncStorage.setItem(`progress_${id}`, currentProgress.toString());
        } catch (error) {
          console.error("Error saving progress:", error);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: `https://pixeldrain.com/api/file/${id}` }}
        useNativeControls={true}
        shouldPlay={true}
        onLoad={handleVideoLoad}
        onFullscreenUpdate={handleFullscreenUpdate}
        onError={handleVideoError}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />
      <ActivityIndicator size="small" color="black" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default VideoPlayer;
