import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';

// Definizione delle interfacce per i dati
interface Episode {
  id: number;
  description: string;
  duration: string;
  releaseDate: string;
}

interface Arc {
  [episodeKey: string]: Episode;
}

interface Saga {
  [arcKey: string]: Arc;
}

interface EpisodeData {
  [sagaKey: string]: Saga;
}

const index = () => {
  // Stato per i dati caricati
  const [episodeData, setEpisodeData] = useState<EpisodeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Caricamento dei dati JSON
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/M4rga/one-pace-app/main/assets/others/episodes.json'); // Sostituisci con l'URL del tuo file JSON
        const data: EpisodeData = await response.json();
        setEpisodeData(data);
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!episodeData) {
    return (
      <View style={styles.container}>
        <Text>Errore nel caricamento dei dati</Text>
      </View>
    );
  }

  // Creazione dinamica dei link per ogni episodio, dichiarando il tipo
  const links: JSX.Element[] = [];
  Object.values(episodeData).forEach((saga: Saga) => {
    Object.values(saga).forEach((arc: Arc) => {
      Object.values(arc).forEach((episode: Episode) => {
        links.push(
          <Link
            key={episode.id}
            href={{ pathname: '../otherPages/video', params: { id: episode.id.toString() } }}
          >
            Episode {episode.id}
          </Link>
        );
      });
    });
  });

  return (
    <View style={styles.container}>
      {links}
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

export default index;
