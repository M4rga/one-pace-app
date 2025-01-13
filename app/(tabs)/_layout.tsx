import { Tabs } from "expo-router";
import React from "react";

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tab One",
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Tab Two",
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
