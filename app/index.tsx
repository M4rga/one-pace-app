import React from "react";
import { StyleSheet, ImageBackground, Image } from "react-native";
import { Link } from "expo-router";

const index = () => {
  return (
    <ImageBackground
      source={require("../assets/images/goingMerry.png")}
      style={{ flex: 1 }}
    >
      <Image
        source={require("../assets/images/title.png")}
        style={styles.scritta}
      />
      <Link href={"/(tabs)"} replace style={styles.link}></Link>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  scritta: {
    resizeMode: "contain",
    width: "80%",
    position: "absolute",
    left: "10%",
    bottom: "25%",
  },
  link: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});

export default index;
