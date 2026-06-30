package com.frontegg.reactnative

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.LifecycleState
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.frontegg.android.AdminPortalActivity
import com.frontegg.android.fronteggAuth
import com.frontegg.android.models.Entitlement
import io.reactivex.rxjava3.core.Observable
import io.reactivex.rxjava3.disposables.Disposable
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
    val activity = reactApplicationContext.currentActivity
    auth.login(activity!!, loginHint) {
      promise.resolve("")
    }
  }

  @ReactMethod
  fun switchTenant(tenantId: String, promise: Promise) {
    auth.switchTenant(tenantId) {
      promise.resolve(tenantId)
    }
  }

  @ReactMethod
  fun directLoginAction(type: String, data: String, ephemeralSession: Boolean, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    auth.directLoginAction(activity!!, type, data)
    promise.resolve(true)
  }

  @ReactMethod
  fun refreshToken(promise: Promise) {
    auth.refreshTokenIfNeeded()
    promise.resolve("")
  }

  @ReactMethod
  fun loginWithPasskeys(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    auth.loginWithPasskeys(activity!!) { error ->
      if (error != null) {
        promise.reject(error)
      } else {
        promise.resolve("")
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
    val activity = currentActivity
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
    val activity = reactApplicationContext.currentActivity
    auth.registerPasskeys(activity!!) { error ->
      if (error != null) {
        promise.reject(error)
      } else {
        promise.resolve("")
      }
    }
  }

  @ReactMethod
  fun openAdminPortal(promise: Promise) {
    val activity = currentActivity
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
