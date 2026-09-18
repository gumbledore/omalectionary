// Runs Text.js's resolve() against the built data/bsb.json under node.
// Exit status is the verdict.
const Reference = require("../Reference.js")
const Text = require("../Text.js")
const BSB = require("../data/bsb.json")
const SBLGNT = require("../data/sblgnt.json")
const WLC = require("../data/wlc.json")
const assert = require("node:assert/strict")

// ref -> expected first and last verse text (exact strings, from the built
// JSON; John 3:16 and Psalm 23:1 spot-checked against a known BSB rendering
// -- see build/convert_bsb.py's header for the source and its caveats).
// `original`/`originalLast` (when present) are the same first/last verse in
// whichever of SBLGNT/WLC applies (see Text.originalFor), spot-checked
// against a known rendering -- see build/convert_sblgnt.py and
// build/convert_wlc.py's headers for sourcing and versification notes.
const CASES = [
  {
    ref: "John 3:16",
    first: "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.",
    last: "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.",
    original: "Οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον ὥστε τὸν υἱὸν τὸν μονογενῆ ἔδωκεν, ἵνα πᾶς ὁ πιστεύων εἰς αὐτὸν μὴ ἀπόληται ἀλλὰ ἔχῃ ζωὴν αἰώνιον.",
    originalLast: "Οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον ὥστε τὸν υἱὸν τὸν μονογενῆ ἔδωκεν, ἵνα πᾶς ὁ πιστεύων εἰς αὐτὸν μὴ ἀπόληται ἀλλὰ ἔχῃ ζωὴν αἰώνιον."
  },
  {
    ref: "Psalm 23",
    first: "A Psalm of David.\nThe LORD is my shepherd;\nI shall not want.",
    last: "Surely goodness and mercy will follow me\nall the days of my life,\nand I will dwell in the house of the LORD\nforever.",
    // Ps 23 has no WLC<->KJV versification difference (no VerseMap.xml
    // entries for this psalm), so Hebrew v1 = English v1 directly.
    original: "מִזְמ֥וֹר לְדָוִ֑ד יְהוָ֥ה רֹ֝עִ֗י לֹ֣א אֶחְסָֽר׃",
    originalLast: "אַ֤ךְ ׀ ט֤וֹב וָחֶ֣סֶד יִ֭רְדְּפוּנִי כָּל־יְמֵ֣י חַיָּ֑י וְשַׁבְתִּ֥י בְּבֵית־יְ֝הוָ֗ה לְאֹ֣רֶךְ יָמִֽים׃"
  },
  {
    ref: "Jeremiah 8:18-9:1",
    first: "My sorrow is beyond healing;\nmy heart is faint within me.",
    last: "Oh, that my head were a spring of water,\nand my eyes a fountain of tears!\nI would weep day and night\nover the slain daughter of my people.",
    // 9:1 English = Hebrew 8:23 (Jeremiah's chapter/verse split moves by
    // one from here through the rest of Hebrew ch8/English ch9).
    original: "מַבְלִ֥יגִיתִ֖י עֲלֵ֣י יָג֑וֹן עָלַ֖י לִבִּ֥י דַוָּֽי׃",
    originalLast: "מִֽי־יִתֵּ֤ן רֹאשִׁי֙ מַ֔יִם וְעֵינִ֖י מְק֣וֹר דִּמְעָ֑ה וְאֶבְכֶּה֙ יוֹמָ֣ם וָלַ֔יְלָה אֵ֖ת חַֽלְלֵ֥י בַת־עַמִּֽי׃"
  },
  {
    ref: "Psalm 118:1-2, 14-24",
    first: "Give thanks to the LORD, for He is good;\nHis loving devotion endures forever.",
    last: "This is the day that the LORD has made;\nwe will rejoice and be glad in it.",
    original: "הוֹד֣וּ לַיהוָ֣ה כִּי־ט֑וֹב כִּ֖י לְעוֹלָ֣ם חַסְדּֽוֹ׃",
    originalLast: "זֶה־הַ֭יּוֹם עָשָׂ֣ה יְהוָ֑ה נָגִ֖ילָה וְנִשְׂמְחָ֣ה בֽוֹ׃"
  },
  {
    ref: "Luke 2:1-14, \(15-20\)",
    first: "Now in those days a decree went out from Caesar Augustus that a census should be taken of the whole empire.",
    last: "The shepherds returned, glorifying and praising God for all they had heard and seen, which was just as the angel had told them.",
    original: "Ἐγένετο δὲ ἐν ταῖς ἡμέραις ἐκείναις ἐξῆλθεν δόγμα παρὰ Καίσαρος Αὐγούστου ἀπογράφεσθαι πᾶσαν τὴν οἰκουμένην·",
    originalLast: "καὶ ὑπέστρεψαν οἱ ποιμένες δοξάζοντες καὶ αἰνοῦντες τὸν θεὸν ἐπὶ πᾶσιν οἷς ἤκουσαν καὶ εἶδον καθὼς ἐλαλήθη πρὸς αὐτούς."
  },
  {
    ref: "Romans 8:1-11",
    first: "Therefore, there is now no condemnation for those who are in Christ Jesus.",
    last: "And if the Spirit of Him who raised Jesus from the dead is living in you, He who raised Christ Jesus from the dead will also give life to your mortal bodies through His Spirit, who lives in you.",
    original: "Οὐδὲν ἄρα νῦν κατάκριμα τοῖς ἐν Χριστῷ Ἰησοῦ·",
    originalLast: "εἰ δὲ τὸ πνεῦμα τοῦ ἐγείραντος τὸν Ἰησοῦν ἐκ νεκρῶν οἰκεῖ ἐν ὑμῖν, ὁ ἐγείρας ἐκ νεκρῶν Χριστὸν Ἰησοῦν ζῳοποιήσει καὶ τὰ θνητὰ σώματα ὑμῶν διὰ τὸ ἐνοικοῦν αὐτοῦ πνεῦμα ἐν ὑμῖν."
  },
  {
    // Superscription-fold case: WLC Ps 51:1-2 (the un-numbered heading) has
    // no KJV mapping of its own, so it defaults to Ps.51.1 and gets folded
    // (newline-joined, superscription first) into the same English verse 1
    // that WLC 51:3 ("Have mercy on me, O God...") maps to explicitly.
    ref: "Psalm 51:1",
    first: "For the choirmaster. A Psalm of David. When Nathan the prophet came to him after his adultery with Bathsheba.\nHave mercy on me, O God,\naccording to Your loving devotion;\naccording to Your great compassion,\nblot out my transgressions.",
    last: "For the choirmaster. A Psalm of David. When Nathan the prophet came to him after his adultery with Bathsheba.\nHave mercy on me, O God,\naccording to Your loving devotion;\naccording to Your great compassion,\nblot out my transgressions.",
    original: "לַמְנַצֵּ֗חַ מִזְמ֥וֹר לְדָוִֽד׃\nבְּֽבוֹא־אֵ֭לָיו נָתָ֣ן הַנָּבִ֑יא כַּֽאֲשֶׁר־בָּ֝֗א אֶל־בַּת־שָֽׁבַע׃\nחָנֵּ֣נִי אֱלֹהִ֣ים כְּחַסְדֶּ֑ךָ כְּרֹ֥ב רַ֝חֲמֶ֗יךָ מְחֵ֣ה פְשָׁעָֽי׃",
    originalLast: "לַמְנַצֵּ֗חַ מִזְמ֥וֹר לְדָוִֽד׃\nבְּֽבוֹא־אֵ֭לָיו נָתָ֣ן הַנָּבִ֑יא כַּֽאֲשֶׁר־בָּ֝֗א אֶל־בַּת־שָֽׁבַע׃\nחָנֵּ֣נִי אֱלֹהִ֣ים כְּחַסְדֶּ֑ךָ כְּרֹ֥ב רַ֝חֲמֶ֗יךָ מְחֵ֣ה פְשָׁעָֽי׃"
  },
  {
    // Hebrew 3:1-5 = English 2:28-32 (Joel's chapter split).
    ref: "Joel 2:28",
    first: "And afterward, I will pour out My Spirit on all people.\nYour sons and daughters will prophesy,\nyour old men will dream dreams,\nyour young men will see visions.",
    last: "And afterward, I will pour out My Spirit on all people.\nYour sons and daughters will prophesy,\nyour old men will dream dreams,\nyour young men will see visions.",
    original: "וְהָיָ֣ה אַֽחֲרֵי־כֵ֗ן אֶשְׁפּ֤וֹךְ אֶת־רוּחִי֙ עַל־כָּל־בָּשָׂ֔ר וְנִבְּא֖וּ בְּנֵיכֶ֣ם וּבְנֽוֹתֵיכֶ֑ם זִקְנֵיכֶם֙ חֲלֹמ֣וֹת יַחֲלֹמ֔וּן בַּח֣וּרֵיכֶ֔ם חֶזְיֹנ֖וֹת יִרְאֽוּ׃",
    originalLast: "וְהָיָ֣ה אַֽחֲרֵי־כֵ֗ן אֶשְׁפּ֤וֹךְ אֶת־רוּחִי֙ עַל־כָּל־בָּשָׂ֔ר וְנִבְּא֖וּ בְּנֵיכֶ֣ם וּבְנֽוֹתֵיכֶ֑ם זִקְנֵיכֶם֙ חֲלֹמ֣וֹת יַחֲלֹמ֔וּן בַּח֣וּרֵיכֶ֔ם חֶזְיֹנ֖וֹת יִרְאֽוּ׃"
  },
  {
    // Hebrew 3:19-24 = English 4:1-6 (Malachi's chapter split).
    ref: "Malachi 4:1",
    first: "“For behold, the day is coming, burning like a furnace, when all the arrogant and every evildoer will be stubble; the day is coming when I will set them ablaze,” says the LORD of Hosts. “Not a root or branch will be left to them.”",
    last: "“For behold, the day is coming, burning like a furnace, when all the arrogant and every evildoer will be stubble; the day is coming when I will set them ablaze,” says the LORD of Hosts. “Not a root or branch will be left to them.”",
    original: "כִּֽי־הִנֵּ֤ה הַיּוֹם֙ בָּ֔א בֹּעֵ֖ר כַּתַּנּ֑וּר וְהָי֨וּ כָל־זֵדִ֜ים וְכָל־עֹשֵׂ֤ה רִשְׁעָה֙ קַ֔שׁ וְלִהַ֨ט אֹתָ֜ם הַיּ֣וֹם הַבָּ֗א אָמַר֙ יְהוָ֣ה צְבָא֔וֹת אֲשֶׁ֛ר לֹא־יַעֲזֹ֥ב לָהֶ֖ם שֹׁ֥רֶשׁ וְעָנָֽף׃",
    originalLast: "כִּֽי־הִנֵּ֤ה הַיּוֹם֙ בָּ֔א בֹּעֵ֖ר כַּתַּנּ֑וּר וְהָי֨וּ כָל־זֵדִ֜ים וְכָל־עֹשֵׂ֤ה רִשְׁעָה֙ קַ֔שׁ וְלִהַ֨ט אֹתָ֜ם הַיּ֣וֹם הַבָּ֗א אָמַר֙ יְהוָ֣ה צְבָא֔וֹת אֲשֶׁ֛ר לֹא־יַעֲזֹ֥ב לָהֶ֖ם שֹׁ֥רֶשׁ וְעָנָֽף׃"
  }
]

