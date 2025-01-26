import { Tabs, Link } from "expo-router";
import React from "react";
import Feather from "@expo/vector-icons/Feather";

const TabLayout = () => {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Episodes",
          headerRight: () => (
            <Link
              href={"/otherPages/settings"}
              style={{ marginHorizontal: 15 }}
            >
              <Feather name="settings" size={24} color="black" />
            </Link>
          ),
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
