import { View, StyleSheet, ActivityIndicator, Alert, Vibration  } from "react-native";
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
  const { id = null } = params;

  useEffect(() => {
    const loadSwitchStates = async () => {
      try {
        const savedStates = await AsyncStorage.getItem("switchStates");
        if (savedStates) {
          const parsedStates = JSON.parse(savedStates);
          setSilentMode(parsedStates.silentmode || false);
          setHideNotif(parsedStates.hidenotification || false);
          setSilenceNotif(parsedStates.silencenotification || false);
          setVibrateNotif(parsedStates.silencenotification || false);
        }
      } catch (error) {
        console.error("Errore durante il caricamento degli stati:", error);
      }
    };

    loadSwitchStates();
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
          if(vibrateNotif) {
            Vibration.vibrate();
          }
          return {
            shouldShowAlert: hideNotif, // Non mostrare l'alert della notifica
            shouldPlaySound: silenceNotif, // Non suonare una notifica
            shouldSetBadge: true, // Non aggiornare il badge
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

    // Disabilita notifiche all'inizio
    disableNotifications();

    return () => {
      // Riabilita notifiche quando il componente si smonta
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

  const handleVideoError = () => {
    Alert.alert(
      "Errore",
      "Errore nel caricamento del link",
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
  
  console.log(silentMode, hideNotif, silenceNotif, vibrateNotif, "------------------------------------------------" )

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: "https://pixeldrain.com/api/file/7m6KDEuw" }}
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
