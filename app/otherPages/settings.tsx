import React, { useState, useEffect } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Settings = () => {
  const [switchStates, setSwitchStates] = useState<{ [key: string]: boolean }>({});

  // Leggi lo stato salvato da AsyncStorage al caricamento del componente
  useEffect(() => {
    const loadSwitchStates = async () => {
      try {
        const savedStates = await AsyncStorage.getItem("switchStates");
        if (savedStates) {
          setSwitchStates(JSON.parse(savedStates)); // Imposta lo stato salvato
        }
      } catch (error) {
        console.error("Errore durante il caricamento degli stati:", error);
      }
    };

    loadSwitchStates();
  }, []);

  // Salva lo stato aggiornato in AsyncStorage
  const saveSwitchStates = async (states: { [key: string]: boolean }) => {
    try {
      await AsyncStorage.setItem("switchStates", JSON.stringify(states));
    } catch (error) {
      console.error("Errore durante il salvataggio degli stati:", error);
    }
  };

  // Gestione dello switch
  const toggleSwitch = (id: string) => {
    setSwitchStates((prevStates) => {
      const updatedStates = {
        ...prevStates,
        [id]: !prevStates[id],
      };
      saveSwitchStates(updatedStates); // Salva il nuovo stato
      return updatedStates;
    });
  };

  const getSwitchValue = (id: string) => switchStates[id] || false;

  return (
    <View style={styles.container}>
      {/* Switch 1 */}
      <View style={styles.settingRow}>
        <Text style={styles.label}>Play on silent mode</Text>
        <Switch
          trackColor={{ false: "#e9e9ea", true: "#34c759" }}
          thumbColor={"white"}
          ios_backgroundColor="#e9e9ea"
          onValueChange={() => toggleSwitch("silentmode")}
          value={getSwitchValue("silentmode")}
        />
      </View>

      {/* Switch 2 */}
      <View style={styles.settingRowDark}>
        <Text style={styles.labelDark}>Hide notificaions</Text>
        <Switch
          trackColor={{ false: "#39393d", true: "#30d158" }}
          thumbColor={"white"}
          ios_backgroundColor="#39393d"
          onValueChange={() => toggleSwitch("hidenotification")}
          value={getSwitchValue("hidenotification")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRowDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#1c1c1e",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    color: "#000",
    fontWeight: "400",
  },
  labelDark: {
    fontSize: 16,
    color: "white",
    fontWeight: "400",
  },
});

export default Settings;
