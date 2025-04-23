# Authentication and usage

The Frontegg React Native SDK supports secure, cross-platform authentication flows for both iOS and Android:

* **Embedded Webview**: A built-in login screen rendered inside your app. Enabled by default.
* **System Browser (Chrome Custom Tabs / iOS equivalent)**: A secure, system-managed login flow for social providers. Automatically uses Chrome Custom Tabs on Android and the iOS system browser.
* **Passkeys**: Passwordless authentication using platform biometrics and WebAuthn. Available on iOS 15+ and Android SDK 26+.

## Chrome custom tabs for social login

To enable social login using Chrome Custom Tabs within your Android application, you need to modify the `android/app/build.gradle` file as described below.

1. Open the `android/app/build.gradle` file.
2. Before the android `{}` block, declare the following variables (replace placeholders with your actual values):

```groovy
def fronteggDomain = "{{FRONTEGG_BASE_URL}}" // without https://
def fronteggClientId = "{{FRONTEGG_CLIENT_ID}}"
```

3. Within the `android { defaultConfig { ... } }` section, add the following:

```groovy
manifestPlaceholders = [
    "package_name"        : applicationId,
    "frontegg_domain"     : fronteggDomain,
    "frontegg_client_id"  : fronteggClientId
]

buildConfigField "String", "FRONTEGG_DOMAIN", "\"$fronteggDomain\""
buildConfigField "String", "FRONTEGG_CLIENT_ID", "\"$fronteggClientId\""
buildConfigField "Boolean", "FRONTEGG_USE_CHROME_CUSTOM_TABS", "true"
```

- Replace `{{FRONTEGG_BASE_URL}}` with the domain name from your Frontegg Portal.
- Replace `{{FRONTEGG_CLIENT_ID}}` with your Frontegg client ID.

4. After saving your changes, sync the Gradle project to apply the configuration.

**NOTE**: By default, the Frontegg SDK will use the Chrome browser for social login when this flag is set to `true`.

## Wrap your app with FronteggProvider

**NOTE**: It is recommended to use the `FronteggWrapper` component along with `NavigationContainer` from `@react-navigation/native`.

1. Install navigation dependencies:
  - NPM: `npm install -s @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context`
  - Yarn: `yarn add @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context`

2. Modify your `App.tsx` to wrap your app with `FronteggWrapper`:
```tsx
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import { FronteggWrapper } from '@frontegg/react-native';

const Stack = createNativeStackNavigator();

export default () => {
  return (
    <FronteggWrapper>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </FronteggWrapper>
  );
};
```

## Login with Frontegg

1. Use the `useAuth` hook to access login method:
```tsx
import { View, Button } from 'react-native';
import { useAuth, login } from '@frontegg/react-native';

export function MyScreen() {
  const { isAuthenticated } = useAuth();

  return (
    <View>
      <Button title={'Login'} onPress={login} />
    </View>
  );
}
```

## Switch account (tenant)

Use the `switchTenant` function from `useAuth`:

```tsx
import { useCallback } from 'react';
import { View, Button } from 'react-native';
import { useAuth } from '@frontegg/react-native';

export function MyScreen() {
  const { switchTenant, user } = useAuth();

  console.log("user tenants", user?.tenants);

  const handleSwitchTenant = useCallback(() => {
    const tenantId = 'TENANT_ID'; // Replace with your tenant ID
    switchTenant(tenantId)
      .then(() => {
        console.log('Tenant switched successfully');
      })
      .catch((error) => {
        console.log('Failed to switch tenant', error);
      });
  }, [switchTenant]);

  return (
    <View>
      <Button title={'Switch Tenant'} onPress={handleSwitchTenant} />
    </View>
  );
}
```

## Check user authentication state

Use the `useAuth` hook with `showLoader` and `isLoading` to conditionally display your app:

```tsx
import { View, Text, Button } from 'react-native';
import { useAuth, login, logout } from '@frontegg/react-native';

export default function HomeScreen() {
  const {
    showLoader,
    isLoading,
    isAuthenticated,
    user,
  } = useAuth();

  if (showLoader || isLoading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View>
      <Text>{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</Text>
      {isAuthenticated && <Text>{user?.email}</Text>}
      <Button
        color={isAuthenticated ? '#FF0000' : '#000000'}
        title={isAuthenticated ? 'Logout' : 'Login'}
        onPress={() => {
          isAuthenticated ? logout() : login();
        }}
      />
    </View>
  );
}
```