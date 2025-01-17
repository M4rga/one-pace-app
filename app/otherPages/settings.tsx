import React, { useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";

const Settings = () => {
  const [switchStates, setSwitchStates] = useState<{ [key: string]: boolean }>({});

  const toggleSwitch = (id: string) => {
    setSwitchStates((prevStates) => ({
      ...prevStates,
      [id]: !prevStates[id],
    }));
  };

  const getSwitchValue = (id: string) => switchStates[id] || false;

  return (
    <View style={styles.container}>
      {/* Switch 1 */}
      <View style={styles.settingRow}>
        <Text style={styles.label}>Enable Feature 1</Text>
        <Switch
          trackColor={{ false: "#e9e9ea", true: "#34c759" }}
          thumbColor={"white"}
          ios_backgroundColor="#e9e9ea"
          onValueChange={() => toggleSwitch("feature1")}
          value={getSwitchValue("feature1")}
        />
      </View>

      {/* Switch 2 */}
      <View style={styles.settingRowDark}>
        <Text style={styles.labelDark}>Enable Feature 2</Text>
        <Switch
          trackColor={{ false: "#39393d", true: "#30d158" }}
          thumbColor={"white"}
          ios_backgroundColor="#39393d"
          onValueChange={() => toggleSwitch("feature2")}
          value={getSwitchValue("feature2")}
        />
      </View>

      {/* Switch 3 */}
      <View style={styles.settingRow}>
        <Text style={styles.label}>Enable Feature 3</Text>
        <Switch
          trackColor={{ false: "#e9e9ea", true: "#34c759" }}
          thumbColor={"white"}
          ios_backgroundColor="#e9e9ea"
          onValueChange={() => toggleSwitch("feature3")}
          value={getSwitchValue("feature3")}
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
