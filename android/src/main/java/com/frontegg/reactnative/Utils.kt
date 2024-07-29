package com.frontegg.reactnative

import android.app.Activity
import android.content.Context
import android.util.Log


const val TAG: String = "FronteggUtils"


interface ActivityProvider {
    fun getActivity(): Activity?
}

val Context.fronteggConstants: FronteggConstants
    get() {
        val packageName = this.packageName
        val className = "$packageName.BuildConfig"
        try {
            val buildConfigClass = Class.forName(className)

            // Get the field from BuildConfig class
            val baseUrl = safeGetValueFromBuildConfig(buildConfigClass, "FRONTEGG_DOMAIN", "")
            val clientId = safeGetValueFromBuildConfig(buildConfigClass, "FRONTEGG_CLIENT_ID", "")

            val applicationId =
                safeGetNullableValueFromBuildConfig(buildConfigClass, "FRONTEGG_APPLICATION_ID", "")

            val useAssetsLinks =
                safeGetValueFromBuildConfig(buildConfigClass, "FRONTEGG_USE_ASSETS_LINKS", true)
            val useChromeCustomTabs = safeGetValueFromBuildConfig(
                buildConfigClass, "FRONTEGG_USE_CHROME_CUSTOM_TABS", true
            )

            return FronteggConstants(
                baseUrl = baseUrl,
                clientId = clientId,
                applicationId = applicationId,
                useAssetsLinks = useAssetsLinks,
                useChromeCustomTabs = useChromeCustomTabs,
                bundleId = this.packageName,
            )
        } catch (e: ClassNotFoundException) {
            Log.e(TAG, "Class not found: $className")
            throw e
        }
    }

fun <T> safeGetNullableValueFromBuildConfig(
    buildConfigClass: Class<*>,
    name: String,
    default: T,
): T? {
    return try {
        val field = buildConfigClass.getField(name)
        field.get(default) as T
    } catch (e: Exception) {
        Log.e(
            TAG, "Field '$name' not found in BuildConfig, return default $default"
        )
        null
    }
}


fun <T> safeGetValueFromBuildConfig(buildConfigClass: Class<*>, name: String, default: T): T {
    return try {
        val field = buildConfigClass.getField(name)
        field.get(default) as T
    } catch (e: Exception) {
        Log.e(
            TAG, "Field '$name' not found in BuildConfig, return default $default"
        )
        default
    }
}
