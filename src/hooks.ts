import { useContext } from 'react';
import FronteggContext from './FronteggContext';

export const useAuth = () => {
  return useContext(FronteggContext);
};
