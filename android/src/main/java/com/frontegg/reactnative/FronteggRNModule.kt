package com.frontegg.reactnative

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.LifecycleState
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.frontegg.android.FronteggApp
import com.frontegg.android.FronteggAuth
import io.reactivex.rxjava3.core.Observable
import io.reactivex.rxjava3.disposables.Disposable


class FronteggRNModule(val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

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
            val params = Arguments.createMap().apply {
              putString("eventProperty", "someValue")
            }
            sendEvent(reactContext, "test", params)

            loginPromise?.reject("Canceled")
          }

          Activity.RESULT_OK -> {
            val params = Arguments.createMap().apply {
              putString("eventProperty", "someValue")
            }
            sendEvent(reactContext, "test", params)
            loginPromise?.resolve(params)

          }
        }
      }
    }
  }

  init {
    reactContext.addActivityEventListener(activityEventListener)
    FronteggApp.init(
      "auth.davidantoon.me",
      "b6adfe4c-d695-4c04-b95f-3ec9fd0c6cca",
      reactContext
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

  private fun notifyChanges(){
    if (reactContext.lifecycleState == LifecycleState.RESUMED) {
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
  }

  @ReactMethod
  fun logout() {
    FronteggAuth.instance.logout()
  }

  @ReactMethod
  fun addListener(eventName: String?) {
    if (eventName == "onFronteggAuthEvent") {
      subscribe()
    }
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    if (this.disposable != null) {
      this.disposable!!.dispose()
    }
  }


  private var loginPromise: Promise? = null

  @ReactMethod
  fun login(promise: Promise) {
    val activity = currentActivity
    loginPromise = promise
    AuthenticationActivity.authenticateUsingBrowser(activity!!)
  }


  override fun getConstants(): MutableMap<String, Any> =
    hashMapOf("DEFAULT_EVENT_NAME" to "New Event")

  companion object {
    const val NAME = "FronteggRN"

  }
}
