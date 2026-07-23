package com.frontegg.reactnative

import android.app.Activity
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.LifecycleState
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.frontegg.android.AdminPortalActivity
import com.frontegg.android.fronteggAuth
import com.frontegg.android.models.Entitlement
import io.reactivex.rxjava3.core.Observable
import io.reactivex.rxjava3.disposables.Disposable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.time.DurationUnit
import kotlin.time.toDuration


class FronteggRNModule(val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  private val fronteggConstants: FronteggConstants
  private var disposable: Disposable? = null

  private val auth get() = reactContext.applicationContext.fronteggAuth

  override fun getName(): String {
    return NAME
  }

  init {
    fronteggConstants = reactContext.fronteggConstants
    // SDK 1.3+ auto-initializes from BuildConfig when first accessing context.fronteggAuth
  }

  private fun sendEvent(
    reactContext: ReactApplicationContext,
    eventName: String,
    params: WritableMap?
  ) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  // See for more examples:
  // https://reactnative.dev/docs/native-modules-android

  @ReactMethod
  fun subscribe() {
    if (this.disposable != null) {
      this.disposable!!.dispose()
    }
    this.disposable = Observable.mergeArray(
      auth.accessToken.observable,
      auth.refreshToken.observable,
      auth.refreshingToken.observable,
      auth.user.observable,
      auth.isAuthenticated.observable,
      auth.isLoading.observable,
      auth.initializing.observable,
      auth.showLoader.observable,
    ).subscribe {
      notifyChanges()
    }
    notifyChanges()
  }

  private val handler = Handler(Looper.getMainLooper())
  private val eventRunnable = Runnable {
    notifyChanges()
  }

  private fun notifyChanges() {
    if (reactContext.lifecycleState != LifecycleState.RESUMED) {
      // Remove any pending posts of eventRunnable and enqueue it again
      handler.removeCallbacks(eventRunnable)
      handler.postDelayed(eventRunnable, 500L) // Adjust the debounce delay as needed
      return
    }
    handler.removeCallbacks(eventRunnable)
    val accessToken = auth.accessToken.value
    val refreshToken = auth.refreshToken.value
    val refreshingToken = auth.refreshingToken.value
    val user = auth.user.value
    val isAuthenticated = auth.isAuthenticated.value
    val isLoading = auth.isLoading.value
    val initializing = auth.initializing.value
    val showLoader = auth.showLoader.value

    val params = Arguments.createMap().apply {

      putString("accessToken", accessToken)
      putString("refreshToken", refreshToken)
      putBoolean("refreshingToken", refreshingToken)
      putMap("user", user?.toReadableMap())
      putBoolean("isAuthenticated", isAuthenticated)
      putBoolean("isLoading", isLoading)
      putBoolean("initializing", initializing)
      putBoolean("showLoader", showLoader)
    }


    sendEvent(reactContext, "onFronteggAuthEvent", params)
  }

  @ReactMethod
  fun logout() {
    auth.logout()
  }

  @ReactMethod
  fun addListener(eventName: String?) {

  }

  @ReactMethod
  fun removeListeners(count: Int) {

  }

  @ReactMethod
  fun login(loginHint: String?, promise: Promise) {
    withActivityOrReject(reactApplicationContext.currentActivity, promise) { activity ->
      auth.login(activity, loginHint) { error ->
        resolveOrRejectLogin(error, promise)
      }
    }
  }

  @ReactMethod
  fun switchTenant(tenantId: String, promise: Promise) {
    auth.switchTenant(tenantId) { success ->
      resolveTenantSwitch(success, tenantId, promise)
    }
  }

  @ReactMethod
  fun directLoginAction(
    type: String,
    data: String,
    ephemeralSession: Boolean,
    additionalQueryParams: ReadableMap?,
    promise: Promise
  ) {
    // Parity note: the JS `directLoginAction(type, data, ephemeralSession, additionalQueryParams)`
    // signature is shared across platforms, so both trailing args must be declared here to keep the
    // JS↔native argument mapping aligned (otherwise `additionalQueryParams` collides with the
    // Promise slot). iOS honors both (see ios/FronteggRN.swift), but the native Android SDK's
    // `directLoginAction(activity, type, data)` does not yet accept them — threading them through
    // requires native support in frontegg-android-kotlin. Until then they are accepted no-ops on
    // Android. `ephemeralSession` is inherently iOS-only here (Android runs the flow in the embedded
    // WebView, not an ASWebAuthenticationSession-style browser session).
    withActivityOrReject(reactApplicationContext.currentActivity, promise) { activity ->
      auth.directLoginAction(activity, type, data)
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun refreshToken(promise: Promise) {
    // FR-25937: refreshTokenIfNeeded() starts the refresh in the background and returns
    // immediately, so resolving here handed JS a stale token. refreshTokenAndWait() suspends
    // until the refresh finishes; resolve its Boolean result to match iOS (which awaits a Bool).
    CoroutineScope(Dispatchers.IO).launch {
      try {
        val success = auth.refreshTokenAndWait()
        promise.resolve(success)
      } catch (e: Exception) {
        promise.reject("REFRESH_TOKEN_ERROR", e.message, e)
      }
    }
  }

  @ReactMethod
  fun loginWithPasskeys(promise: Promise) {
    withActivityOrReject(reactApplicationContext.currentActivity, promise) { activity ->
      auth.loginWithPasskeys(activity) { error ->
        if (error != null) {
          promise.reject(error)
        } else {
          promise.resolve("")
        }
      }
    }
  }

  @ReactMethod
  fun isSteppedUp(maxAgeSeconds: Double, promise: Promise) {
    val maxAge =
      if (maxAgeSeconds < 0) null else maxAgeSeconds.toDuration(DurationUnit.SECONDS)
    promise.resolve(auth.isSteppedUp(maxAge))
  }

  @ReactMethod
  fun stepUp(maxAgeSeconds: Double, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Current activity is null")
      return
    }
    val maxAge =
      if (maxAgeSeconds < 0) null else maxAgeSeconds.toDuration(DurationUnit.SECONDS)
    auth.stepUp(activity, maxAge) { error ->
      if (error != null) {
        promise.reject("STEP_UP_ERROR", error.message, error)
      } else {
        promise.resolve(null)
      }
    }
  }

  @ReactMethod
  fun requestAuthorize(refreshToken: String, deviceTokenCookie: String?, promise: Promise) {
    try {
      auth.requestAuthorize(refreshToken, deviceTokenCookie) { result ->
        result.fold(
          onSuccess = { user ->
            promise.resolve(user.toReadableMap())
          },
          onFailure = { error ->
            promise.reject("AUTHORIZATION_ERROR", error.message, error)
          }
        )
      }
    } catch (e: Exception) {
      promise.reject("EXCEPTION", e.message, e)
    }
  }



  @ReactMethod
  fun registerPasskeys(promise: Promise) {
    withActivityOrReject(reactApplicationContext.currentActivity, promise) { activity ->
      auth.registerPasskeys(activity) { error ->
        if (error != null) {
          promise.reject(error)
        } else {
          promise.resolve("")
        }
      }
    }
  }

  @ReactMethod
  fun openAdminPortal(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Cannot open Admin Portal without an active Activity")
      return
    }

    AdminPortalActivity.open(activity)
    promise.resolve(null)
  }

  @ReactMethod
  fun loadEntitlements(forceRefresh: Boolean, promise: Promise) {
    auth.loadEntitlements(forceRefresh) { success ->
      promise.resolve(success)
    }
  }

  @ReactMethod
  fun getFeatureEntitlement(key: String, promise: Promise) {
    promise.resolve(entitlementToMap(auth.getFeatureEntitlements(key)))
  }

  @ReactMethod
  fun getPermissionEntitlement(key: String, promise: Promise) {
    promise.resolve(entitlementToMap(auth.getPermissionEntitlements(key)))
  }

  private fun entitlementToMap(entitlement: Entitlement): WritableMap =
    Arguments.createMap().apply {
      putBoolean("isEntitled", entitlement.isEntitled)
      putString("justification", entitlement.justification)
    }

  override fun getConstants(): MutableMap<String, Any?> = fronteggConstants.toMap()

  companion object {
    const val NAME = "FronteggRN"

  }
}

