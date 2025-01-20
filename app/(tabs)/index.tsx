import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';

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
  const [episodeData, setEpisodeData] = useState<EpisodeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `https://raw.githubusercontent.com/M4rga/one-pace-app/main/assets/others/episodes.json?timestamp=${new Date().getTime()}`;
        const response = await fetch(url);
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
