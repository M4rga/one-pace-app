import { Tabs } from "expo-router";
import React from "react";
import { View, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";

function CustomHeader() {
  return (
    <View>
      <SafeAreaView style={{ backgroundColor: "transparent" }} />
      <StatusBar backgroundColor="transparent" translucent />
    </View>
  );
}

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        header: () => <CustomHeader />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Episodes",
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
