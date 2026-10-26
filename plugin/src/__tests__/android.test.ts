import { WarningAggregator, type AndroidConfig } from 'expo/config-plugins';

import {
  addFronteggToAppBuildGradle,
  addRegionIntentFilters,
  addRegionsInitToMainApplication,
  buildGradleDefaultConfig,
  ensureMinSdkVersion,
} from '../android';

jest.mock('expo/config-plugins', () => {
  const configPlugins = jest.requireActual('expo/config-plugins');
  return {
    ...configPlugins,
    WarningAggregator: { addWarningAndroid: jest.fn() },
  };
});

const APP_BUILD_GRADLE = `android {
    defaultConfig {
        applicationId "com.example.app"
        minSdkVersion rootProject.ext.minSdkVersion
    }
}
`;

const SDK_53_MAIN_APPLICATION = `class MainApplication : Application(), ReactApplication {
  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
  }
}
`;

const SDK_58_MAIN_APPLICATION = `class MainApplication : Application(), ReactApplication {
  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }
}
`;

const REGIONS_INIT_CALL =
  '    com.frontegg.reactnative.FronteggRegions.initFromBuildConfig(this)';

const MULTI_REGION_PROPS = {
  regions: [
    { key: 'eu', baseUrl: 'https://eu.example.com', clientId: 'eu-client' },
    { key: 'us', baseUrl: 'https://us.example.com', clientId: 'us-client' },
  ],
};

function createManifest(): AndroidConfig.Manifest.AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
      application: [
        {
          $: { 'android:name': '.MainApplication' },
          activity: [{ $: { 'android:name': '.MainActivity' } }],
        },
      ],
    },
  };
}

describe('buildGradleDefaultConfig', () => {
  it('writes placeholders and build config fields for a single region', () => {
    const block = buildGradleDefaultConfig({
      baseUrl: 'https://app-x.frontegg.com/',
      clientId: 'client-id',
      applicationId: 'app-id',
      useChromeCustomTabs: false,
      androidBuildConfigFields: { FRONTEGG_SENTRY_MAX_QUEUE_SIZE: 50 },
    });

    expect(block).toContain('"package_name": applicationId,');
    expect(block).toContain(`"frontegg_domain": 'app-x.frontegg.com',`);
    expect(block).toContain(`"frontegg_client_id": 'client-id'`);
    expect(block).toContain(
      `buildConfigField "String", "FRONTEGG_DOMAIN", '"app-x.frontegg.com"'`
    );
    expect(block).toContain(
      `buildConfigField "String", "FRONTEGG_CLIENT_ID", '"client-id"'`
    );
    expect(block).toContain(
      `buildConfigField "String", "FRONTEGG_APPLICATION_ID", '"app-id"'`
    );
    expect(block).toContain(
      'buildConfigField "boolean", "FRONTEGG_USE_ASSETS_LINKS", "true"'
    );
    expect(block).toContain(
      'buildConfigField "boolean", "FRONTEGG_USE_CHROME_CUSTOM_TABS", "false"'
    );
    expect(block).toContain(
      'buildConfigField "int", "FRONTEGG_SENTRY_MAX_QUEUE_SIZE", "50"'
    );
  });

  it('uses the first region for placeholders and omits domain fields for multi-region', () => {
    const block = buildGradleDefaultConfig({
      regions: [
        { key: 'eu', baseUrl: 'https://eu.example.com', clientId: 'eu-client' },
        { key: 'us', baseUrl: 'https://us.example.com', clientId: 'us-client' },
      ],
    });

    expect(block).toContain(`"frontegg_domain": 'eu.example.com',`);
    expect(block).not.toContain('FRONTEGG_DOMAIN');
    expect(block).not.toContain('FRONTEGG_CLIENT_ID');
    const regionsField = block.match(
      /buildConfigField "String", "FRONTEGG_REGIONS", '(.*)'/
    );
    const javaStringLiteral = regionsField?.[1]?.replace(/\\\\/g, '\\') ?? '';
    expect(JSON.parse(JSON.parse(javaStringLiteral))).toEqual([
      { key: 'eu', baseUrl: 'eu.example.com', clientId: 'eu-client' },
      { key: 'us', baseUrl: 'us.example.com', clientId: 'us-client' },
    ]);
  });
});

