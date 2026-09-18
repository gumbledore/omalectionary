// Runs the pure Reference/Lectionary/Config modules under node. Exit status
// is the verdict.
const Reference = require("../Reference.js")
const Lectionary = require("../Lectionary.js")
const Config = require("../Config.js")
const SUNDAYS = require("../data/sundays.js")
const assert = require("node:assert/strict")

// --- Reference parser: one case per form named in the ticket spec ---

assert.deepEqual(Reference.parseRef("Luke 16:1-13"),
  { book: "Luke", ranges: [{ chapter: 16, start: 1, end: 13 }] })

assert.deepEqual(Reference.parseRef("Psalm 79:1-9"),
  { book: "Ps", ranges: [{ chapter: 79, start: 1, end: 9 }] })

assert.deepEqual(Reference.parseRef("Jeremiah 8:18-9:1"),
  { book: "Jer", ranges: [{ chapter: 8, start: 18, end: 1, endChapter: 9 }] })

assert.deepEqual(Reference.parseRef("Luke 2:1-14, (15-20)"),
  { book: "Luke", ranges: [
    { chapter: 2, start: 1, end: 14 },
    { chapter: 2, start: 15, end: 20, optional: true }
  ] })

assert.deepEqual(Reference.parseRef("Luke 2:(1-7), 8-20"),
  { book: "Luke", ranges: [
    { chapter: 2, start: 1, end: 7, optional: true },
    { chapter: 2, start: 8, end: 20 }
  ] })

assert.deepEqual(Reference.parseRef("1 Kings 19:1-4, (5-7), 8-15a"),
  { book: "1Kgs", ranges: [
    { chapter: 19, start: 1, end: 4 },
    { chapter: 19, start: 5, end: 7, optional: true },
    { chapter: 19, start: 8, end: 15, endPart: "a" }
  ] })

assert.deepEqual(Reference.parseRef("Psalm 119:1-8"),
  { book: "Ps", ranges: [{ chapter: 119, start: 1, end: 8 }] })

assert.deepEqual(Reference.parseRef("Psalm 23"),
  { book: "Ps", ranges: [{ chapter: 23, whole: true }] })

assert.deepEqual(Reference.parseRef("Genesis 1:1-2:4a"),
  { book: "Gen", ranges: [{ chapter: 1, start: 1, end: 4, endChapter: 2, endPart: "a" }] })

// Abbreviated labels
assert.equal(Reference.formatLabel(Reference.parseRef("Jeremiah 8:18-9:1")), "Jer 8:18-9:1")
assert.equal(Reference.formatLabel(Reference.parseRef("Psalm 79:1-9")), "Ps 79:1-9")
assert.equal(Reference.formatLabel(Reference.parseRef("1 Timothy 2:1-7")), "1 Tim 2:1-7")
assert.equal(Reference.formatLabel(Reference.parseRef("Luke 16:1-13")), "Lk 16:1-13")
assert.equal(Reference.formatLabel(Reference.parseRef("1 Kings 19:1-4, (5-7), 8-15a")), "1 Kgs 19:1-4, (5-7), 8-15a")
assert.equal(Reference.formatLabel(Reference.parseRef("Luke 2:(1-7), 8-20")), "Lk 2:(1-7), 8-20")
assert.equal(Reference.formatLabel(Reference.parseRef("Psalm 23")), "Ps 23")

// The four gospels abbreviate to two letters; Matthew/Mark included per spec.
assert.equal(Reference.abbreviate("Matt"), "Mt")
assert.equal(Reference.abbreviate("Mark"), "Mk")
assert.equal(Reference.abbreviate("Luke"), "Lk")
assert.equal(Reference.abbreviate("John"), "Jn")

console.log("reference ok")

// --- Abbreviation table covers every book referenced anywhere in sundays.js ---

function collectRefs(entry) {
  var refs = []
  ;["first", "psalm", "second", "gospel"].forEach(function (role) {
    var v = entry[role]
    if (v === undefined) return
    if (v && typeof v === "object" && (v["1"] !== undefined || v["2"] !== undefined)) {
      ["1", "2"].forEach(function (t) { if (v[t] !== undefined) refs.push(v[t]) })
    } else {
      refs.push(v)
    }
  })
  return refs
}

var bookCount = 0
for (var key in SUNDAYS) {
  for (var yr in SUNDAYS[key]) {
    collectRefs(SUNDAYS[key][yr]).forEach(function (r) {
      var ref = typeof r === "string" ? r : r.ref
      var parsed = Reference.parseRef(ref) // throws if the book/form is unknown
      Reference.abbreviate(parsed.book)    // throws if no abbreviation is on file
      bookCount++
    })
  }
}
assert.ok(bookCount > 300, "expected the table to carry a few hundred readings, got " + bookCount)
console.log("abbreviation table covers all " + bookCount + " readings ok")

