import * as React from 'react';

import { StyleSheet, View, Text, Button } from 'react-native';
import { login, listener, logout } from '@frontegg/react-native';

export default function App() {
  const [result, setResult] = React.useState<number | undefined>();

  React.useEffect(() => {
    let subs = listener(setResult);

    return () => {
      subs.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Status: {result || 'Not Logged In'}</Text>

      <View style={styles.listenerButton}>
        <Button
          color={result ? '#FF0000' : '#000000'}
          title={result ? 'Logout' : 'Login'}
          onPress={() => {
            result ? logout() : login();
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
