import type { AndroidConfig } from 'expo/config-plugins';

import {
  addFronteggToAppBuildGradle,
  addRegionIntentFilters,
  buildGradleDefaultConfig,
  ensureMinSdkVersion,
} from '../android';

const APP_BUILD_GRADLE = `android {
    defaultConfig {
        applicationId "com.example.app"
        minSdkVersion rootProject.ext.minSdkVersion
    }
}
`;

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
