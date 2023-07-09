package com.frontegg.reactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.frontegg.android.FronteggApp
import android.app.Activity
import android.content.Intent
import com.frontegg.android.services.Authentication
import com.frontegg.reactnative.AuthenticationActivity

class FronteggRNModule(val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

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
      if (requestCode == FRONTEGG_OAUTH_LOGIN_REQUEST) {
        when (resultCode) {
          Activity.RESULT_CANCELED -> {
            val params = Arguments.createMap().apply {
              putString("eventProperty", "someValue")
            }
            sendEvent(reactContext, "test", params)
          }

          Activity.RESULT_OK -> {
            val uri = intent?.data?.toString()
            val params = Arguments.createMap().apply {
              putString("eventProperty", "someValue")
            }
            sendEvent(reactContext, "test", params)
//            uri?.let { promise.resolve(uri.toString()) }
//              ?: promise.reject(E_NO_IMAGE_DATA_FOUND, "No image data found")
          }
        }
      }
    }
  }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  private fun sendEvent(reactContext: ReactApplicationContext, eventName: String, params: WritableMap?) {
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, params)
  }

  // See for more examples:
  // https://reactnative.dev/docs/native-modules-android


  @ReactMethod
  fun subscribe() {

  }

  @ReactMethod
  fun logout() {

  }


  private var loginPromise: Promise? = null

  @ReactMethod
  fun login(promise: Promise) {

    val activity = currentActivity

    if (activity == null) {
        promise.reject(E_ACTIVITY_DOES_NOT_EXIST, "Activity doesn't exist")
        return
    }

    FronteggApp.init(
        "auth.davidantoon.me",
        "b6adfe4c-d695-4c04-b95f-3ec9fd0c6cca",
        activity
    )

    loginPromise = promise

    AuthenticationActivity.authenticateUsingBrowser(activity)
    // val intent = Intent(this, AuthenticationActivity::class.java)
    // intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    // activity.startActivityForResult(intent, FRONTEGG_OAUTH_LOGIN_REQUEST)
  }


  override fun getConstants(): MutableMap<String, Any> =
    hashMapOf("DEFAULT_EVENT_NAME" to "New Event")

  companion object {
    const val NAME = "FronteggRN"

    const val E_ACTIVITY_DOES_NOT_EXIST = "E_ACTIVITY_DOES_NOT_EXIST"
    const val FRONTEGG_OAUTH_LOGIN_REQUEST = 110112

    const val LOCAL_AUTH_REQUEST_CODE = 150
    const val NO_BROWSER_FOUND_RESULT_CODE = 1404
    const val UNKNOWN_ERROR_RESULT_CODE = 1405
  }
}
