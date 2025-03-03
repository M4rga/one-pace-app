import React, { useState, useImperativeHandle } from "react";
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
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";

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
// prettier-ignore
const DownloadButton = React.forwardRef<
  { stopDownload: () => Promise<void> },
  {
    episodeId: string;
    isDownloaded: boolean;
    onDownloadComplete?: () => void;
    onStatusChange?: (
      episodeId: string,
      status: "idle" | "downloading" | "paused" | "downloaded"
    ) => void;
    externalProgress?: number;
  }
>(({ episodeId, isDownloaded, onDownloadComplete, onStatusChange, externalProgress }, ref) => {
  const [progress, setProgress] = useState(isDownloaded ? 1 : 0);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(isDownloaded);
  const [paused, setPaused] = useState(false);
  // prettier-ignore
  const downloadResumableRef = React.useRef<FileSystem.DownloadResumable | null>(null);

  React.useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
    }
  }, [externalProgress]);

  React.useEffect(() => {
    if (externalProgress === 0) {
      setDownloading(false);
      setPaused(false);
      setDownloaded(false);
    }
  }, [externalProgress]);

  // reset the download status if the episode is already downloaded
  React.useEffect(() => {
    if (!isDownloaded) {
      setDownloaded(false);
      setDownloading(false);
      setProgress(0);
    }
  }, [isDownloaded]);

  const handleDownload = async () => {
    if (downloaded) return;

    // if the download is in progress, pause it
    if (downloading) {
      if (downloadResumableRef.current) {
        try {
          await downloadResumableRef.current.pauseAsync();
          setPaused(true);
          if (onStatusChange) { onStatusChange(episodeId, "paused"); }
          setDownloading(false);
        } catch (error) {
          console.error("Failed to pause download:", error);
        }
      }
      return;
    }

    // if the download is paused, resume it
    if (paused) {
      if (downloadResumableRef.current) {
        try {
          setDownloading(true);
          if (onStatusChange) { onStatusChange(episodeId, "downloading"); }
          setPaused(false);
          const result = await downloadResumableRef.current.resumeAsync();
          if (result && result.uri) {
            const storedData = await AsyncStorage.getItem("downloaded_episodes");
            let downloadedEpisodes: string[] = storedData ? JSON.parse(storedData) : [];
            if (!downloadedEpisodes.includes(episodeId)) {
              downloadedEpisodes.push(episodeId);
              await AsyncStorage.setItem("downloaded_episodes", JSON.stringify(downloadedEpisodes));
            }
            setDownloaded(true);
            console.log("Download completed");
            if (onDownloadComplete) { onDownloadComplete(); }
            if (onStatusChange) { onStatusChange(episodeId, "downloaded"); }
          }
        } catch (error) {
          console.error("Failed to resume download:", error);
        } finally {
          setDownloading(false);
        }
      }
      return;
    }

    // if the download is not started, start it
    try {
      console.log("Download started");
      const downloadUrl = `https://pixeldrain.com/api/file/${episodeId}?download`;
      const directoryUri = FileSystem.documentDirectory + "downloaded_episodes";
      await FileSystem.makeDirectoryAsync(directoryUri, {
        intermediates: true,
      });
      // prettier-ignore
      const fileUri = FileSystem.documentDirectory + `downloaded_episodes/${episodeId}.mp4`;
      const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
        const progressRatio =
          downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        setProgress(progressRatio);
      };

      setDownloading(true);
      if (onStatusChange) { onStatusChange(episodeId, "downloading"); }
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        fileUri,
        {},
        callback
      );
      downloadResumableRef.current = downloadResumable;
      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        // gets the list of downloaded episodes from AsyncStorage
        const storedData = await AsyncStorage.getItem("downloaded_episodes");
        let downloadedEpisodes: string[] = storedData ? JSON.parse(storedData) : [];

        // if the episode is not in the list, add it
        if (!downloadedEpisodes.includes(episodeId)) {
          downloadedEpisodes.push(episodeId);
          await AsyncStorage.setItem("downloaded_episodes", JSON.stringify(downloadedEpisodes));
        }

        setDownloaded(true);
        console.log("Download completed");
        if (onDownloadComplete) { onDownloadComplete(); }
        if (onStatusChange) { onStatusChange(episodeId, "downloaded"); }
      }
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  // La funzione stopDownload esposta al parent: se il download è in corso, prima lo mette in pausa, poi resetta lo stato e il progresso
  const stopDownload = async () => {
    if (downloading && downloadResumableRef.current) {
      try {
        await downloadResumableRef.current.pauseAsync();
      } catch (error) {
        console.error("Error pausing download", error);
      }
    }
    setProgress(0);
    setDownloading(false);
    setPaused(false);
    setDownloaded(false);
    if (onStatusChange) {
      onStatusChange(episodeId, "idle");
    }
  };

  useImperativeHandle(ref, () => ({
    stopDownload,
  }));

  return (
    // the button is a progress circle that shows the download progress and it is disabled if the episode is already downloaded
    <Pressable onPress={handleDownload} disabled={downloaded}>
      <Progress.Circle
        progress={downloading || paused || downloaded ? progress : 0}
        size={40}
        showsText={true}
        formatText={() =>
          downloading ? (
            <Feather name="pause" size={20} />
          ) : paused ? (
            <Feather name="play" size={20} />
          ) : downloaded ? (
            <Feather name="check" size={20} />
          ) : (
            <Feather name="download-cloud" size={20} />
          )
        }
      />
    </Pressable>
  );
});

