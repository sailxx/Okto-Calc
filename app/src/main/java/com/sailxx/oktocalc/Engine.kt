package com.sailxx.oktocalc

import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode
import kotlin.math.*

class CalcError(val kind: Kind) : Exception(kind.name) {
    enum class Kind { DIV0, FORMAT, DOMAIN }
}

/** Вычислитель выражений в духе Google Calculator: проценты, неявное умножение, степени, факториал, тригонометрия. */
object Engine {
    private sealed interface Tok {
        data class Num(val v: Double) : Tok
        data class Op(val c: Char) : Tok
        data class Name(val s: String) : Tok
    }

    val functions = setOf("sin", "cos", "tan", "asin", "acos", "atan", "ln", "log", "abs", "sqrt")

    private fun tokenize(raw: String): List<Tok> {
        val s = raw.replace("sin⁻¹", "asin").replace("cos⁻¹", "acos").replace("tan⁻¹", "atan")
            .replace('−', '-').replace('×', '*').replace('÷', '/').replace('–', '-')
        val out = ArrayList<Tok>()
        var i = 0
        while (i < s.length) {
            val ch = s[i]
            when {
                ch.isWhitespace() || ch == ',' || ch == ' ' || ch == ' ' -> i++
                ch.isDigit() || ch == '.' -> {
                    val st = i
                    while (i < s.length && (s[i].isDigit() || s[i] == '.')) i++
                    // Научная запись результата: 1.5E12, 2E-8
                    if (i < s.length && s[i] == 'E') {
                        var j = i + 1
                        if (j < s.length && (s[j] == '-' || s[j] == '+')) j++
                        if (j < s.length && s[j].isDigit()) {
                            while (j < s.length && s[j].isDigit()) j++
                            i = j
                        }
                    }
                    out += Tok.Num(s.substring(st, i).toDoubleOrNull() ?: throw CalcError(CalcError.Kind.FORMAT))
                }
                ch == 'π' -> { out += Tok.Name("pi"); i++ }
                ch == '√' -> { out += Tok.Op('√'); i++ }
                ch.isLetter() -> {
                    val st = i
                    while (i < s.length && s[i].isLetter() && s[i] != 'π') i++
                    out += Tok.Name(s.substring(st, i))
                }
                ch in "+-*/^%!()" -> { out += Tok.Op(ch); i++ }
                else -> throw CalcError(CalcError.Kind.FORMAT)
            }
        }
        return out
    }

    private class Parser(val t: List<Tok>, val deg: Boolean) {
        var p = 0
        fun peek() = t.getOrNull(p)
        fun isOp(vararg cs: Char) = (peek() as? Tok.Op)?.c?.let { it in cs } == true

        fun parse(): Double {
            val v = expr()
            if (p < t.size) throw CalcError(CalcError.Kind.FORMAT)
            return v
        }

        fun expr(): Double {
            var l = term().first
            while (isOp('+', '-')) {
                val op = (t[p++] as Tok.Op).c
                val (r, pct) = term()
                // «50 + 10%» — процент от левой части
                val rr = if (pct) l * r else r
                l = if (op == '+') l + rr else l - rr
            }
            return l
        }

        private fun startsOperand(x: Tok?) = when (x) {
            is Tok.Num, is Tok.Name -> true
            is Tok.Op -> x.c == '(' || x.c == '√'
            null -> false
        }

        fun term(): Pair<Double, Boolean> {
            var (l, pct) = unary()
            var single = true
            while (true) {
                if (isOp('*', '/')) {
                    val op = (t[p++] as Tok.Op).c
                    val r = unary().first
                    if (op == '/') {
                        if (r == 0.0) throw CalcError(CalcError.Kind.DIV0)
                        l /= r
                    } else l *= r
                } else if (startsOperand(peek())) {
                    l *= unary().first
                } else break
                single = false
            }
            return l to (pct && single)
        }

        fun unary(): Pair<Double, Boolean> = when {
            isOp('-') -> { p++; val (v, _) = unary(); -v to false }
            isOp('+') -> { p++; unary() }
            else -> power()
        }

