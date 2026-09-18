import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Calendar.js" as Calendar
import "Reference.js" as Reference
import "data/sundays.js" as SundaysData
import "data/daily.js" as DailyData
import "Lectionary.js" as Lectionary
import "Config.js" as Config

// Today's liturgical day name on the bar, tinted by season, with the
// appointed readings (Sunday/feast set; coming Sunday's on a weekday) in the
// tooltip. Calendar.js/Reference.js/Lectionary.js/Config.js are plain JS,
// also importable by node for tests — this widget just wires the sibling JS
// files together (see Lectionary.js's header comment for why that wiring
// happens here instead of via require()) and renders the result.
BarWidget {
  id: root
  moduleName: "gumbledore.omalectionary"

  readonly property string homePath: Quickshell.env("HOME")
  readonly property string configPath: (Quickshell.env("XDG_CONFIG_HOME") || (homePath + "/.config")) + "/omalectionary/config.json"
  readonly property string pluginDir: Qt.resolvedUrl(".").toString().replace(/^file:\/\//, "").replace(/\/$/, "")

  property var config: ({ track: 2 })
  property var today: ({ short: "", name: "", year: "", season: "", color: "white", date: "", readings: [] })
  readonly property string dateKey: today.date

  function refresh() {
    // Idempotent and cheap — called here (rather than once in
    // Component.onCompleted) so a refresh triggered by the async FileView
    // load can never race ahead of the wiring.
    // 4th arg (the RCL Daily Lectionary table) is ticket 04's addition to
    // Lectionary.configure -- required on every weekday, not just Sundays.
    Lectionary.configure(Calendar, Reference, SundaysData.SUNDAYS, DailyData.DAILY)
    root.today = Lectionary.dayFor(new Date(), root.config)
  }

  Component.onCompleted: {
    root.refresh()
    root.scheduleMidnight()
  }

  FileView {
    id: configFile
    path: root.configPath
    printErrors: false
    watchChanges: true
    onLoaded: { root.config = Config.parseConfig(text()); root.refresh() }
    onLoadFailed: { root.config = Config.parseConfig(""); root.refresh() }
    onFileChanged: reload()
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

  function readingsLine() {
    return root.today.readings.map(function (r) { return r.label }).join(" · ")
  }

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

  WidgetButton {
    id: button
    bar: root.bar
    text: root.today.short
    foreground: root.tint
    useActiveColor: false
    tooltipText: root.today.name + " · Year " + root.today.year + "\n" + root.readingsLine()
    onPressed: Quickshell.execDetached([root.pluginDir + "/bin/omalectionary", "show-overlay"])
  }
}
