package com.frontegg.reactnative

import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log


const val TAG: String = "FronteggUtils"

private const val BUILD_CONFIG_PACKAGE_META = "com.frontegg.reactnative.BUILD_CONFIG_PACKAGE"


interface ActivityProvider {
    fun getActivity(): Activity?
}

val Context.fronteggConstants: FronteggConstants
    get() {
        val buildConfigClass = resolveBuildConfigClass(this)

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
    }

/**
 * Locate the host app's generated `BuildConfig` class.
 *
 * The class lives at `<javaPackage>.BuildConfig`, but apps whose `applicationId` differs from
 * their AGP `namespace` (a common pattern for white-label / multi-flavor builds) need to
 * override the lookup, since [Context.getPackageName] returns the `applicationId` at runtime
 * while the generated `BuildConfig` is emitted under the `namespace`.
 *
 * Resolution order:
 *  1. `<applicationContext.packageName>.BuildConfig` (the existing behaviour).
 *  2. The value of the `com.frontegg.reactnative.BUILD_CONFIG_PACKAGE` `<meta-data>` entry on
 *     `<application>` in `AndroidManifest.xml`, suffixed with `.BuildConfig`.
 */
private fun resolveBuildConfigClass(context: Context): Class<*> {
    val candidates = buildConfigClassCandidates(
        primaryPackageName = context.packageName,
        fallbackPackageName = readFallbackBuildConfigPackage(context),
    )

    var lastError: ClassNotFoundException? = null
    for (className in candidates) {
        try {
            return Class.forName(className)
        } catch (e: ClassNotFoundException) {
            Log.w(TAG, "BuildConfig not found at $className, trying next candidate")
            lastError = e
        }
    }

    Log.e(
        TAG,
        "Could not locate host BuildConfig. Tried: ${candidates.joinToString()}. " +
            "If applicationId differs from your android.namespace, add " +
            "<meta-data android:name=\"$BUILD_CONFIG_PACKAGE_META\" " +
            "android:value=\"your.java.package\" /> to <application> in AndroidManifest.xml."
    )
    throw lastError ?: ClassNotFoundException("BuildConfig not found for ${context.packageName}")
}

/**
 * Pure-logic candidate list for `BuildConfig` class lookup. Extracted from
 * [resolveBuildConfigClass] so it can be unit-tested without Android dependencies.
 *
 * Guarantees:
 *  - `primaryPackageName` is always tried first.
 *  - `fallbackPackageName`, if non-null and non-blank, is appended next.
 *  - If both inputs produce the same candidate string, only the first occurrence is kept.
 */
internal fun buildConfigClassCandidates(
    primaryPackageName: String,
    fallbackPackageName: String?,
): List<String> {
    val candidates = LinkedHashSet<String>()
    candidates.add("$primaryPackageName.BuildConfig")
    fallbackPackageName?.takeIf { it.isNotBlank() }?.let {
        candidates.add("$it.BuildConfig")
    }
    return candidates.toList()
}

private fun readFallbackBuildConfigPackage(context: Context): String? = runCatching {
    val appInfo = context.packageManager.getApplicationInfo(
        context.packageName,
        PackageManager.GET_META_DATA,
    )
    appInfo.metaData?.getString(BUILD_CONFIG_PACKAGE_META)
}.getOrNull()

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
