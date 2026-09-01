import { NativeModules } from 'react-native';
import {
  directLoginAction,
  login,
  normalizeLoginError,
  openAdminPortal,
} from '../FronteggNative';

jest.mock('react-native', () => ({
  NativeModules: {
    FronteggRN: {
      openAdminPortal: jest.fn(() => Promise.resolve(null)),
      directLoginAction: jest.fn(() => Promise.resolve()),
      login: jest.fn(() => Promise.resolve('Success')),
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

// Issue #110: login() rejects with a typed, cross-platform FronteggLoginError.
describe('login', () => {
  beforeEach(() => {
    (NativeModules.FronteggRN.login as jest.Mock).mockReset();
  });

  it('resolves when the native login succeeds', async () => {
    (NativeModules.FronteggRN.login as jest.Mock).mockResolvedValue('Success');
    await expect(login('hint@example.com')).resolves.toBe('Success');
    expect(NativeModules.FronteggRN.login).toHaveBeenCalledWith(
      'hint@example.com',
      undefined
    );
  });

  it('accepts no arguments', async () => {
    (NativeModules.FronteggRN.login as jest.Mock).mockResolvedValue('Success');
    await login();
    expect(NativeModules.FronteggRN.login).toHaveBeenCalledWith(
      undefined,
      undefined
    );
  });

  // Issue #127: login-box theme/copy overrides.
  it('accepts an options object with a login hint', async () => {
    (NativeModules.FronteggRN.login as jest.Mock).mockResolvedValue('Success');
    await login({ loginHint: 'hint@example.com' });
    expect(NativeModules.FronteggRN.login).toHaveBeenCalledWith(
      'hint@example.com',
      undefined
    );
  });

  it('forwards themeOptions and localizations as a customization payload', async () => {
    (NativeModules.FronteggRN.login as jest.Mock).mockResolvedValue('Success');
    const themeOptions = {
      loginBox: { palette: { primary: { main: '#3F6655' } } },
    };
    const localizations = { en: { loginBox: { login: { title: 'Sign-in' } } } };

    await login({ loginHint: 'hint@example.com', themeOptions, localizations });

    expect(NativeModules.FronteggRN.login).toHaveBeenCalledWith(
      'hint@example.com',
      { themeOptions, localizations }
    );
  });

  it('forwards only the key that was provided', async () => {
    (NativeModules.FronteggRN.login as jest.Mock).mockResolvedValue('Success');
    const themeOptions = { loginBox: { themeName: 'modern' } };

    await login({ themeOptions });

    expect(NativeModules.FronteggRN.login).toHaveBeenCalledWith(undefined, {
      themeOptions,
    });
  });

  it('treats an explicit null as a reset rather than an omission', async () => {
    (NativeModules.FronteggRN.login as jest.Mock).mockResolvedValue('Success');

    await login({ themeOptions: null });

    // Present-with-null clears the override; absent would leave it untouched.
    expect(NativeModules.FronteggRN.login).toHaveBeenCalledWith(undefined, {
      themeOptions: null,
    });
  });

  it('omits the customization payload entirely when nothing is customized', async () => {
    (NativeModules.FronteggRN.login as jest.Mock).mockResolvedValue('Success');
    await login({ loginHint: 'hint@example.com' });
    const [, customization] = (NativeModules.FronteggRN.login as jest.Mock).mock
      .calls[0];
    expect(customization).toBeUndefined();
  });

  it('rejects with a normalized FronteggLoginError carrying the native details', async () => {
    const nativeError = Object.assign(new Error('Operation canceled by user'), {
      code: 'user_cancelled',
      userInfo: {
        nativeCode: 'operationCanceled',
        nativeMessage: 'Operation canceled by user',
      },
    });
    (NativeModules.FronteggRN.login as jest.Mock).mockRejectedValue(
      nativeError
    );

    await expect(login()).rejects.toMatchObject({
      name: 'FronteggLoginError',
      code: 'user_cancelled',
      userCancelled: true,
      message: 'Operation canceled by user',
      nativeCode: 'operationCanceled',
      nativeMessage: 'Operation canceled by user',
    });
  });
});

describe('normalizeLoginError', () => {
  it('passes through each stable code and derives userCancelled', () => {
    for (const code of [
      'user_cancelled',
      'oauth_failed',
      'network',
      'unknown',
    ] as const) {
      const error = normalizeLoginError({ code, message: 'msg' });
      expect(error.code).toBe(code);
      expect(error.userCancelled).toBe(code === 'user_cancelled');
    }
  });

  it('maps unrecognized codes to unknown, preserving the raw code as nativeCode', () => {
    const error = normalizeLoginError({
      code: 'LOGIN_ERROR',
      message: 'frontegg.error.failed_to_authenticate',
    });
    expect(error.code).toBe('unknown');
    expect(error.userCancelled).toBe(false);
    expect(error.nativeCode).toBe('LOGIN_ERROR');
    expect(error.message).toBe('frontegg.error.failed_to_authenticate');
  });

  it('tolerates null/undefined and non-error rejections', () => {
    const error = normalizeLoginError(undefined);
    expect(error.code).toBe('unknown');
    expect(error.message).toBe('Login failed');
    expect(error.userCancelled).toBe(false);
  });
});
