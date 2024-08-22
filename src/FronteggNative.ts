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

export function login() {
  FronteggRN.login()
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

export async function switchTenant(teanntId: string) {
  return FronteggRN.switchTenant(teanntId);
}

export async function refreshToken() {
  return FronteggRN.refreshToken();
}

export async function directLoginAction(
  type: string,
  data: string,
  ephemeralSession: boolean = true
): Promise<void> {
  return FronteggRN.directLoginAction(type, data, ephemeralSession);
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
