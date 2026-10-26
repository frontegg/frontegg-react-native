export type FronteggRegion = {
  key: string;
  baseUrl: string;
  clientId: string;
  applicationId?: string;
};

export type FronteggLogLevel =
  | 'trace'
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'critical';

export type FronteggPluginProps = {
  baseUrl?: string;
  clientId?: string;
  applicationId?: string;
  regions?: FronteggRegion[];
  keychainService?: string;
  embeddedMode?: boolean;
  logLevel?: FronteggLogLevel;
  useAssetLinks?: boolean;
  useChromeCustomTabs?: boolean;
  associatedDomains?: boolean;
  iosPlist?: Record<string, string | number | boolean>;
  androidBuildConfigFields?: Record<string, string | number | boolean>;
};

export function getFronteggHost(baseUrl: string): string {
  return baseUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

export function isMultiRegion(props: FronteggPluginProps): boolean {
  return Boolean(props.regions?.length);
}

export function resolveRegions(props: FronteggPluginProps): FronteggRegion[] {
  if (props.regions?.length) {
    const invalidRegion = props.regions.find(
      (region) => !region.key || !region.baseUrl || !region.clientId
    );
    if (invalidRegion) {
      throw new Error(
        '@frontegg/react-native: every entry in `regions` needs `key`, `baseUrl` and `clientId`.'
      );
    }
    return props.regions;
  }
  if (!props.baseUrl || !props.clientId) {
    throw new Error(
      '@frontegg/react-native: the Expo config plugin needs `baseUrl` and `clientId`, or a non-empty `regions` array.'
    );
  }
  return [
    {
      key: 'default',
      baseUrl: props.baseUrl,
      clientId: props.clientId,
      applicationId: props.applicationId,
    },
  ];
}

export function getPrimaryRegion(props: FronteggPluginProps): FronteggRegion {
  return resolveRegions(props)[0] as FronteggRegion;
}

export function getRegionHosts(props: FronteggPluginProps): string[] {
  const hosts = resolveRegions(props).map((region) =>
    getFronteggHost(region.baseUrl)
  );
  return [...new Set(hosts)];
}

export function withoutUndefinedValues(
  entries: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entries).filter(([, value]) => value !== undefined)
  );
}
