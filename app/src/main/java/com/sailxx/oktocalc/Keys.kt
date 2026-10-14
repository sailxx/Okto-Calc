package com.sailxx.oktocalc

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class KeyKind { DIGIT, OP, SCI, EQ, CLEAR, DEL }

private fun colorsFor(kind: KeyKind, t: AppTheme): Pair<Color, Color> {
    val c = t.c
    return if (!t.okto) when (kind) {
        KeyKind.DIGIT -> c.surface to c.onBg
        KeyKind.OP -> c.container to c.onContainer
        KeyKind.SCI -> c.surfaceHi to c.onBg
        KeyKind.EQ -> c.primary to c.onPrimary
        KeyKind.CLEAR -> c.accent2 to c.onAccent2
        KeyKind.DEL -> c.surfaceHi to c.onBg
    } else when (kind) {
        KeyKind.DIGIT -> c.key to c.keyInk
        KeyKind.OP -> c.key to c.primary
        KeyKind.SCI -> c.key to c.keyInk
        KeyKind.EQ -> c.primary to c.onPrimary
        KeyKind.CLEAR -> c.key to c.danger
        KeyKind.DEL -> c.key to c.keyInk
    }
}

/**
 * Скруглённая клавиша. «Цветная» — тональная заливка, при нажатии форма из круга «сжимается» в скруглённый квадрат.
 * Okto — объёмная клавиша: тёмная кромка снизу и блик сверху, при нажатии вдавливается.
 */
@Composable
fun CalcKey(
    label: String,
    kind: KeyKind,
    modifier: Modifier = Modifier,
    active: Boolean = false,
    small: Boolean = false,
    desc: String = label,
    onLong: (() -> Unit)? = null,
    icon: (@Composable (Color) -> Unit)? = null,
    onTap: () -> Unit,
) {
    val t = T
    val c = t.c
    var pressed by remember { mutableStateOf(false) }
    val tap by rememberUpdatedState(onTap)
    val long by rememberUpdatedState(onLong)

    val (bg0, fg0) = colorsFor(kind, t)
    val bg = if (active) c.primary else bg0
    val fg = if (active) c.onPrimary else fg0

    val pct by animateIntAsState(if (pressed) 30 else 50, tween(120), label = "pct")
    val rad by animateDpAsState(
        if (pressed) (if (small) 8.dp else 12.dp) else (if (small) 14.dp else 22.dp), tween(100), label = "rad",
    )
    val edge by animateDpAsState(if (pressed) 0.dp else 3.dp, tween(80), label = "edge")
    val shape = if (t.okto) RoundedCornerShape(rad) else RoundedCornerShape(pct)

    val gestures = Modifier
        .semantics {
            role = Role.Button
            contentDescription = desc
            onClick { tap(); true }
        }
        .pointerInput(Unit) {
            detectTapGestures(
                onPress = { pressed = true; tryAwaitRelease(); pressed = false },
                onLongPress = { if (long != null) long?.invoke() else tap() },
                onTap = { tap() },
            )
        }

    val content: @Composable () -> Unit = {
        if (icon != null) icon(fg) else Text(
            label,
            color = fg,
            fontFamily = if (t.okto) JbMono else Nunito,
            fontWeight = if (t.okto) FontWeight.Medium else FontWeight.ExtraBold,
            fontSize = when {
                small && t.okto -> 13.sp
                small -> 16.sp
                t.okto -> 26.sp
                else -> 30.sp
            },
            maxLines = 1,
        )
    }

    if (t.okto) {
        Box(modifier.clip(shape).background(c.keyEdge).then(gestures)) {
            Box(
                Modifier
                    .fillMaxSize()
                    .padding(bottom = edge)
                    .clip(shape)
                    .background(bg)
                    .drawBehind { drawRect(c.keyHi, size = Size(size.width, 1.dp.toPx())) },
                contentAlignment = Alignment.Center,
            ) { content() }
        }
    } else {
        Box(modifier.clip(shape).background(bg).then(gestures), contentAlignment = Alignment.Center) { content() }
    }
}

@Composable
fun BackspaceIcon(color: Color) {
    Canvas(Modifier.size(28.dp)) {
        val w = size.width
        val h = size.height
        val st = Stroke(width = 2.2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
        val p = Path().apply {
            moveTo(w * 0.34f, h * 0.2f); lineTo(w * 0.9f, h * 0.2f); lineTo(w * 0.9f, h * 0.8f)
            lineTo(w * 0.34f, h * 0.8f); lineTo(w * 0.08f, h * 0.5f); close()
        }
        drawPath(p, color, style = st)
        drawLine(color, Offset(w * 0.48f, h * 0.38f), Offset(w * 0.72f, h * 0.62f), st.width, StrokeCap.Round)
        drawLine(color, Offset(w * 0.72f, h * 0.38f), Offset(w * 0.48f, h * 0.62f), st.width, StrokeCap.Round)
    }
}
