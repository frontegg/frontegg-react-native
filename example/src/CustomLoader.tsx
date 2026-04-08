import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CustomLoader = () => (
  <View style={styles.loaderContainer}>
    <Text style={styles.loaderText}>Custom Loading...</Text>
  </View>
);

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 18,
    color: '#000',
  },
});

export default CustomLoader;