/**
 * Runs [block] with the current [activity], or rejects [promise] with NO_ACTIVITY when it is null
 * (FR-25939). login/directLoginAction/loginWithPasskeys/registerPasskeys previously used
 * `currentActivity!!`, which threw a KotlinNullPointerException (crashing the app) when the app was
 * backgrounded or the activity had been recreated. Top-level so it can be unit-tested without the
 * ReactApplicationContext, matching stepUp/openAdminPortal which already null-check inline.
 */
internal inline fun withActivityOrReject(
  activity: Activity?,
  promise: Promise,
  block: (Activity) -> Unit,
) {
  if (activity == null) {
    promise.reject("NO_ACTIVITY", "Current activity is null")
    return
  }
  block(activity)
}

/**
 * Completes [promise] for the native login callback (FR-25938). The SDK callback is
 * `((Exception?) -> Unit)?`; the module used to ignore the error and always resolve, so a
 * cancelled/failed login looked like success to JS. Reject on a non-null [error], resolve otherwise.
 */
internal fun resolveOrRejectLogin(error: Exception?, promise: Promise) {
  if (error != null) {
    promise.reject("LOGIN_ERROR", error.message ?: "Login failed", error)
  } else {
    promise.resolve("")
  }
}

/**
 * Completes [promise] for the native switchTenant callback (FR-25938). The SDK callback yields a
 * `Boolean`; the module used to ignore it and always resolve the tenant id, so a failed switch
 * looked like success. Reject when [success] is false, otherwise resolve [tenantId].
 */
internal fun resolveTenantSwitch(success: Boolean, tenantId: String, promise: Promise) {
  if (success) {
    promise.resolve(tenantId)
  } else {
    promise.reject("SWITCH_TENANT_ERROR", "Failed to switch tenant")
  }
}
