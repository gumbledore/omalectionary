// Extends Calendar.js's day record with the appointed Sunday/feast readings.
// dayFor(date, config) never reads files itself (node tests pass config
// directly); the widget reads the user's config.json via Quickshell FileView
// and passes the parsed object in.
//
// Cross-file loading note: like Reference.js, this file avoids require()/
// import of sibling files at module scope so the exact same file works
// under `node` (CommonJS) and under Quickshell's QML JS engine (which has
// no require()). Under node, Calendar.js/Reference.js/data/sundays.js are
// pulled in automatically below. Under QML, BarWidget.qml imports those
// three files itself and calls `configure()` once at startup to hand them
// in — see BarWidget.qml's Component.onCompleted.

var Calendar, Reference, SUNDAYS
if (typeof require !== "undefined") {
  Calendar = require("./Calendar.js")
  Reference = require("./Reference.js")
  SUNDAYS = require("./data/sundays.js")
}

function configure(calendarModule, referenceModule, sundaysTable) {
  Calendar = calendarModule
  Reference = referenceModule
  SUNDAYS = sundaysTable
}

// Fixed-date feasts that can fall on any weekday. Per the ticket, a weekday
// governed by one of these uses that feast's own readings rather than
// looking ahead to the next Sunday.
var FIXED_WEEKDAY_KEYS = [
  "christmas", "epiphany", "holy-name", "ash-wednesday",
  "holy-monday", "holy-tuesday", "holy-wednesday", "maundy-thursday",
  "good-friday", "holy-saturday", "all-saints", "ascension"
]

function pad2(n) { return n < 10 ? "0" + n : "" + n }

function nextDateString(dateStr) {
  var m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  var d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  d.setUTCDate(d.getUTCDate() + 1)
  return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate())
}

// The calendar record whose readings should be shown: `today` itself if
// it's a Sunday or one of the fixed feasts above, otherwise the record for
// the next Sunday or next fixed feast, whichever comes first.
function resolveGoverning(today) {
  if (today.weekday === 0) return today
  if (FIXED_WEEKDAY_KEYS.indexOf(today.key) !== -1) return today

  var d = nextDateString(today.date)
  for (var guard = 0; guard < 400; guard++) {
    var rec = Calendar.dayFor(d)
    if (rec.key !== today.key) return rec
    d = nextDateString(d)
  }
  throw new Error("Lectionary: could not resolve the coming Sunday for " + today.date)
}

function trackFor(config) {
  var t = config && config.track
  return (t === 1 || t === 2) ? t : 2
}

// Resolves a raw reading value (string | {ref,alt} | {"1":.., "2":..}) to
// { ref, alt }, applying the track split only when present.
function normalizeReading(raw, track) {
  var value = raw
  if (value && typeof value === "object" && (value["1"] !== undefined || value["2"] !== undefined)) {
    value = value[String(track)] !== undefined ? value[String(track)] : value["2"]
  }
  if (typeof value === "string") return { ref: value, alt: undefined }
  return { ref: value.ref, alt: value.alt }
}

function buildReading(role, raw, track) {
  var norm = normalizeReading(raw, track)
  var parsed = Reference.parseRef(norm.ref)
  var reading = {
    role: role,
    ref: norm.ref,
    label: Reference.formatLabel(parsed),
    book: parsed.book,
    ranges: parsed.ranges
  }
  if (norm.alt) reading.alt = norm.alt
  return reading
}

var ROLES = ["first", "psalm", "second", "gospel"]

function readingsFor(governing, config) {
  var byYear = SUNDAYS[governing.key]
  if (!byYear) throw new Error("Lectionary: no readings table entry for day key \"" + governing.key + "\"")
  var entry = byYear[governing.year] || byYear["*"]
  if (!entry) throw new Error("Lectionary: no readings for " + governing.key + " year " + governing.year)

  var track = trackFor(config)
  var readings = []
  for (var i = 0; i < ROLES.length; i++) {
    var role = ROLES[i]
    if (entry[role] !== undefined) readings.push(buildReading(role, entry[role], track))
  }
  return readings
}

function dayFor(date, config) {
  var today = Calendar.dayFor(date)
  var governing = resolveGoverning(today)
  var readings = readingsFor(governing, config)

  var result = {}
  for (var k in today) result[k] = today[k]
  result.readings = readings
  return result
}

if (typeof module !== "undefined") {
  module.exports = { dayFor: dayFor, configure: configure }
}
