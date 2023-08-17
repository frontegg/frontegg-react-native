import React, { useEffect, useState } from 'react';
import type { FronteggAppOptions } from '@frontegg/types';
import type { FC } from 'react';
import type { FronteggState } from './FronteggContext';
import FronteggContext, { defaultFronteggState } from './FronteggContext';
import { listener, login, logout, switchTenant } from './FronteggNative';

export const FronteggWrapper: FC<Omit<FronteggAppOptions, 'contextOptions'>> = (
  props
) => {
  const [state, setState] = useState<FronteggState>(defaultFronteggState);

  useEffect(() => {
    let subs = listener((s: any) => {
      try {
        setState(s);
      } catch (e) {
        console.error('error', e);
      }
    });

    return () => {
      subs.remove();
    };
  }, []);
  return (
    <FronteggContext.Provider value={{ ...state, login, logout, switchTenant }}>
      {props.children}
    </FronteggContext.Provider>
  );
};
