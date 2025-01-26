import React, { useState, useEffect } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Settings = () => {
  // prettier-ignore
  const [switchStates, setSwitchStates] = useState<{ [key: string]: boolean }>({});

  // useEffect to set the switch states on AsyncStorage
  useEffect(() => {
    const loadSwitchStates = async () => {
      try {
        const savedStates = await AsyncStorage.getItem("switchStates");
        // saves to savedStates every switchState
        if (savedStates) {
          setSwitchStates(JSON.parse(savedStates)); // Imposta lo stato salvato
        }
      } catch (error) {
        console.error("Error on loading states:", error);
      }
    };

    loadSwitchStates();
  }, []);

  // sets the switchStates on AsyncStorage
  const saveSwitchStates = async (states: { [key: string]: boolean }) => {
    try {
      await AsyncStorage.setItem("switchStates", JSON.stringify(states));
    } catch (error) {
      console.error("Error on saving the states:", error);
    }
  };

  // dynamic function to create new switch states
  const toggleSwitch = (id: string) => {
    setSwitchStates((prevStates) => {
      const updatedStates = {
        ...prevStates,
        [id]: !prevStates[id],
      };
      saveSwitchStates(updatedStates); // saves the new switch state
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
  label: {
    fontSize: 16,
    color: "#000",
    fontWeight: "400",
  },
});

export default Settings;