const JSON_URL =
  "https://raw.githubusercontent.com/M4rga/one-pace-app/main/assets/others/episodes.json";
const LOCAL_JSON_PATH = FileSystem.documentDirectory + "episodes.json";

const index: React.FC = () => {
  const [data, setData] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  // prettier-ignore
  const [expandedSagas, setExpandedSagas] = React.useState<Record<string, boolean>>({});
  // prettier-ignore
  const [expandedArcs, setExpandedArcs] = React.useState<Record<string, boolean>>({});
  const [downloadedEpisodes, setDownloadedEpisodes] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [downloadStatuses, setDownloadStatuses] = useState<
    Record<string, "idle" | "downloading" | "paused" | "downloaded">
  >({});
  const [downloadProgresses, setDownloadProgresses] = useState<
    Record<string, number>
  >({});

  // Ref per accedere alle funzioni dei DownloadButton, indicizzate per episodeId
  const downloadButtonRefs = React.useRef<
    Record<string, { stopDownload: () => Promise<void> }>
  >({});

  // function to handle the long press on an episode
  const handleEpisodeLongPress = (episodeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // create the buttons for the alert
    const buttons: {
      text: string;
      onPress: () => void;
      style?: "default" | "cancel" | "destructive";
    }[] = [
      {
        text: "Set as Watched",
        onPress: () => {
          (async () => {
            try {
              await AsyncStorage.setItem(
                `progress_${episodeId}`,
                JSON.stringify(100)
              );
              setRefreshKey((prev) => prev + 1);
            } catch (error) {
              console.error("Error setting as watched:", error);
            }
          })();
        },
      },
      {
        text: "Clear Progress",
        onPress: () => {
          (async () => {
            try {
              await AsyncStorage.removeItem(`progress_${episodeId}`);
              setRefreshKey((prev) => prev + 1);
            } catch (error) {
              console.error("Error clearing progress:", error);
            }
          })();
        },
      },
    ];

    // add the "Stop Download" button if the episode is downloading or paused
    // prettier-ignore
    if (downloadStatuses[episodeId] === "downloading" || downloadStatuses[episodeId] === "paused") {
      buttons.push({
        text: "Stop Download",
        onPress: () => {
          console.log("Stop download pressed for episode", episodeId);
          const btnRef = downloadButtonRefs.current[episodeId];
          if (btnRef && btnRef.stopDownload) {
            btnRef.stopDownload();
          }
          setDownloadProgresses((prev) => ({ ...prev, [episodeId]: 0 }));
          setDownloadStatuses((prev) => ({ ...prev, [episodeId]: "idle" }));
        },
        style: "destructive",
      });
    }

    // add the "Delete Download" button if the episode is downloaded
    if (downloadedEpisodes.includes(episodeId)) {
      buttons.push({
        text: "Delete Download",
        onPress: () => {
          console.log("Delete download pressed for episode", episodeId);
          (async () => {
            // delete the file from the FileSystem
            const fileUri =
              FileSystem.documentDirectory +
              `downloaded_episodes/${episodeId}.mp4`;
            try {
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
            } catch (error) {
              console.error("Error deleting file:", error);
            }
            // remove the episode from the downloaded episodes list in AsyncStorage
            const storedData = await AsyncStorage.getItem(
              "downloaded_episodes"
            );
            let downloaded: string[] = storedData ? JSON.parse(storedData) : [];
            downloaded = downloaded.filter((id) => id !== episodeId);
            await AsyncStorage.setItem(
              "downloaded_episodes",
              JSON.stringify(downloaded)
            );
            // updates the download circle
            setDownloadProgresses((prev) => ({ ...prev, [episodeId]: 0 }));
            setDownloadedEpisodes(downloaded);
            setDownloadStatuses((prev) => ({ ...prev, [episodeId]: "idle" }));
          })();
        },
        style: "destructive",
      });
    }

    // add the "Cancel" button
    buttons.push({
      text: "Cancel",
      style: "cancel",
      onPress: () => {},
    });

    Alert.alert("Episode options", "", buttons);
  };

  const fetchData = async () => {
    try {
      const response = await fetch(JSON_URL);
      const json = await response.json();
      setData(json);
      // saves the JSON locally
      await FileSystem.writeAsStringAsync(
        LOCAL_JSON_PATH,
        JSON.stringify(json)
      );
      // gets the list of downloaded episodes from AsyncStorage
      const storedData = await AsyncStorage.getItem("downloaded_episodes");
      const downloaded: string[] = storedData ? JSON.parse(storedData) : [];
      setDownloadedEpisodes(downloaded);
    } catch (error) {
      console.error("Error on loading the json:", error);
      // if the JSON couldn't be fetched, try to load it from the local file
      try {
        const fileInfo = await FileSystem.getInfoAsync(LOCAL_JSON_PATH);
        if (fileInfo.exists) {
          const fileContent = await FileSystem.readAsStringAsync(
            LOCAL_JSON_PATH
          );
          const json = JSON.parse(fileContent);
          setData(json);
        } else {
          console.error("Local JSON file not found");
        }
      } catch (localError) {
        console.error("Error loading local JSON file:", localError);
      }
    } finally {
      // gets the list of downloaded episodes from AsyncStorage always
      const storedData = await AsyncStorage.getItem("downloaded_episodes");
      const downloaded: string[] = storedData ? JSON.parse(storedData) : [];
      setDownloadedEpisodes(downloaded);
      setLoading(false);
    }
  };

  // useEffect to fetch the JSON data and the downloaded episodes from AsyncStorage
  React.useEffect(() => {
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
                              ref={(ref) => {
                                if (ref) {
                                  downloadButtonRefs.current[episodeData.id] =
                                    ref;
                                }
                              }}
                              episodeId={episodeData.id}
                              isDownloaded={downloadedEpisodes.includes(
                                episodeData.id
                              )}
                              externalProgress={
                                downloadProgresses[episodeData.id]
                              }
                              onDownloadComplete={fetchData}
                              onStatusChange={(id, status) =>
                                setDownloadStatuses((prev) => ({
                                  ...prev,
                                  [id]: status,
                                }))
                              }
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
    alignItems: "center",
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
