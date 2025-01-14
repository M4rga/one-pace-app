import { View, Text, StyleSheet } from "react-native";
import React from 'react'
import { useLocalSearchParams } from "expo-router";

const video = () => {
  const params = useLocalSearchParams();
  const { id = 42, other } = params;
  return (
    <View style={styles.container}>
      <Text>
        Qui andrà l'episodio: {id}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: "center",
    justifyContent: "center",
  },
});

export default video