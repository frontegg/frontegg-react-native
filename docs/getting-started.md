# Getting started with Frontegg React Native SDK

Welcome to the Frontegg React Native SDK! Easily integrate Frontegg’s out-of-the-box authentication and user management functionalities into your applications for a seamless and secure user experience.

The Frontegg React Native SDK can be used in two ways:

1. With the hosted Frontegg login that will be called through a webview, enabling all login methods supported on the login box
2. By directly using Frontegg APIs from your custom UI, with available methods

The Frontegg React Native SDK automatically handles token refresh behind the scenes, ensuring your users maintain authenticated sessions without manual intervention.

### Supported languages
- JavaScript / TypeScript: For React Native app development and using Frontegg hooks and components
- Kotlin (Android): For native configuration and initialization
- Groovy: For Android build.gradle setup (Groovy DSL)
- Swift: For iOS configuration and SDK linking
- Objective-C: Required for older iOS projects or mixed-language setups (e.g., AppDelegate integration).

### Supported platforms
- iOS: Deployment target 14.0 or higher
- Android: Minimum SDK version 26 (Android 8.0)
- React Native: Version 0.63+ (recommended for best compatibility)
- WebAuthn support (Passkeys):
  - iOS: Version 15+ required for platform-level support
  - Android: SDK 26+, with browser support for Chrome custom tabs

### Prepare your Frontegg environment

- Navigate to Frontegg Portal [ENVIRONMENT] → `Keys & domains`
- If you don't have an application, follow the integration steps after signing up
- Copy your environment's `FronteggDomain` from Frontegg Portal domain for future steps
- Navigate to [ENVIRONMENT] → Authentication → Login method
- Make sure hosted login is toggled on.
- Add the following common redirect URL:

  ```
  {{FRONTEGG_BASE_URL}}/oauth/authorize
  ```

- Replace `{{IOS_BUNDLE_IDENTIFIER}}` with your IOS bundle identifier.
- Replace `{{ANDROID_PACKAGE_NAME}}` with your Android package name.
- Replace `{{FRONTEGG_BASE_URL}}` with your Frontegg domain, i.e `app-xxxx.frontegg.com` or your custom domain.

- For iOS add:
  ```
  {{IOS_BUNDLE_IDENTIFIER}}://{{FRONTEGG_BASE_URL}}/ios/oauth/callback
  ```

- For Android add:
  ```
  {{ANDROID_PACKAGE_NAME}}://{{FRONTEGG_BASE_URL}}/android/oauth/callback
  https://{{FRONTEGG_BASE_URL}}/oauth/account/redirect/android/{{ANDROID_PACKAGE_NAME}}  ← required for assetlinks
  ```

> [!WARNING] 
> On every step, if you have a [custom domain](https://developers.frontegg.com/guides/env-settings/custom-domain), replace the `[frontegg-domain]` and `[your-custom-domain]` placeholders with your custom domain instead of the value from the Keys & domains page.

### Add Frontegg package to the project

Use your preferred package manager to install the Frontegg React Native SDK:

npm: 
```
npm install -s @frontegg/react-native
```

yarn:
```
yarn add @frontegg/react-native
```
