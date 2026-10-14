@file:OptIn(ExperimentalTextApi::class)

package com.sailxx.oktocalc

import android.content.Context
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.core.graphics.ColorUtils
import java.util.Locale

// ---------- Шрифты ----------

private fun variable(res: Int, vararg weights: Int) = FontFamily(
    weights.map { Font(res, FontWeight(it), variationSettings = FontVariation.Settings(FontVariation.weight(it))) },
)

val Nunito = variable(R.font.nunito, 400, 500, 600, 700, 800, 900)
val Golos = variable(R.font.golos, 400, 500, 600, 700, 800)
val JbMono = variable(R.font.jbmono, 400, 500, 600, 700, 800)

// ---------- Настройки ----------

/** Какая тема выбрана. */
enum class ThemeKind { COLOR, OKTO, OKTO_LIGHT, CUSTOM }

/** Раскладка: «Цветная» (мягкие тональные клавиши) или «Okto» (табло и объёмные клавиши). */
enum class UiStyle { TONAL, OKTO }

enum class Lang {
    RU, EN;

    companion object {
        fun system(): Lang = if (Locale.getDefault().language in setOf("ru", "uk", "be", "kk")) RU else EN
    }
}

data class Settings(
    val kind: ThemeKind = ThemeKind.COLOR,
    val style: UiStyle = UiStyle.TONAL,
    val dark: Boolean = false,
    val hue: Float = 255f,
    val sat: Float = 0.7f,
    val lang: Lang = Lang.system(),
    val deg: Boolean = true,
    val haptics: Boolean = true,
)

class SettingsStore(context: Context) {
    private val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)

    fun load() = Settings(
        kind = enumOr(prefs.getString("kind", null), ThemeKind.COLOR),
        style = enumOr(prefs.getString("style", null), UiStyle.TONAL),
        dark = prefs.getBoolean("dark", false),
        hue = prefs.getFloat("hue", 255f),
        sat = prefs.getFloat("sat", 0.7f),
        lang = enumOr(prefs.getString("lang", null), Lang.system()),
        deg = prefs.getBoolean("deg", true),
        haptics = prefs.getBoolean("haptics", true),
    )

    fun save(s: Settings) {
        prefs.edit()
            .putString("kind", s.kind.name).putString("style", s.style.name)
            .putBoolean("dark", s.dark).putFloat("hue", s.hue).putFloat("sat", s.sat)
            .putString("lang", s.lang.name).putBoolean("deg", s.deg).putBoolean("haptics", s.haptics)
            .apply()
    }

    private inline fun <reified E : Enum<E>> enumOr(name: String?, default: E): E =
        enumValues<E>().firstOrNull { it.name == name } ?: default
}

// ---------- Палитра (та же, что в Okto Notes) ----------

@Immutable
data class Palette(
    val dark: Boolean,
    val bg: Color, val onBg: Color, val muted: Color,
    val surface: Color, val surfaceHi: Color, val outline: Color,
    val primary: Color, val onPrimary: Color,
    val container: Color, val onContainer: Color,
    val accent2: Color, val onAccent2: Color,
    /** «Колодец» — табло. */
    val well: Color, val wellInk: Color, val wellDim: Color, val wellGhost: Color, val wellEdge: Color,
    /** «Клавиша» Okto: тень снизу и блик сверху. */
    val key: Color, val keyInk: Color, val keyEdge: Color, val keyHi: Color,
    val danger: Color,
)

fun hsl(h: Float, s: Float, l: Float, a: Float = 1f): Color {
    val argb = ColorUtils.HSLToColor(floatArrayOf(((h % 360f) + 360f) % 360f, s.coerceIn(0f, 1f), l.coerceIn(0f, 1f)))
    return Color(argb).copy(alpha = a)
}

val ColorPalette = Palette(
    dark = false,
    bg = Color(0xFFF7F2FA), onBg = Color(0xFF1D1B20), muted = Color(0xFF49454F),
    surface = Color.White, surfaceHi = Color(0xFFECE6F0), outline = Color(0xFF79747E),
    primary = Color(0xFF4A2FC0), onPrimary = Color.White,
    container = Color(0xFFE8DEFF), onContainer = Color(0xFF21005D),
    accent2 = Color(0xFFFFD8E4), onAccent2 = Color(0xFF31111D),
    well = Color(0xFFE8DEFF), wellInk = Color(0xFF21005D), wellDim = Color(0xFF4F4566),
    wellGhost = Color(0x1421005D), wellEdge = Color.Transparent,
    key = Color(0xFFECE6F0), keyInk = Color(0xFF1D1B20), keyEdge = Color(0xFFCAC4D0), keyHi = Color.Transparent,
    danger = Color(0xFFB3261E),
)

