package com.sailxx.oktocalc

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Pad = 16.dp

@Composable
private fun Header(title: String, left: String, onLeft: () -> Unit, right: String? = null, onRight: () -> Unit = {}) {
    val c = C
    Row(Modifier.fillMaxWidth().padding(bottom = 14.dp), verticalAlignment = Alignment.CenterVertically) {
        PanelChip(left, onLeft)
        Text(
            title.uppercase(),
            Modifier.weight(1f),
            color = c.onBg,
            textAlign = TextAlign.Center,
            fontFamily = JbMono,
            fontWeight = FontWeight.SemiBold,
            fontSize = 14.sp,
            letterSpacing = 1.sp,
        )
        if (right != null) PanelChip(right, onRight) else Spacer(Modifier.size(1.dp))
    }
}

@Composable
private fun PanelChip(text: String, onClick: () -> Unit, selected: Boolean = false, modifier: Modifier = Modifier) {
    val c = C
    val shape = RoundedCornerShape(10.dp)
    val bg = if (selected) c.primary else c.key
    val fg = if (selected) c.onPrimary else c.keyInk
    Box(
        modifier
            .clip(shape)
            .background(bg)
            .then(if (!selected) Modifier.border(BorderStroke(1.dp, c.outline), shape) else Modifier)
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text.uppercase(),
            color = fg,
            fontFamily = JbMono,
            fontWeight = FontWeight.SemiBold,
            fontSize = 12.sp,
            letterSpacing = 0.8.sp,
            maxLines = 1,
        )
    }
}

@Composable
private fun Card(modifier: Modifier = Modifier, onClick: (() -> Unit)? = null, content: @Composable () -> Unit) {
    val c = C
    val shape = RoundedCornerShape(14.dp)
    Box(
        modifier
            .fillMaxWidth()
            .clip(shape)
            .background(c.surface)
            .border(BorderStroke(1.dp, c.outline), shape)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(16.dp),
    ) { content() }
}

@Composable
private fun Caption(text: String) {
    Text(
        text.uppercase(),
        Modifier.padding(start = 4.dp, bottom = 8.dp, top = 18.dp),
        color = C.muted,
        fontFamily = JbMono,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        letterSpacing = 0.8.sp,
    )
}

@Composable
private fun Row2(a: @Composable (Modifier) -> Unit, b: @Composable (Modifier) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        a(Modifier.weight(1f)); b(Modifier.weight(1f))
    }
}

@Composable
private fun Row3(a: @Composable (Modifier) -> Unit, b: @Composable (Modifier) -> Unit, c: @Composable (Modifier) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        a(Modifier.weight(1f)); b(Modifier.weight(1f)); c(Modifier.weight(1f))
    }
}

@Composable
fun HistoryScreen(state: CalcState, s: Strings, onBack: () -> Unit) {
    val c = C
    Column(Modifier.fillMaxSize().padding(Pad)) {
        Header(s.history, s.back, onBack, if (state.history.isNotEmpty()) s.clear else null) { state.clearHistory() }
        if (state.history.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(s.emptyHistory, color = c.muted, fontSize = 15.sp)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.history) { h ->
                    Card(onClick = { state.insert(h.result); onBack() }) {
                        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.End) {
                            Text(
                                CalcState.pretty(h.expr, " ") + " =", color = c.muted, maxLines = 2, textAlign = TextAlign.End,
                                fontFamily = JbMono, fontSize = 14.sp,
                            )
                            Text(
                                CalcState.pretty(h.result, " "), color = c.onBg, maxLines = 1,
                                fontFamily = JbMono, fontWeight = FontWeight.Medium, fontSize = 26.sp,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsScreen(settings: Settings, s: Strings, onChange: (Settings) -> Unit, onBack: () -> Unit) {
    val c = C
    Column(Modifier.fillMaxSize().padding(Pad)) {
        Header(s.settings, s.back, onBack)
        Column(Modifier.verticalScroll(rememberScrollState())) {
            Caption(s.theme)
            Row3(
                { PanelChip(s.themeSystem, { onChange(settings.copy(kind = ThemeKind.SYSTEM)) }, settings.kind == ThemeKind.SYSTEM, it) },
                { PanelChip(s.themeDark, { onChange(settings.copy(kind = ThemeKind.OKTO)) }, settings.kind == ThemeKind.OKTO, it) },
                { PanelChip(s.themeLight, { onChange(settings.copy(kind = ThemeKind.OKTO_LIGHT)) }, settings.kind == ThemeKind.OKTO_LIGHT, it) },
            )

            Caption(s.angles)
            Row2(
                { PanelChip(s.degrees, { onChange(settings.copy(deg = true)) }, settings.deg, it) },
                { PanelChip(s.radians, { onChange(settings.copy(deg = false)) }, !settings.deg, it) },
            )

            Caption(s.language)
            Row2(
                { PanelChip("Русский", { onChange(settings.copy(lang = Lang.RU)) }, settings.lang == Lang.RU, it) },
                { PanelChip("English", { onChange(settings.copy(lang = Lang.EN)) }, settings.lang == Lang.EN, it) },
            )

            Spacer(Modifier.height(18.dp))
            Card { SwitchRow(s.haptics, settings.haptics) { onChange(settings.copy(haptics = it)) } }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SwitchRow(label: String, value: Boolean, onChange: (Boolean) -> Unit) {
    val c = C
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, Modifier.weight(1f), color = c.onBg, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        Switch(
            value, onChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = c.onPrimary, checkedTrackColor = c.primary,
                uncheckedThumbColor = c.muted, uncheckedTrackColor = c.surfaceHi, uncheckedBorderColor = c.outline,
            ),
        )
    }
}

