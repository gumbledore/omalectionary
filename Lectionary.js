// Extends Calendar.js's day record with the appointed Sunday/feast readings
// (data/sundays.js) on Sundays and fixed feasts, and with the RCL Daily
// Lectionary (data/daily.js) on other weekdays. dayFor(date, config) never
// reads files itself (node tests pass config directly); the widget reads
// the user's config.json via Quickshell FileView and passes the parsed
// object in.
//
// Cross-file loading note: like Reference.js, this file avoids require()/
// import of sibling files at module scope so the exact same file works
// under `node` (CommonJS) and under Quickshell's QML JS engine (which has
// no require()). Under node, Calendar.js/Reference.js/data/sundays.js/
// data/daily.js are pulled in automatically below. Under QML, BarWidget.qml
// imports those files itself and calls `configure()` once at startup to
// hand them in — see BarWidget.qml's Component.onCompleted.

var Calendar, Reference, SUNDAYS, DAILY
if (typeof require !== "undefined") {
  Calendar = require("./Calendar.js")
  Reference = require("./Reference.js")
  SUNDAYS = require("./data/sundays.js")
  DAILY = require("./data/daily.js")
}

function configure(calendarModule, referenceModule, sundaysTable, dailyTable) {
  Calendar = calendarModule
  Reference = referenceModule
  SUNDAYS = sundaysTable
  if (dailyTable !== undefined) DAILY = dailyTable
}

// Fixed-date feasts that can fall on any weekday. A day governed by one of
// these (i.e. the day itself, not a weekday merely inheriting the reign —
// see isFeastStart) uses that feast's own readings rather than the daily
// table.
var FIXED_WEEKDAY_KEYS = [
  "christmas", "epiphany", "holy-name", "ash-wednesday",
  "holy-monday", "holy-tuesday", "holy-wednesday", "maundy-thursday",
  "good-friday", "holy-saturday", "all-saints", "ascension"
]

function pad2(n) { return n < 10 ? "0" + n : "" + n }

function parseDateString(dateStr) {
  var m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
}

function shiftDateString(dateStr, n) {
  var d = parseDateString(dateStr)
  d.setUTCDate(d.getUTCDate() + n)
  return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate())
}

function nextDateString(dateStr) { return shiftDateString(dateStr, 1) }
function prevDateString(dateStr) { return shiftDateString(dateStr, -1) }

function daysBetween(fromStr, toStr) {
  return Math.round((parseDateString(toStr).getTime() - parseDateString(fromStr).getTime()) / 86400000)
}

// True when `rec` (a Calendar.dayFor record) is itself the actual day a
// Sunday/feast governs — a real Sunday, or a fixed-feast day whose reign
// just started today (as opposed to a weekday merely inheriting an ongoing
// fixed reign, e.g. the Thursday after Ash Wednesday still shows key
// "ash-wednesday" but isn't Ash Wednesday itself).
function isFeastStart(rec) {
  if (rec.weekday === 0) return true
  if (FIXED_WEEKDAY_KEYS.indexOf(rec.key) === -1) return false
  return Calendar.dayFor(prevDateString(rec.date)).key !== rec.key
}

// The next actual Sunday/feast start on or after `today`'s following day —
// used both to find "today's governing feast" when today is itself a
// weekday continuing a fixed reign (old ticket-02 behavior) and, from the
// daily-lectionary side, to find the Sunday/feast that a Thu/Fri/Sat is in
// preparation for.
function resolveGoverning(today) {
  if (isFeastStart(today)) return today
  var d = nextDateString(today.date)
  for (var guard = 0; guard < 400; guard++) {
    var rec = Calendar.dayFor(d)
    if (rec.key !== today.key) return rec
    d = nextDateString(d)
  }
  throw new Error("Lectionary: could not resolve the coming Sunday for " + today.date)
}