val OktoPalette = Palette(
    dark = true,
    bg = Color(0xFF141414), onBg = Color(0xFFEDEDED), muted = Color(0xFF8E8E8E),
    surface = Color(0xFF1D1D1D), surfaceHi = Color(0xFF262626), outline = Color(0xFF2A2A2A),
    primary = Color(0xFFEDEDED), onPrimary = Color(0xFF141414),
    container = Color(0xFF262626), onContainer = Color(0xFFEDEDED),
    accent2 = Color(0xFF262626), onAccent2 = Color(0xFFEDEDED),
    well = Color(0xFF0A0A0A), wellInk = Color(0xFFF2F2F2), wellDim = Color(0xFF8A8A8A),
    wellGhost = Color(0x0FFFFFFF), wellEdge = Color(0xFF1F1F1F),
    key = Color(0xFF262626), keyInk = Color(0xFFEDEDED), keyEdge = Color(0xFF070707), keyHi = Color(0x12FFFFFF),
    danger = Color(0xFFEF5A5F),
)

val OktoLightPalette = Palette(
    dark = false,
    bg = Color(0xFFF6F6F6), onBg = Color(0xFF141414), muted = Color(0xFF6B6B6B),
    surface = Color.White, surfaceHi = Color(0xFFEBEBEB), outline = Color(0xFFDADADA),
    primary = Color(0xFF141414), onPrimary = Color(0xFFF6F6F6),
    container = Color(0xFFEBEBEB), onContainer = Color(0xFF141414),
    accent2 = Color(0xFFEBEBEB), onAccent2 = Color(0xFF141414),
    well = Color(0xFFEAEAEA), wellInk = Color(0xFF141414), wellDim = Color(0xFF7A7A7A),
    wellGhost = Color(0x0F000000), wellEdge = Color(0xFFD6D6D6),
    key = Color.White, keyInk = Color(0xFF141414), keyEdge = Color(0xFFC4C4C4), keyHi = Color(0xCCFFFFFF),
    danger = Color(0xFFD33A3F),
)

fun tonalPalette(h: Float, s: Float, dark: Boolean): Palette {
    val ps = s.coerceIn(0f, 1f)
    return if (!dark) Palette(
        dark = false,
        bg = hsl(h, 0.45f * ps, 0.97f), onBg = hsl(h, 0.12f * ps, 0.12f), muted = hsl(h, 0.08f * ps, 0.30f),
        surface = Color.White, surfaceHi = hsl(h, 0.25f * ps, 0.92f), outline = hsl(h, 0.06f * ps, 0.48f),
        primary = hsl(h, maxOf(0.45f, 0.8f * ps), 0.40f), onPrimary = Color.White,
        container = hsl(h, 0.85f * ps, 0.91f), onContainer = hsl(h, 0.65f * ps, 0.18f),
        accent2 = hsl(h + 60f, 0.85f * ps, 0.90f), onAccent2 = hsl(h + 60f, 0.6f * ps, 0.16f),
        well = hsl(h, 0.85f * ps, 0.91f), wellInk = hsl(h, 0.65f * ps, 0.18f), wellDim = hsl(h, 0.15f * ps, 0.36f),
        wellGhost = hsl(h, 0.65f * ps, 0.18f, 0.08f), wellEdge = Color.Transparent,
        key = hsl(h, 0.25f * ps, 0.92f), keyInk = hsl(h, 0.12f * ps, 0.12f), keyEdge = hsl(h, 0.12f * ps, 0.80f),
        keyHi = Color.Transparent, danger = Color(0xFFB3261E),
    ) else Palette(
        dark = true,
        bg = hsl(h, 0.12f * ps, 0.075f), onBg = hsl(h, 0.15f * ps, 0.90f), muted = hsl(h, 0.08f * ps, 0.68f),
        surface = hsl(h, 0.12f * ps, 0.13f), surfaceHi = hsl(h, 0.10f * ps, 0.18f), outline = hsl(h, 0.06f * ps, 0.57f),
        primary = hsl(h, maxOf(0.5f, 0.85f * ps), 0.80f), onPrimary = hsl(h, 0.65f * ps, 0.20f),
        container = hsl(h, 0.35f * ps, 0.30f), onContainer = hsl(h, 0.85f * ps, 0.92f),
        accent2 = hsl(h + 60f, 0.35f * ps, 0.30f), onAccent2 = hsl(h + 60f, 0.8f * ps, 0.90f),
        well = hsl(h, 0.35f * ps, 0.30f), wellInk = hsl(h, 0.85f * ps, 0.92f), wellDim = hsl(h, 0.3f * ps, 0.78f),
        wellGhost = hsl(h, 0.85f * ps, 0.92f, 0.10f), wellEdge = Color.Transparent,
        key = hsl(h, 0.10f * ps, 0.18f), keyInk = hsl(h, 0.15f * ps, 0.90f), keyEdge = Color.Black,
        keyHi = Color.Transparent, danger = Color(0xFFF2B8B5),
    )
}

