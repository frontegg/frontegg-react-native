import {
  AndroidConfig,
  CodeGenerator,
  WarningAggregator,
  withAndroidManifest,
  withAppBuildGradle,
  withGradleProperties,
  withMainApplication,
  type ConfigPlugin,
} from 'expo/config-plugins';

import {
  getFronteggHost,
  getPrimaryRegion,
  getRegionHosts,
  isMultiRegion,
  resolveRegions,
  withoutUndefinedValues,
  type FronteggPluginProps,
} from './config';

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;
type ManifestIntentFilter = AndroidConfig.Manifest.ManifestIntentFilter;
type PropertiesItem = AndroidConfig.Properties.PropertiesItem;

const PLUGIN_NAME = '@frontegg/react-native';
const MIN_SDK_VERSION = 26;
const MIN_SDK_PROPERTY = 'android.minSdkVersion';
const EMBEDDED_AUTH_ACTIVITY = 'com.frontegg.android.EmbeddedAuthActivity';
const AUTHENTICATION_ACTIVITY = 'com.frontegg.android.AuthenticationActivity';
const EMBEDDED_AUTH_PATH_PREFIXES = [
  '/oauth/account/activate',
  '/oauth/account/invitation/accept',
  '/oauth/account/reset-password',
  '/oauth/account/login/magic-link',
  '/oauth/account/unlock',
];
const PACKAGE_NAME_PLACEHOLDER = '${package_name}';
const REGIONS_INIT_TAG = `${PLUGIN_NAME}-regions`;
const SUPER_ON_CREATE = /^\s*super\.onCreate\(\)/m;
const REGIONS_INIT_CALL =
  '    com.frontegg.reactnative.FronteggRegions.initFromBuildConfig(this)';

type MainApplicationSource = { language: string; contents: string };

function toGroovyString(text: string): string {
  const escapedText = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${escapedText}'`;
}

function toBuildConfigField(name: string, value: unknown): string {
  if (typeof value === 'boolean') {
    return `buildConfigField "boolean", "${name}", "${value}"`;
  }
  if (typeof value === 'number') {
    const javaType = Number.isInteger(value) ? 'int' : 'double';
    return `buildConfigField "${javaType}", "${name}", "${value}"`;
  }
  const javaStringLiteral = JSON.stringify(String(value));
  return `buildConfigField "String", "${name}", ${toGroovyString(
    javaStringLiteral
  )}`;
}

function buildRegionsJson(props: FronteggPluginProps): string {
  const regions = resolveRegions(props).map((region) => ({
    key: region.key,
    baseUrl: getFronteggHost(region.baseUrl),
    clientId: region.clientId,
    applicationId: region.applicationId,
  }));
  return JSON.stringify(regions);
}

export function buildGradleDefaultConfig(props: FronteggPluginProps): string {
  const primaryRegion = getPrimaryRegion(props);
  const primaryHost = getFronteggHost(primaryRegion.baseUrl);
  const singleRegion = !isMultiRegion(props);
  const buildConfigFields = withoutUndefinedValues({
    FRONTEGG_DOMAIN: singleRegion ? primaryHost : undefined,
    FRONTEGG_CLIENT_ID: singleRegion ? primaryRegion.clientId : undefined,
    FRONTEGG_APPLICATION_ID: singleRegion
      ? primaryRegion.applicationId
      : undefined,
    FRONTEGG_REGIONS: singleRegion ? undefined : buildRegionsJson(props),
    FRONTEGG_USE_ASSETS_LINKS: props.useAssetLinks ?? true,
    FRONTEGG_USE_CHROME_CUSTOM_TABS: props.useChromeCustomTabs ?? true,
    ...props.androidBuildConfigFields,
  });

  return [
    'manifestPlaceholders += [',
    '    "package_name": applicationId,',
    `    "frontegg_domain": ${toGroovyString(primaryHost)},`,
    `    "frontegg_client_id": ${toGroovyString(primaryRegion.clientId)}`,
    ']',
    ...Object.entries(buildConfigFields).map(([name, value]) =>
      toBuildConfigField(name, value)
    ),
  ]
    .map((line) => `        ${line}`)
    .join('\n');
}

export function addFronteggToAppBuildGradle(
  buildGradle: string,
  props: FronteggPluginProps
): string {
  return CodeGenerator.mergeContents({
    src: buildGradle,
    newSrc: buildGradleDefaultConfig(props),
    tag: PLUGIN_NAME,
    anchor: /^\s*applicationId\s/,
    offset: 1,
    comment: '//',
  }).contents;
}

export function ensureMinSdkVersion(
  properties: PropertiesItem[]
): PropertiesItem[] {
  const otherProperties = properties.filter(
    (item) => item.type !== 'property' || item.key !== MIN_SDK_PROPERTY
  );
  const currentValues = properties.flatMap((item) =>
    item.type === 'property' && item.key === MIN_SDK_PROPERTY
      ? [Number(item.value)]
      : []
  );
  const minSdkVersion = Math.max(MIN_SDK_VERSION, ...currentValues);
  return [
    ...otherProperties,
    { type: 'property', key: MIN_SDK_PROPERTY, value: String(minSdkVersion) },
  ];
}

