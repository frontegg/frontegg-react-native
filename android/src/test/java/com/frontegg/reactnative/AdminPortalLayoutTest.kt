package com.frontegg.reactnative

import com.frontegg.android.AdminPortalLayout
import org.junit.Assert.assertEquals
import org.junit.Test

class AdminPortalLayoutTest {

    @Test
    fun responsiveValue_opensTheResponsiveLayout() {
        assertEquals(AdminPortalLayout.RESPONSIVE, adminPortalLayoutFrom("responsive"))
    }

    @Test
    fun desktopMissingOrUnknownValue_opensTheDesktopLayout() {
        assertEquals(AdminPortalLayout.DESKTOP, adminPortalLayoutFrom("desktop"))
        assertEquals(AdminPortalLayout.DESKTOP, adminPortalLayoutFrom(null))
        assertEquals(AdminPortalLayout.DESKTOP, adminPortalLayoutFrom("tablet"))
    }
}