        fun power(): Pair<Double, Boolean> {
            val (b, pct) = postfix()
            if (isOp('^')) {
                p++
                val e = unary().first
                if (b == 0.0 && e < 0) throw CalcError(CalcError.Kind.DIV0)
                val r = b.pow(e)
                if (r.isNaN()) throw CalcError(CalcError.Kind.DOMAIN)
                return r to false
            }
            return b to pct
        }

        fun postfix(): Pair<Double, Boolean> {
            var v = primary()
            var pct = false
            while (true) {
                if (isOp('!')) { p++; v = factorial(v); pct = false }
                else if (isOp('%')) { p++; v /= 100.0; pct = true }
                else break
            }
            return v to pct
        }

        private fun factorial(v: Double): Double {
            if (v < 0 || v != floor(v) || v > 170) throw CalcError(CalcError.Kind.DOMAIN)
            var r = 1.0
            for (k in 2..v.toInt()) r *= k
            return r
        }

        fun primary(): Double {
            val x = peek() ?: throw CalcError(CalcError.Kind.FORMAT)
            p++
            return when (x) {
                is Tok.Num -> x.v
                is Tok.Op -> when (x.c) {
                    '(' -> {
                        val v = expr()
                        if (isOp(')')) p++ // недостающие скобки закрываются сами
                        v
                    }
                    '√' -> sqrtChecked(postfix().first)
                    else -> throw CalcError(CalcError.Kind.FORMAT)
                }
                is Tok.Name -> when (x.s) {
                    "pi" -> PI
                    "e" -> E
                    in functions -> apply(x.s, argument())
                    else -> throw CalcError(CalcError.Kind.FORMAT)
                }
            }
        }

        private fun argument(): Double =
            if (isOp('(')) { p++; val v = expr(); if (isOp(')')) p++; v } else postfix().first

        private fun sqrtChecked(v: Double): Double {
            if (v < 0) throw CalcError(CalcError.Kind.DOMAIN)
            return sqrt(v)
        }

        private fun snap(v: Double) = if (abs(v) < 1e-14) 0.0 else v

        private fun apply(name: String, a: Double): Double {
            val rad = if (deg) Math.toRadians(a) else a
            val r = when (name) {
                "sin" -> snap(sin(rad))
                "cos" -> snap(cos(rad))
                "tan" -> {
                    if (abs(cos(rad)) < 1e-14) throw CalcError(CalcError.Kind.DOMAIN)
                    snap(tan(rad))
                }
                "asin" -> asin(a).let { if (deg) Math.toDegrees(it) else it }
                "acos" -> acos(a).let { if (deg) Math.toDegrees(it) else it }
                "atan" -> atan(a).let { if (deg) Math.toDegrees(it) else it }
                "ln" -> { if (a <= 0) throw CalcError(CalcError.Kind.DOMAIN); ln(a) }
                "log" -> { if (a <= 0) throw CalcError(CalcError.Kind.DOMAIN); log10(a) }
                "abs" -> abs(a)
                "sqrt" -> sqrtChecked(a)
                else -> throw CalcError(CalcError.Kind.FORMAT)
            }
            if (r.isNaN()) throw CalcError(CalcError.Kind.DOMAIN)
            return r
        }
    }

    fun eval(src: String, deg: Boolean): Double {
        val v = Parser(tokenize(src), deg).parse()
        if (v.isNaN() || v.isInfinite()) throw CalcError(CalcError.Kind.DOMAIN)
        return v
    }

    /** 12 значащих цифр без хвостовых нулей; большие и малые числа — как 1.5E12. */
    fun format(v: Double): String {
        if (v == 0.0) return "0"
        val bd = BigDecimal(v).round(MathContext(12, RoundingMode.HALF_UP)).stripTrailingZeros()
        val a = bd.abs()
        val sci = a >= BigDecimal("1E12") || a < BigDecimal("1E-7")
        if (!sci) return bd.toPlainString()
        val digits = bd.unscaledValue().abs().toString()
        val exp = digits.length - 1 - bd.scale()
        val mant = digits.take(1) + if (digits.length > 1) "." + digits.drop(1) else ""
        return (if (bd.signum() < 0) "-" else "") + mant + "E" + exp
    }
}