for (const c of CASES) {
  const verses = Text.resolve(Reference.parseRef(c.ref), BSB)
  assert.ok(verses.length > 0, c.ref + ": resolved no verses")
  assert.equal(verses[0].text, c.first, c.ref + ": first verse text")
  assert.equal(verses[verses.length - 1].text, c.last, c.ref + ": last verse text")

  if (c.original !== undefined) {
    const book = Reference.parseRef(c.ref).book
    const originalTable = Text.originalFor(book) === "greek" ? SBLGNT : WLC
    const originalVerses = Text.resolve(Reference.parseRef(c.ref), originalTable)
    assert.ok(originalVerses.length > 0, c.ref + ": resolved no original-language verses")
    assert.equal(originalVerses[0].text, c.original, c.ref + ": first verse original text")
    assert.equal(originalVerses[originalVerses.length - 1].text, c.originalLast, c.ref + ": last verse original text")
  }
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

// originalFor: NT books read Greek, everything else Hebrew.
{
  assert.equal(Text.originalFor("John"), "greek")
  assert.equal(Text.originalFor("Rev"), "greek")
  assert.equal(Text.originalFor("Gen"), "hebrew")
  assert.equal(Text.originalFor("Ps"), "hebrew")
  assert.equal(Text.originalFor("Mal"), "hebrew")
}

// versionName: readable label per version key.
{
  assert.equal(Text.versionName("english"), "Berean Standard Bible")
  assert.equal(Text.versionName("greek"), "SBL Greek New Testament")
  assert.equal(Text.versionName("hebrew"), "Westminster Leningrad Codex")
}

// interleave: pairs english/original verses by chapter:verse, in english order.
{
  const english = Text.resolve(Reference.parseRef("John 3:16-17"), BSB)
  const original = Text.resolve(Reference.parseRef("John 3:16-17"), SBLGNT)
  const rows = Text.interleave(english, original)
  assert.equal(rows.length, 2)
  assert.equal(rows[0].chapter, 3)
  assert.equal(rows[0].verse, 16)
  assert.equal(rows[0].english, english[0].text)
  assert.equal(rows[0].original, original[0].text)
  assert.equal(rows[1].verse, 17)
}

console.log("text.test.js: " + CASES.length + " reference cases + 3 structural checks + 3 model checks passed")
