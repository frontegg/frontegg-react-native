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

export function login() {
  console.log('login');
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

export function listener(callback: any) {
  const CounterEvents = new NativeEventEmitter(FronteggRN);
  const subs = CounterEvents.addListener('onFronteggAuthEvent', (res) => {
    console.log('onFronteggAuthEvent event', res);
    callback(res);
  });

  FronteggRN.subscribe();

  return subs;
}

export { FronteggWrapper } from './FronteggWrapper';
