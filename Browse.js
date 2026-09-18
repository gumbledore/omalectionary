// Day-browsing helpers for the overlay: clamping the +/-7 day offset,
// computing the browsed date, and building a ref.ly (Logos) URL from a
// reading's first range. Pure JS, dual export, self-contained (no
// require()/import of sibling files at module scope) -- same pattern as
// Reference.js/Lectionary.js so this file loads unmodified under both
// `node` and Quickshell's QML JS engine.

var MAX_OFFSET = 7

function clampOffset(n) {
  var num = Number(n)
  if (!isFinite(num)) return 0
  num = Math.round(num)
  return Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, num))
}

function pad2(n) { return n < 10 ? "0" + n : "" + n }

// Local calendar day of `base` (a Date, or "YYYY-MM-DD" string) shifted by
// `offset` days, done via Date.UTC math on the y/m/d components (like
// Lectionary.js's nextDateString) so DST transitions never skew the result.
function offsetDate(base, offset) {
  var y, m, d
  if (typeof base === "string") {
    var parsed = base.match(/^(\d{4})-(\d{2})-(\d{2})/)
    y = Number(parsed[1]); m = Number(parsed[2]) - 1; d = Number(parsed[3])
  } else {
    var dt = (base instanceof Date) ? base : new Date(base)
    y = dt.getFullYear(); m = dt.getMonth(); d = dt.getDate()
  }
  var n = Number(offset)
  if (!isFinite(n)) n = 0

  var utc = new Date(Date.UTC(y, m, d))
  utc.setUTCDate(utc.getUTCDate() + Math.round(n))
  return utc.getUTCFullYear() + "-" + pad2(utc.getUTCMonth() + 1) + "-" + pad2(utc.getUTCDate())
}

// OSIS book id (Reference.js's BOOKS[...].id) -> Logos-style abbreviation,
// the form ref.ly expects. Apocrypha books (Sir/Wis/Bar) have no Logos
// abbreviation in the ticket's table; they fall back to their OSIS id,
// which ref.ly simply won't resolve -- acceptable since Logos itself has no
// standard edition covering them.
var LOGOS_ABBR = {
  Gen: "Ge", Exod: "Ex", Lev: "Le", Num: "Nu", Deut: "Dt",
  Josh: "Jos", Judg: "Jdg", Ruth: "Ru", "1Sam": "1Sa", "2Sam": "2Sa",
  "1Kgs": "1Ki", "2Kgs": "2Ki", "1Chr": "1Ch", "2Chr": "2Ch",
  Ezra: "Ezr", Neh: "Ne", Esth: "Es", Job: "Job", Ps: "Ps",
  Prov: "Pr", Eccl: "Ec", Song: "So", Isa: "Is", Jer: "Je",
  Lam: "La", Ezek: "Eze", Dan: "Da", Hos: "Ho", Joel: "Joe",
  Amos: "Am", Obad: "Ob", Jonah: "Jon", Mic: "Mic", Nah: "Na",
  Hab: "Hab", Zeph: "Zep", Hag: "Hag", Zech: "Zec", Mal: "Mal",
  Matt: "Mt", Mark: "Mk", Luke: "Lk", John: "Jn", Acts: "Ac",
  Rom: "Ro", "1Cor": "1Co", "2Cor": "2Co", Gal: "Ga", Eph: "Eph",
  Phil: "Php", Col: "Col", "1Thess": "1Th", "2Thess": "2Th",
  "1Tim": "1Ti", "2Tim": "2Ti", Titus: "Tt", Phlm: "Phm", Heb: "Heb",
  Jas: "Jas", "1Pet": "1Pe", "2Pet": "2Pe", "1John": "1Jn",
  "2John": "2Jn", "3John": "3Jn", Jude: "Jud", Rev: "Re"
}

// Builds a ref.ly URL (no version suffix, so Logos uses the user's
// preferred Bible) from a reading's book and one range: the first
// non-optional range if any, else the first range (so a reading like
// "Luke 2:(1-7), 8-20" links to the required 8-20, not the bracketed
// optional opener). Range shapes per Reference.js/Text.js: whole chapter
// {whole, chapter}; single-chapter verse span {chapter, start, end[,
// optional, startPart, endPart]}; chapter-spanning {chapter, start,
// endChapter, end}. Part suffixes (a/b) are dropped; ref.ly wants plain
// chapter/verse numbers only.
function logosUrl(reading) {
  var abbr = LOGOS_ABBR[reading.book] || reading.book
  var ranges = reading.ranges
  var r = ranges[0]
  for (var i = 0; i < ranges.length; i++) {
    if (!ranges[i].optional) { r = ranges[i]; break }
  }
  var loc
  if (r.whole) {
    loc = String(r.chapter)
  } else if (r.endChapter) {
    loc = r.chapter + "." + r.start + "-" + r.endChapter + "." + r.end
  } else if (r.end !== r.start) {
    loc = r.chapter + "." + r.start + "-" + r.end
  } else {
    loc = r.chapter + "." + r.start
  }
  return "https://ref.ly/" + abbr + loc
}

if (typeof module !== "undefined") {
  module.exports = { clampOffset: clampOffset, offsetDate: offsetDate, logosUrl: logosUrl, LOGOS_ABBR: LOGOS_ABBR }
}
