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
  const NONE = { themeOptions: null, localizations: null };

  beforeEach(() => {
    (NativeModules.FronteggRN.login as jest.Mock).mockClear();
    NativeModules.FronteggRN.loginWithOptions = jest.fn(() =>
      Promise.resolve('Success')
    );
  });

  it('bridges a login hint', async () => {
    await expect(login('hint@example.com')).resolves.toBe('Success');
    expect(NativeModules.FronteggRN.loginWithOptions).toHaveBeenCalledWith(
      'hint@example.com',
      NONE
    );
  });

  it('accepts no arguments', async () => {
    await login();
    expect(NativeModules.FronteggRN.loginWithOptions).toHaveBeenCalledWith(
      undefined,
      NONE
    );
  });

  it('accepts an options object with a login hint', async () => {
    await login({ loginHint: 'hint@example.com' });
    expect(NativeModules.FronteggRN.loginWithOptions).toHaveBeenCalledWith(
      'hint@example.com',
      NONE
    );
  });

  it('forwards themeOptions and localizations', async () => {
    const themeOptions = {
      loginBox: { palette: { primary: { main: '#3F6655' } } },
    };
    const localizations = { en: { loginBox: { login: { title: 'Sign-in' } } } };

    await login({ loginHint: 'hint@example.com', themeOptions, localizations });

    expect(NativeModules.FronteggRN.loginWithOptions).toHaveBeenCalledWith(
      'hint@example.com',
      { themeOptions, localizations }
    );
  });

  // A key the caller omitted must be cleared, not inherited, so the previous brand's
  // theme cannot render on the next brand's login.
  it('clears an override the caller did not supply', async () => {
    const themeOptions = {
      loginBox: { logo: { image: 'https://a/logo.png' } },
    };

    await login({ themeOptions });
    expect(NativeModules.FronteggRN.loginWithOptions).toHaveBeenLastCalledWith(
      undefined,
      { themeOptions, localizations: null }
    );

    await login();
    expect(NativeModules.FronteggRN.loginWithOptions).toHaveBeenLastCalledWith(
      undefined,
      NONE
    );
  });

  // `{ themeOptions: brand?.theme }` with an unresolved brand must not be read as an
  // instruction to keep whatever was set before.
  it('treats an explicitly undefined override as cleared', async () => {
    await login({ loginHint: 'hint@example.com', themeOptions: undefined });
    expect(NativeModules.FronteggRN.loginWithOptions).toHaveBeenCalledWith(
      'hint@example.com',
      NONE
    );
  });

  describe('against a native binary without loginWithOptions', () => {
    beforeEach(() => {
      delete (NativeModules.FronteggRN as Record<string, unknown>)
        .loginWithOptions;
    });

    it('still signs in, using the legacy method', async () => {
      await expect(login('hint@example.com')).resolves.toBe('Success');
      expect(NativeModules.FronteggRN.login).toHaveBeenCalledWith(
        'hint@example.com'
      );
    });

    it('warns when overrides were requested but cannot be applied', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await login({ themeOptions: { loginBox: {} } });

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('needs a newer native SDK')
      );
      expect(NativeModules.FronteggRN.login).toHaveBeenCalledWith(undefined);
      warn.mockRestore();
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