// The previous actual Sunday/feast start before `today` — the Sunday/feast
// a Mon/Tue/Wed is responding to.
function resolvePrevious(today) {
  var d = prevDateString(today.date)
  for (var guard = 0; guard < 400; guard++) {
    var rec = Calendar.dayFor(d)
    if (isFeastStart(rec)) return rec
    d = prevDateString(d)
  }
  throw new Error("Lectionary: could not resolve the past Sunday for " + today.date)
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

var SUNDAY_ROLES = ["first", "psalm", "second", "gospel"]

function readingsFor(governing, config) {
  var byYear = SUNDAYS[governing.key]
  if (!byYear) throw new Error("Lectionary: no readings table entry for day key \"" + governing.key + "\"")
  var entry = byYear[governing.year] || byYear["*"]
  if (!entry) throw new Error("Lectionary: no readings for " + governing.key + " year " + governing.year)

  var track = trackFor(config)
  var readings = []
  for (var i = 0; i < SUNDAY_ROLES.length; i++) {
    var role = SUNDAY_ROLES[i]
    if (entry[role] !== undefined) readings.push(buildReading(role, entry[role], track))
  }
  return readings
}

// Daily readings print psalm first, then first/second, per CCT.
var DAILY_ROLES = ["psalm", "first", "second"]

function dailyReadingsFor(key, year, slot, config) {
  var byYear = DAILY[key]
  if (!byYear) return null
  var entry = (byYear[year] || byYear["*"] || {})[slot]
  if (!entry) return null

  var track = trackFor(config)
  var readings = []
  for (var i = 0; i < DAILY_ROLES.length; i++) {
    var role = DAILY_ROLES[i]
    if (entry[role] !== undefined) readings.push(buildReading(role, entry[role], track))
  }
  return readings
}

var AFTER_SLOTS = ["mon", "tue", "wed"] // weekday 1,2,3: response to the past Sunday
var BEFORE_SLOTS = ["thu", "fri", "sat"] // weekday 4,5,6: preparation for the coming Sunday

// Resolves the (key, year, slot) that governs a non-feast weekday's daily
// readings. Easter Week (days 1-6 after Easter Day) is a documented special
// case: CCT gives it its own full Monday-Saturday octave of readings under
// the "easter" key rather than splitting it between "easter" (response,
// days 1-3) and "easter-2" (preparation, days 4-6) the way every other week
// would generically resolve — so all six Easter Week days point at "easter"
// itself. Every other week (including the days around Ash Wednesday,
// Christmas, and Epiphany) needs no special case: those fixed feasts are
// either exactly 3 days from the neighboring Sunday (Ash Wednesday sits
// midweek, so "the 3 days after it" and "the 3 days before Lent 1" are the
// same days) or, in the rare case a fixed reign runs longer (e.g. Christmas
// Day falling on a Sunday, pushing "Christmas 1" past New Year), simply has
// no daily-table entry and falls back to the governing feast's own Sunday
// reading (see the null-entry fallback below).
function resolveDailySlot(today) {
  var sinceEaster = daysBetween(today.easter, today.date)
  if (sinceEaster >= 1 && sinceEaster <= 6) {
    return { key: "easter", year: today.year, slot: AFTER_SLOTS.concat(BEFORE_SLOTS)[sinceEaster - 1] }
  }
  if (today.weekday >= 1 && today.weekday <= 3) {
    var prev = resolvePrevious(today)
    return { key: prev.key, year: prev.year, slot: AFTER_SLOTS[today.weekday - 1] }
  }
  var next = resolveGoverning(today)
  return { key: next.key, year: next.year, slot: BEFORE_SLOTS[today.weekday - 4] }
}

function dayFor(date, config) {
  var today = Calendar.dayFor(date)
  var result = {}
  for (var k in today) result[k] = today[k]

  if (isFeastStart(today)) {
    result.readings = readingsFor(today, config)
    result.source = "sunday"
    return result
  }

  var target = resolveDailySlot(today)
  var readings = dailyReadingsFor(target.key, target.year, target.slot, config)
  if (!readings) {
    // Rare fallback (e.g. a fixed reign running unusually long): show the
    // governing feast's own Sunday/feast readings rather than crashing.
    var governing = today.weekday >= 4 ? resolveGoverning(today) : resolvePrevious(today)
    readings = readingsFor(governing, config)
  }
  result.readings = readings
  result.source = "daily"
  return result
}

if (typeof module !== "undefined") {
  module.exports = { dayFor: dayFor, configure: configure, resolveDailySlot: resolveDailySlot }
}