function createIntentFilter(
  dataAttributes: Record<string, string>[],
  autoVerify: boolean
): ManifestIntentFilter {
  return {
    ...(autoVerify ? { $: { 'android:autoVerify': 'true' } } : {}),
    action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
    category: [
      { $: { 'android:name': 'android.intent.category.DEFAULT' } },
      { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
    ],
    data: dataAttributes.map((attributes) => ({ $: attributes })),
  };
}

function createWebLinkFilter(
  host: string,
  pathPrefix: string
): ManifestIntentFilter {
  return createIntentFilter(
    [
      { 'android:scheme': 'https' },
      { 'android:scheme': 'http' },
      { 'android:host': host },
      { 'android:pathPrefix': pathPrefix },
    ],
    true
  );
}

export function addRegionIntentFilters(
  manifest: AndroidManifest,
  hosts: string[]
): AndroidManifest {
  const application =
    AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  const appActivities = (application.activity ?? []).filter(
    (activity) =>
      ![EMBEDDED_AUTH_ACTIVITY, AUTHENTICATION_ACTIVITY].includes(
        activity.$['android:name']
      )
  );
  const additionalHosts = hosts.slice(1);
  if (!additionalHosts.length) {
    application.activity = appActivities;
    return manifest;
  }

  AndroidConfig.Manifest.ensureToolsAvailable(manifest);
  const embeddedAuthFilters = additionalHosts.flatMap((host) =>
    EMBEDDED_AUTH_PATH_PREFIXES.map((pathPrefix) =>
      createWebLinkFilter(host, pathPrefix)
    )
  );
  const authenticationFilters = additionalHosts.flatMap((host) => [
    createWebLinkFilter(
      host,
      `/oauth/account/redirect/android/${PACKAGE_NAME_PLACEHOLDER}`
    ),
    createIntentFilter(
      [
        {
          'android:host': host,
          'android:scheme': PACKAGE_NAME_PLACEHOLDER,
          'android:pathPrefix': '/android/oauth/callback',
        },
      ],
      false
    ),
  ]);
  application.activity = [
    ...appActivities,
    {
      '$': {
        'android:name': EMBEDDED_AUTH_ACTIVITY,
        'android:exported': 'true',
        'tools:node': 'merge',
      },
      'intent-filter': embeddedAuthFilters,
    },
    {
      '$': {
        'android:name': AUTHENTICATION_ACTIVITY,
        'android:exported': 'true',
        'tools:node': 'merge',
      },
      'intent-filter': authenticationFilters,
    },
  ];
  return manifest;
}

export function addRegionsInitToMainApplication(
  mainApplication: MainApplicationSource,
  props: FronteggPluginProps
): string {
  if (!isMultiRegion(props)) {
    return CodeGenerator.removeContents({
      src: mainApplication.contents,
      tag: REGIONS_INIT_TAG,
    }).contents;
  }
  const canPatch =
    mainApplication.language === 'kt' &&
    SUPER_ON_CREATE.test(mainApplication.contents);
  if (!canPatch) {
    WarningAggregator.addWarningAndroid(
      PLUGIN_NAME,
      'Only a Kotlin MainApplication that calls super.onCreate() can be patched. Call FronteggRegions.initFromBuildConfig(this) in MainApplication.onCreate manually (see docs/advanced.md).'
    );
    return mainApplication.contents;
  }
  return CodeGenerator.mergeContents({
    src: mainApplication.contents,
    newSrc: REGIONS_INIT_CALL,
    tag: REGIONS_INIT_TAG,
    anchor: SUPER_ON_CREATE,
    offset: 1,
    comment: '//',
  }).contents;
}

export const withFronteggAndroid: ConfigPlugin<FronteggPluginProps> = (
  config,
  props
) => {
  config = withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      WarningAggregator.addWarningAndroid(
        PLUGIN_NAME,
        'Only a Groovy app/build.gradle can be patched. Add the Frontegg manifestPlaceholders and buildConfigFields manually (see docs/setup.md).'
      );
      return modConfig;
    }
    modConfig.modResults.contents = addFronteggToAppBuildGradle(
      modConfig.modResults.contents,
      props
    );
    return modConfig;
  });
  config = withMainApplication(config, (modConfig) => {
    modConfig.modResults.contents = addRegionsInitToMainApplication(
      modConfig.modResults,
      props
    );
    return modConfig;
  });
  config = withGradleProperties(config, (modConfig) => {
    modConfig.modResults = ensureMinSdkVersion(modConfig.modResults);
    return modConfig;
  });
  return withAndroidManifest(config, (modConfig) => {
    modConfig.modResults = addRegionIntentFilters(
      modConfig.modResults,
      getRegionHosts(props)
    );
    return modConfig;
  });
};
