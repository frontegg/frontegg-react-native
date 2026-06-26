package com.frontegg.reactnative

import org.junit.Assert.assertEquals
import org.junit.Test

class BuildConfigResolverTest {

    @Test
    fun buildConfigClassCandidates_usesApplicationIdWhenNoMetaData() {
        assertEquals(
            listOf("com.example.app.BuildConfig"),
            buildConfigClassCandidates("com.example.app", null),
        )
    }

    @Test
    fun buildConfigClassCandidates_appendsMetaDataPackage() {
        assertEquals(
            listOf(
                "com.healthie.app.flavor.BuildConfig",
                "com.main.BuildConfig",
            ),
            buildConfigClassCandidates("com.healthie.app.flavor", "com.main"),
        )
    }

    @Test
    fun buildConfigClassCandidates_acceptsFullyQualifiedBuildConfigInMetaData() {
        assertEquals(
            listOf("com.example.app.BuildConfig", "com.main.BuildConfig"),
            buildConfigClassCandidates("com.example.app", "com.main.BuildConfig"),
        )
    }

    @Test
    fun buildConfigClassCandidates_doesNotDuplicateWhenMetaDataMatchesApplicationId() {
        assertEquals(
            listOf("com.example.app.BuildConfig"),
            buildConfigClassCandidates("com.example.app", "com.example.app"),
        )
    }

    @Test
    fun buildConfigClassCandidates_ignoresBlankMetaData() {
        assertEquals(
            listOf("com.example.app.BuildConfig"),
            buildConfigClassCandidates("com.example.app", "   "),
        )
    }
}
