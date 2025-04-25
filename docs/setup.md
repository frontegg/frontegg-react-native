# Project setup

This section guides you through configuring the Frontegg React Native SDK for both iOS and Android, including required project files, authentication callbacks, and platform-specific settings.

## Setup iOS Project

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
