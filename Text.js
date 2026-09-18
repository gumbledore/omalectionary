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

if (typeof module !== "undefined") {
  module.exports = { resolve: resolve }
}
