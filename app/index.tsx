  import React from "react";
  import { StyleSheet, ImageBackground, Image, View } from "react-native";
  import { Link } from "expo-router";

  const index = () => {
    return (
      <ImageBackground
        source={require("../assets/images/going merry.png")}
        style={{ flex: 1 }}
      >
        <Image 
          source={require("../assets/images/scritta.png")} 
          style={styles.scritta} 
        />
        <Link href={"/(tabs)"} replace style={{position: "absolute", width: "100%", height: "100%"}}></Link>
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
  });

  export default index;
