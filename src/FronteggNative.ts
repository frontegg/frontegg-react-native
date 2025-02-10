import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@frontegg/react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const FronteggRN = NativeModules.FronteggRN
  ? NativeModules.FronteggRN
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function getConstants() {
  return FronteggRN.getConstants();
}

export function login(loginHint?: string) {
  FronteggRN.login(loginHint)
    .then((data: any) => {
      console.log(data);
    })
    .catch((e: any) => {
      console.log(e);
    });
}

export function logout() {
  return FronteggRN.logout();
}

export async function switchTenant(tenantId: string) {
  return FronteggRN.switchTenant(tenantId);
}

export async function refreshToken() {
  return FronteggRN.refreshToken();
}

export async function directLoginAction(
  type: string,
  data: string,
  ephemeralSession: boolean = true,
  additionalQueryParams?: Record<string, string>
): Promise<void> {
  return FronteggRN.directLoginAction(type, data, ephemeralSession, additionalQueryParams);
}

export async function loginWithPasskeys(): Promise<void> {
  return FronteggRN.loginWithPasskeys();
}

export async function requestAuthorize(
  refreshToken: string,
  deviceTokenCookie?: string
) {
  return await FronteggRN.requestAuthorize(refreshToken, deviceTokenCookie);
}

export async function registerPasskeys(): Promise<void> {
  return FronteggRN.registerPasskeys();
}

function debounce<T extends (...args: any[]) => any>(func: T, waitFor: number) {
  let timeout: any;

  return function (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    clearTimeout(timeout);
    return new Promise(
      (resolve: any) =>
        (timeout = setTimeout(() => resolve(func.apply(this, args)), waitFor))
    );
  };
}

export function listener(callback: (res: any) => any) {
  const CounterEvents = new NativeEventEmitter(FronteggRN);
  const debouncedFunc = debounce((res: any) => {
    callback(res);
  }, 50);
  const subs = CounterEvents.addListener('onFronteggAuthEvent', (res) => {
    debouncedFunc(res);
  });
  FronteggRN.subscribe();
  return subs;
}
