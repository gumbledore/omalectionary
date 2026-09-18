import QtQuick
import qs.Commons
import qs.Ui
import "Calendar.js" as Calendar

// Today's liturgical day name on the bar, tinted by season. All the
// computation lives in Calendar.js (pure JS, also importable by node for
// tests); this widget just renders what it returns and recomputes at
// midnight. No lectionary readings yet — that's a later ticket.
BarWidget {
  id: root
  moduleName: "gumbledore.omalectionary"

  property var today: Calendar.dayFor(new Date())
  readonly property string dateKey: today.date

  function refresh() {
    root.today = Calendar.dayFor(new Date())
  }

  // The shell's Color singleton only exposes five roles (foreground,
  // background, accent, urgent, muted) — no raw hue palette to pick a
  // liturgical purple/green from — so "white" and "red" map onto the
  // closest native role (foreground / urgent) and "purple"/"green" fall
  // back to fixed liturgical hex, since neither exposed role stands in for
  // either hue.
  function seasonColor(color) {
    if (color === "white") return Color.foreground
    if (color === "red") return Color.urgent
    if (color === "purple") return "#6b3fa0"
    if (color === "green") return "#3f8f4f"
    return Color.foreground
  }

  readonly property color tint: seasonColor(today.color)

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  // One-shot timer fired at (just after) local midnight, rescheduled every
  // time it fires so the widget never needs a shell restart to roll over.
  Timer {
    id: midnightTimer
    repeat: false
    onTriggered: { root.refresh(); root.scheduleMidnight() }
  }

  function scheduleMidnight() {
    var now = new Date()
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5)
    midnightTimer.interval = Math.max(1000, next.getTime() - now.getTime())
    midnightTimer.restart()
  }

  // Coarse safety net: if the precise timer drifts or the machine slept
  // through it, this catches the date rollover within 10 minutes.
  Timer {
    interval: 600000
    running: true
    repeat: true
    onTriggered: {
      if (Calendar.dayFor(new Date()).date !== root.dateKey) root.refresh()
    }
  }

  Component.onCompleted: {
    root.refresh()
    root.scheduleMidnight()
  }

  WidgetButton {
    id: button
    bar: root.bar
    text: root.today.short
    foreground: root.tint
    useActiveColor: false
    tooltipText: root.today.name + " · Year " + root.today.year + " · " + root.today.season
    // Click is a no-op for now; the overlay entry point is a placeholder.
  }
}
