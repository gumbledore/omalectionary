// Parses RCL-style scripture references ("Jeremiah 8:18-9:1", "Luke 2:1-14,
// (15-20)", "1 Kings 19:1-4, (5-7), 8-15a", "Psalm 23") into a book id plus
// an ordered list of verse ranges, and renders the abbreviated tooltip label
// ("Jer 8:18-9:1"). Pure JS, dual export like Calendar.js.
//
// Self-contained on purpose (no require()/import of sibling files): QML
// loads this file directly via `import "Reference.js" as Reference`, and
// plain (non-`.pragma library`) QML-imported JS files cannot themselves
// import other JS files in a form Node's CommonJS loader also accepts. So
// the book/abbreviation table lives here as a plain object instead of a
// separate data/books.json, to keep one file that works unmodified under
// both `node` and Quickshell's QML engine.

// Full ref name (as used in data/sundays.js) -> OSIS-style book id -> SBL-
// style short abbreviation for the tooltip. Covers the Protestant canon plus
// the RCL's occasional Apocrypha alternates (Sir, Wis, Bar).
var BOOKS = {
  "Genesis": { id: "Gen", abbr: "Gen" },
  "Exodus": { id: "Exod", abbr: "Exod" },
  "Leviticus": { id: "Lev", abbr: "Lev" },
  "Numbers": { id: "Num", abbr: "Num" },
  "Deuteronomy": { id: "Deut", abbr: "Deut" },
  "Joshua": { id: "Josh", abbr: "Josh" },
  "Judges": { id: "Judg", abbr: "Judg" },
  "Ruth": { id: "Ruth", abbr: "Ruth" },
  "1 Samuel": { id: "1Sam", abbr: "1 Sam" },
  "2 Samuel": { id: "2Sam", abbr: "2 Sam" },
  "1 Kings": { id: "1Kgs", abbr: "1 Kgs" },
  "2 Kings": { id: "2Kgs", abbr: "2 Kgs" },
  "1 Chronicles": { id: "1Chr", abbr: "1 Chr" },
  "2 Chronicles": { id: "2Chr", abbr: "2 Chr" },
  "Ezra": { id: "Ezra", abbr: "Ezra" },
  "Nehemiah": { id: "Neh", abbr: "Neh" },
  "Esther": { id: "Esth", abbr: "Esth" },
  "Job": { id: "Job", abbr: "Job" },
  "Psalm": { id: "Ps", abbr: "Ps" },
  "Proverbs": { id: "Prov", abbr: "Prov" },
  "Ecclesiastes": { id: "Eccl", abbr: "Eccl" },
  "Song of Solomon": { id: "Song", abbr: "Song" },
  "Isaiah": { id: "Isa", abbr: "Isa" },
  "Jeremiah": { id: "Jer", abbr: "Jer" },
  "Lamentations": { id: "Lam", abbr: "Lam" },
  "Ezekiel": { id: "Ezek", abbr: "Ezek" },
  "Daniel": { id: "Dan", abbr: "Dan" },
  "Hosea": { id: "Hos", abbr: "Hos" },
  "Joel": { id: "Joel", abbr: "Joel" },
  "Amos": { id: "Amos", abbr: "Amos" },
  "Obadiah": { id: "Obad", abbr: "Obad" },
  "Jonah": { id: "Jonah", abbr: "Jonah" },
  "Micah": { id: "Mic", abbr: "Mic" },
  "Nahum": { id: "Nah", abbr: "Nah" },
  "Habakkuk": { id: "Hab", abbr: "Hab" },
  "Zephaniah": { id: "Zeph", abbr: "Zeph" },
  "Haggai": { id: "Hag", abbr: "Hag" },
  "Zechariah": { id: "Zech", abbr: "Zech" },
  "Malachi": { id: "Mal", abbr: "Mal" },
  "Matthew": { id: "Matt", abbr: "Mt" },
  "Mark": { id: "Mark", abbr: "Mk" },
  "Luke": { id: "Luke", abbr: "Lk" },
  "John": { id: "John", abbr: "Jn" },
  "Acts": { id: "Acts", abbr: "Acts" },
  "Romans": { id: "Rom", abbr: "Rom" },
  "1 Corinthians": { id: "1Cor", abbr: "1 Cor" },
  "2 Corinthians": { id: "2Cor", abbr: "2 Cor" },
  "Galatians": { id: "Gal", abbr: "Gal" },
  "Ephesians": { id: "Eph", abbr: "Eph" },
  "Philippians": { id: "Phil", abbr: "Phil" },
  "Colossians": { id: "Col", abbr: "Col" },
  "1 Thessalonians": { id: "1Thess", abbr: "1 Thess" },
  "2 Thessalonians": { id: "2Thess", abbr: "2 Thess" },
  "1 Timothy": { id: "1Tim", abbr: "1 Tim" },
  "2 Timothy": { id: "2Tim", abbr: "2 Tim" },
  "Titus": { id: "Titus", abbr: "Titus" },
  "Philemon": { id: "Phlm", abbr: "Phlm" },
  "Hebrews": { id: "Heb", abbr: "Heb" },
  "James": { id: "Jas", abbr: "Jas" },
  "1 Peter": { id: "1Pet", abbr: "1 Pet" },
  "2 Peter": { id: "2Pet", abbr: "2 Pet" },
  "1 John": { id: "1John", abbr: "1 Jn" },
  "2 John": { id: "2John", abbr: "2 Jn" },
  "3 John": { id: "3John", abbr: "3 Jn" },
  "Jude": { id: "Jude", abbr: "Jude" },
  "Revelation": { id: "Rev", abbr: "Rev" },
  "Sirach": { id: "Sir", abbr: "Sir" },
  "Wisdom of Solomon": { id: "Wis", abbr: "Wis" },
  "Baruch": { id: "Bar", abbr: "Bar" }
}

