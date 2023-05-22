import React, { useCallback, useEffect } from 'react';
import type { FC } from 'react';
import { ReactNativeView } from '@frontegg/react-native';
import { Button, Image, StyleSheet, Text, View } from 'react-native';
import { useAuth, useAuthActions } from '@frontegg/react-hooks';
import { DUMMY_EMAIL, DUMMY_PASSWORD } from '@env';

const MyApp: FC = () => {
  const { user, isLoading, isAuthenticated, loginState } = useAuth();
  const { logout, login, setState } = useAuthActions();

  console.log(process.env.DUMMY_EMAIL);
  useEffect(() => {
    // console.log(loginState);
  }, [loginState]);
  const loginWithUser = useCallback(() => {
    login({
      email: DUMMY_EMAIL ?? 'email',
      password: DUMMY_PASSWORD ?? 'pass',
      callback: (_, error) => {
        error && console.error((error as any as Error).stack);

        setState({ isLoading: false, isAuthenticated: true });
      },
    });
  }, [login, setState]);

  // console.log(JSON.stringify(user, null, 2));
  return (
    <>
      {isAuthenticated && user ? (
        <Image
          style={styles.box}
          source={{ uri: user.profilePictureUrl ?? '' }}
        />
      ) : (
        <ReactNativeView color="#32a852" style={styles.box} />
      )}
      <Text>Email: {user?.email ?? 'Unauthenticated'}</Text>
      <Text>Loading: {isLoading ? 'true' : 'false'}</Text>

      <View style={styles.button}>
        <Button color={'#2656bb'} title={'Login'} onPress={loginWithUser} />
      </View>
      <View style={styles.button}>
        <Button color={'#bb262b'} title={'Logout'} onPress={() => logout()} />
      </View>
    </>
  );
};

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
  button: {
    marginTop: 20,
  },
});

export default MyApp;
