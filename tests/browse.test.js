// Runs Browse.js's pure functions under node. Exit status is the verdict.
const Browse = require("../Browse.js")
const Reference = require("../Reference.js")
const assert = require("node:assert/strict")

// --- clampOffset ---

assert.equal(Browse.clampOffset(8), 7)
assert.equal(Browse.clampOffset(-9), -7)
assert.equal(Browse.clampOffset(0), 0)
assert.equal(Browse.clampOffset(3), 3)
assert.equal(Browse.clampOffset("x"), 0)
assert.equal(Browse.clampOffset(null), 0)

// --- offsetDate ---

// Month end.
assert.equal(Browse.offsetDate("2026-01-31", 1), "2026-02-01")
// Year end.
assert.equal(Browse.offsetDate("2026-12-31", 1), "2027-01-01")
// Across a US DST change (spring forward, second Sunday of March 2026 is
// the 8th) -- local calendar arithmetic must not lose or repeat a day.
assert.equal(Browse.offsetDate("2026-03-07", 1), "2026-03-08")
assert.equal(Browse.offsetDate("2026-03-08", 1), "2026-03-09")
assert.equal(Browse.offsetDate(new Date(2026, 2, 7), 2), "2026-03-09")

// --- logosUrl ---

function url(ref) { return Browse.logosUrl(Reference.parseRef(ref)) }

assert.equal(url("John 3:16-21"), "https://ref.ly/Jn3.16-21")
assert.equal(url("Psalm 23"), "https://ref.ly/Ps23")
assert.equal(url("Jeremiah 8:18-9:1"), "https://ref.ly/Je8.18-9.1")
assert.equal(url("Psalm 118:1-2, 14-24"), "https://ref.ly/Ps118.1-2")
assert.equal(url("1 Kings 19:1-4, (5-7), 8-15a"), "https://ref.ly/1Ki19.1-4")
assert.equal(url("Luke 2:(1-7), 8-20"), "https://ref.ly/Lk2.1-7")
assert.equal(url("Genesis 1:1-2:4a"), "https://ref.ly/Ge1.1-2.4")

console.log("browse.test.js: all assertions passed")
