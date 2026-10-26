import fs from 'fs';
import path from 'path';
import {
  CodeGenerator,
  IOSConfig,
  WarningAggregator,
  withAppDelegate,
  withDangerousMod,
  withEntitlementsPlist,
  withInfoPlist,
  withPodfile,
  withPodfileProperties,
  withXcodeProject,
  type ConfigPlugin,
} from 'expo/config-plugins';

import {
  getPrimaryRegion,
  getRegionHosts,
  isMultiRegion,
  resolveRegions,
  withoutUndefinedValues,
  type FronteggPluginProps,
  type FronteggRegion,
} from './config';

const PLUGIN_NAME = '@frontegg/react-native';
const PLIST_FILE_NAME = 'Frontegg.plist';
const ASSOCIATED_DOMAINS_KEY = 'com.apple.developer.associated-domains';

const OPEN_URL_HANDLER = [
  '    if FronteggAuth.shared.handleOpenUrl(url) {',
  '      return true',
  '    }',
].join('\n');

const USER_ACTIVITY_HANDLER = [
  '    if let url = userActivity.webpageURL, FronteggAuth.shared.handleOpenUrl(url) {',
  '      return true',
  '    }',
].join('\n');

const URL_HANDLER_OVERRIDES = `
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
${OPEN_URL_HANDLER}
    return super.application(app, open: url, options: options)
  }

  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
${USER_ACTIVITY_HANDLER}
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }`;

const SPM_FALLBACK_POST_INTEGRATE = [
  'post_integrate do |installer|',
  '  unless defined?(spm_dependency)',
  `    require File.join(File.dirname(\`node --print "require.resolve('@frontegg/react-native/package.json')"\`), 'ios/frontegg_spm')`,
  '    FronteggSPM.link_frontegg_rn_pod(installer)',
  '  end',
  'end',
].join('\n');

function toHttpsUrl(baseUrl: string): string {
  return /^https?:\/\//.test(baseUrl) ? baseUrl : `https://${baseUrl}`;
}

function toPlistConnection(region: FronteggRegion): Record<string, unknown> {
  return withoutUndefinedValues({
    baseUrl: toHttpsUrl(region.baseUrl),
    clientId: region.clientId,
    applicationId: region.applicationId,
  });
}

export function buildFronteggPlist(
  props: FronteggPluginProps
): Record<string, unknown> {
  const regions = resolveRegions(props);
  const connectionEntries = isMultiRegion(props)
    ? {
        regions: regions.map((region) => ({
          key: region.key,
          ...toPlistConnection(region),
        })),
      }
    : toPlistConnection(getPrimaryRegion(props));

  return withoutUndefinedValues({
    ...connectionEntries,
    keychainService: props.keychainService,
    embeddedMode: props.embeddedMode,
    logLevel: props.logLevel,
    useAssetLinks: props.useAssetLinks,
    ...props.iosPlist,
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function serializePlistValue(value: unknown, indentation: string): string {
  const nestedIndentation = `${indentation}\t`;
  if (typeof value === 'boolean') {
    return `${indentation}<${value}/>`;
  }
  if (typeof value === 'number') {
    const tag = Number.isInteger(value) ? 'integer' : 'real';
    return `${indentation}<${tag}>${value}</${tag}>`;
  }
  if (Array.isArray(value)) {
    const items = value.map((item) =>
      serializePlistValue(item, nestedIndentation)
    );
    return [`${indentation}<array>`, ...items, `${indentation}</array>`].join(
      '\n'
    );
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).flatMap(([key, entryValue]) => [
      `${nestedIndentation}<key>${escapeXml(key)}</key>`,
      serializePlistValue(entryValue, nestedIndentation),
    ]);
    return [`${indentation}<dict>`, ...entries, `${indentation}</dict>`].join(
      '\n'
    );
  }
  return `${indentation}<string>${escapeXml(String(value))}</string>`;
}

export function serializePlist(dictionary: Record<string, unknown>): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    serializePlistValue(dictionary, ''),
    '</plist>',
    '',
  ].join('\n');
}

export function addAssociatedDomains<
  Entitlements extends Record<string, unknown>
>(entitlements: Entitlements, hosts: string[]): Entitlements {
  const existingDomains = entitlements[ASSOCIATED_DOMAINS_KEY];
  const currentDomains = Array.isArray(existingDomains) ? existingDomains : [];
  const fronteggDomains = hosts.flatMap((host) => [
    `applinks:${host}`,
    `webcredentials:${host}`,
  ]);
  return {
    ...entitlements,
    [ASSOCIATED_DOMAINS_KEY]: [
      ...new Set([...currentDomains, ...fronteggDomains]),
    ],
  };
}

