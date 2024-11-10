import * as React from 'react';

import { StyleSheet, View, Text, Button } from 'react-native';
import {
  switchTenant,
  login,
  logout,
  refreshToken,
  useAuth,
  directLoginAction,
  registerPasskeys,
  loginWithPasskeys,
} from '@frontegg/react-native';
import { useState } from 'react';
import type { ITenantsResponse } from '@frontegg/rest-api';

export default function HomeScreen() {
  const [switching, setSwitching] = useState<string>('');
  const state = useAuth();

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 30, marginBottom: 16 }}>
        React Native Example
      </Text>

      <Text>showLoader: {state.showLoader ? 'true' : 'false'}</Text>
      <Text>initializing: {state.initializing ? 'true' : 'false'}</Text>
      <Text>isLoading: {state.isLoading ? 'true' : 'false'}</Text>
      <Text>isAuthenticated: {state.isAuthenticated ? 'true' : 'false'}</Text>
      <Text>Active Tenant: {state.user?.activeTenant.name}</Text>
      <Text>refreshToken: {state.refreshToken}</Text>
      <Text>
        accessToken:{' '}
        {state.accessToken
          ? state.accessToken.substring(state.accessToken.length - 40)
          : ''}
      </Text>
      <Text>user: {state.user ? state.user.email : 'Not Logged in'}</Text>

      <View style={styles.listenerButton}>
        <Button
          color={state.isAuthenticated ? '#FF0000' : '#000000'}
          title={state.isAuthenticated ? 'Logout' : 'Login'}
          onPress={() => {
            state.isAuthenticated ? logout() : login();
          }}
        />
      </View>

      {state.isAuthenticated ? null : (
        <View style={styles.listenerButton}>
          <Button
            color={'#000000'}
            title={'Login with google'}
            onPress={() => {
              directLoginAction('social-login', 'google');
            }}
          />
        </View>
      )}

      {state.isAuthenticated ? (
        <View style={styles.listenerButton}>
          <Button
            color={'#000000'}
            title={'Register Passkeys'}
            onPress={() => {
              registerPasskeys()
                .then(() => {
                  console.log('Passkeys registered');
                })
                .catch((e) => {
                  console.error(e);
                });
            }}
          />
        </View>
      ) : (
        <View style={styles.listenerButton}>
          <Button
            color={'#000000'}
            title={'Login with Passkeys'}
            onPress={() => {
              loginWithPasskeys()
                .then(() => {
                  console.log('Passkeys login succeeded');
                })
                .catch((e) => {
                  console.error(e);
                });
            }}
          />
        </View>
      )}

      <View style={styles.listenerButton}>
        <Button
          title={'Refresh Token'}
          onPress={() => {
            refreshToken();
          }}
        />
      </View>

      <Text style={styles.tenantsTitle}>Tenants</Text>

      {(state.user?.tenants ?? [])
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
        .map((tenant: ITenantsResponse) => (
          <View key={tenant.tenantId} style={styles.tenantRow}>
            <Button
              title={`${tenant.name} ${
                tenant.tenantId === switching
                  ? ' (switching...)'
                  : tenant.tenantId === state.user?.activeTenant.tenantId
                  ? ' (active)'
                  : ''
              }`.trim()}
              onPress={() => {
                console.log(tenant.tenantId, state.user?.activeTenant.tenantId);
                setSwitching(tenant.tenantId);
                switchTenant(tenant.tenantId).then(() => {
                  setSwitching('');
                });
              }}
            />
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listenerButton: {
    marginVertical: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  tenantsTitle: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  tenantRow: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
});
