import {
  addAssociatedDomains,
  addFronteggUrlHandling,
  addSpmFallbackToPodfile,
  buildFronteggPlist,
  serializePlist,
} from '../ios';

const SDK_57_APP_DELEGATE = `internal import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}
`;

const SDK_58_APP_DELEGATE = `internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
}
`;

const PODFILE = `require 'json'

prepare_react_native_project!

target 'HelloWorld' do
end
`;

describe('buildFronteggPlist', () => {
  it('writes a single-region configuration with an https base URL', () => {
    const plist = buildFronteggPlist({
      baseUrl: 'app-x.frontegg.com',
      clientId: 'client-id',
      applicationId: 'app-id',
      keychainService: 'my-keychain',
      embeddedMode: false,
      iosPlist: { lateInit: true },
    });

    expect(plist).toEqual({
      baseUrl: 'https://app-x.frontegg.com',
      clientId: 'client-id',
      applicationId: 'app-id',
      keychainService: 'my-keychain',
      embeddedMode: false,
      lateInit: true,
    });
  });

  it('writes a regions array for multi-region configurations', () => {
    const plist = buildFronteggPlist({
      regions: [
        { key: 'eu', baseUrl: 'https://eu.example.com', clientId: 'eu-client' },
        {
          key: 'us',
          baseUrl: 'us.example.com',
          clientId: 'us-client',
          applicationId: 'us-app',
        },
      ],
    });

    expect(plist).toEqual({
      regions: [
        { key: 'eu', baseUrl: 'https://eu.example.com', clientId: 'eu-client' },
        {
          key: 'us',
          baseUrl: 'https://us.example.com',
          clientId: 'us-client',
          applicationId: 'us-app',
        },
      ],
    });
  });

  it('throws when neither baseUrl/clientId nor regions are provided', () => {
    expect(() => buildFronteggPlist({ baseUrl: 'app-x.frontegg.com' })).toThrow(
      /clientId/
    );
  });
});

describe('serializePlist', () => {
  it('serializes strings, booleans, numbers and nested regions', () => {
    const xml = serializePlist({
      baseUrl: 'https://a&b.com',
      embeddedMode: true,
      networkMonitoringInterval: 10,
      regions: [{ key: 'eu' }],
    });

    expect(xml).toContain(
      '<key>baseUrl</key>\n\t<string>https://a&amp;b.com</string>'
    );
    expect(xml).toContain('<key>embeddedMode</key>\n\t<true/>');
    expect(xml).toContain('<integer>10</integer>');
    expect(xml).toContain(
      '\t<array>\n\t\t<dict>\n\t\t\t<key>key</key>\n\t\t\t<string>eu</string>'
    );
  });
});

describe('addAssociatedDomains', () => {
  it('adds applinks and webcredentials for each host without duplicates', () => {
    const entitlements = addAssociatedDomains(
      { 'com.apple.developer.associated-domains': ['applinks:eu.example.com'] },
      ['eu.example.com', 'us.example.com']
    );

    expect(entitlements['com.apple.developer.associated-domains']).toEqual([
      'applinks:eu.example.com',
      'webcredentials:eu.example.com',
      'applinks:us.example.com',
      'webcredentials:us.example.com',
    ]);
  });
});

describe('addFronteggUrlHandling', () => {
  it('patches the existing URL overrides of an SDK 53-57 AppDelegate', () => {
    const appDelegate = addFronteggUrlHandling(SDK_57_APP_DELEGATE);

    expect(appDelegate).toContain('internal import Expo\n// @generated begin');
    expect(appDelegate).toContain('import FronteggSwift');
    expect(appDelegate).toMatch(
      /\) -> Bool \{\n\/\/ @generated begin @frontegg\/react-native-open-url[^\n]*\n {4}if FronteggAuth\.shared\.handleOpenUrl\(url\)/
    );
    expect(appDelegate).toMatch(
      /\) -> Bool \{\n\/\/ @generated begin @frontegg\/react-native-user-activity[^\n]*\n {4}if let url = userActivity\.webpageURL/
    );
    expect(
      appDelegate.match(/public override func application\(/g)
    ).toHaveLength(2);
  });

  it('adds URL overrides to an SDK 58 AppDelegate that has none', () => {
    const appDelegate = addFronteggUrlHandling(SDK_58_APP_DELEGATE);

    expect(
      appDelegate.match(/public override func application\(/g)
    ).toHaveLength(2);
    expect(appDelegate).toContain(
      'return super.application(app, open: url, options: options)'
    );
  });

  it('is idempotent', () => {
    for (const source of [SDK_57_APP_DELEGATE, SDK_58_APP_DELEGATE]) {
      const patchedOnce = addFronteggUrlHandling(source);
      expect(addFronteggUrlHandling(patchedOnce)).toBe(patchedOnce);
    }
  });
});

describe('addSpmFallbackToPodfile', () => {
  it('adds a guarded post_integrate hook once', () => {
    const podfile = addSpmFallbackToPodfile(PODFILE);

    expect(podfile).toContain('unless defined?(spm_dependency)');
    expect(podfile).toContain('FronteggSPM.link_frontegg_rn_pod(installer)');
    expect(addSpmFallbackToPodfile(podfile)).toBe(podfile);
  });
});
