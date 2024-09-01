import React, { type ReactNode, useEffect, useState } from 'react';
import type { FC } from 'react';
import type { FronteggState } from './FronteggContext';
import FronteggContext, { defaultFronteggState } from './FronteggContext';
import { listener } from './FronteggNative';

export const FronteggWrapper: FC<{ children: ReactNode }> = (props) => {
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
    <FronteggContext.Provider value={{ ...state }}>
      {props.children}
    </FronteggContext.Provider>
  );
};
