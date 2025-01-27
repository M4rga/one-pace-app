import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Progress from "react-native-progress";
import { useLocalSearchParams, router } from "expo-router";

// Define the types for the JSON
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

const JSON_URL =
  "https://raw.githubusercontent.com/M4rga/one-pace-app/main/assets/others/episodes.json";

const index: React.FC = () => {
  const params = useLocalSearchParams();
  const { prevId = null } = params;
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  // prettier-ignore
  const [expandedSagas, setExpandedSagas] = useState<Record<string, boolean>>({});
  const [expandedArcs, setExpandedArcs] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});

  // useEffect to fetch data from async
  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch the JSON data
        const response = await fetch(JSON_URL);
        const json = await response.json();
        setData(json);

        // fetch progress for all episodes
        const keys = (await AsyncStorage.getAllKeys()).filter((key) =>
          key.startsWith("progress_")
        );
        const progressData = await AsyncStorage.multiGet(keys);
        const parsedProgress: Record<string, number> = {};
        progressData.forEach(([key, value]) => {
          if (value) {
            parsedProgress[key] = JSON.parse(value);
          }
        });
        setProgress(parsedProgress);
      } catch (error) {
        console.error("Error on loading the json:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (prevId) {
      const loadProgressForPrevEpisode = async () => {
        try {
          // Crea la chiave dell'episodio
          const progressKey = `progress_${prevId}`;

          // Recupera il progresso dell'episodio specifico
          const storedProgress = await AsyncStorage.getItem(progressKey);

          if (storedProgress) {
            // Se il progresso esiste, aggiorna lo stato del progresso
            const parsedProgress = JSON.parse(storedProgress);
            setProgress((prevProgress) => ({
              ...prevProgress,
              [progressKey]: parsedProgress,
            }));
          }
        } catch (error) {
          console.error("Error loading progress for episode:", error);
        }
      };

      loadProgressForPrevEpisode();
    }
  }, [prevId]);

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
                          <Pressable
                            style={styles.episodeItem}
                            onPress={() => {
                              router.replace({
                                pathname: "../otherPages/video",
                                params: { id: episodeData.id }, // Usa query invece di params
                              });
                            }}
                          >
                            <Text>
                              {/* gets only the numbers of the episode name */}
                              Episode {episodeName.replace(/\D/g, "")}
                              <Progress.Bar
                                progress={
                                  // prettier-ignore
                                  progress[`progress_${episodeData.id}`] / 2000000 || 0
                                }
                                width={200}
                              />
                            </Text>
                          </Pressable>
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
  },
});

export default index;