fun oktoPalette(h: Float, s: Float, dark: Boolean): Palette {
    val ps = s.coerceIn(0f, 1f)
    return if (dark) Palette(
        dark = true,
        bg = hsl(h, 0.18f * ps, 0.08f), onBg = hsl(h, 0.15f * ps, 0.91f), muted = hsl(h, 0.08f * ps, 0.58f),
        surface = hsl(h, 0.15f * ps, 0.11f), surfaceHi = hsl(h, 0.14f * ps, 0.15f), outline = hsl(h, 0.14f * ps, 0.17f),
        primary = if (ps < 0.05f) Color(0xFFEDEDED) else hsl(h, maxOf(0.7f, ps), 0.60f),
        onPrimary = if (ps < 0.05f) Color(0xFF141414) else hsl(h, 0.6f, 0.10f),
        container = hsl(h, 0.14f * ps, 0.15f), onContainer = hsl(h, 0.15f * ps, 0.91f),
        accent2 = hsl(h, 0.14f * ps, 0.15f), onAccent2 = hsl(h, 0.15f * ps, 0.91f),
        well = hsl(h, 0.25f * ps, 0.04f),
        wellInk = if (ps < 0.05f) Color(0xFFF2F2F2) else hsl(h, maxOf(0.75f, ps), 0.66f),
        wellDim = hsl(h, 0.18f * ps, 0.52f),
        wellGhost = if (ps < 0.05f) Color(0x0FFFFFFF) else hsl(h, 0.75f, 0.66f, 0.08f),
        wellEdge = hsl(h, 0.2f * ps, 0.10f),
        key = hsl(h, 0.14f * ps, 0.15f), keyInk = hsl(h, 0.15f * ps, 0.91f), keyEdge = Color.Black,
        keyHi = Color(0x10FFFFFF), danger = Color(0xFFEF5A5F),
    ) else Palette(
        dark = false,
        bg = hsl(h, 0.22f * ps, 0.89f), onBg = hsl(h, 0.30f * ps, 0.12f), muted = hsl(h, 0.12f * ps, 0.34f),
        surface = hsl(h, 0.20f * ps, 0.85f), surfaceHi = hsl(h, 0.25f * ps, 0.95f), outline = hsl(h, 0.18f * ps, 0.76f),
        primary = hsl(h, 0.55f * ps, 0.28f), onPrimary = Color.White,
        container = hsl(h, 0.25f * ps, 0.95f), onContainer = hsl(h, 0.30f * ps, 0.12f),
        accent2 = hsl(h, 0.25f * ps, 0.95f), onAccent2 = hsl(h, 0.30f * ps, 0.12f),
        well = hsl(h, 0.18f * ps, 0.15f), wellInk = hsl(h, 0.55f * ps, 0.86f), wellDim = hsl(h, 0.15f * ps, 0.60f),
        wellGhost = hsl(h, 0.55f * ps, 0.86f, 0.07f), wellEdge = Color(0x66000000),
        key = hsl(h, 0.30f * ps, 0.96f), keyInk = hsl(h, 0.30f * ps, 0.12f), keyEdge = hsl(h, 0.18f * ps, 0.68f),
        keyHi = Color(0xCCFFFFFF), danger = Color(0xFFD33A3F),
    )
}

