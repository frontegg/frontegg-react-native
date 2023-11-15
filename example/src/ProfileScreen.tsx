import * as React from 'react';

import { StyleSheet, View, Button } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.listenerButton}>
        <Button title={'Test'} onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listenerButton: {
    marginVertical: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
