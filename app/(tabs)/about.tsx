import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

const about = () => {
  return (
    <View style={styles.container}>
      <Text>Pagina about</Text>
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

export default about