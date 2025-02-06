import { View, Text, Pressable } from "react-native";
import React, { useState } from "react";
import * as FileSystem from "expo-file-system";

const Prova = () => {
  const [esisteManifest, setEsisteManifest] = useState<boolean>(false);
  const [esisteEpisodes, setEsisteEpisodes] = useState<boolean>(false);
  const [esisteAsyncStorage, setEsisteAsyncStorage] = useState<boolean>(false);

  const listFilesInDirectory = async () => {
    try {
      const baseDirectory = FileSystem.documentDirectory ?? "";
      const directoryUri1 = baseDirectory;
      const directoryUri2 = baseDirectory + "downloaded_episodes/";
      const directoryUri3 = baseDirectory + "RCTAsyncLocalStorage/";
      const manifestUri = baseDirectory + "RCTAsyncLocalStorage/manifest.json";

      // Controllo se la cartella "downloaded_episodes" esiste
      const episodesInfo = await FileSystem.getInfoAsync(directoryUri2);
      setEsisteEpisodes(episodesInfo.exists);
      console.log("EpisodesInfo:", esisteEpisodes);

      // Controllo se la cartella "RCTAsyncLocalStorage" esiste
      const asyncStorageInfo = await FileSystem.getInfoAsync(directoryUri3);
      setEsisteAsyncStorage(asyncStorageInfo.exists);

      // Controllo se il file manifest.json esiste
      const manifestInfo = await FileSystem.getInfoAsync(manifestUri);
      setEsisteManifest(manifestInfo.exists);

      // Lettura della directory principale
      const files1 = await FileSystem.readDirectoryAsync(directoryUri1);
      console.log("Directory principale:", files1);
      console.log("");

      // Se la cartella "downloaded_episodes" esiste, stampa i file al suo interno
      if (episodesInfo.exists) {
        const files2 = await FileSystem.readDirectoryAsync(directoryUri2);
        console.log("Episodi scaricati:", files2);
        console.log("");
      }

      // Se la cartella "RCTAsyncLocalStorage" esiste, stampa i file al suo interno
      if (asyncStorageInfo.exists) {
        const files3 = await FileSystem.readDirectoryAsync(directoryUri3);
        console.log("Async storage:", files3);
        console.log("");
      }

      // Se il file manifest.json esiste, leggilo e stampalo
      if (manifestInfo.exists) {
        const fileContent = await FileSystem.readAsStringAsync(manifestUri);
        const jsonData = JSON.parse(fileContent);
        console.log("Testo del manifest:", jsonData);
        console.log("");
      }
    } catch (error) {
      console.error("Errore durante la lettura della directory:", error);
    }
  };

  const clearDirectory = async () => {
    try {
      const baseDirectory = FileSystem.documentDirectory ?? "";

      // Leggi i file nella directory principale
      const files = await FileSystem.readDirectoryAsync(baseDirectory);

      for (const file of files) {
        const fileUri = baseDirectory + file;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.isDirectory) {
          // Cancellazione ricorsiva della cartella
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } else {
          // Cancellazione del file
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        }
      }

      console.log("Directory svuotata con successo!");
    } catch (error) {
      console.error("Errore durante lo svuotamento della directory:", error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Pressable
        onPress={listFilesInDirectory}
        style={{ padding: 20, backgroundColor: "#ddd", marginBottom: 10 }}
      >
        <Text>Lista file</Text>
      </Pressable>
      <Pressable
        onPress={clearDirectory}
        style={{ padding: 20, backgroundColor: "#f88" }}
      >
        <Text>Svuota cartella</Text>
      </Pressable>
    </View>
  );
};

export default Prova;
