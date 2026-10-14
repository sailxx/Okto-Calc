package com.sailxx.oktocalc

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class EngineTest {
    private fun r(s: String, deg: Boolean = true) = Engine.format(Engine.eval(s, deg))

    @Test fun basic() {
        assertEquals("14", r("2+3×4"))
        assertEquals("0.3", r("0.1+0.2"))
        assertEquals("2.5", r("5÷2"))
        assertEquals("-3", r("−3"))
        assertEquals("-4", r("−2^2"))
    }

    @Test fun percent() {
        assertEquals("55", r("50+10%"))
        assertEquals("45", r("50−10%"))
        assertEquals("5", r("50×10%"))
        assertEquals("0.5", r("50%"))
    }

    @Test fun implicitAndParens() {
        assertEquals("6.28318530718", r("2π"))
        assertEquals("12", r("3(1+3)"))
        assertEquals("7", r("(1+2×3"))
    }

    @Test fun functions() {
        assertEquals("0", r("sin(180)"))
        assertEquals("1", r("sin(90)"))
        assertEquals("1", r("sin(π÷2)", deg = false))
        assertEquals("45", r("tan⁻¹(1)"))
        assertEquals("2", r("log(100)"))
        assertEquals("1", r("ln(e)"))
        assertEquals("3", r("√9"))
        assertEquals("4", r("√9+1"))
        assertEquals("120", r("5!"))
        assertEquals("1024", r("2^10"))
        assertEquals("0.5", r("2^(−1)"))
    }

    @Test fun formatting() {
        assertEquals("1E12", Engine.format(1e12))
        assertEquals("1.5E-8", Engine.format(1.5e-8))
        assertEquals("999999999999", Engine.format(999999999999.0))
        assertEquals("1E12", r("1E12"))
        assertEquals("0.333333333333", Engine.format(1.0 / 3))
    }

    @Test fun errors() {
        assertEquals(CalcError.Kind.DIV0, assertThrows(CalcError::class.java) { r("1÷0") }.kind)
        assertEquals(CalcError.Kind.DOMAIN, assertThrows(CalcError::class.java) { r("√(−1)") }.kind)
        assertEquals(CalcError.Kind.FORMAT, assertThrows(CalcError::class.java) { r("2+") }.kind)
    }
}
