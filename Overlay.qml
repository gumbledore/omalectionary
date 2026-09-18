import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import QtQuick
import qs.Commons
import qs.Ui
import "Calendar.js" as Calendar
import "Reference.js" as Reference
import "data/sundays.js" as SundaysData
import "data/daily.js" as DailyData
import "Lectionary.js" as Lectionary
import "Config.js" as Config
import "Text.js" as ReadingText

// Full-height reading overlay: header (date + liturgical day), a tab row
// naming each appointed reading, and one reading at a time in a centered
// serif column. Structured after gumbledore.reminders/ReminderFlow.qml (its
// own PanelWindow, `shell`/`manifest`/`opened` properties, exclusive
// keyboard focus while open) since that's this shell's reference overlay
// plugin. BarWidget.qml's click handler and bin/omalectionary both reach
// this through the IpcHandler below.
Item {
  id: root

  property var shell: null
  property var manifest: null
  property bool opened: false

  readonly property string homePath: Quickshell.env("HOME")
  readonly property string configPath: (Quickshell.env("XDG_CONFIG_HOME") || (homePath + "/.config")) + "/omalectionary/config.json"
  // This QML file's own directory, so the bundled data/bsb.json can be
  // found regardless of where the plugin is installed/symlinked.
  readonly property string pluginDir: Qt.resolvedUrl(".").toString().replace(/^file:\/\//, "").replace(/\/$/, "")

  // A serif readable at length; checked against `fc-list` for this machine
  // (Noto Serif ships with the system), with a generic fallback.
  readonly property string serifFamily: "Noto Serif, serif"

  property var config: ({ track: 2 })
  property var today: ({ short: "", name: "", year: "", season: "", color: "white", date: "", readings: [] })
  property var bsb: null
  property int activeIndex: 0

  readonly property var activeReading: (root.today.readings.length > activeIndex) ? root.today.readings[activeIndex] : null
  readonly property var activeVerses: (root.activeReading && root.bsb)
    ? ReadingText.resolve({ book: root.activeReading.book, ranges: root.activeReading.ranges }, root.bsb)
    : []

  function refresh() {
    // 4th arg (the RCL Daily Lectionary table) is ticket 04's addition to
    // Lectionary.configure -- required on every weekday, not just Sundays.
    Lectionary.configure(Calendar, Reference, SundaysData.SUNDAYS, DailyData.DAILY)
    root.today = Lectionary.dayFor(new Date(), root.config)
    if (root.activeIndex >= root.today.readings.length) root.activeIndex = 0
  }

  function open() {
    root.refresh()
    root.opened = true
    Qt.callLater(function () { keyCatcher.forceActiveFocus() })
  }

  function close() { root.opened = false }

  function dismiss() {
    root.opened = false
    if (root.shell && typeof root.shell.hide === "function")
      root.shell.hide((root.manifest && root.manifest.id) || "gumbledore.omalectionary")
  }

  function toggle() { if (root.opened) root.dismiss(); else root.open() }

  function selectReading(index) {
    if (index < 0 || index >= root.today.readings.length) return
    root.activeIndex = index
    readingFlick.contentY = 0
  }

  Component.onCompleted: root.refresh()

  FileView {
    id: configFile
    path: root.configPath
    printErrors: false
    watchChanges: true
    onLoaded: { root.config = Config.parseConfig(text()); root.refresh() }
    onLoadFailed: { root.config = Config.parseConfig(""); root.refresh() }
    onFileChanged: reload()
  }

  // Loaded once; ~4 MB of JSON parses in well under a second and the
  // overlay only ever needs today's handful of verses out of it.
  FileView {
    id: bsbFile
    path: root.pluginDir + "/data/bsb.json"
    printErrors: true
    onLoaded: {
      try { root.bsb = JSON.parse(text()) } catch (e) { root.bsb = {} }
    }
    onLoadFailed: { root.bsb = {} }
  }

  IpcHandler {
    target: "gumbledore.omalectionary"
    function open(): void { root.open() }
    function close(): void { root.dismiss() }
    function toggle(): void { root.toggle() }
  }

  function parseLocalDate(dateStr) {
    var m = String(dateStr || "").match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!m) return new Date()
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }

  function toHex(c) {
    function h(x) { var s = Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16); return s.length < 2 ? "0" + s : s }
    return "#" + h(c.r) + h(c.g) + h(c.b)
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  }

  // One verse as rich text: a small muted superscript number, then the
  // verse's own poetry/paragraph newlines preserved as <br>.
  function verseHtml(v) {
    var body = escapeHtml(v.text).replace(/\n/g, "<br>")
    return "<font color=\"" + root.toHex(Color.muted) + "\" size=\"2\"><sup>" + v.verse + "</sup></font>&#160;" + body
  }

  PanelWindow {
    id: panel
    visible: root.opened
    anchors { top: true; bottom: true; left: true; right: true }
    color: "transparent"
    WlrLayershell.namespace: "omalectionary-overlay"
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.keyboardFocus: WlrKeyboardFocus.Exclusive
    exclusionMode: ExclusionMode.Ignore

    Rectangle {
      anchors.fill: parent
      color: Color.background
    }

    // A 65-character sample at the reading column's own font/size, per the
    // ticket's "compute via a TextMetrics on a 65-char string" -- this is
    // what fixes the column's width regardless of window size.
    TextMetrics {
      id: columnMetrics
      font.family: root.serifFamily
      font.pixelSize: Style.font.body
      text: Array(66).join("n")
    }

    Item {
      id: keyCatcher
      anchors.fill: parent
      focus: true
      Keys.priority: Keys.BeforeItem
      Keys.onPressed: function (event) {
        var handled = true
        if (event.key === Qt.Key_Escape) {
          root.dismiss()
        } else if (event.key === Qt.Key_Left || event.key === Qt.Key_H) {
          root.selectReading(root.activeIndex - 1)
        } else if (event.key === Qt.Key_Right || event.key === Qt.Key_L) {
          root.selectReading(root.activeIndex + 1)
        } else if (event.key >= Qt.Key_1 && event.key <= Qt.Key_9) {
          root.selectReading(event.key - Qt.Key_1)
        } else if (event.key === Qt.Key_Up || event.key === Qt.Key_K) {
          readingFlick.contentY = Math.max(0, readingFlick.contentY - 80)
        } else if (event.key === Qt.Key_Down || event.key === Qt.Key_J) {
          readingFlick.contentY = Math.min(Math.max(0, readingFlick.contentHeight - readingFlick.height), readingFlick.contentY + 80)
        } else if (event.key === Qt.Key_PageUp) {
          readingFlick.contentY = Math.max(0, readingFlick.contentY - readingFlick.height * 0.9)
        } else if (event.key === Qt.Key_PageDown) {
          readingFlick.contentY = Math.min(Math.max(0, readingFlick.contentHeight - readingFlick.height), readingFlick.contentY + readingFlick.height * 0.9)
        } else {
          handled = false
        }
        event.accepted = handled
      }
    }

    Column {
      id: layout
      anchors.fill: parent
      anchors.margins: Style.spacing.panelPadding
      spacing: Style.spacing.lg

      // -- header: full date, then "Proper 19 · Year A · Season after Pentecost" --
      Column {
        id: dateHeader
        width: parent.width
        spacing: Style.spacing.xxs

        Text {
          text: root.today.date ? Qt.formatDate(root.parseLocalDate(root.today.date), "dddd, MMMM d, yyyy") : ""
          color: Color.foreground
          font.family: Style.font.family
          font.pixelSize: Style.font.heading
        }
        Text {
          text: root.today.name + " · Year " + root.today.year + " · " + root.today.season
          color: Color.muted
          font.family: Style.font.family
          font.pixelSize: Style.font.body
        }
      }

      // -- reading tabs --
      Row {
        id: tabRow
        width: parent.width
        spacing: Style.spacing.sm

        Repeater {
          model: root.today.readings
          delegate: Rectangle {
            readonly property bool active: index === root.activeIndex
            width: tabLabel.implicitWidth + Style.spacing.controlPaddingX * 2
            height: tabLabel.implicitHeight + Style.spacing.controlPaddingY * 2
            radius: Style.cornerRadius
            color: active ? Style.selectedFill : "transparent"
            border.width: active ? Style.selectedBorderWidth : 0
            border.color: Style.selectedBorderColor

            Text {
              id: tabLabel
              anchors.centerIn: parent
              text: modelData.label
              color: active ? Color.foreground : Color.muted
              font.family: Style.font.family
              font.pixelSize: Style.font.body
            }

            MouseArea {
              anchors.fill: parent
              cursorShape: Qt.PointingHandCursor
              onClicked: root.selectReading(index)
            }
          }
        }
      }

      // -- the reading itself: centered, ~65 characters wide, scrolls --
      Flickable {
        id: readingFlick
        width: parent.width
        height: parent.height - layout.spacing * 2 - dateHeader.height - tabRow.height
        contentWidth: width
        contentHeight: readingColumn.height
        clip: true
        boundsBehavior: Flickable.StopAtBounds

        Column {
          id: readingColumn
          x: Math.max(0, (readingFlick.width - width) / 2)
          width: Math.min(columnMetrics.width, readingFlick.width)
          spacing: Style.spacing.lg

          Repeater {
            model: root.activeVerses
            delegate: Text {
              width: readingColumn.width
              textFormat: Text.RichText
              wrapMode: Text.WordWrap
              text: root.verseHtml(modelData)
              color: Color.foreground
              opacity: modelData.optional ? 0.6 : 1.0
              font.family: root.serifFamily
              font.pixelSize: Style.font.body
              lineHeight: 1.5
              lineHeightMode: Text.ProportionalHeight
            }
          }

          Text {
            visible: root.bsb && root.activeVerses.length === 0
            width: readingColumn.width
            text: "No text available for this reading."
            color: Color.muted
            font.family: root.serifFamily
            font.pixelSize: Style.font.body
          }
        }
      }
    }
  }
}
