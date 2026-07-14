import { NativeModules } from 'react-native';
import { directLoginAction, openAdminPortal } from '../FronteggNative';

jest.mock('react-native', () => ({
  NativeModules: {
    FronteggRN: {
      openAdminPortal: jest.fn(() => Promise.resolve(null)),
      directLoginAction: jest.fn(() => Promise.resolve()),
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

describe('directLoginAction', () => {
  beforeEach(() => {
    (NativeModules.FronteggRN.directLoginAction as jest.Mock).mockClear();
  });

  it('bridges type, data, ephemeralSession and additionalQueryParams to the native module', async () => {
    const params = { prompt: 'consent', foo: 'bar' };
    await directLoginAction('social-login', 'google', false, params);
    expect(NativeModules.FronteggRN.directLoginAction).toHaveBeenCalledWith(
      'social-login',
      'google',
      false,
      params
    );
  });

  it('defaults ephemeralSession to true and forwards an undefined additionalQueryParams', async () => {
    await directLoginAction('social-login', 'google');
    expect(NativeModules.FronteggRN.directLoginAction).toHaveBeenCalledWith(
      'social-login',
      'google',
      true,
      undefined
    );
  });
});
