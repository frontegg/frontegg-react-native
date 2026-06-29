import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import FronteggButton from './components/FronteggButton';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.listenerButton}>
          <FronteggButton
            testID="profileTestButton"
            variant="primary"
            title="Test"
            onPress={() => {}}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  listenerButton: {
    marginVertical: 4,
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    backgroundColor: '#F9FAFC',
    padding: 24,
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
