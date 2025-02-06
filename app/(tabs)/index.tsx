import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Progress from "react-native-progress";
import Feather from "@expo/vector-icons/Feather";
import * as FileSystem from "expo-file-system"; // Nuova importazione necessaria

// define the types for the JSON
interface Data {
  [sagaName: string]: Saga;
}
interface Saga {
  [arcName: string]: Arc;
}
interface Arc {
  nepisodes: number;
  dub: string[];
  sub: string[];
  resolution: string[];
  status: string;
  episodes: Record<string, Episode>;
}
interface Episode {
  id: string;
}

const EpisodeProgress: React.FC<{ episodeId: string; refreshKey?: number }> = ({
  episodeId,
  refreshKey,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // useFocusEffect to fetch the progress from AsyncStorage every time the user is on the episode list
  useFocusEffect(
    React.useCallback(() => {
      const fetchProgress = async () => {
        try {
          const stored = await AsyncStorage.getItem(`progress_${episodeId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            setProgress(parsed);
          } else {
            setProgress(0);
          }
        } catch (error) {
          console.error("Error fetching progress", error);
        }
      };
      fetchProgress();
      console.log("Fetching progress for episode", episodeId);
    }, [episodeId, refreshKey])
  );

  // return the progress bar with the progress saved in AsyncStorage
  return (
    <View
      style={{ flex: 1, paddingTop: 5 }}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
      }}
    >
      <Progress.Bar progress={progress / 100} width={containerWidth} />
    </View>
  );
};

// download button component that downloads the episode and saves it in the FileSystem and AsyncStorage
const DownloadButton: React.FC<{
  episodeId: string;
  isDownloaded: boolean;
}> = ({ episodeId, isDownloaded }) => {
  const [progress, setProgress] = useState(isDownloaded ? 1 : 0);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(isDownloaded);

  const handleDownload = async () => {
    try {
      console.log("Downloading...");
      const downloadUrl = `https://pixeldrain.com/api/file/${episodeId}?download`;
      const directoryUri = FileSystem.documentDirectory + "downloaded_episodes";
      await FileSystem.makeDirectoryAsync(directoryUri, {
        intermediates: true,
      });
      // prettier-ignore
      const fileUri = FileSystem.documentDirectory + `downloaded_episodes/${episodeId}`;
      const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
        const progressRatio =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        setProgress(progressRatio);
      };

      setDownloading(true);
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        fileUri,
        {},
        callback
      );
      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        // gets the list of downloaded episodes from AsyncStorage
        const storedData = await AsyncStorage.getItem("downloaded_episodes");
        let downloadedEpisodes: string[] = storedData
          ? JSON.parse(storedData)
          : [];

        // if the episode is not in the list, add it
        if (!downloadedEpisodes.includes(episodeId)) {
          downloadedEpisodes.push(episodeId);
          await AsyncStorage.setItem(
            "downloaded_episodes",
            JSON.stringify(downloadedEpisodes)
          );
        }

        setDownloaded(true);
        console.log("Download completato:", result.uri);
      } else {
        console.warn("Download interrotto o non riuscito");
      }
    } catch (error) {
      console.error("Download fallito:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    // return the download button with the progress bar
    <Pressable onPress={handleDownload} disabled={downloading || downloaded}>
      <Progress.Circle
        progress={downloading || downloaded ? progress : 0}
        size={40}
        showsText={true}
        formatText={() =>
          downloading ? (
            <Feather name="pause" size={20} />
          ) : downloaded ? (
            <Feather name="check" size={20} />
          ) : (
            <Feather name="download-cloud" size={20} />
          )
        }
      />
    </Pressable>
  );
};

const JSON_URL =
  "https://raw.githubusercontent.com/M4rga/one-pace-app/main/assets/others/episodes.json";

const index: React.FC = () => {
  const [data, setData] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  // prettier-ignore
  const [expandedSagas, setExpandedSagas] = React.useState<Record<string, boolean>>({});
  // prettier-ignore
  const [expandedArcs, setExpandedArcs] = React.useState<Record<string, boolean>>({});
  const [downloadedEpisodes, setDownloadedEpisodes] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0); // <-- Stato aggiunto per forzare il refresh

  // function to handle the long press on an episode
  const handleEpisodeLongPress = (episodeId: string) => {
    Alert.alert("Episode options", "Select an option:", [
      {
        text: "Set as Watched",
        onPress: async () => {
          try {
            await AsyncStorage.setItem(
              `progress_${episodeId}`,
              JSON.stringify(100)
            );
            setRefreshKey((prev) => prev + 1);
          } catch (error) {
            console.error("Error setting as watched:", error);
          }
        },
      },
      {
        text: "Clear Progress",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(`progress_${episodeId}`);
            setRefreshKey((prev) => prev + 1);
          } catch (error) {
            console.error("Error clearing progress:", error);
          }
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  // useEffect to fetch the JSON data and the downloaded episodes from AsyncStorage
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(JSON_URL);
        const json = await response.json();
        setData(json);
        // gets the list of downloaded episodes from AsyncStorage
        const storedData = await AsyncStorage.getItem("downloaded_episodes");
        const downloaded: string[] = storedData ? JSON.parse(storedData) : [];
        setDownloadedEpisodes(downloaded);
      } catch (error) {
        console.error("Error on loading the json:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // when the user clicks on a saga, toggle the visibility of its arcs
  const toggleSaga = (sagaName: string) => {
    setExpandedSagas((prev) => ({
      ...prev,
      [sagaName]: !prev[sagaName],
    }));
  };

  // when the user clicks on an arc, toggle the visibility of its episodes
  const toggleArc = (arcName: string) => {
    setExpandedArcs((prev) => ({
      ...prev,
      [arcName]: !prev[arcName],
    }));
  };

  // function to get the color of the arc status
  const getArcStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "#28a745";
      case "to be redone":
        return "#ffc107";
      case "work in progress":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  // if the data is still loading, show a loading spinner
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color="black" />
      </View>
    );
  }

  // if the data couldn't be loaded, show an error message
  if (!data) {
    return (
      <View style={styles.container}>
        <Text>Error loading data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={{ width: "100%" }}
        // gets the sagas from the data object
        data={Object.entries(data)}
        // the key is the saga name
        keyExtractor={([sagaName]) => sagaName}
        // for each saga name
        renderItem={({ item: [sagaName, sagaData] }) => (
          <View>
            {/* Saga */}
            <Pressable
              style={styles.sagaHeader}
              onPress={() => toggleSaga(sagaName)}
            >
              <Text style={styles.sagaText}>{sagaName}</Text>
            </Pressable>

            {/* if the saga is expanded, show its arcs */}
            {expandedSagas[sagaName] && (
              <FlatList
                // gets the arcs from the saga data
                data={Object.entries(sagaData)}
                // the key is the arc name
                keyExtractor={([arcName]) => arcName}
                // for each arc name
                renderItem={({ item: [arcName, arcData] }) => (
                  <View>
                    {/* Arc */}
                    <Pressable
                      style={[
                        styles.arcHeader,
                        { backgroundColor: getArcStatusColor(arcData.status) },
                      ]}
                      onPress={() => toggleArc(arcName)}
                    >
                      <Text style={styles.arcText}>{arcName}</Text>
                    </Pressable>

                    {/* if the arc is expanded, show its episodes */}
                    {expandedArcs[arcName] && (
                      <FlatList
                        // gets the episodes from the arc data
                        data={Object.entries(arcData.episodes)}
                        // the key is the episode name
                        keyExtractor={([episodeName]) => episodeName}
                        // for each episode name
                        renderItem={({ item: [episodeName, episodeData] }) => (
                          // Episode
                          <View style={styles.episodeItem}>
                            {/* left side of the episode */}
                            <Pressable
                              style={{ flex: 1, paddingRight: 10 }}
                              onPress={() => {
                                router.push({
                                  pathname: "../otherPages/video",
                                  params: { id: episodeData.id },
                                });
                              }}
                              onLongPress={() =>
                                handleEpisodeLongPress(episodeData.id)
                              }
                            >
                              {/* gets only the numbers of the episode name */}
                              <Text>
                                Episode {episodeName.replace(/\D/g, "")}
                              </Text>
                              {/* shows the progress bar */}
                              <EpisodeProgress
                                episodeId={episodeData.id}
                                refreshKey={refreshKey}
                              />
                            </Pressable>
                            {/* right side of the episode */}
                            <DownloadButton
                              episodeId={episodeData.id}
                              isDownloaded={downloadedEpisodes.includes(
                                episodeData.id
                              )}
                            />
                          </View>
                        )}
                      />
                    )}
                  </View>
                )}
              />
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center", // <-- Aggiunto per centrare la pagina
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sagaHeader: {
    padding: 15,
    backgroundColor: "#007bff",
    borderRadius: 5,
    marginBottom: 5,
  },
  sagaText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "bold",
  },
  arcHeader: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    marginLeft: 15,
  },
  arcText: {
    fontSize: 16,
    color: "#ffffff",
  },
  episodeItem: {
    padding: 10,
    backgroundColor: "#e9ecef",
    marginLeft: 30,
    marginBottom: 5,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    color: "#555",
    marginTop: 5,
  },
});

export default index;
