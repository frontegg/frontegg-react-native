import * as React from 'react';

import { StyleSheet, View, Text, Button } from 'react-native';
import { login, listener, logout } from '@frontegg/react-native';
import type { IUserProfile } from '@frontegg/rest-api';

interface FronteggRNState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUserProfile | null;
  initializing: boolean;
  showLoader: boolean;
}

export default function HomeScreen() {
  const [result, setResult] = React.useState<FronteggRNState>({
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    user: null,
    initializing: true,
    showLoader: true,
  });

  React.useEffect(() => {
    let subs = listener((s: any) => {
      try {
        setResult(s);
      } catch (e) {
        console.error('error', e);
      }
    });

    return () => {
      subs.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>showLoader: {result.showLoader ? 'true' : 'false'}</Text>
      <Text>initializing: {result.initializing ? 'true' : 'false'}</Text>
      <Text>isLoading: {result.isLoading ? 'true' : 'false'}</Text>
      <Text>isAuthenticated: {result.isAuthenticated ? 'true' : 'false'}</Text>
      <Text>refreshToken: {result.refreshToken}</Text>
      <Text>
        accessToken:{' '}
        {result.accessToken
          ? result.accessToken.substring(result.accessToken.length - 40)
          : ''}
      </Text>
      <Text>user: {result.user ? result.user.email : 'Not Logged in'}</Text>

      <View style={styles.listenerButton}>
        <Button
          color={result.isAuthenticated ? '#FF0000' : '#000000'}
          title={result.isAuthenticated ? 'Logout' : 'Login'}
          onPress={() => {
            result.isAuthenticated ? logout() : login();
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
