// Runs the pure Calendar module under node. Exit status is the verdict.
// Fixtures cover every season boundary, all three year letters, a leap year,
// the earliest/latest possible Easters, and each Christmas weekday class.
const C = require("../Calendar.js")
const assert = require("node:assert/strict")

function check(date, expected) {
  const got = C.dayFor(date)
  for (const field in expected) {
    assert.equal(got[field], expected[field], `${date} .${field}: expected ${expected[field]}, got ${got[field]}`)
  }
}

// --- Easter itself, against the ticket's known anchors ---
assert.equal(C.dayFor("2024-03-31").key, "easter")
assert.equal(C.dayFor("2025-04-20").key, "easter")
assert.equal(C.dayFor("2026-04-05").key, "easter")
assert.equal(C.dayFor("2027-03-28").key, "easter")

// --- Earliest/latest possible Easter ---
check("2285-03-22", { key: "easter", season: "Easter", color: "white" })
check("1818-03-22", { key: "easter", season: "Easter", color: "white" })
check("2038-04-25", { key: "easter", season: "Easter", color: "white" })
check("1943-04-25", { key: "easter", season: "Easter", color: "white" })

// --- Advent 1 anchors ---
assert.equal(C.dayFor("2024-12-01").key, "advent-1")
assert.equal(C.dayFor("2025-11-30").key, "advent-1")
assert.equal(C.dayFor("2026-11-29").key, "advent-1")

// --- Full church-year walk (Advent 2025 -> Advent 2026, Year A), every
//     season boundary in order ---
check("2025-11-25", { key: "proper-29", short: "Christ the King", season: "Season after Pentecost", color: "white", year: "C" })
check("2025-11-30", { key: "advent-1", short: "Advent 1", season: "Advent", color: "purple", year: "A" })
check("2025-12-07", { key: "advent-2", short: "Advent 2", season: "Advent" })
check("2025-12-14", { key: "advent-3", short: "Advent 3", season: "Advent" })
check("2025-12-21", { key: "advent-4", short: "Advent 4", season: "Advent" })
check("2025-12-24", { key: "advent-4", season: "Advent" }) // Dec 24 still Advent
check("2025-12-25", { key: "christmas", short: "Christmas", season: "Christmas", color: "white" })
check("2025-12-28", { key: "christmas-1", short: "Christmas 1", season: "Christmas" })
check("2026-01-01", { key: "holy-name", short: "Holy Name", season: "Christmas", color: "white" })
check("2026-01-02", { key: "christmas-1", season: "Christmas" }) // reverts after the spike
check("2026-01-04", { key: "christmas-2", short: "Christmas 2", season: "Christmas" })
check("2026-01-06", { key: "epiphany", short: "Epiphany", season: "Season after Epiphany", color: "white" })
check("2026-01-11", { key: "baptism", short: "Baptism of the Lord" })
check("2026-01-18", { key: "epiphany-2", short: "Epiphany 2", season: "Season after Epiphany", color: "green" })
check("2026-02-08", { key: "epiphany-5", short: "Epiphany 5" })
check("2026-02-15", { key: "transfiguration", short: "Transfiguration", season: "Season after Epiphany", color: "white" })
check("2026-02-18", { key: "ash-wednesday", short: "Ash Wednesday", season: "Lent", color: "purple" })
check("2026-02-19", { key: "ash-wednesday", season: "Lent" }) // weekday inherits Ash Wednesday week
check("2026-02-22", { key: "lent-1", short: "Lent 1", season: "Lent" })
check("2026-03-01", { key: "lent-2", short: "Lent 2" })
check("2026-03-08", { key: "lent-3", short: "Lent 3" })
check("2026-03-15", { key: "lent-4", short: "Lent 4" })
check("2026-03-22", { key: "lent-5", short: "Lent 5" })
check("2026-03-29", { key: "palm-sunday", short: "Palm Sunday", season: "Holy Week", color: "red" })
check("2026-03-30", { key: "holy-monday", season: "Holy Week", color: "red" })
check("2026-03-31", { key: "holy-tuesday", season: "Holy Week" })
check("2026-04-01", { key: "holy-wednesday", season: "Holy Week" })
check("2026-04-02", { key: "maundy-thursday", short: "Maundy Thursday", season: "Holy Week" })
check("2026-04-03", { key: "good-friday", short: "Good Friday", season: "Holy Week" })
check("2026-04-04", { key: "holy-saturday", season: "Holy Week" })
check("2026-04-05", { key: "easter", short: "Easter", season: "Easter", color: "white" })
check("2026-04-08", { key: "easter", season: "Easter" }) // Easter week weekday
check("2026-04-12", { key: "easter-2", short: "Easter 2" })
check("2026-05-10", { key: "easter-6", short: "Easter 6" })
check("2026-05-14", { key: "ascension", short: "Ascension", season: "Easter", color: "white" })
check("2026-05-15", { key: "easter-6", season: "Easter" }) // reverts after the spike
check("2026-05-17", { key: "easter-7", short: "Easter 7" })
check("2026-05-24", { key: "pentecost", short: "Pentecost", season: "Pentecost", color: "red" })
check("2026-05-31", { key: "trinity", short: "Trinity", season: "Season after Pentecost", color: "white" })
check("2026-06-07", { key: "proper-5", short: "Proper 5", season: "Season after Pentecost", color: "green" })
check("2026-09-13", { key: "proper-19", short: "Proper 19" })
check("2026-09-20", { key: "proper-20", short: "Proper 20", year: "A" })
check("2026-11-01", { key: "all-saints", short: "All Saints", color: "white" })
check("2026-11-02", { key: "proper-26", season: "Season after Pentecost" }) // reverts after the spike
check("2026-11-22", { key: "proper-29", short: "Christ the King", color: "white" })
check("2026-11-29", { key: "advent-1", year: "B" }) // next church year

// --- All three year letters (via Easter, Advent-anchored) ---
check("2024-03-31", { year: "B" }) // Easter in church year begun Advent 2023
check("2025-04-20", { year: "C" }) // church year begun Advent 2024
check("2026-04-05", { year: "A" }) // church year begun Advent 2025

// --- Leap year: Feb 29 falls inside Lent 2 in 2024 ---
check("2024-02-29", { key: "lent-2", season: "Lent", color: "purple" })

// --- Every Christmas weekday class (Sun..Sat) ---
check("2022-12-25", { key: "christmas", weekday: 0 })
check("2023-12-25", { key: "christmas", weekday: 1 })
check("2018-12-25", { key: "christmas", weekday: 2 })
check("2019-12-25", { key: "christmas", weekday: 3 })
check("2025-12-25", { key: "christmas", weekday: 4 })
check("2020-12-25", { key: "christmas", weekday: 5 })
check("2021-12-25", { key: "christmas", weekday: 6 })
// Christmas Day falling on Sunday skips "Christmas 1" that year (next Sunday
// is Jan 1, Holy Name).
check("2022-12-31", { key: "christmas", season: "Christmas" })
check("2023-01-01", { key: "holy-name", season: "Christmas" })
check("2023-01-02", { key: "christmas", season: "Christmas" })

// --- Accepts a Date object too (local y/m/d, matching new Date(y, m-1, d)) ---
assert.equal(C.dayFor(new Date(2026, 8, 20)).key, "proper-20")

console.log("calendar ok")
