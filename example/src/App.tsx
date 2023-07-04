import * as React from 'react';

import { StyleSheet, View, Text, Button } from 'react-native';
import { login, listener } from '@frontegg/react-native';

export default function App() {
  const [result, setResult] = React.useState<number | undefined>();

  React.useEffect(() => {
    // multiply(3, 7);
  }, []);

  return (
    <View style={styles.container}>
      <Text
        onPress={() => {
          login();
        }}
      >
        Login: {result}
      </Text>

      <View style={styles.listenerButton}>
        <Button
          title={'Listen'}
          onPress={() => {
            listener();
          }}
        />
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