function mergeSwiftBlock(
  source: string,
  tag: string,
  block: string,
  anchor: RegExp,
  offset: number
): string {
  return CodeGenerator.mergeContents({
    src: source,
    newSrc: block,
    tag: `${PLUGIN_NAME}-${tag}`,
    anchor,
    offset,
    comment: '//',
  }).contents;
}

export function addFronteggUrlHandling(appDelegate: string): string {
  const withImport = mergeSwiftBlock(
    appDelegate,
    'import',
    'import FronteggSwift',
    /^(internal )?import Expo$/,
    1
  );
  const withoutGeneratedOverrides = CodeGenerator.removeContents({
    src: withImport,
    tag: `${PLUGIN_NAME}-url-handlers`,
  }).contents;

  if (/open url: URL,/.test(withoutGeneratedOverrides)) {
    const withOpenUrlHandler = mergeSwiftBlock(
      withoutGeneratedOverrides,
      'open-url',
      OPEN_URL_HANDLER,
      /open url: URL,/,
      3
    );
    return mergeSwiftBlock(
      withOpenUrlHandler,
      'user-activity',
      USER_ACTIVITY_HANDLER,
      /continue userActivity: NSUserActivity,/,
      3
    );
  }
  return mergeSwiftBlock(
    withImport,
    'url-handlers',
    URL_HANDLER_OVERRIDES,
    /var reactNativeFactory: RCTReactNativeFactory\?/,
    1
  );
}

export function addSpmFallbackToPodfile(podfile: string): string {
  return CodeGenerator.mergeContents({
    src: podfile,
    newSrc: SPM_FALLBACK_POST_INTEGRATE,
    tag: `${PLUGIN_NAME}-spm`,
    anchor: /^prepare_react_native_project!/,
    offset: 1,
    comment: '#',
  }).contents;
}

const withFronteggPlistFile: ConfigPlugin<FronteggPluginProps> = (
  config,
  props
) => {
  config = withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const { platformProjectRoot, projectRoot } = modConfig.modRequest;
      const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
      const plistPath = path.join(
        platformProjectRoot,
        projectName,
        PLIST_FILE_NAME
      );
      await fs.promises.writeFile(
        plistPath,
        serializePlist(buildFronteggPlist(props))
      );
      return modConfig;
    },
  ]);
  return withXcodeProject(config, (modConfig) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(
      modConfig.modRequest.projectRoot
    );
    const plistFilePath = `${projectName}/${PLIST_FILE_NAME}`;
    if (!modConfig.modResults.hasFile(plistFilePath)) {
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: plistFilePath,
        groupName: projectName,
        project: modConfig.modResults,
        isBuildFile: true,
      });
    }
    return modConfig;
  });
};

const withFronteggAppDelegate: ConfigPlugin = (config) =>
  withAppDelegate(config, (modConfig) => {
    if (modConfig.modResults.language !== 'swift') {
      WarningAggregator.addWarningIOS(
        PLUGIN_NAME,
        'Only a Swift AppDelegate can be patched. Forward openURL and continueUserActivity to FronteggAuth.shared.handleOpenUrl manually (see docs/setup.md).'
      );
      return modConfig;
    }
    try {
      modConfig.modResults.contents = addFronteggUrlHandling(
        modConfig.modResults.contents
      );
    } catch (error) {
      WarningAggregator.addWarningIOS(
        PLUGIN_NAME,
        `Could not add FronteggAuth.shared.handleOpenUrl to AppDelegate.swift, add it manually: ${error}`
      );
    }
    return modConfig;
  });

export const withFronteggIos: ConfigPlugin<FronteggPluginProps> = (
  config,
  props
) => {
  config = withFronteggPlistFile(config, props);
  config = withFronteggAppDelegate(config);
  config = withInfoPlist(config, (modConfig) => {
    const bundleIdentifier = modConfig.ios?.bundleIdentifier ?? null;
    modConfig.modResults = IOSConfig.Scheme.appendScheme(
      bundleIdentifier,
      modConfig.modResults
    );
    return modConfig;
  });
  if (props.associatedDomains !== false) {
    config = withEntitlementsPlist(config, (modConfig) => {
      modConfig.modResults = addAssociatedDomains(
        modConfig.modResults,
        getRegionHosts(props)
      );
      return modConfig;
    });
  }
  config = withPodfileProperties(config, (modConfig) => {
    if (!modConfig.modResults['ios.useFrameworks']) {
      modConfig.modResults['ios.useFrameworks'] = 'static';
    }
    return modConfig;
  });
  return withPodfile(config, (modConfig) => {
    modConfig.modResults.contents = addSpmFallbackToPodfile(
      modConfig.modResults.contents
    );
    return modConfig;
  });
};
