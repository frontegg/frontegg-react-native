# @frontegg/react-native

Frontegg is a first-of-its-kind full-stack user management platform, empowering software teams with user infrastructure features for the product-led era.


## Table of Contents

- [Project Requirements](#project-requirements)
- [Getting Started](#getting-started)
    - [Prepare Frontegg workspace](#prepare-frontegg-workspace)
    - [Setup Hosted Login](#setup-hosted-login)
    - [Add frontegg package to the project](#add-frontegg-package-to-the-project)
- [Setup iOS Project](#setup-ios-project)
    - [Create Frontegg plist file](#create-frontegg-plist-file)
    - [Config iOS associated domain](#config-ios-associated-domain)
- [Setup Android Project](#setup-android-project)
    - [Set minimum SDK version](#set-minimum-sdk-version)
    - [Configure build config fields](#configure-build-config-fields)
    - [Register authentication activity](#register-authentication-activity)
    - [Config Android AssetLinks](#config-ios-associated-domain)
- [Usages](#usages)
  - [Wrap your app with FronteggProvider](#wrap-your-app-with-fronteggprovider)
## Project Requirements

- Minimum iOS deployment version **=> 14**
- Min Android SDK **=> 26**


## Getting Started

### Prepare Frontegg workspace

Navigate to [Frontegg Portal Settings](https://portal.frontegg.com/development/settings), If you don't have application
follow integration steps after signing up.
Copy FronteggDomain to future steps from [Frontegg Portal Domain](https://portal.frontegg.com/development/settings/domains)

### Setup Hosted Login

- Navigate to [Login Method Settings](https://portal.frontegg.com/development/authentication/hosted)
- Toggle Hosted login method
- Add `{{IOS_BUNDLE_IDENTIFIER}}://{{FRONTEGG_BASE_URL}}/ios/oauth/callback`
- Replace `IOS_BUNDLE_IDENTIFIER` with your application identifier
- Replace `FRONTEGG_BASE_URL` with your frontegg base url

### Add frontegg package to the project

Use a package manager npm/yarn to install frontegg React Native library.

**NPM:**
```bash
npm install -s @frontegg/react-native
```

**Yarn:**
```bash
yarn add @frontegg/react-native
```

## Setup iOS Project


### Create Frontegg plist file

To setup your SwiftUI application to communicate with Frontegg, you have to create a new file named `Frontegg.plist` under
your root project directory, this file will store values to be used variables by Frontegg SDK:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>baseUrl</key>
	<string>https://[DOMAIN_HOST_FROM_PREVIOUS_STEP]</string>
	<key>clientId</key>
	<string>[CLIENT_ID_FROM_PREVIOUS_STEP]</string>
</dict>
</plist>
```

### Config iOS associated domain

Configuring your iOS associated domain is required for Magic Link authentication / Reset Password / Activate Account.

In order to add your iOS associated domain to your Frontegg application, you will need to update in each of your integrated Frontegg Environments the iOS associated domain that you would like to use with that Environment. Send a POST request to `https://api.frontegg.com/vendors/resources/associated-domains/v1/ios` with the following payload:
```
{
    “appId”:[YOUR_ASSOCIATED_DOMAIN]
}
```
In order to use our API’s, follow [this guide](‘https://docs.frontegg.com/reference/getting-started-with-your-api’) to generate a vendor token.


## Setup Android Project

### Set minimum sdk version

To set up your Android minimum sdk version, open root gradle file at`android/build.gradle`,
and add/edit the `minSdkVersion` under `buildscript.ext`:

```groovy
buildscript {
    ext {
        minSdkVersion = 26
        // ...
    }
}
```


### Configure build config fields

To set up your Android application on to communicate with Frontegg, you have to add `buildConfigField` property the gradle `android/app/build.gradle`.
This property will store frontegg hostname (without https) and client id from previous step:

```groovy

def fronteggDomain = "DOMAIN_HOST.com"
def fronteggClientId = "CLIENT_ID"

android {
    defaultConfig {
        
        manifestPlaceholders = [
                package_name : applicationId,
                frontegg_domain : fronteggDomain,
                frontegg_client_id: fronteggClientId
        ]

        buildConfigField "String", 'FRONTEGG_DOMAIN', "\"$fronteggDomain\""
        buildConfigField "String", 'FRONTEGG_CLIENT_ID', "\"$fronteggClientId\""
    }
    
    
}
```

Add bundleConfig=true if not exists inside the android section inside the app gradle `android/app/build.gradle`

```groovy
android {
  buildFeatures {
    buildConfig = true
  }
}
```


### Register authentication activity

Open the app/src/main/AndroidManifest.xml file and add the following line to the before manifest section:

```xml
<activity android:name="com.frontegg.android.AuthenticationActivity" android:exported="true">
   <intent-filter android:autoVerify="true">
       <action android:name="android.intent.action.VIEW" />

       <category android:name="android.intent.category.DEFAULT" />
       <category android:name="android.intent.category.BROWSABLE" />

       <data
           android:host="${frontegg_domain}"
           android:pathPrefix="/android/${package_name}/callback"
           android:scheme="https"
       />
   </intent-filter>
</activity>

```


### Config Android AssetLinks

Configuring your Android `AssetLinks` is required for Magic Link authentication / Reset Password / Activate Account / login with IdPs.

To add your `AssetLinks` to your Frontegg application, you will need to update in each of your integrated Frontegg Environments the `AssetLinks` that you would like to use with that Environment. Send a POST request to `https://api.frontegg.com/vendors/resources/associated-domains/v1/android` with the following payload:
```
{
    "packageName": "YOUR_APPLICATION_PACKAGE_NAME",
    "sha256CertFingerprints": ["YOUR_KEYSTORE_CERT_FINGERPRINTS"]
}
```

Each Android app has multiple certificate fingerprint, to get your `DEBUG` sha256CertFingerprint you have to run the following command:

For Debug mode, run the following command and copy the `SHA-256` value
```bash
./gradlew signingReport

###################
#  Example Output:
###################

#  Variant: debugAndroidTest
#  Config: debug
#  Store: /Users/davidfrontegg/.android/debug.keystore
#  Alias: AndroidDebugKey
#  MD5: 25:F5:99:23:FC:12:CA:10:8C:43:F4:02:7D:AD:DC:B6
#  SHA1: FC:3C:88:D6:BF:4E:62:2E:F0:24:1D:DB:D7:15:36:D6:3E:14:84:50
#  SHA-256: D9:6B:4A:FD:62:45:81:65:98:4D:5C:8C:A0:68:7B:7B:A5:31:BD:2B:9B:48:D9:CF:20:AE:56:FD:90:C1:C5:EE
#  Valid until: Tuesday, 18 June 2052

```


For Release mode, Extract the SHA256 using keytool from your `Release` keystore file:
```bash
keytool -list -v -keystore /PATH/file.jks -alias YourAlias -storepass *** -keypass ***
```

In order to use our API’s, follow [this guide](https://docs.frontegg.com/reference/getting-started-with-your-api) to generate a vendor token.


## Usages

### Wrap your app with FronteggProvider

NOTE: we recommend to use `FronteggWrapper` component along with  the `NavigationContainer` from `@react-navigation/native`:
to install `@react-navigation/native` and `@react-navigation/native-stack` run the following command:

**NPM:**
```bash
npm install -s @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```
**Yarn:**
```bash
yarn add @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

Modify your `App.tsx` file and wrap your app with FronteggProvider and pass your Frontegg configuration:

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

### Login with frontegg

To log in with frontegg you can use the `useAuth` hook:

```tsx
import { View, Button } from 'react-native';
import { useAuth } from '@frontegg/react-native';


export function MyScreen() {
  const { isAuthenticated, login, logout } = useAuth();
  
  return <View>
    <Button title={'Login'} onPress={login} />
  </View>
} 

```


### Check if user is authenticated

To check if user is authenticated before display your app you can use the `useAuth` hook
along with the isLoading property:

```tsx

import { StyleSheet, View, Text, Button } from 'react-native';
import { useAuth } from '@frontegg/react-native';

export default function HomeScreen() {
  const {
    showLoader,
    isLoading,
    isAuthenticated,
    user,
  } = useAuth();

  // showLoader when the SDK is initializing the app / authenticate the user
  if(showLoader || isLoading) {
    return <View>
      <Text>Loading...</Text>
    </View>
  }

  
  return <View>
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
}
```
