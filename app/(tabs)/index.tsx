import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import React from "react";

const index = () => {
  return (
    <View style={styles.container}>
      <Link href="/otherPages/settings">
        <Text>Apri Modal</Text>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "red",
  },
});

export default index;
