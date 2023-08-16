import * as React from 'react';

import { StyleSheet, View, Text, Button } from 'react-native';
import { useAuth } from '@frontegg/react-native';
import { switchTenant } from '../../src/FronteggNative';
import { useState } from 'react';
import type { ITenantsResponse } from '@frontegg/rest-api';

export default function HomeScreen() {
  const [switching, setSwitching] = useState<string>('');
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
      <Text>Active Tenant: {user?.activeTenant.name}</Text>
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

      <Text style={styles.tenantsTitle}>Tenants</Text>

      {(user?.tenants ?? [])
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
        .map((tenant: ITenantsResponse) => (
          <View key={tenant.tenantId} style={styles.tenantRow}>
            <Button
              title={`${tenant.name} ${
                tenant.tenantId === switching
                  ? ' (switching...)'
                  : tenant.tenantId === user?.activeTenant.tenantId
                  ? ' (active)'
                  : ''
              }`.trim()}
              onPress={() => {
                console.log(tenant.tenantId, user?.activeTenant.tenantId);
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