// Longest full name first so "1 Corinthians" matches before a shorter
// clashing prefix could.
var BOOK_NAMES = Object.keys(BOOKS).sort(function (a, b) { return b.length - a.length })

function idFor(fullName) {
  var entry = BOOKS[fullName]
  if (!entry) throw new Error("Reference: unknown book " + fullName)
  return entry.id
}

function abbreviate(bookId) {
  for (var name in BOOKS) {
    if (BOOKS[name].id === bookId) return BOOKS[name].abbr
  }
  throw new Error("Reference: unknown book id " + bookId)
}

// Splits a comma list at top level only, keeping "(1a,4-11,19-23)" intact
// as one token instead of breaking on the commas inside it.
function splitTopLevel(body) {
  var parts = [], depth = 0, cur = ""
  for (var i = 0; i < body.length; i++) {
    var c = body.charAt(i)
    if (c === "(") depth++
    else if (c === ")") depth--
    if (c === "," && depth === 0) { parts.push(cur); cur = "" } else cur += c
  }
  parts.push(cur)
  return parts
}

// One comma-list token, e.g. "1-4", "(5-7)", "8-15a", "23", or a token that
// jumps to a new chapter mid-list ("3:22b-28", or "(11:14-15)").
function parseSegment(raw, chapter) {
  var segment = raw.trim()
  var optional = false
  if (segment.charAt(0) === "(" && segment.charAt(segment.length - 1) === ")") {
    optional = true
    segment = segment.slice(1, -1).trim()
  }

  var range = { chapter: chapter }
  var jump = segment.match(/^(\d+):(.+)$/)
  if (jump && jump[2].indexOf(",") === -1) {
    range.chapter = Number(jump[1])
    range.chapterShown = true
    segment = jump[2]
  }

  var m
  if (segment.indexOf(",") !== -1) {
    // A nonconsecutive list inside one group, e.g. "1a,4-11,19-23" — RCL
    // brackets a scattered set of verses as one optional unit; collapsed to
    // its outer span since the tooltip only needs an abbreviated label, not
    // the exact enumeration.
    var nums = segment.match(/\d+/g).map(Number)
    range.start = Math.min.apply(null, nums)
    range.end = Math.max.apply(null, nums)
  } else if ((m = segment.match(/^(\d+)([a-z])?-(\d+):(\d+)([a-z])?$/))) { // chapter-spanning: "18-9:1", "15b-2:9"
    range.start = Number(m[1])
    if (m[2]) range.startPart = m[2]
    range.end = Number(m[4])
    range.endChapter = Number(m[3])
    if (m[5]) range.endPart = m[5]
  } else if ((m = segment.match(/^(\d+)([a-z])?-(\d+)([a-z])?$/))) {
    range.start = Number(m[1])
    if (m[2]) range.startPart = m[2]
    range.end = Number(m[3])
    if (m[4]) range.endPart = m[4]
  } else if ((m = segment.match(/^(\d+)([a-z])?$/))) {
    range.start = Number(m[1])
    range.end = Number(m[1])
    if (m[2]) range.endPart = m[2]
  } else {
    throw new Error("Reference: cannot parse verse segment \"" + raw + "\"")
  }

  if (optional) range.optional = true
  return range
}

