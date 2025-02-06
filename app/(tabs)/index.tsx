import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  Pressable,
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

// episode progress component that shows the progress of the single episode saved in AsyncStorage every time the user goes back to the episode list
const EpisodeProgress: React.FC<{ episodeId: string }> = ({ episodeId }) => {
  const [progress, setProgress] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [episodeExists, setEpisodeExists] = useState<boolean>(false);

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
    }, [episodeId])
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
// Aggiunta la prop isDownloaded per far sapere al componente se l'episodio risulta già scaricato
const DownloadButton: React.FC<{
  episodeId: string;
  isDownloaded: boolean;
}> = ({ episodeId, isDownloaded }) => {
  const [progress, setProgress] = useState(isDownloaded ? 1 : 0);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(isDownloaded);

  const handleDownload = async () => {
    try {
      console.log("Download in corso...");
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
        // Recupera la lista di episodi scaricati da AsyncStorage
        const storedData = await AsyncStorage.getItem("downloaded_episodes");
        let downloadedEpisodes: string[] = storedData
          ? JSON.parse(storedData)
          : [];

        // Se l'episodio non è già nella lista, lo aggiunge
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
  // State per gestire le saghe e gli archi espansi
  // prettier-ignore
  const [expandedSagas, setExpandedSagas] = React.useState<Record<string, boolean>>({});
  // prettier-ignore
  const [expandedArcs, setExpandedArcs] = React.useState<Record<string, boolean>>({});
  // Nuovo state per memorizzare gli id degli episodi scaricati (letti da AsyncStorage)
  const [downloadedEpisodes, setDownloadedEpisodes] = useState<string[]>([]);

  // useEffect per fare il fetch del JSON e leggere gli episodi scaricati
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(JSON_URL);
        const json = await response.json();
        setData(json);
        // Legge la lista degli episodi scaricati da AsyncStorage
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
                            >
                              {/* gets only the numbers of the episode name */}
                              <Text>
                                Episode {episodeName.replace(/\D/g, "")}
                              </Text>
                              {/* shows the progress bar */}
                              <EpisodeProgress episodeId={episodeData.id} />
                            </Pressable>
                            {/* right side of the episode: bottone download con percentuale */}
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
