package com.frontegg.reactnative

data class FronteggConstants(
    val baseUrl: String,
    val clientId: String,
    val applicationId: String?,
    val useAssetsLinks: Boolean,
    val useChromeCustomTabs: Boolean,
    val bundleId: String
) {
    fun toMap(): MutableMap<String, Any?> {
        return mutableMapOf(
            Pair("baseUrl", baseUrl),
            Pair("clientId", clientId),
            Pair("applicationId", applicationId),
            Pair("useAssetsLinks", useAssetsLinks),
            Pair("useChromeCustomTabs", useChromeCustomTabs),
            Pair("bundleId", bundleId),
        )
    }
}