// ---------- Тема приложения ----------

@Immutable
class AppTheme(val style: UiStyle, val c: Palette) {
    val okto: Boolean get() = style == UiStyle.OKTO
    val font: FontFamily get() = if (okto) Golos else Nunito
}

val LocalAppTheme = staticCompositionLocalOf { AppTheme(UiStyle.TONAL, ColorPalette) }

val T: AppTheme
    @Composable @ReadOnlyComposable get() = LocalAppTheme.current

val C: Palette
    @Composable @ReadOnlyComposable get() = LocalAppTheme.current.c

fun buildTheme(s: Settings): AppTheme = when (s.kind) {
    ThemeKind.COLOR -> AppTheme(UiStyle.TONAL, ColorPalette)
    ThemeKind.OKTO -> AppTheme(UiStyle.OKTO, OktoPalette)
    ThemeKind.OKTO_LIGHT -> AppTheme(UiStyle.OKTO, OktoLightPalette)
    ThemeKind.CUSTOM -> when (s.style) {
        UiStyle.TONAL -> AppTheme(UiStyle.TONAL, tonalPalette(s.hue, s.sat, s.dark))
        UiStyle.OKTO -> AppTheme(UiStyle.OKTO, oktoPalette(s.hue, s.sat, s.dark))
    }
}

@Composable
fun OktoTheme(theme: AppTheme, content: @Composable () -> Unit) {
    val c = theme.c
    val scheme = if (c.dark) {
        darkColorScheme(primary = c.primary, onPrimary = c.onPrimary, background = c.bg, onBackground = c.onBg, surface = c.surface, onSurface = c.onBg, surfaceVariant = c.surfaceHi, outline = c.outline)
    } else {
        lightColorScheme(primary = c.primary, onPrimary = c.onPrimary, background = c.bg, onBackground = c.onBg, surface = c.surface, onSurface = c.onBg, surfaceVariant = c.surfaceHi, outline = c.outline)
    }
    CompositionLocalProvider(LocalAppTheme provides theme) {
        MaterialTheme(colorScheme = scheme) {
            ProvideTextStyle(TextStyle(fontFamily = theme.font, color = c.onBg), content)
        }
    }
}

// ---------- Строки ----------

class Strings(val lang: Lang) {
    private fun t(ru: String, en: String) = if (lang == Lang.RU) ru else en
    val history get() = t("История", "History")
    val settings get() = t("Настройки", "Settings")
    val clear get() = t("Очистить", "Clear")
    val back get() = t("Назад", "Back")
    val emptyHistory get() = t("Пока пусто", "Nothing here yet")
    val copied get() = t("Скопировано", "Copied")
    val deg get() = t("DEG", "DEG")
    val rad get() = t("RAD", "RAD")
    val errDiv0 get() = t("Нельзя делить на 0", "Can't divide by 0")
    val errFormat get() = t("Ошибка формата", "Format error")
    val errDomain get() = t("Недопустимое значение", "Invalid input")
    val theme get() = t("Тема", "Theme")
    val themeColor get() = t("Цветная", "Color")
    val themeOkto get() = "Okto"
    val themeOktoLight get() = "Okto Light"
    val themeCustom get() = t("Своя", "Custom")
    val layout get() = t("Раскладка", "Layout")
    val layoutTonal get() = t("Цветная", "Color")
    val layoutOkto get() = "Okto"
    val darkMode get() = t("Тёмная", "Dark")
    val hue get() = t("Оттенок", "Hue")
    val sat get() = t("Насыщенность", "Saturation")
    val language get() = t("Язык", "Language")
    val angles get() = t("Углы", "Angles")
    val degrees get() = t("Градусы", "Degrees")
    val radians get() = t("Радианы", "Radians")
    val haptics get() = t("Вибро-отклик", "Haptic feedback")
    val sciOpen get() = t("Инженерные функции", "Scientific functions")
    val backspace get() = t("Стереть", "Delete")
    val locale: Locale get() = if (lang == Lang.RU) Locale("ru") else Locale.ENGLISH
}
