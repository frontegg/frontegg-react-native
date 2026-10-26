package com.frontegg.reactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReadableMap

abstract class FronteggRNSpec internal constructor(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  protected abstract fun getTypedExportedConstants(): Map<String, Any?>

  override fun getConstants(): Map<String, Any?> = getTypedExportedConstants()

  abstract fun subscribe()
  abstract fun addListener(eventName: String?)
  abstract fun removeListeners(count: Double)
  abstract fun login(loginHint: String?, promise: Promise)
  abstract fun loginWithOptions(loginHint: String?, customization: ReadableMap?, promise: Promise)
  abstract fun isLoginBoxCustomizationSupported(promise: Promise)
  abstract fun logout(promise: Promise)
  abstract fun switchTenant(tenantId: String, promise: Promise)
  abstract fun directLoginAction(
    type: String,
    data: String,
    ephemeralSession: Boolean,
    additionalQueryParams: ReadableMap?,
    promise: Promise
  )
  abstract fun refreshToken(promise: Promise)
  abstract fun getOrRefreshAccessToken(promise: Promise)
  abstract fun loginWithPasskeys(promise: Promise)
  abstract fun registerPasskeys(promise: Promise)
  abstract fun requestAuthorize(refreshToken: String, deviceTokenCookie: String?, promise: Promise)
  abstract fun isSteppedUp(maxAgeSeconds: Double, promise: Promise)
  abstract fun stepUp(maxAgeSeconds: Double, promise: Promise)
  abstract fun openAdminPortal(promise: Promise)
  abstract fun loadEntitlements(forceRefresh: Boolean, promise: Promise)
  abstract fun getFeatureEntitlement(key: String, promise: Promise)
  abstract fun getPermissionEntitlement(key: String, promise: Promise)
  abstract fun initWithRegion(regionKey: String, promise: Promise)
}