describe('addFronteggToAppBuildGradle', () => {
  it('inserts the block right after applicationId and is idempotent', () => {
    const props = { baseUrl: 'app-x.frontegg.com', clientId: 'client-id' };
    const buildGradle = addFronteggToAppBuildGradle(APP_BUILD_GRADLE, props);

    expect(buildGradle).toMatch(
      /applicationId "com\.example\.app"\n\/\/ @generated begin @frontegg\/react-native[^\n]*\n {8}manifestPlaceholders \+= \[/
    );
    expect(addFronteggToAppBuildGradle(buildGradle, props)).toBe(buildGradle);
  });
});

describe('ensureMinSdkVersion', () => {
  it('adds android.minSdkVersion when missing', () => {
    expect(ensureMinSdkVersion([])).toEqual([
      { type: 'property', key: 'android.minSdkVersion', value: '26' },
    ]);
  });

  it('raises a lower value and keeps a higher one', () => {
    const lowerValue = ensureMinSdkVersion([
      { type: 'property', key: 'android.minSdkVersion', value: '24' },
    ]);
    const higherValue = ensureMinSdkVersion([
      { type: 'property', key: 'android.minSdkVersion', value: '28' },
    ]);

    expect(lowerValue).toEqual([
      { type: 'property', key: 'android.minSdkVersion', value: '26' },
    ]);
    expect(higherValue).toEqual([
      { type: 'property', key: 'android.minSdkVersion', value: '28' },
    ]);
  });
});

describe('addRegionIntentFilters', () => {
  it('leaves the manifest untouched for a single host', () => {
    const manifest = addRegionIntentFilters(createManifest(), [
      'app-x.frontegg.com',
    ]);

    expect(manifest).toEqual(createManifest());
  });

  it('adds deep link filters for every additional region host', () => {
    const hosts = ['eu.example.com', 'us.example.com'];
    const manifest = addRegionIntentFilters(createManifest(), hosts);
    const activities = manifest.manifest.application?.[0]?.activity ?? [];
    const [, embeddedAuthActivity, authenticationActivity] = activities;

    expect(manifest.manifest.$['xmlns:tools']).toBe(
      'http://schemas.android.com/tools'
    );
    expect(embeddedAuthActivity?.$['android:name']).toBe(
      'com.frontegg.android.EmbeddedAuthActivity'
    );
    expect(embeddedAuthActivity?.$['tools:node']).toBe('merge');
    expect(embeddedAuthActivity?.['intent-filter']).toHaveLength(5);
    expect(JSON.stringify(embeddedAuthActivity)).not.toContain(
      'eu.example.com'
    );
    expect(JSON.stringify(embeddedAuthActivity)).toContain('us.example.com');
    expect(authenticationActivity?.['intent-filter']?.[1]?.data).toEqual([
      {
        $: {
          'android:host': 'us.example.com',
          'android:scheme': '${package_name}',
          'android:pathPrefix': '/android/oauth/callback',
        },
      },
    ]);
    expect(
      addRegionIntentFilters(manifest, hosts).manifest.application?.[0]
        ?.activity
    ).toHaveLength(3);
  });
});

describe('addRegionsInitToMainApplication', () => {
  it.each([
    ['SDK 53', SDK_53_MAIN_APPLICATION, 'SoLoader.init'],
    ['SDK 58', SDK_58_MAIN_APPLICATION, 'loadReactNative'],
  ])(
    'initializes the regions right after super.onCreate() (%s)',
    (_, contents, reactNativeStart) => {
      const mainApplication = addRegionsInitToMainApplication(
        { language: 'kt', contents },
        MULTI_REGION_PROPS
      );
      const lines = mainApplication.split('\n');
      const superOnCreateIndex = lines.indexOf('    super.onCreate()');

      expect(lines[superOnCreateIndex + 2]).toBe(REGIONS_INIT_CALL);
      expect(mainApplication.split(REGIONS_INIT_CALL)).toHaveLength(2);
      expect(mainApplication.indexOf(REGIONS_INIT_CALL)).toBeLessThan(
        mainApplication.indexOf(reactNativeStart)
      );
    }
  );

  it('is idempotent', () => {
    const mainApplication = addRegionsInitToMainApplication(
      { language: 'kt', contents: SDK_58_MAIN_APPLICATION },
      MULTI_REGION_PROPS
    );

    expect(
      addRegionsInitToMainApplication(
        { language: 'kt', contents: mainApplication },
        MULTI_REGION_PROPS
      )
    ).toBe(mainApplication);
  });

  it('leaves a single-region app unchanged and removes a previous region init', () => {
    const singleRegionProps = { baseUrl: 'app-x.frontegg.com', clientId: 'id' };
    const multiRegionApplication = addRegionsInitToMainApplication(
      { language: 'kt', contents: SDK_58_MAIN_APPLICATION },
      MULTI_REGION_PROPS
    );

    expect(
      addRegionsInitToMainApplication(
        { language: 'kt', contents: SDK_58_MAIN_APPLICATION },
        singleRegionProps
      )
    ).toBe(SDK_58_MAIN_APPLICATION);
    expect(
      addRegionsInitToMainApplication(
        { language: 'kt', contents: multiRegionApplication },
        singleRegionProps
      )
    ).toBe(SDK_58_MAIN_APPLICATION);
  });

  it('warns and skips a Java MainApplication', () => {
    const javaMainApplication =
      'public class MainApplication extends Application {}';

    expect(
      addRegionsInitToMainApplication(
        { language: 'java', contents: javaMainApplication },
        MULTI_REGION_PROPS
      )
    ).toBe(javaMainApplication);
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledWith(
      '@frontegg/react-native',
      expect.stringContaining('FronteggRegions.initFromBuildConfig')
    );
  });
});
