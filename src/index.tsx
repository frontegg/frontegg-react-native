import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@frontegg/react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

console.log('NativeModules', NativeModules);
console.log('FronteggRN', NativeModules.FronteggRN);

const CounterEvents = new NativeEventEmitter(NativeModules.FronteggRN);
// subscribe to event
CounterEvents.addListener('onFronteggAuthEvent', (res) =>
  console.log('onFronteggAuthEvent event', res)
);

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
  return FronteggRN.login();
}

export function listener() {
  return FronteggRN.exampleFunc();
}
