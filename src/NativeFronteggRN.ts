import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type RegionConfig = {
  key: string;
  baseUrl: string;
  clientId: string;
  applicationId?: string | null;
};

export type NativeEntitlement = {
  isEntitled: boolean;
  justification?: string | null;
};

export interface Spec extends TurboModule {
  getConstants(): {
    baseUrl: string;
    clientId: string;
    applicationId?: string | null;
    bundleId?: string | null;
    useAssetLinks?: boolean | null;
    useAssetsLinks?: boolean;
    useChromeCustomTabs?: boolean;
    isRegional: boolean;
    regionData: RegionConfig[];
  };

  subscribe(): void;
  addListener(eventName: string): void;
  removeListeners(count: number): void;

  login(loginHint?: string | null): Promise<void>;
  loginWithOptions(
    loginHint: string | null | undefined,
    customization: Object
  ): Promise<void>;
  isLoginBoxCustomizationSupported(): Promise<boolean>;
  logout(): Promise<void>;
  switchTenant(tenantId: string): Promise<string>;
  directLoginAction(
    type: string,
    data: string,
    ephemeralSession: boolean,
    additionalQueryParams?: Object | null
  ): Promise<void>;
  refreshToken(): Promise<boolean>;
  getOrRefreshAccessToken(): Promise<string | null>;
  loginWithPasskeys(): Promise<void>;
  registerPasskeys(): Promise<void>;
  requestAuthorize(
    refreshToken: string,
    deviceTokenCookie?: string | null
  ): Promise<Object>;
  isSteppedUp(maxAgeSeconds: number): Promise<boolean>;
  stepUp(maxAgeSeconds: number): Promise<void>;
  openAdminPortal(): Promise<void>;
  loadEntitlements(forceRefresh: boolean): Promise<boolean>;
  getFeatureEntitlement(key: string): Promise<NativeEntitlement>;
  getPermissionEntitlement(key: string): Promise<NativeEntitlement>;
  initWithRegion(regionKey: string): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('FronteggRN');
