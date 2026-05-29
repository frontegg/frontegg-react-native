import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import FronteggButton from './components/FronteggButton';
import {
  switchTenant,
  login,
  logout,
  refreshToken,
  useAuth,
  directLoginAction,
  registerPasskeys,
  loginWithPasskeys,
  requestAuthorize,
  isSteppedUp,
  stepUp,
} from '@frontegg/react-native';
import { useState } from 'react';
import type { ITenantsResponse } from '@frontegg/rest-api';

const STEP_UP_MAX_AGE_SECONDS = 60;

export default function HomeScreen() {
  const [switching, setSwitching] = useState<string>('');
  const [stepUpMessage, setStepUpMessage] = useState<{
    text: string;
    isSuccess: boolean;
  } | null>(null);
  const state = useAuth();

  const handleSensitiveAction = async () => {
    setStepUpMessage(null);
    try {
      const alreadySteppedUp = await isSteppedUp(STEP_UP_MAX_AGE_SECONDS);
      if (alreadySteppedUp) {
        setStepUpMessage({
          text: 'You are already stepped up',
          isSuccess: true,
        });
        return;
      }
      await stepUp(STEP_UP_MAX_AGE_SECONDS);
      setStepUpMessage({
        text: 'Action completed successfully',
        isSuccess: true,
      });
    } catch (error) {
      setStepUpMessage({
        text: `Action completed with failure${
          error instanceof Error ? `: ${error.message}` : ''
        }`,
        isSuccess: false,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>React Native Example</Text>

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
          <FronteggButton
            variant="primary"
            title={state.isAuthenticated ? 'Logout' : 'Login'}
            onPress={() => {
              state.isAuthenticated ? logout() : login();
            }}
          />
        </View>

        {state.isAuthenticated ? null : (
          <View style={styles.listenerButton}>
            <FronteggButton
              variant="primary"
              title="Login with google"
              onPress={() => {
                directLoginAction('social-login', 'google');
              }}
            />
          </View>
        )}

        {state.isAuthenticated ? (
          <View style={styles.listenerButton}>
            <FronteggButton
              variant="primary"
              title="Sensitive action"
              onPress={handleSensitiveAction}
            />
          </View>
        ) : null}

        {stepUpMessage ? (
          <View
            style={[
              styles.messageBanner,
              stepUpMessage.isSuccess
                ? styles.messageBannerSuccess
                : styles.messageBannerError,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                stepUpMessage.isSuccess
                  ? styles.messageTextSuccess
                  : styles.messageTextError,
              ]}
            >
              {stepUpMessage.text}
            </Text>
          </View>
        ) : null}

        {state.isAuthenticated ? (
          <View style={styles.listenerButton}>
            <FronteggButton
              variant="primary"
              title="Request Authorization"
              onPress={async () => {
                if (!state.refreshToken) {
                  setStepUpMessage({
                    text: 'No refresh token available',
                    isSuccess: false,
                  });
                  return;
                }
                try {
                  const user = await requestAuthorize(state.refreshToken);
                  console.log('Authorization Success:', user);
                  setStepUpMessage({
                    text: 'Request authorize successful',
                    isSuccess: true,
                  });
                } catch (error) {
                  console.error('Authorization Failed:', error);
                  setStepUpMessage({
                    text: `Request authorize failed${
                      error instanceof Error ? `: ${error.message}` : ''
                    }`,
                    isSuccess: false,
                  });
                }
              }}
            />
          </View>
        ) : null}

        {state.isAuthenticated ? (
          <View style={styles.listenerButton}>
            <FronteggButton
              variant="primary"
              title="Register Passkeys"
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
            <FronteggButton
              variant="primary"
              title="Login with Passkeys"
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
          <FronteggButton
            variant="primary"
            title="Refresh Token"
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
              <FronteggButton
                variant="primary"
                title={`${tenant.name} ${
                  tenant.tenantId === switching
                    ? ' (switching...)'
                    : tenant.tenantId === state.user?.activeTenant.tenantId
                    ? ' (active)'
                    : ''
                }`.trim()}
                disabled={tenant.tenantId === switching}
                onPress={() => {
                  console.log(
                    tenant.tenantId,
                    state.user?.activeTenant.tenantId
                  );
                  setSwitching(tenant.tenantId);
                  switchTenant(tenant.tenantId).then(() => {
                    setSwitching('');
                  });
                }}
              />
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    marginBottom: 16,
    color: '#373739',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  listenerButton: {
    // Flutter uses `SizedBox(height: 8)` between buttons.
    // With `marginVertical: 4`, distance between adjacent blocks becomes 8.
    marginVertical: 4,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F9FAFC',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
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
  messageBanner: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    width: '100%',
  },
  messageBannerSuccess: {
    backgroundColor: '#E8F5E9',
  },
  messageBannerError: {
    backgroundColor: '#FFEBEE',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageTextSuccess: {
    color: '#2E7D32',
  },
  messageTextError: {
    color: '#C62828',
  },
});
