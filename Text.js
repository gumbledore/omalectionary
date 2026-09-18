// Resolves a Reference.js-parsed reference against a loaded version table
// (data/bsb.json's shape: { book: { chapter: { verse: text } } }) into an
// ordered array of verse objects. Pure JS, dual export, no cross-file
// requires at module scope (same pattern as Reference.js/Lectionary.js) --
// resolve() only needs plain data in, plain data out, so it never has to
// load Reference.js itself; the caller parses the ref first.
//
// Missing verses (book/chapter/verse absent from the table) are skipped
// rather than thrown, since a version may not cover every book (e.g. no
// Apocrypha in the BSB) and a later ticket's SBLGNT/WLC tables only cover
// their own testament.

function lookup(table, book, chapter, verse) {
  var b = table[book]
  if (!b) return undefined
  var c = b[String(chapter)]
  if (!c) return undefined
  return c[String(verse)]
}

function maxVerse(table, book, chapter) {
  var b = table[book]
  if (!b) return 0
  var c = b[String(chapter)]
  if (!c) return 0
  var max = 0
  for (var key in c) {
    var n = Number(key)
    if (n > max) max = n
  }
  return max
}

function pushRange(out, table, book, chapter, start, end, optional) {
  for (var v = start; v <= end; v++) {
    var text = lookup(table, book, chapter, v)
    if (text !== undefined) out.push({ chapter: chapter, verse: v, text: text, optional: !!optional })
  }
}

// One range -> zero or more verse objects, walking chapter boundaries with
// the table's own verse counts when the range spans chapters.
function resolveRange(out, table, book, range) {
  if (range.whole) {
    pushRange(out, table, book, range.chapter, 1, maxVerse(table, book, range.chapter), false)
    return
  }
  if (range.endChapter) {
    pushRange(out, table, book, range.chapter, range.start, maxVerse(table, book, range.chapter), range.optional)
    for (var c = range.chapter + 1; c < range.endChapter; c++) {
      pushRange(out, table, book, c, 1, maxVerse(table, book, c), range.optional)
    }
    pushRange(out, table, book, range.endChapter, 1, range.end, range.optional)
    return
  }
  pushRange(out, table, book, range.chapter, range.start, range.end, range.optional)
}

// parsed: Reference.parseRef(ref)'s { book, ranges }. table: a loaded
// version JSON (data/bsb.json shape). Returns [{ chapter, verse, text,
// optional }], in reading order.
function resolve(parsed, table) {
  var out = []
  for (var i = 0; i < parsed.ranges.length; i++) {
    resolveRange(out, table, parsed.book, parsed.ranges[i])
  }
  return out
}

// NT book ids (Matt..Rev, per Reference.js's BOOKS table) read Greek
// (SBLGNT); everything else (OT, Psalms, and the RCL's occasional
// Apocrypha alternates, which the WLC/SBLGNT don't cover) is treated as
// Hebrew (WLC) since that's the nearer of the two for display purposes,
// even though resolve() against wlc.json will simply come back empty for
// an Apocrypha book.
var NT_BOOKS = {
  Matt: true, Mark: true, Luke: true, John: true, Acts: true, Rom: true,
  "1Cor": true, "2Cor": true, Gal: true, Eph: true, Phil: true, Col: true,
  "1Thess": true, "2Thess": true, "1Tim": true, "2Tim": true, Titus: true,
  Phlm: true, Heb: true, Jas: true, "1Pet": true, "2Pet": true,
  "1John": true, "2John": true, "3John": true, Jude: true, Rev: true
}

function originalFor(book) {
  return NT_BOOKS[book] ? "greek" : "hebrew"
}

var VERSION_NAMES = {
  english: "Berean Standard Bible",
  greek: "SBL Greek New Testament",
  hebrew: "Westminster Leningrad Codex"
}

function versionName(key) {
  return VERSION_NAMES[key] || key
}

// Pairs english/original verses by chapter:verse for the interlinear view.
// Verses present in one array but not the other (a version missing a verse,
// e.g. a footnote-only variant) still appear, with the missing side "".
// Pure and order-preserving off the english array, since that's always the
// complete side for any reading this plugin resolves.
function interleave(englishVerses, originalVerses) {
  var byKey = {}
  for (var i = 0; i < originalVerses.length; i++) {
    var o = originalVerses[i]
    byKey[o.chapter + ":" + o.verse] = o
  }
  var seen = {}
  var out = []
  for (var j = 0; j < englishVerses.length; j++) {
    var e = englishVerses[j]
    var key = e.chapter + ":" + e.verse
    var o2 = byKey[key]
    seen[key] = true
    out.push({ chapter: e.chapter, verse: e.verse, english: e.text, original: o2 ? o2.text : "", optional: !!e.optional })
  }
  // Any original verse with no english counterpart (shouldn't normally
  // happen for this plugin's readings, but keep the pairing total).
  for (var k = 0; k < originalVerses.length; k++) {
    var o3 = originalVerses[k]
    var key2 = o3.chapter + ":" + o3.verse
    if (!seen[key2]) out.push({ chapter: o3.chapter, verse: o3.verse, english: "", original: o3.text, optional: !!o3.optional })
  }
  return out
}

if (typeof module !== "undefined") {
  module.exports = { resolve: resolve, originalFor: originalFor, versionName: versionName, interleave: interleave }
}
