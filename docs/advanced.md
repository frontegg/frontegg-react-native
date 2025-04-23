# Advanced options

In this guide, you'll find an overview and best practices for enabling advanced features like passkeys and multi-app configurations.

### Multi-app support

#### iOS setup

If your Frontegg workspace supports multiple apps, you need to specify which one your iOS client should use.

To enable this feature, add `applicationId` to `Frontegg.plist` as follows:

```xml
<plist version="1.0">
  <dict>
    <key>applicationId</key>
    <string>{{FRONTEGG_APPLICATION_ID}}</string>

    <key>baseUrl</key>
    <string>{{FRONTEGG_BASE_URL}}</string>

    <key>clientId</key>
    <string>{{FRONTEGG_CLIENT_ID}}</string>
  </dict>
</plist>
```

- Replace `{{FRONTEGG_APPLICATION_ID}}` with your application ID.
- Replace `{{FRONTEGG_BASE_URL}}` with the domain name from your Frontegg Portal.
- Replace `{{FRONTEGG_CLIENT_ID}}` with your Frontegg client ID.

#### Android setup

1. Open the `android/app/build.gradle` file in your project.
2. Add the following variable at the top of the file (outside the android block):

```groovy
def fronteggApplicationId = "{{FRONTEGG_APPLICATION_ID}}"
```

3. Inside the `android { defaultConfig { } }` block, add the following line:

```groovy
buildConfigField "String", "FRONTEGG_APPLICATION_ID", "\"$fronteggApplicationId\""
```


### Passkeys authentication

Passkeys provide a seamless, passwordless login experience using WebAuthn and platform-level biometric authentication.

**Prerequisites**

1. **iOS Version**:  Ensure your project targets iOS 15 or later to support the necessary WebAuthn APIs.
2. **Android**: Use Android SDK 26+.
3. **Frontegg SDK Version**: Use Frontegg iOS SDK version 1.2.24 or later.

#### Android setup

1. Open `android/build.gradle`.
2. Add the following Gradle dependencies under dependencies:

   ```groovy
      dependencies {
       implementation 'androidx.browser:browser:1.8.0'
       implementation 'com.frontegg.sdk:android:1.2.30'
   }
   ```

3. Inside the `android` block, add the following to set Java 8 compatibility:

   ```groovy
    android {
     compileOptions {
         sourceCompatibility JavaVersion.VERSION_1_8
         targetCompatibility JavaVersion.VERSION_1_8
     }
   }
   ```

#### iOS setup

1. Open your project in **Xcode**
2. Go to your **target** settings
3. Open the **Signing & Capabilities** tab
4. Click the **+ Capability** button and add **Associated Domains**
5. Under **Associated Domains**, click the **+** and add: `webcredentials:your-domain.com`. For example, if your domain is `https://example.com`, use `webcredentials:example.com`.
5. Enter your domain in the format: `webcredentials:[YOUR_DOMAIN]`. For example: `webcredentials:example.com`.
6. Host a `.well-known/webauthn` JSON file on your domain server with the following structure:
   ```json
   {
     "origins": [
       "https://example.com",
       "https://subdomain.example.com"
     ]
   }
   ```
7. Ensure the file is publicly accessible at: `https://example.com/.well-known/webauthn`.
8. Verify that your Associated Domains configuration works using [Apple’s Associated Domains Validator](https://developer.apple.com/contact/request/associated-domains).


#### Register Passkeys

Use the registerPasskeys method to register a passkey for the current user:

```tsx
import { registerPasskeys } from '@frontegg/react-native';

async function handleRegisterPasskeys() {
  try {
    await registerPasskeys();
    console.log('Passkeys registered successfully');
  } catch (error) {
    console.error('Error registering passkeys:', error);
  }
}
```

#### Login with Passkeys

Use the loginWithPasskeys method to log in using passkeys:

```tsx
import { loginWithPasskeys } from '@frontegg/react-native';

async function handleLoginWithPasskeys() {
  try {
    await loginWithPasskeys();
    console.log('Passkeys login successful');
  } catch (error) {
    console.error('Error logging in with Passkeys:', error);
  }
}
```