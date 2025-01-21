import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity
} from "react-native";
import { Link } from "expo-router"; // Importa Link da expo-router

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
  const [expandedSagas, setExpandedSagas] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedArcs, setExpandedArcs] = useState<Record<string, boolean>>(
    {}
  );

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
                            <Link
                              href={{
                                pathname: "../otherPages/video",
                                params: { id: episodeData.id },
                              }}
                            >
                              Episode {episodeData.id}
                            </Link>
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
});

export default ExpandableList;
