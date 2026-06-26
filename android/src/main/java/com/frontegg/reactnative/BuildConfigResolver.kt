package com.frontegg.reactnative

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log

/** Manifest meta-data name for the package that contains the host app [BuildConfig]. */
const val BUILD_CONFIG_PACKAGE_META_DATA_NAME = "com.frontegg.reactnative.BUILD_CONFIG_PACKAGE"

/**
 * Ordered FQCN candidates for the host app [BuildConfig] class.
 *
 * @param applicationId Runtime application id ([Context.getPackageName]).
 * @param manifestBuildConfigPackage Optional value from [BUILD_CONFIG_PACKAGE_META_DATA_NAME].
 */
fun buildConfigClassCandidates(
    applicationId: String,
    manifestBuildConfigPackage: String?,
): List<String> {
    val candidates = mutableListOf("$applicationId.BuildConfig")

    val packageName = manifestBuildConfigPackage?.trim()?.takeIf { it.isNotEmpty() } ?: return candidates

    val className =
        if (packageName.endsWith(".BuildConfig")) packageName else "$packageName.BuildConfig"

    if (className !in candidates) {
        candidates.add(className)
    }

    return candidates
}

fun resolveBuildConfigClass(
    applicationId: String,
    manifestBuildConfigPackage: String?,
): Class<*> {
    val candidates = buildConfigClassCandidates(applicationId, manifestBuildConfigPackage)
    var lastError: ClassNotFoundException? = null

    for (className in candidates) {
        try {
            return Class.forName(className)
        } catch (e: ClassNotFoundException) {
            Log.w(TAG, "BuildConfig not found at $className, trying next candidate")
            lastError = e
        }
    }

    val hint =
        if (manifestBuildConfigPackage.isNullOrBlank()) {
            "If applicationId differs from your AGP namespace, add <meta-data " +
                "android:name=\"$BUILD_CONFIG_PACKAGE_META_DATA_NAME\" " +
                "android:value=\"your.namespace\" /> under <application>."
        } else {
            "Verify <meta-data android:name=\"$BUILD_CONFIG_PACKAGE_META_DATA_NAME\" /> " +
                "points to the package that contains BuildConfig."
        }

    Log.e(TAG, "Could not load BuildConfig. Tried: ${candidates.joinToString()}. $hint")

    throw lastError ?: ClassNotFoundException(
        "No BuildConfig class found for applicationId=$applicationId"
    )
}

fun Context.readBuildConfigPackageMetaData(): String? {
    return try {
        val appInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
        appInfo.metaData?.getString(BUILD_CONFIG_PACKAGE_META_DATA_NAME)
    } catch (e: Exception) {
        Log.w(TAG, "Failed to read $BUILD_CONFIG_PACKAGE_META_DATA_NAME from manifest", e)
        null
    }
}
