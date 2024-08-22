package com.frontegg.reactnative

import android.app.Activity
import android.content.Intent
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.LifecycleState
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.frontegg.android.AuthenticationActivity
import com.frontegg.android.FronteggApp
import com.frontegg.android.FronteggAuth
import io.reactivex.rxjava3.core.Observable
import io.reactivex.rxjava3.disposables.Disposable


class FronteggRNModule(val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  private val fronteggConstants: FronteggConstants
  private var disposable: Disposable? = null
  override fun getName(): String {
    return NAME
  }

  private val activityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(
      activity: Activity?,
      requestCode: Int,
      resultCode: Int,
      intent: Intent?
    ) {
      if (requestCode == AuthenticationActivity.OAUTH_LOGIN_REQUEST) {
        when (resultCode) {
          Activity.RESULT_CANCELED -> {
            loginPromise?.reject("Canceled")
          }

          Activity.RESULT_OK -> {
            loginPromise?.resolve("OK")
          }
        }
      }
    }
  }

  init {
    reactContext.addActivityEventListener(activityEventListener)
    fronteggConstants = reactContext.fronteggConstants

    FronteggApp.init(
      fronteggConstants.baseUrl,
      fronteggConstants.clientId,
      reactContext.applicationContext,
      applicationId = fronteggConstants.applicationId,
      useAssetsLinks = fronteggConstants.useAssetsLinks,
      useChromeCustomTabs = fronteggConstants.useChromeCustomTabs,
    )
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
      FronteggAuth.instance.accessToken.observable,
      FronteggAuth.instance.refreshToken.observable,
      FronteggAuth.instance.user.observable,
      FronteggAuth.instance.isAuthenticated.observable,
      FronteggAuth.instance.isLoading.observable,
      FronteggAuth.instance.initializing.observable,
      FronteggAuth.instance.showLoader.observable,
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
    val accessToken = FronteggAuth.instance.accessToken.value
    val refreshToken = FronteggAuth.instance.refreshToken.value
    val user = FronteggAuth.instance.user.value
    val isAuthenticated = FronteggAuth.instance.isAuthenticated.value
    val isLoading = FronteggAuth.instance.isLoading.value
    val initializing = FronteggAuth.instance.initializing.value
    val showLoader = FronteggAuth.instance.showLoader.value

    val params = Arguments.createMap().apply {

      putString("accessToken", accessToken)
      putString("refreshToken", refreshToken)
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
    FronteggAuth.instance.logout()
  }

  @ReactMethod
  fun addListener(eventName: String?) {

  }

  @ReactMethod
  fun removeListeners(count: Int) {

  }


  private var loginPromise: Promise? = null

  @ReactMethod
  fun login(promise: Promise) {
    val activity = currentActivity
    loginPromise = promise
    FronteggAuth.instance.login(activity!!)
  }

  @ReactMethod
  fun switchTenant(tenantId: String, promise: Promise) {
    FronteggAuth.instance.switchTenant(tenantId) {
      promise.resolve(tenantId)
    }
  }

  @ReactMethod
  fun directLoginAction(type: String, data: String, ephemeralSession:Boolean, promise: Promise) {
    val activity = currentActivity
    FronteggAuth.instance.directLoginAction(activity!!, type, data)
    promise.resolve(true)
  }

  @ReactMethod
  fun refreshToken(promise: Promise) {
    FronteggAuth.instance.refreshTokenIfNeeded()
    promise.resolve("")
  }

  override fun getConstants(): MutableMap<String, Any?> = fronteggConstants.toMap()

  companion object {
    const val NAME = "FronteggRN"

  }
}
