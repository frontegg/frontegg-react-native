import { NativeModules } from 'react-native';
import { openAdminPortal } from '../FronteggNative';

jest.mock('react-native', () => ({
  NativeModules: {
    FronteggRN: {
      openAdminPortal: jest.fn(() => Promise.resolve(null)),
      subscribe: jest.fn(),
    },
  },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
  })),
  Platform: {
    select: jest.fn(),
  },
}));

describe('openAdminPortal', () => {
  it('calls the native openAdminPortal method', async () => {
    await openAdminPortal();
    expect(NativeModules.FronteggRN.openAdminPortal).toHaveBeenCalled();
  });
});
