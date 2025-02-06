import React, { useState } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import * as Progress from "react-native-progress";
import * as FileSystem from "expo-file-system";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect } from "@react-navigation/native";

const About: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [esisteEpisodes, setEsisteEpisodes] = useState<boolean>(false);
  const episodeId = "7m6KDEuw";
  // prettier-ignore
  const destinationUri = FileSystem.documentDirectory + `downloaded_episodes/${episodeId}.mp4`;

  const downloadFile = async () => {
    const url = `https://pixeldrain.com/api/file/${episodeId}?download`;

    // Crea la cartella "downloaded_episodes" se non esiste
    const directoryUri = FileSystem.documentDirectory + "downloaded_episodes";
    try {
      // Verifica se la cartella esiste, se non la crea
      await FileSystem.makeDirectoryAsync(directoryUri, {
        intermediates: true,
      });
    } catch (error) {
      console.log("Errore durante la creazione della cartella:", error);
    }

    const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
      const progressFraction =
        downloadProgress.totalBytesWritten /
        downloadProgress.totalBytesExpectedToWrite;
      setProgress(progressFraction);
    };

    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      destinationUri,
      {},
      callback
    );

    setIsDownloading(true);
    try {
      const result = await downloadResumable.downloadAsync();
      if (result && result.uri) {
        Alert.alert(
          "Download completato",
          `Il file è stato salvato in:\n${result.uri}`
        );
        console.log("Download completato:", result.uri);
        fetchProgress();
      } else {
        Alert.alert("Errore", "Download non riuscito.");
      }
    } catch (error) {
      console.error("Errore durante il download:", error);
      Alert.alert("Errore", "Si è verificato un errore durante il download.");
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  const fetchProgress = async () => {
    const episodesInfo = await FileSystem.getInfoAsync(destinationUri);
    setEsisteEpisodes(episodesInfo.exists);
    console.log("EpisodesInfo:", episodesInfo.exists);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProgress();
    }, [episodeId])
  );

  return (
    <View style={styles.container}>
      <Pressable onPress={downloadFile} disabled={isDownloading}>
        <Progress.Circle
          progress={progress}
          size={100}
          showsText={true}
          formatText={() =>
            isDownloading ? (
              <Feather name="pause" size={24} color="black" />
            ) : esisteEpisodes ? (
              <Feather name="check" size={24} color="black" />
            ) : (
              <Feather name="download-cloud" size={24} color="black" />
            )
          }
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  linkText: {
    marginBottom: 20,
    fontSize: 16,
  },
});

export default About;
