<p align="center">
  <img src="https://raw.githubusercontent.com/frontegg/frontegg-react-native/master/images/frontegg-react-native.png" alt="Frontegg React Native SDK" width="640" />
</p>

<h1 align="center">Frontegg React Native SDK</h1>

<p align="center">
  <strong>Authentication and user management for your React Native app — one package, both platforms.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@frontegg/react-native"><img src="https://img.shields.io/npm/v/@frontegg/react-native?label=npm&color=6c47ff" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/iOS-14%2B-lightgrey" alt="iOS 14+" />
  <img src="https://img.shields.io/badge/Android-API%2026%2B-3ddc84" alt="Android API 26+" />
  <img src="https://img.shields.io/badge/React%20Native-0.63%2B-61dafb" alt="React Native 0.63+" />
  <a href="https://github.com/frontegg/frontegg-react-native/blob/master/LICENSE"><img src="https://img.shields.io/github/license/frontegg/frontegg-react-native?color=blue" alt="Licence" /></a>
</p>

---

[Frontegg](https://frontegg.com/) is a self-served user management platform for modern SaaS
applications. Drop this SDK in and your app gets a production login screen, a live session, and a
user object — without you writing an auth flow or touching a token.

| | |
| --- | --- |
| **Hosted or embedded login** | Frontegg's login box, or your own UI on top of the API |
| **Every method your tenants need** | Email, social, SSO, magic link, passkeys, MFA and step-up |
| **Sessions that stay alive** | Tokens refresh in the background, on both platforms |
| **Built for multi-tenant SaaS** | Multi-tenancy, RBAC, entitlements and multi-region support |

---

## Install

```sh
npm install @frontegg/react-native
```

Then the peer dependencies:

```sh
# Expo
npx expo install @react-native-async-storage/async-storage @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context

# Bare React Native
npm install @react-native-async-storage/async-storage @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

**Requirements:** React Native 0.63+ · iOS deployment target 14+ · Android API 26+ with JDK 17 and
AGP 7.4+. Passkeys additionally need iOS 15+ and Chrome Custom Tabs on Android.

## Quick start

**1 · Allow the redirect URLs.** In the Frontegg Portal, under **[ENVIRONMENT] → Authentication →
Login method**, turn hosted login on and add the shared URL plus one per platform:

```
{{FRONTEGG_BASE_URL}}/oauth/authorize

# iOS
{{IOS_BUNDLE_IDENTIFIER}}://{{FRONTEGG_BASE_URL}}/ios/oauth/callback

# Android
{{ANDROID_PACKAGE_NAME}}://{{FRONTEGG_BASE_URL}}/android/oauth/callback
https://{{FRONTEGG_BASE_URL}}/oauth/account/redirect/android/{{ANDROID_PACKAGE_NAME}}
```

**2 · Configure the native projects.** iOS reads a `Frontegg.plist`; Android takes its domain and
client ID from `build.gradle`. Both are covered step by step in the
[Setup guide](https://react-native-guide.frontegg.com/#/setup) — this is the one part that is not
JavaScript, and it differs per platform.

On Expo, add the config plugin to `app.json` instead and run `npx expo prebuild` — it generates both
native configurations for you ([Expo setup](https://react-native-guide.frontegg.com/#/setup?id=expo)):

```json
{
  "expo": {
    "plugins": [
      ["@frontegg/react-native", { "baseUrl": "https://{{FRONTEGG_BASE_URL}}", "clientId": "{{FRONTEGG_CLIENT_ID}}" }]
    ]
  }
}
```

**3 · Wrap your app.**

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { FronteggWrapper } from '@frontegg/react-native';

export default function App() {
  return (
    <FronteggWrapper>
      <NavigationContainer>
        {/* your navigator */}
      </NavigationContainer>
    </FronteggWrapper>
  );
}
```

**4 · Read the authentication state** anywhere below it.

```tsx
import { View, Button } from 'react-native';
import { useAuth, login } from '@frontegg/react-native';

export function MyScreen() {
  const { isAuthenticated } = useAuth();

  return (
    <View>
      {isAuthenticated ? <Profile /> : <Button title="Login" onPress={login} />}
    </View>
  );
}
```

## Documentation

| Guide | What it covers |
| --- | --- |
| [Get Started](https://react-native-guide.frontegg.com/#/getting-started) | Requirements, environment prep, installation |
| [Setup](https://react-native-guide.frontegg.com/#/setup) | iOS and Android native configuration |
| [Usage Examples](https://react-native-guide.frontegg.com/#/usage) | Hooks, login flows, error handling |
| [API Reference](https://react-native-guide.frontegg.com/#/api) | Every method, hook and type the SDK exports |
| [Advanced Topics](https://react-native-guide.frontegg.com/#/advanced) | Complex integration scenarios |

Full platform documentation lives at [developers.frontegg.com](https://developers.frontegg.com).

## Example app

A complete integration you can run:
[example](https://github.com/frontegg/frontegg-react-native/tree/master/example).

## Support

No Frontegg account yet? [Sign up free](https://portal.us.frontegg.com/signup).

Questions, or something broken? Reach the team at
[support.frontegg.com](https://support.frontegg.com/frontegg/directories) or
[open an issue](https://github.com/frontegg/frontegg-react-native/issues).

Licensed under the [LICENSE](https://github.com/frontegg/frontegg-react-native/blob/master/LICENSE) in this repository.
