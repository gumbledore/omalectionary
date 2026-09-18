// Runs Text.js's resolve() against the built data/bsb.json under node.
// Exit status is the verdict.
const Reference = require("../Reference.js")
const Text = require("../Text.js")
const BSB = require("../data/bsb.json")
const assert = require("node:assert/strict")

// ref -> expected first and last verse text (exact strings, from the built
// JSON; John 3:16 and Psalm 23:1 spot-checked against a known BSB rendering
// -- see build/convert_bsb.py's header for the source and its caveats).
const CASES = [
  {
    ref: "John 3:16",
    first: "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.",
    last: "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life."
  },
  {
    ref: "Psalm 23",
    first: "A Psalm of David.\nThe LORD is my shepherd;\nI shall not want.",
    last: "Surely goodness and mercy will follow me\nall the days of my life,\nand I will dwell in the house of the LORD\nforever."
  },
  {
    ref: "Jeremiah 8:18-9:1",
    first: "My sorrow is beyond healing;\nmy heart is faint within me.",
    last: "Oh, that my head were a spring of water,\nand my eyes a fountain of tears!\nI would weep day and night\nover the slain daughter of my people."
  },
  {
    ref: "Psalm 118:1-2, 14-24",
    first: "Give thanks to the LORD, for He is good;\nHis loving devotion endures forever.",
    last: "This is the day that the LORD has made;\nwe will rejoice and be glad in it."
  },
  {
    ref: "Luke 2:1-14, (15-20)",
    first: "Now in those days a decree went out from Caesar Augustus that a census should be taken of the whole empire.",
    last: "The shepherds returned, glorifying and praising God for all they had heard and seen, which was just as the angel had told them."
  },
  {
    ref: "Romans 8:1-11",
    first: "Therefore, there is now no condemnation for those who are in Christ Jesus.",
    last: "And if the Spirit of Him who raised Jesus from the dead is living in you, He who raised Christ Jesus from the dead will also give life to your mortal bodies through His Spirit, who lives in you."
  }
]

for (const c of CASES) {
  const verses = Text.resolve(Reference.parseRef(c.ref), BSB)
  assert.ok(verses.length > 0, c.ref + ": resolved no verses")
  assert.equal(verses[0].text, c.first, c.ref + ": first verse text")
  assert.equal(verses[verses.length - 1].text, c.last, c.ref + ": last verse text")
}

// Jeremiah 8:18-9:1 crosses into chapter 9.
{
  const verses = Text.resolve(Reference.parseRef("Jeremiah 8:18-9:1"), BSB)
  const last = verses[verses.length - 1]
  assert.equal(last.chapter, 9)
  assert.equal(last.verse, 1)
}

// Psalm 118:1-2, 14-24 is a verse list, not a contiguous range -- verse 3 is absent.
{
  const verses = Text.resolve(Reference.parseRef("Psalm 118:1-2, 14-24"), BSB)
  assert.ok(!verses.some((v) => v.verse === 3), "Psalm 118 verse 3 should be absent")
}

// Luke 2:1-14, (15-20): verse 15 is in the bracketed optional range.
{
  const verses = Text.resolve(Reference.parseRef("Luke 2:1-14, (15-20)"), BSB)
  const v15 = verses.find((v) => v.verse === 15)
  assert.ok(v15, "verse 15 should be present")
  assert.equal(v15.optional, true)
  const v14 = verses.find((v) => v.verse === 14)
  assert.equal(v14.optional, false)
}

console.log("text.test.js: " + CASES.length + " reference cases + 3 structural checks passed")
