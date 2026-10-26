# Project setup

This section guides you through configuring the Frontegg React Native SDK for both iOS and Android, including required project files, authentication callbacks, and platform-specific settings.

> **Using Expo?** Skip the manual iOS and Android steps below — the bundled config plugin generates them on `npx expo prebuild`. See [Expo](#expo).

## Expo

The package ships an [Expo config plugin](https://docs.expo.dev/config-plugins/introduction/) that applies the native setup from this guide every time you run `npx expo prebuild`, so you never edit `ios/` or `android/` by hand. It works with [development builds](https://docs.expo.dev/develop/development-builds/introduction/) and EAS Build — not with Expo Go, which can't load custom native code.

### 1. Add the plugin to `app.json`

```json
{
  "expo": {
    "ios": { "bundleIdentifier": "com.your.company.app" },
    "android": { "package": "com.your.company.app" },
    "plugins": [
      [
        "@frontegg/react-native",
        {
          "baseUrl": "https://{{FRONTEGG_BASE_URL}}",
          "clientId": "{{FRONTEGG_CLIENT_ID}}"
        }
      ]
    ]
  }
}
```

### 2. Generate the native projects and run

```bash
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

Re-run `npx expo prebuild` whenever you change the plugin options.

### Options

| Option | Platform | Effect |
| --- | --- | --- |
| `baseUrl` | iOS, Android | Your Frontegg domain, with or without `https://`. Required unless `regions` is set. |
| `clientId` | iOS, Android | Your Frontegg client ID. Required unless `regions` is set. |
| `applicationId` | iOS, Android | Application ID for [multi-app](advanced.md#multi-app-support) workspaces. |
| `regions` | iOS, Android | `[{ "key", "baseUrl", "clientId", "applicationId"? }]` for multi-region apps. Replaces `baseUrl`/`clientId`. |
| `keychainService` | iOS | `keychainService` in `Frontegg.plist`. |
| `embeddedMode` | iOS | `embeddedMode` in `Frontegg.plist`. |
| `logLevel` | iOS | `trace`, `debug`, `info`, `warn`, `error` or `critical`. |
| `useAssetLinks` | iOS, Android | `useAssetLinks` in `Frontegg.plist`; `FRONTEGG_USE_ASSETS_LINKS` on Android (default `true`). |
| `useChromeCustomTabs` | Android | `FRONTEGG_USE_CHROME_CUSTOM_TABS` (default `true`). |
| `associatedDomains` | iOS | Set to `false` to skip the `applinks:`/`webcredentials:` entitlements (default `true`). |
| `iosPlist` | iOS | Any other `Frontegg.plist` key, e.g. `{ "lateInit": true }`. |
| `androidBuildConfigFields` | Android | Any other `BuildConfig` field the Android SDK reads, e.g. `{ "FRONTEGG_ENABLE_OFFLINE_MODE": true }`. |

Multi-region example:

```json
[
  "@frontegg/react-native",
  {
    "regions": [
      { "key": "eu", "baseUrl": "https://auth-eu.example.com", "clientId": "{{EU_CLIENT_ID}}" },
      { "key": "us", "baseUrl": "https://auth-us.example.com", "clientId": "{{US_CLIENT_ID}}" }
    ]
  }
]
```

### What prebuild generates

**iOS**

- `Frontegg.plist` in the app target (bundled as a resource), built from the options above.
- `applinks:` and `webcredentials:` associated domains for every Frontegg domain.
- Your bundle identifier as a URL scheme in `Info.plist`.
- `FronteggAuth.shared.handleOpenUrl` calls in the Swift `AppDelegate` for deep links and universal links.
- `ios.useFrameworks: "static"` in `Podfile.properties.json` (unless you already set it), plus the `frontegg_spm` `post_integrate` hook for React Native versions without `spm_dependency`.

**Android**

- `manifestPlaceholders` (`package_name`, `frontegg_domain`, `frontegg_client_id`) and the `FRONTEGG_*` `buildConfigField`s in `android/app/build.gradle`.
- `android.minSdkVersion=26` in `gradle.properties` (a higher value is kept).
- For multi-region apps, a `FRONTEGG_REGIONS` `buildConfigField` (a JSON array of the regions) instead of `FRONTEGG_DOMAIN`/`FRONTEGG_CLIENT_ID`, plus the App Link and redirect intent filters for every region after the first. The SDK reads `FRONTEGG_REGIONS` and calls `FronteggApp.initWithRegions` for you — do not also call `initWithRegions` in `MainApplication`, because a second call replaces the SDK instance.

### Still manual

- Allow the redirect URLs in the Frontegg Portal ([Getting started](getting-started.md#prepare-your-frontegg-environment)).
- Register your app with Frontegg for universal links and App Links: the iOS associated-domains request (see [Handle open app with URL](#handle-open-app-with-url)) and the Android `sha256CertFingerprints` request (see [Enable Android AssetLinks](#enable-android-assetlinks)).
- Enable the **Associated Domains** capability for your App ID. EAS Build does this for you; for local builds, enable it in the Apple Developer portal or set `associatedDomains: false`.
- Projects with an Objective-C `AppDelegate` (Expo SDK 52 and older) must add the `handleOpenUrl` calls by hand, as shown in [Handle open app with URL](#handle-open-app-with-url).

## Setup iOS Project

### Integrate FronteggSwift via Swift Package Manager

The iOS native SDK (`FronteggSwift`) is delivered through **Swift Package Manager (SPM)** only. The CocoaPods pod `FronteggSwift` is **not** used (previously pinned at `1.2.76`). React Native still uses CocoaPods for `FronteggRN` and other dependencies; `FronteggSwift` is linked into the `FronteggRN` pod target via SPM after `pod install`.

**Requirements:** Xcode **15+**, iOS deployment target **14.0+**, CocoaPods.

#### 1. Update `ios/Podfile`

Inside your app target (the same block as `use_native_modules!`):

```ruby
target 'YourApp' do
  # Required so the FronteggRN pod can import the FronteggSwift SPM product.
  use_frameworks! :linkage => :static

  config = use_native_modules!
  # ... use_react_native! etc.
```

After `post_install` (do **not** put the SPM hook inside `post_install` — CocoaPods would overwrite the patched `Pods` project):

```ruby
  post_install do |installer|
    react_native_post_install(installer, config[:reactNativePath], :mac_catalyst_enabled => false)
    # ...your other post_install hooks...
  end

  post_integrate do |installer|
    require_relative '../node_modules/@frontegg/react-native/ios/frontegg_spm'
    FronteggSPM.link_frontegg_rn_pod(installer)
  end
end
```

Adjust the `require_relative` path if your `node_modules` layout differs (monorepo, etc.).

#### 2. Install pods

From the `ios` directory:

```bash
cd ios
bundle exec pod install   # recommended if you use a Gemfile
```

**React Native 0.72:** if `pod install` fails downloading `boost`, add the boost URL workaround at the top of your `Podfile` (see the [example `ios/Podfile`](https://github.com/frontegg/frontegg-react-native/blob/master/example/ios/Podfile)).

#### 3. Build and run

- Open **`YourApp.xcworkspace`** (not `.xcodeproj`).
- For local development on a **simulator**, prefer:

```bash
cd ..
yarn start          # Metro — one terminal
yarn ios --simulator "iPhone 17 Pro Max"
```

If a physical iPhone is connected, React Native may target the device and fail on code signing (`com.your.bundle`). Use `--simulator` or disconnect the device.

The `frontegg_spm` helper pins **FronteggSwift 1.3.24** from `https://github.com/frontegg/frontegg-ios-swift.git`, links it to the **FronteggRN** CocoaPods target, and configures the app Xcode project so SPM resolves without duplicate symbol errors at link time.

> **Embedded mode step-up:** `FronteggSwift` **1.3.11** routes `stepUp()` through the embedded `WKWebView` when `embeddedMode` is enabled (instead of `ASWebAuthenticationSession`), so MFA/step-up reuses the existing web session. Set `<key>embeddedMode</key><true/>` in `Frontegg.plist` if you use the embedded login box.

#### Step-up from JavaScript

```ts
import { isSteppedUp, stepUp } from '@frontegg/react-native';

const maxAgeSeconds = 60;
if (await isSteppedUp(maxAgeSeconds)) {
  // already stepped up
} else {
  await stepUp(maxAgeSeconds);
}
```

See the [example `HomeScreen`](https://github.com/frontegg/frontegg-react-native/blob/master/example/src/HomeScreen.tsx) for a **Sensitive action** button matching the native iOS SDK demo.

### Create Frontegg.plist

1. Add a new file named `Frontegg.plist` to your root project directory.
2. Add the following content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>baseUrl</key>
        <string>https://{{FRONTEGG_BASE_URL}}</string>
        <key>clientId</key>
        <string>{{FRONTEGG_CLIENT_ID}}</string>
    </dict>
</plist>
```

- Replace `{{FRONTEGG_BASE_URL}}` with the domain name from your Frontegg Portal.
- Replace `{{FRONTEGG_CLIENT_ID}}` with your Frontegg client ID.

> **Plist keys are forwarded as-is.** iOS configuration is plist-driven: the native
> `FronteggSwift` SDK reads `Frontegg.plist` directly, so every key you set there reaches the
> native SDK without any wrapper involvement. In particular, the proposed
> `<key>useAssetLinks</key><true/>` option
> ([frontegg-ios-swift#293](https://github.com/frontegg/frontegg-ios-swift/issues/293)) can be
> set today — the currently pinned `FronteggSwift` ignores unknown plist keys, so it is a safe
> no-op until a SDK version that supports it ships, at which point it takes effect with no
> wrapper change. The wrapper also surfaces the key's value to JS via `getConstants().useAssetLinks`
> (mirroring Android's `useAssetsLinks` BuildConfig constant) so you can verify your configuration.

### Handle open app with URL

To support login via magic link and other authentication methods that require your app to open from a URL, add the following code to your app.

#### `For Objective-C:`

1. Create `FronteggSwiftAdapter.swift` in your project and add the following code:

    ```objective-c
    //  FronteggSwiftAdapter.swift

    import Foundation
    import FronteggSwift

    @objc(FronteggSwiftAdapter)
    public class FronteggSwiftAdapter: NSObject {
        @objc public static let shared = FronteggSwiftAdapter()

        @objc public func handleOpenUrl(_ url: URL) -> Bool {
            return FronteggAuth.shared.handleOpenUrl(url)
        }
    }
    ```

2. Open `AppDelegate.m` file and import swift headers:

    ```objective-c
    #import <[YOUR_PROJECT_NAME]-Swift.h>
    ```
3. Add URL handlers to `AppDelegate.m`:

    ```objective-c
    #import <[YOUR_PROJECT_NAME]-Swift.h>

   // ...CODE...

   - (BOOL)application:(UIApplication *)app openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
    {

      if([[FronteggSwiftAdapter shared] handleOpenUrl:url] ){
        return TRUE;
      }
      return [RCTLinkingManager application:app openURL:url options:options];
    }

    - (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
     restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
    {

      if (userActivity.webpageURL != NULL){
        if([[FronteggSwiftAdapter shared] handleOpenUrl:userActivity.webpageURL] ){
          return TRUE;
        }
      }
     return [RCTLinkingManager application:application
                      continueUserActivity:userActivity
                        restorationHandler:restorationHandler];
    }
    ```

4. Register your domain with Frontegg:

**NOTE**: Make youre you have a [vendor token to access Frontegg APIs](https://docs.frontegg.com/reference/getting-started-with-your-api). 

a. Open your terminal or API tool (such as Postman or cURL).
b. Send a `POST` request to the following endpoint: `https://api.frontegg.com/vendors/resources/associated-domains/v1/ios`.
c. Include the following JSON payload in the request body:
   ```json
   {
     "appId": "{{ASSOCIATED_DOMAIN}}"
   }
   ```
d. Replace `{{ASSOCIATED_DOMAIN}}` with the actual associated domain you want to use for the iOS app.
e. Repeat this step for each Frontegg environment where you want to support URL-based app opening.


#### `For Swift:`

1. Open `AppDelegate.m` file and import swift headers:

    ```swift
    import FronteggSwift
    ```
2. Add URL handlers to `AppDelegate.swift`:
    ```swift
    import UIKit
    import FronteggSwift

    @UIApplicationMain
    class AppDelegate: UIResponder, UIApplicationDelegate {

        /*
         * Called when the app was launched with a url. Feel free to add additional processing here,
         * but if you want the App API to support tracking app url opens, make sure to keep this call
         */
        func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {

            if(FronteggAuth.shared.handleOpenUrl(url)){
                return true
            }

            return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
        }

        /*
         * Called when the app was launched with an activity, including Universal Links.
         * Feel free to add additional processing here, but if you want the App API to support
         * tracking app url opens, make sure to keep this call
         */
        func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {

            if let url = userActivity.webpageURL {
                if(FronteggAuth.shared.handleOpenUrl(url)){
                    return true
                }
            }
            return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
        }
    }
    ```

## Setup Android Project

### Set the minimum SDK version

1. Open your project in Android Studio.
2. Navigate to the root-level Gradle file: `android/build.gradle`.
3. Locate the `buildscript.ext` section in the file.
4. Add or update the `minSdkVersion` value. For example:

```groovy
buildscript {
    ext {
        minSdkVersion = 26
        // ...
    }
}
```

### Configure build config fields

To set up your Android application on to communicate with Frontegg:

1. Add `buildConfigField` entries to `android/app/build.gradle`: 

```groovy

def fronteggDomain = "{{FRONTEGG_BASE_URL}}" // without protocol https://
def fronteggClientId = "{{FRONTEGG_CLIENT_ID}}"

android {
    defaultConfig {
        // Keep your existing applicationId declared above manifestPlaceholders — the
        // "package_name" placeholder below reads applicationId, so it must be set first.
        // (If manifestPlaceholders is pasted above applicationId, package_name resolves
        // to null and the AAR manifest merge fails.)
        applicationId "com.your.company.app"

        manifestPlaceholders = [
                "package_name" : applicationId,
                "frontegg_domain" : fronteggDomain,
                "frontegg_client_id": fronteggClientId
        ]

        buildConfigField "String", '{{FRONTEGG_BASE_URL}}', "\"$fronteggDomain\""
        buildConfigField "String", '{{CLIENT_ID}}', "\"$fronteggClientId\""
        buildConfigField "Boolean", 'FRONTEGG_USE_ASSETS_LINKS', "true" /** For using frontegg domain for deeplinks **/
        buildConfigField "Boolean", 'FRONTEGG_USE_CHROME_CUSTOM_TABS', "true"  /** For using custom chrome tab for social-logins **/
    }


}
```

- Replace `{{FRONTEGG_BASE_URL}}` with the domain name from your Frontegg Portal.
- Replace `{{FRONTEGG_CLIENT_ID}}` with your Frontegg client ID.

2. Add `buildConfig = true` under the `buildFeatures` block in the `android` section of your `android/app/build.gradle` file if it doesn't already exist:

```groovy
android {
  buildFeatures {
    buildConfig = true
  }
}
```

### White-label apps (`applicationId` ≠ `namespace`)

If your product flavors use different `applicationId` values but share one Java/Kotlin `namespace`, AGP generates `BuildConfig` under the **namespace** package, not under each flavor's `applicationId`. The SDK looks up `BuildConfig` by `applicationId` first; when that fails, add this under `<application>` in `android/app/src/main/AndroidManifest.xml` (use your shared namespace, without `.BuildConfig`):

```xml
<meta-data
  android:name="com.frontegg.reactnative.BUILD_CONFIG_PACKAGE"
  android:value="com.main" />
```

Apps where `applicationId` matches `namespace` do not need this entry.

### Enable Android AssetLinks

To enable Android features like Magic Link authentication, password reset, account activation, and login with identity providers, follow the steps below.

**NOTE**: Make youre you have a [vendor token to access Frontegg APIs](https://docs.frontegg.com/reference/getting-started-with-your-api). 

1. Send a POST request to the following Frontegg endpoint:

   ```bash
   https://api.frontegg.com/vendors/resources/associated-domains/v1/android
   ```
2. Use the following payload:

   ```json
   {
  "packageName": "YOUR_APPLICATION_PACKAGE_NAME",
  "sha256CertFingerprints": ["YOUR_KEYSTORE_CERT_FINGERPRINTS"]
   }
   ```

3. Get your `sha256CertFingerprints`. Each Android app has multiple certificate fingerprints. You must extract at least the one for `DEBUG` and optionally for `RELEASE`.

**For Debug mode**
   
1. Open a terminal in your project root.
2. Run the following command:

  ```
  ./gradlew signingReport
  ```
3. Look for the section with:

  ```
  Variant: debug
  Config: debug
  ```
4. Copy the SHA-256 value from the output. Make sure the `Variant` and `Config` both equal `debug`.

Example output:

```
./gradlew signingReport

###################
#  Example Output:
###################

#  Variant: debug
#  Config: debug
#  Store: /Users/davidfrontegg/.android/debug.keystore
#  Alias: AndroidDebugKey
#  MD5: 25:F5:99:23:FC:12:CA:10:8C:43:F4:02:7D:AD:DC:B6
#  SHA1: FC:3C:88:D6:BF:4E:62:2E:F0:24:1D:DB:D7:15:36:D6:3E:14:84:50
#  SHA-256: D9:6B:4A:FD:62:45:81:65:98:4D:5C:8C:A0:68:7B:7B:A5:31:BD:2B:9B:48:D9:CF:20:AE:56:FD:90:C1:C5:EE
#  Valid until: Tuesday, 18 June 2052
```

**For Release mode:**

1. Run the following command (customize the path and credentials):
  
  ```
  keytool -list -v -keystore /PATH/file.jks -alias YourAlias -storepass *** -keypass ***
  ```

2. Copy the `SHA-256` value from the output.
