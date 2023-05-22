import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import FronteggWrapper from '../../src/FronteggWrapper';
import MyApp from './MyApp';

export default function App() {
  return (
    <View style={styles.container}>
      <FronteggWrapper
        contextOptions={{
          baseUrl: 'https://auth.davidantoon.me',
          clientId: 'b6adfe4c-d695-4c04-b95f-3ec9fd0c6cca',
        }}
      >
        <MyApp />
      </FronteggWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
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
