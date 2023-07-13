import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  FronteggStoreContext,
  FronteggStoreProvider,
  useAuthActions,
} from '@frontegg/react-hooks';
import type { FronteggAppOptions, FronteggAppInstance } from '@frontegg/types';
import type { FC } from 'react';
import { ContextHolder } from '@frontegg/rest-api';
import 'react-native-url-polyfill/auto';

class App {
  public name: string = 'default';
  public options!: FronteggAppOptions;
}

const app = new App() as FronteggAppInstance;

// @ts-ignore
global.localStorage = {
  getItem: (key: string) => {
    console.log('getItem', key);
    return null;
  },
  setItem: (key: string, value: string) => {
    console.log('setItem', key, value);
    return null;
  },
  removeItem: (key: string) => {
    console.log('removeItem', key);
    return null;
  },
  clear: () => {
    console.log('clear');
    return null;
  },
};

export const StoreListener: FC = () => {
  const { requestAuthorize } = useAuthActions();
  const { store } = useContext(FronteggStoreContext);

  useEffect(() => {
    console.log('on mount');
    requestAuthorize(true);
  }, [requestAuthorize]);

  // @ts-ignore
  global.store = store;
  return null;
};
export const FronteggWrapper: FC<Omit<FronteggAppOptions, 'contextOptions'>> = (
  props
) => {
  const onRedirectTo = useCallback((url: string) => {
    console.log('onRedirectTo', url);
  }, []);

  app.options = {
    contextOptions: {
      // get from native modules
      baseUrl: 'http://localhost:8080',
    },
    ...props,
    onRedirectTo,
    framework: 'nextjs',
  };
  ContextHolder.setOnRedirectTo(onRedirectTo);
  const [, _setLoading] = useState(false);

  // @ts-ignore
  global.window = {
    // @ts-ignore
    localStorage: global.localStorage,
    location: {
      href: app.options.contextOptions.baseUrl,
      pathname: '/',
    },
  };

  const setLoading = useCallback(
    (state: boolean) => {
      setTimeout(() => _setLoading(state), 500);
    },
    [_setLoading]
  );

  return (
    <FronteggStoreProvider app={app} setLoading={setLoading}>
      <StoreListener />
      {props.children}
    </FronteggStoreProvider>
  );
};
export default FronteggWrapper;
