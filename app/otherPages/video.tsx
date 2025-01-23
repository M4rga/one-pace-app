import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Vibration,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video, VideoFullscreenUpdateEvent, Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const VideoPlayer = () => {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const params = useLocalSearchParams();
  const [silentMode, setSilentMode] = useState<boolean>(false);
  const [hideNotif, setHideNotif] = useState<boolean>(false);
  const [silenceNotif, setSilenceNotif] = useState<boolean>(false);
  const [vibrateNotif, setVibrateNotif] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPosition, setCurrentPosition] = useState<number>(0); // Stato per la posizione corrente
  const { id = null } = params;

  const STORAGE_KEY = `video_position_${id}`; // Chiave unica basata sull'ID del video

  // Carica la posizione salvata del video
  const loadPosition = async () => {
    try {
      const savedPosition = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedPosition) {
        setCurrentPosition(parseFloat(savedPosition));
      }
    } catch (error) {
      console.error("Errore durante il caricamento della posizione:", error);
    }
  };

  // Salva la posizione corrente del video
  const savePosition = async (position: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, position.toString());
    } catch (error) {
      console.error("Errore durante il salvataggio della posizione:", error);
    }
  };

  useEffect(() => {
    const loadSwitchStates = async () => {
      try {
        const savedStates = await AsyncStorage.getItem("switchStates");
        if (savedStates) {
          const parsedStates = JSON.parse(savedStates);
          setSilentMode(parsedStates.silentmode || false);
          setHideNotif(parsedStates.hidenotification || false);
          setSilenceNotif(parsedStates.silencenotification || false);
          setVibrateNotif(parsedStates.vibratenotification || false);
        }
      } catch (error) {
        console.error("Error: can't load settings");
      }
    };

    loadSwitchStates();
    loadPosition(); // Carica la posizione salvata quando il componente viene montato
  }, []);

  useEffect(() => {
    const configureAudio = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: silentMode,
      });
    };
    configureAudio();
  }, [silentMode]);

  useEffect(() => {
    const disableNotifications = async () => {
      await Notifications.setNotificationHandler({
        handleNotification: async () => {
          if (vibrateNotif) {
            Vibration.vibrate();
          }
          return {
            shouldShowAlert: hideNotif,
            shouldPlaySound: silenceNotif,
            shouldSetBadge: true,
          };
        },
      });
    };

    const enableNotifications = async () => {
      await Notifications.setNotificationHandler({
        handleNotification: async () => {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        },
      });
    };

    disableNotifications();

    return () => {
      enableNotifications();
    };
  }, []);

  const handleEnterFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.presentFullscreenPlayer();
    }
  };

  const handleFullscreenUpdate = (status: VideoFullscreenUpdateEvent) => {
    if (status.fullscreenUpdate === 2) {
      router.back();
    }
  };

  const handleVideoLoad = async () => {
    // Entra in schermo intero e avanza alla posizione salvata
    handleEnterFullscreen();
    if (videoRef.current && currentPosition > 0) {
      await videoRef.current.setPositionAsync(currentPosition);
    }
    setLoading(false);
  };

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

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      savePosition(status.positionMillis); // Salva la posizione corrente
    }
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="small" color="black" />}
      <Video
        ref={videoRef}
        source={{ uri: `https://pixeldrain.com/api/file/${id}` }}
        useNativeControls={true}
        shouldPlay={true}
        onLoad={handleVideoLoad} // Quando il video è caricato
        onFullscreenUpdate={handleFullscreenUpdate}
        onError={handleVideoError}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate} // Aggiornamento posizione
      />
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
