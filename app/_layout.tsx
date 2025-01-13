import { Stack } from "expo-router";
import React from "react";

const RootLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="otherPages/settings"
        options={{ presentation: "modal" }}
      />
    </Stack>
  );
};

export default RootLayout;