// --- Fixture dates -> expected reading labels, both tracks ---

function labels(result) { return result.readings.map(function (r) { return r.label }).join(" · ") }
function check(date, track, expectedKey, expectedLabels) {
  var got = Lectionary.dayFor(date, { track: track })
  assert.equal(got.key, expectedKey, date + " key")
  assert.equal(labels(got), expectedLabels, date + " track " + track + " labels")
}

// Year A (church year begun Advent 2025)
check("2025-11-30", 2, "advent-1", "Isa 2:1-5 · Ps 122 · Rom 13:11-14 · Mt 24:36-44")
check("2026-04-05", 2, "easter", "Acts 10:34-43 · Ps 118:1-2, 14-24 · Col 3:1-4 · Jn 20:1-18")
check("2025-12-25", 2, "christmas", "Isa 9:2-7 · Ps 96 · Titus 2:11-14 · Lk 2:1-14, (15-20)") // feast
check("2026-09-20", 1, "proper-20", "Exod 16:2-15 · Ps 105:1-6, 37-45 · Phil 1:21-30 · Mt 20:1-16") // track 1
check("2026-09-20", 2, "proper-20", "Jonah 3:10-4:11 · Ps 145:1-8 · Phil 1:21-30 · Mt 20:1-16")     // same Sunday, track 2 -> differs
// Weekday: Friday before Proper 20 shows the coming Sunday's set (ticket's own example date)
check("2026-09-18", 2, "proper-19", "Jonah 3:10-4:11 · Ps 145:1-8 · Phil 1:21-30 · Mt 20:1-16")

// Year B (church year begun Advent 2026)
check("2026-11-29", 2, "advent-1", "Isa 64:1-9 · Ps 80:1-7, 17-19 · 1 Cor 1:3-9 · Mk 13:24-37")
check("2027-03-28", 2, "easter", "Acts 10:34-43 · Ps 118:1-2, 14-24 · 1 Cor 15:1-11 · Jn 20:1-18")
check("2027-05-16", 2, "pentecost", "Acts 2:1-21 · Ps 104:24-34, 35b · Rom 8:22-27 · Jn 15:26-27, 16:4b-15")
check("2026-12-25", 2, "christmas", "Isa 9:2-7 · Ps 96 · Titus 2:11-14 · Lk 2:1-14, (15-20)")

// Year C (church year begun Advent 2024)
check("2024-12-01", 2, "advent-1", "Jer 33:14-16 · Ps 25:1-10 · 1 Thess 3:9-13 · Lk 21:25-36")
check("2025-04-20", 2, "easter", "Acts 10:34-43 · Ps 118:1-2, 14-24 · 1 Cor 15:19-26 · Jn 20:1-18")
check("2025-09-21", 1, "proper-20", "Jer 8:18-9:1 · Ps 79:1-9 · 1 Tim 2:1-7 · Lk 16:1-13")
check("2025-09-21", 2, "proper-20", "Amos 8:4-7 · Ps 113 · 1 Tim 2:1-7 · Lk 16:1-13")
check("2024-11-01", 2, "all-saints", "Isa 25:6-9 · Ps 24 · Rev 21:1-6a · Jn 11:32-44")

console.log("fixtures ok")

// readings carry role order and parsed book/ranges/label
var proper20c = Lectionary.dayFor("2025-09-21", { track: 2 })
assert.deepEqual(proper20c.readings.map(function (r) { return r.role }), ["first", "psalm", "second", "gospel"])
assert.equal(proper20c.readings[0].book, "Amos")
assert.deepEqual(proper20c.readings[0].ranges, [{ chapter: 8, start: 4, end: 7 }])
assert.equal(proper20c.readings[0].label, "Amos 8:4-7")

console.log("readings shape ok")

// --- Config: defensive parsing, edge cases ---
assert.equal(Config.parseConfig(undefined).track, 2, "missing config file")
assert.equal(Config.parseConfig("").track, 2, "empty file")
assert.equal(Config.parseConfig("not json").track, 2, "unparsable JSON")
assert.equal(Config.parseConfig('{"track":"x"}').track, 2, "bad track value")
assert.equal(Config.parseConfig('{"track":1}').track, 1, "valid track 1")
assert.equal(Config.parseConfig('{"track":2}').track, 2, "valid track 2")
assert.equal(Config.parseConfig('{"other":true}').track, 2, "missing track key")

console.log("config ok")
console.log("lectionary ok")
