import * as React from 'react';

import { StyleSheet, View, Text, Button } from 'react-native';
import { useAuth } from '@frontegg/react-native';

export default function HomeScreen() {
  const {
    showLoader,
    initializing,
    isLoading,
    isAuthenticated,
    refreshToken,
    accessToken,
    user,
    logout,
    login,
  } = useAuth();

  return (
    <View style={styles.container}>
      <Text>showLoader: {showLoader ? 'true' : 'false'}</Text>
      <Text>initializing: {initializing ? 'true' : 'false'}</Text>
      <Text>isLoading: {isLoading ? 'true' : 'false'}</Text>
      <Text>isAuthenticated: {isAuthenticated ? 'true' : 'false'}</Text>
      <Text>refreshToken: {refreshToken}</Text>
      <Text>
        accessToken:{' '}
        {accessToken ? accessToken.substring(accessToken.length - 40) : ''}
      </Text>
      <Text>user: {user ? user.email : 'Not Logged in'}</Text>

      <View style={styles.listenerButton}>
        <Button
          color={isAuthenticated ? '#FF0000' : '#000000'}
          title={isAuthenticated ? 'Logout' : 'Login'}
          onPress={() => {
            isAuthenticated ? logout() : login();
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
