import { View, Text } from "react-native";
import { Link } from "expo-router";
import React from "react";

const index = () => {
  return (
    <View style={{ marginTop: 100 }}>
      <Link href="/(tabs)">
        <Text>Website + barca</Text>
      </Link>
    </View>
  );
};

export default index;
