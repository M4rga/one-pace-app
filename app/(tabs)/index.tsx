import { Link } from 'expo-router';
import { View, StyleSheet } from 'react-native';

const index = () => {
  return (
    <View style={styles.container}>
      <Link href={{pathname: '../otherPages/video', params: { id: '1' }}}> Episodio uno </Link>
      <Link href={{pathname: '../otherPages/video', params: { id: '2' }}}> Episodio due </Link>
      <Link href={{pathname: '../otherPages/video', params: { id: '3' }}}> Episodio tre </Link>
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

export default index
