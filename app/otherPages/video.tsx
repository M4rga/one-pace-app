import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video, VideoFullscreenUpdateEvent, Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
        console.error("Error: can't load settins");
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

  // Function to go bach to episode list on exit fullscreen
  const handleFullscreenUpdate = (status: VideoFullscreenUpdateEvent) => {
    if (status.fullscreenUpdate === 2) {
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

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: `https://pixeldrain.com/api/file/${id}` }}
        useNativeControls={true}
        shouldPlay={true}
        onLoad={handleEnterFullscreen}
        onFullscreenUpdate={handleFullscreenUpdate}
        onError={handleVideoError}
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