function parseRef(ref) {
  var text = String(ref).trim()

  var bookName = null
  for (var i = 0; i < BOOK_NAMES.length; i++) {
    var name = BOOK_NAMES[i]
    if (text === name || text.indexOf(name + " ") === 0) { bookName = name; break }
  }
  if (!bookName) throw new Error("Reference: no known book in \"" + ref + "\"")

  var rest = text.slice(bookName.length).trim()
  var book = idFor(bookName)

  var colon = rest.indexOf(":")
  if (colon === -1) {
    // Whole chapter, e.g. "Psalm 23".
    return { book: book, ranges: [{ chapter: Number(rest), whole: true }] }
  }

  var chapter = Number(rest.slice(0, colon))
  var body = rest.slice(colon + 1).trim()

  // Chapter-spanning single range with no comma list, e.g. "18-9:1" (from
  // "Jeremiah 8:18-9:1"), "1-2:4a" (from "Genesis 1:1-2:4a"), or "15b-2:9"
  // (from "Haggai 1:15b-2:9").
  if (body.indexOf(",") === -1 && /^\d+[a-z]?-\d+:\d+[a-z]?$/.test(body)) {
    return { book: book, ranges: [parseSegment(body, chapter)] }
  }

  var currentChapter = chapter
  var ranges = splitTopLevel(body).map(function (seg) {
    var range = parseSegment(seg, currentChapter)
    currentChapter = range.chapter
    return range
  })
  return { book: book, ranges: ranges }
}

// `isFirst` (the reference's own opening chapter) always shows the chapter
// outside any optional-verse parens, e.g. "2:(1-7), 8-20". A mid-list jump
// to a new chapter (range.chapterShown, from parseSegment's "N:" handling)
// shows the chapter inside the parens instead, matching how RCL brackets a
// whole alternate reference, e.g. "8:4-11,(11:14-15)".
function formatRange(range, isFirst) {
  if (range.whole) return String(range.chapter)
  var verses = String(range.start) + (range.startPart || "")
  if (range.endChapter) {
    verses += "-" + range.endChapter + ":" + range.end
  } else if (range.end !== range.start) {
    verses += "-" + range.end
  }
  if (range.endPart) verses += range.endPart

  if (isFirst) return range.chapter + ":" + (range.optional ? "(" + verses + ")" : verses)
  if (range.chapterShown) {
    var withChapter = range.chapter + ":" + verses
    return range.optional ? "(" + withChapter + ")" : withChapter
  }
  return range.optional ? "(" + verses + ")" : verses
}

// Abbreviated tooltip label, e.g. "Jer 8:18-9:1" or "1 Kgs 19:1-4, (5-7), 8-15a".
function formatLabel(parsed) {
  var abbr = abbreviate(parsed.book)
  if (parsed.ranges.length === 1 && parsed.ranges[0].whole) {
    return abbr + " " + parsed.ranges[0].chapter
  }
  var parts = parsed.ranges.map(function (r, idx) { return formatRange(r, idx === 0) })
  return abbr + " " + parts.join(", ")
}

if (typeof module !== "undefined") {
  module.exports = { parseRef: parseRef, abbreviate: abbreviate, formatLabel: formatLabel, BOOKS: BOOKS }
}
