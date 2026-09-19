// Pure calendar logic for the Revised Common Lectionary (CCT base): Gregorian
// Easter, then every moveable season derived from it, then a mapping from a
// date to a liturgical day key. No lectionary readings yet (later ticket) —
// dayFor() already returns the shape a wrapper can extend with readings.
//
// Everything here works with local calendar dates (year, month, day), not
// timezones. Internally all arithmetic runs on Date objects built with
// Date.UTC so day-math never touches DST; only the final `date` field is
// formatted back out as "YYYY-MM-DD".

var ORDINALS = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth",
  "Seventh", "Eighth", "Ninth", "Tenth"]

function pad2(n) { return n < 10 ? "0" + n : "" + n }

function makeDate(y, m, d) {
  // m is 1-based here; Date.UTC wants 0-based months.
  return new Date(Date.UTC(y, m - 1, d))
}

function addDays(date, n) {
  var d = new Date(date.getTime())
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function sameDate(a, b) {
  return a.getTime() === b.getTime()
}

function toDateString(date) {
  return date.getUTCFullYear() + "-" + pad2(date.getUTCMonth() + 1) + "-" + pad2(date.getUTCDate())
}

// Sunday on or before `date` (0 days back if already a Sunday).
function sundayOnOrBefore(date) {
  return addDays(date, -date.getUTCDay())
}

// First Sunday strictly after `date`.
function sundayStrictlyAfter(date) {
  var toNext = 7 - date.getUTCDay()
  return addDays(date, toNext)
}

// Advent 1 of calendar year `y`: the Sunday between Nov 27 and Dec 3, found
// by walking back from Dec 3 to the nearest Sunday (at most 6 days back,
// which always lands within that window).
function advent1(y) {
  return sundayOnOrBefore(makeDate(y, 12, 3))
}

// Gregorian Easter (Meeus/Jones/Butcher "anonymous" algorithm), returns a
// Date for Easter Sunday of calendar year `y`.
function gregorianEaster(y) {
  var a = y % 19
  var b = Math.floor(y / 100)
  var c = y % 100
  var d = Math.floor(b / 4)
  var e = b % 4
  var f = Math.floor((b + 8) / 25)
  var g = Math.floor((b - f + 1) / 3)
  var h = (19 * a + b - d - g + 15) % 30
  var i = Math.floor(c / 4)
  var k = c % 4
  var l = (32 + 2 * e + 2 * i - h - k) % 7
  var m = Math.floor((a + 11 * h + 22 * l) / 451)
  var month = Math.floor((h + l - 7 * m + 114) / 31)
  var day = ((h + l - 7 * m + 114) % 31) + 1
  return makeDate(y, month, day)
}

// Accepts a Date object (read via local getters, matching `new Date(y, m-1,
// d)`) or a "YYYY-MM-DD" string, and returns {y, m, d}.
function extractYMD(input) {
  if (input instanceof Date) {
    return { y: input.getFullYear(), m: input.getMonth() + 1, d: input.getDate() }
  }
  var s = String(input || "")
  var match = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) throw new Error("Calendar: expected a Date or YYYY-MM-DD string, got " + s)
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

// Build the ordered chain of "reigns" for the church year beginning Advent 1
// of calendar year `sy` (season-year). Each entry governs every day from its
// own date up to (but not including) the next entry's date — this is what
// lets weekdays "inherit" the preceding Sunday/feast with no extra logic.
// Also returns the three single-day "spikes" (fixed feasts that interrupt a
// reign for one day only, with the surrounding reign continuing around them).
function buildChurchYear(sy) {
  var y2 = sy + 1
  var reigns = []

  var adv1 = advent1(sy)
  reigns.push({ date: adv1, key: "advent-1", name: "First Sunday of Advent", short: "Advent 1", season: "Advent", color: "purple" })
  reigns.push({ date: addDays(adv1, 7), key: "advent-2", name: "Second Sunday of Advent", short: "Advent 2", season: "Advent", color: "purple" })
  reigns.push({ date: addDays(adv1, 14), key: "advent-3", name: "Third Sunday of Advent", short: "Advent 3", season: "Advent", color: "purple" })
  reigns.push({ date: addDays(adv1, 21), key: "advent-4", name: "Fourth Sunday of Advent", short: "Advent 4", season: "Advent", color: "purple" })

  var christmas = makeDate(sy, 12, 25)
  reigns.push({ date: christmas, key: "christmas", name: "Nativity of the Lord", short: "Christmas", season: "Christmas", color: "white" })

  // First/second Sunday after Christmas only exist if they land within the
  // Dec 26-31 / Jan 2-5 windows; when Christmas Day itself is a Sunday the
  // next Sunday is Jan 1 (Holy Name), so there is no "Christmas 1" that year.
  var christmas1 = sundayStrictlyAfter(christmas)
  var hasChristmas1 = christmas1.getUTCFullYear() === sy
  if (hasChristmas1) {
    reigns.push({ date: christmas1, key: "christmas-1", name: "First Sunday after Christmas Day", short: "Christmas 1", season: "Christmas", color: "white" })
    var christmas2 = sundayStrictlyAfter(christmas1)
    if (christmas2.getUTCFullYear() === y2 && christmas2.getUTCMonth() === 0 && christmas2.getUTCDate() <= 5) {
      reigns.push({ date: christmas2, key: "christmas-2", name: "Second Sunday after Christmas Day", short: "Christmas 2", season: "Christmas", color: "white" })
    }
  }

  var epiphany = makeDate(y2, 1, 6)
  reigns.push({ date: epiphany, key: "epiphany", name: "Epiphany of the Lord", short: "Epiphany", season: "Season after Epiphany", color: "white" })

  var easter = gregorianEaster(y2)
  var ashWednesday = addDays(easter, -46)
  var transfiguration = addDays(ashWednesday, -3)

  var baptism = sundayStrictlyAfter(epiphany)
  reigns.push({ date: baptism, key: "baptism", name: "Baptism of the Lord", short: "Baptism", season: "Season after Epiphany", color: "white" })

  var epiN = addDays(baptism, 7)
  var n = 2
  while (epiN.getTime() < transfiguration.getTime()) {
    reigns.push({
      date: epiN, key: "epiphany-" + n,
      name: ORDINALS[n] + " Sunday after the Epiphany", short: "Epiphany " + n,
      season: "Season after Epiphany", color: "green"
    })
    n++
    epiN = addDays(epiN, 7)
  }

  reigns.push({ date: transfiguration, key: "transfiguration", name: "Transfiguration Sunday", short: "Transfiguration", season: "Season after Epiphany", color: "white" })
  reigns.push({ date: ashWednesday, key: "ash-wednesday", name: "Ash Wednesday", short: "Ash Wednesday", season: "Lent", color: "purple" })

  var lent1 = addDays(ashWednesday, 4)
  for (var lk = 1; lk <= 5; lk++) {
    reigns.push({
      date: addDays(lent1, (lk - 1) * 7), key: "lent-" + lk,
      name: ORDINALS[lk] + " Sunday in Lent", short: "Lent " + lk,
      season: "Lent", color: "purple"
    })
  }

  var holyWeekDays = [
    ["palm-sunday", "Palm Sunday", -7],
    ["holy-monday", "Holy Monday", -6],
    ["holy-tuesday", "Holy Tuesday", -5],
    ["holy-wednesday", "Holy Wednesday", -4],
    ["maundy-thursday", "Maundy Thursday", -3],
    ["good-friday", "Good Friday", -2],
    ["holy-saturday", "Holy Saturday", -1]
  ]
  holyWeekDays.forEach(function (row) {
    reigns.push({ date: addDays(easter, row[2]), key: row[0], name: row[1], short: row[1], season: "Holy Week", color: "red" })
  })

  reigns.push({ date: easter, key: "easter", name: "Resurrection of the Lord", short: "Easter", season: "Easter", color: "white" })
  for (var ek = 2; ek <= 7; ek++) {
    reigns.push({
      date: addDays(easter, (ek - 1) * 7), key: "easter-" + ek,
      name: ORDINALS[ek] + " Sunday of Easter", short: "Easter " + ek,
      season: "Easter", color: "white"
    })
  }

  var ascension = addDays(easter, 39)
  var pentecost = addDays(easter, 49)
  var trinity = addDays(easter, 56)
  reigns.push({ date: pentecost, key: "pentecost", name: "Day of Pentecost", short: "Pentecost", season: "Pentecost", color: "red" })
  reigns.push({ date: trinity, key: "trinity", name: "Trinity Sunday", short: "Trinity", season: "Season after Pentecost", color: "white" })

  var advent1Next = advent1(y2)
  var may24 = makeDate(y2, 5, 24)
  var proper = addDays(trinity, 7)
  while (proper.getTime() < advent1Next.getTime()) {
    var num = 3 + Math.floor(daysBetween(may24, proper) / 7)
    if (num === 29) {
      reigns.push({ date: proper, key: "proper-29", name: "Reign of Christ", short: "Christ the King", season: "Season after Pentecost", color: "white" })
    } else {
      reigns.push({ date: proper, key: "proper-" + num, name: "Proper " + num, short: "Proper " + num, season: "Season after Pentecost", color: "green" })
    }
    proper = addDays(proper, 7)
  }

  var allSaints = makeDate(y2, 11, 1)
  var spikes = [
    { date: makeDate(y2, 1, 1), key: "holy-name", name: "Holy Name of Jesus", short: "Holy Name", season: "Christmas", color: "white" },
    { date: allSaints, key: "all-saints", name: "All Saints Day", short: "All Saints", season: "All Saints", color: "white" },
    { date: ascension, key: "ascension", name: "Ascension of the Lord", short: "Ascension", season: "Easter", color: "white" }
  ]

  return { reigns: reigns, spikes: spikes, easter: easter }
}

// Full liturgical record for a single date. See README-less spec: the key
// pattern is a two-layer lookup — a "reign" (Sunday or multi-day fixed feast)
// governs a run of days, and a "spike" (Holy Name, All Saints, Ascension)
// overrides a single day within an ongoing reign.
function dayFor(input) {
  var ymd = extractYMD(input)
  var target = makeDate(ymd.y, ymd.m, ymd.d)

  var cy = ymd.y
  var sy = target.getTime() >= advent1(cy).getTime() ? cy : cy - 1
  var church = buildChurchYear(sy)

  var spike = null
  for (var i = 0; i < church.spikes.length; i++) {
    if (sameDate(church.spikes[i].date, target)) { spike = church.spikes[i]; break }
  }

  var record = spike
  if (!record) {
    for (var j = church.reigns.length - 1; j >= 0; j--) {
      if (church.reigns[j].date.getTime() <= target.getTime()) { record = church.reigns[j]; break }
    }
  }
  // Every date in range [advent1(sy), advent1(sy+1)) is covered by the first
  // reign at minimum, so record is always found.

  var yearLetter = "ABC"[((sy % 3) + 3) % 3]

  return {
    key: record.key,
    sunday: record.key,
    name: record.name,
    short: record.short,
    year: yearLetter,
    season: record.season,
    color: record.color,
    weekday: target.getUTCDay(),
    date: toDateString(target),
    easter: toDateString(church.easter)
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    dayFor: dayFor,
    gregorianEaster: gregorianEaster,
    advent1: advent1
  }
}
