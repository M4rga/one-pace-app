import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  Pressable,
} from "react-native";
import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Componente aggiunto per mostrare il progresso dell'episodio
const EpisodeProgress: React.FC<{ episodeId: string }> = ({ episodeId }) => {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const stored = await AsyncStorage.getItem(`progress_${episodeId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setProgress(parsed);
        }
      } catch (error) {
        console.error("Error fetching progress", error);
      }
    };
    fetchProgress();
  }, [episodeId]);

  return (
    <Text style={styles.progressText}>Progress: {progress.toFixed(2)}%</Text>
  );
};

const JSON_URL =
  "https://raw.githubusercontent.com/M4rga/one-pace-app/main/assets/others/episodes.json";

const index: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  // prettier-ignore
  const [expandedSagas, setExpandedSagas] = useState<Record<string, boolean>>({});
  const [expandedArcs, setExpandedArcs] = useState<Record<string, boolean>>({});

  // useEffect to fetch data from the online JSON file
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(JSON_URL);
        const json = await response.json();
        setData(json);
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
                            <Link
                              href={{
                                pathname: "../otherPages/video",
                                params: { id: episodeData.id },
                              }}
                            >
                              {/* gets only the numbers of the episode name */}
                              <Text>
                                Episode {episodeName.replace(/\D/g, "")}
                              </Text>
                            </Link>
                            {/* Visualizza il progresso salvato */}
                            <EpisodeProgress episodeId={episodeData.id} />
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
  },
  progressText: {
    fontSize: 12,
    color: "#555",
    marginTop: 5,
  },
});

export default index;
