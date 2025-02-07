import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Video,
  VideoFullscreenUpdateEvent,
  Audio,
  AVPlaybackStatus,
} from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import Toast, { BaseToast } from "react-native-toast-message";
import Ionicons from "@expo/vector-icons/Ionicons";

const VideoPlayer = () => {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const params = useLocalSearchParams();
  const { id = null } = params;
  const [silentMode, setSilentMode] = useState<boolean>(false);

  // useEffect to load the settings switch states from AsyncStorage
  useEffect(() => {
    const loadSwitchStates = async () => {
      try {
        const savedStates = await AsyncStorage.getItem("switchStates");
        // loades savedStates from AsyncStorage
        if (savedStates) {
          const parsedStates = JSON.parse(savedStates);
          setSilentMode(parsedStates.silentmode || false);
        }
      } catch (error) {
        console.error("Error: can't load settings");
      }
    };

    loadSwitchStates();
  }, []);

  // useEffect to configure the audio settings
  useEffect(() => {
    const configureAudio = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: silentMode,
      });
    };
    configureAudio();
  }, [silentMode]);

  // Function to enter fullscreen mode on load
  const handleEnterFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.presentFullscreenPlayer();
    }
  };

  // Function to go back to episode list on exit fullscreen
  const handleFullscreenUpdate = (status: VideoFullscreenUpdateEvent) => {
    if (status.fullscreenUpdate === 3) {
      router.back();
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
            router.back();
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Function to handle video load
  const handleVideoLoad = async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    handleEnterFullscreen();
    const progressKey = `progress_${id}`;
    // function to load the progress of the video, it is saved as percentage in AsyncStorage and then converted to milliseconds to seek the video
    try {
      const savedProgress = await AsyncStorage.getItem(progressKey);
      if (savedProgress) {
        const savedPercentage = JSON.parse(savedProgress);
        const seekPosition = (savedPercentage / 100) * status.durationMillis!;
        if (videoRef.current) {
          await videoRef.current.setStatusAsync({
            positionMillis: seekPosition,
          });
        }
      }
    } catch (error) {
      console.error("Error loading progress", error);
    }
  };

  // Function to handle the progress of the video it gets the current position of the video in milliseconds and saves it as percentage in AsyncStorage
  const handlePlaybackStatusUpdate = async (status: any) => {
    if (status.isLoaded && status.durationMillis) {
      const progressPercentage =
        (status.positionMillis / status.durationMillis) * 100;
      const progressKey = `progress_${id}`;
      try {
        await AsyncStorage.setItem(
          progressKey,
          JSON.stringify(progressPercentage)
        );
      } catch (error) {
        console.error("Error saving progress", error);
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
