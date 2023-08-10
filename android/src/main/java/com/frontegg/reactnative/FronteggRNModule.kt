package com.frontegg.reactnative

import android.app.Activity
import android.content.Intent
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
import com.frontegg.android.AuthenticationActivity
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

    FronteggApp.init(
      constants.getValue("baseUrl") as String,
      constants.getValue("clientId") as String,
      reactContext.applicationContext
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

  private fun notifyChanges() {
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

  }

  @ReactMethod
  fun removeListeners(count: Int) {

  }


  private var loginPromise: Promise? = null

  @ReactMethod
  fun login(promise: Promise) {
    val activity = currentActivity
    loginPromise = promise
    AuthenticationActivity.authenticateUsingBrowser(activity!!)
  }


  override fun getConstants(): MutableMap<String, Any> {
    val packageName = reactContext.packageName
    val className = "$packageName.BuildConfig"
    try {
      val buildConfigClass = Class.forName(className)

      // Get the field from BuildConfig class
      val baseUrlField = buildConfigClass.getField("FRONTEGG_DOMAIN")
      val clientIdField = buildConfigClass.getField("FRONTEGG_CLIENT_ID")
      val baseUrl = baseUrlField.get(null) as String // Assuming it's a String
      val clientId = clientIdField.get(null) as String // Assuming it's a String


      return hashMapOf(
        "baseUrl" to baseUrl,
        "clientId" to clientId,
        "bundleId" to reactContext.packageName
      )
    } catch (e: ClassNotFoundException) {
      println("Class not found: $className")
      throw e
    } catch (e: NoSuchFieldException) {
      println(
        "Field not found in BuildConfig: " +
          "buildConfigField \"String\", 'FRONTEGG_DOMAIN', \"\\\"\$fronteggDomain\\\"\"\n" +
          "buildConfigField \"String\", 'FRONTEGG_CLIENT_ID', \"\\\"\$fronteggClientId\\\"\""
      )
      throw e

    } catch (e: IllegalAccessException) {
      println(
        "Access problem with field in BuildConfig: " +
          "buildConfigField \"String\", 'FRONTEGG_DOMAIN', \"\\\"\$fronteggDomain\\\"\"\n" +
          "buildConfigField \"String\", 'FRONTEGG_CLIENT_ID', \"\\\"\$fronteggClientId\\\"\""
      )
      throw e
    }

  }
  companion object {
    const val NAME = "FronteggRN"

  }
}
