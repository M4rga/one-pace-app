import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Progress from "react-native-progress"; // Importa la libreria per le barre di progresso

interface Episode {
  id: string;
}

interface Arc {
  nepisodes: number;
  dub: string[];
  sub: string[];
  resolution: string[];
  status: string;
  episodes: Record<string, Episode>;
}

interface Saga {
  [arcName: string]: Arc;
}

interface Data {
  [sagaName: string]: Saga;
}

const JSON_URL = "https://raw.githubusercontent.com/M4rga/one-pace-app/main/assets/others/episodes.json";

const ExpandableList: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [expandedSagas, setExpandedSagas] = useState<Record<string, boolean>>({});
  const [expandedArcs, setExpandedArcs] = useState<Record<string, boolean>>({});
  const [episodesState, setEpisodesState] = useState<Record<string, { progress: number; isFinished: boolean }>>({});

  const fetchData = async () => {
    try {
      const response = await fetch(JSON_URL);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error("Errore durante il fetch dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Recupera il progresso salvato per ogni episodio quando il componente si monta
    const loadProgress = async () => {
      const storedState = await AsyncStorage.getItem('episodeProgress');
      if (storedState) {
        setEpisodesState(JSON.parse(storedState));
      }
    };
    loadProgress();
  }, []);

  const toggleSaga = (sagaName: string) => {
    setExpandedSagas((prev) => ({
      ...prev,
      [sagaName]: !prev[sagaName],
    }));
  };

  const toggleArc = (arcName: string) => {
    setExpandedArcs((prev) => ({
      ...prev,
      [arcName]: !prev[arcName],
    }));
  };

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

  const handleLongPress = (episodeId: string) => {
    Alert.alert(
      "Gestisci Episodio",
      "Scegli un'azione:",
      [
        {
          text: "Svuota progresso",
          onPress: () => clearProgress(episodeId),
        },
        {
          text: "Segna come finito",
          onPress: () => markAsFinished(episodeId),
        },
        {
          text: "Annulla",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const clearProgress = async (episodeId: string) => {
    try {
      setEpisodesState((prev) => ({
        ...prev,
        [episodeId]: { progress: 0, isFinished: false },
      }));
      await AsyncStorage.removeItem(`video_position_${episodeId}`);
      updateStoredState();
      console.log(`Progresso dell'episodio ${episodeId} svuotato.`);
    } catch (error) {
      console.error("Errore durante il salvataggio del progresso:", error);
    }
  };

  const markAsFinished = async (episodeId: string) => {
    setEpisodesState((prev) => ({
      ...prev,
      [episodeId]: { progress: 1, isFinished: true },
    }));

    // Rimuovere la posizione salvata quando si segna l'episodio come finito
    try {
      await AsyncStorage.removeItem(`video_position_${episodeId}`);
      updateStoredState();
      console.log(`Episodio ${episodeId} segnato come finito e posizione azzerata.`);
    } catch (error) {
      console.error("Errore durante il reset della posizione:", error);
    }
  };

  const updateStoredState = async () => {
    // Salva lo stato dei progressi aggiornato
    await AsyncStorage.setItem('episodeProgress', JSON.stringify(episodesState));
  };

  const saveVideoProgress = async (episodeId: string, progress: number) => {
    // Salva la posizione del video nel AsyncStorage
    try {
      await AsyncStorage.setItem(`video_position_${episodeId}`, JSON.stringify(progress));
      setEpisodesState((prev) => ({
        ...prev,
        [episodeId]: { ...prev[episodeId], progress },
      }));
      updateStoredState();
    } catch (error) {
      console.error("Errore durante il salvataggio della posizione del video:", error);
    }
  };

  const getVideoProgress = async (episodeId: string) => {
    // Recupera la posizione salvata per un episodio specifico
    try {
      const storedProgress = await AsyncStorage.getItem(`video_position_${episodeId}`);
      return storedProgress ? JSON.parse(storedProgress) : 0;
    } catch (error) {
      console.error("Errore durante il recupero della posizione del video:", error);
      return 0;
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color="black" />
      </View>
    );
  }

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
        data={Object.entries(data)}
        keyExtractor={([sagaName]) => sagaName}
        renderItem={({ item: [sagaName, sagaData] }) => (
          <View>
            {/* Saga */}
            <TouchableOpacity
              style={styles.sagaHeader}
              onPress={() => toggleSaga(sagaName)}
            >
              <Text style={styles.sagaText}>{sagaName}</Text>
            </TouchableOpacity>

            {expandedSagas[sagaName] && (
              <FlatList
                data={Object.entries(sagaData)}
                keyExtractor={([arcName]) => arcName}
                renderItem={({ item: [arcName, arcData] }) => (
                  <View>
                    {/* Arc */}
                    <TouchableOpacity
                      style={[
                        styles.arcHeader,
                        { backgroundColor: getArcStatusColor(arcData.status) },
                      ]}
                      onPress={() => toggleArc(arcName)}
                    >
                      <Text style={styles.arcText}>{arcName}</Text>
                    </TouchableOpacity>

                    {expandedArcs[arcName] && (
                      <FlatList
                        data={Object.entries(arcData.episodes)}
                        keyExtractor={([episodeName]) => episodeName}
                        renderItem={({
                          item: [episodeName, episodeData],
                        }) => (
                          <View style={styles.episodeItem}>
                            <Pressable
                              onPress={() => {
                                router.push({
                                  pathname: "../otherPages/video",
                                  params: { id: episodeData.id },
                                });
                              }}
                              onLongPress={() => handleLongPress(episodeData.id)}
                            >
                              <Text>Episode {episodeData.id}</Text>
                              
                              {episodesState[episodeData.id]?.isFinished ? (
                                <Text style={styles.finishedText}>Completato</Text>
                              ) : (
                                <View style={styles.progressContainer}>
                                  <Text style={styles.progressText}>Progresso:</Text>
                                  <Progress.Bar
                                    progress={episodesState[episodeData.id]?.progress || 0}
                                    width={null}
                                    style={styles.progressBar}
                                    color="green"
                                  />
                                </View>
                              )}
                            </Pressable>
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
  finishedText: {
    fontSize: 12,
    color: "green",
    fontStyle: "italic",
  },
  progressContainer: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
  },
});

export default ExpandableList;
