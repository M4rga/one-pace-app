import { Link } from 'expo-router';
import { View, StyleSheet } from 'react-native';

const index = () => {
  return (
    <View style={styles.container}>
      <Link href={{pathname: '../otherPages/video', params: { id: '1' }}}> Episode 1 </Link>
      <Link href={{pathname: '../otherPages/video', params: { id: '2' }}}> Episode 2 </Link>
      <Link href={{pathname: '../otherPages/video', params: { id: '3' }}}> Episode 3 </Link>
      <Link href={{pathname: '../otherPages/video', params: { id: '4' }}}> Episode 4 </Link>
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
