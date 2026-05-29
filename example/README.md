# Frontegg React Native — example app

## Prerequisites

- [React Native environment](https://reactnative.dev/docs/environment-setup) (Node, Xcode 15+, CocoaPods)
- Configure `ios/Frontegg.plist` with your Frontegg `baseUrl` and `clientId` (see [Setup Guide](../docs/setup.md))

## iOS (SPM + CocoaPods)

From the **example** directory:

```bash
yarn install
cd ios && bundle exec pod install && cd ..
yarn start                    # terminal 1
yarn ios --simulator "iPhone 17 Pro Max"   # terminal 2 — use an available simulator name
```

Open `ios/ReactNativeExample.xcworkspace` in Xcode if you build from the IDE.

> Use `--simulator` when a physical iPhone is connected, otherwise `yarn ios` may try to deploy to the device and fail on provisioning.

## Android

```bash
yarn android
```

## More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
