// Sunday/feast lectionary table: RCL (CCT base) as published by Vanderbilt
// Divinity Library's Revised Common Lectionary site
// (https://lectionary.library.vanderbilt.edu/), transcribed by hand.
//
// Shape: SUNDAYS[day-key][year-letter] = { first, psalm, second, gospel }.
// Each reading value is either a plain ref string, or { ref, alt: [...] }
// when the RCL lists "or" alternates (alt is carried through for later
// tickets but never shown in the tooltip). For Propers 4-29 only, "first"
// and "psalm" become { "1": reading, "2": reading } — Track 1
// (semi-continuous OT) vs. Track 2 (complementary OT) — since those two
// tracks diverge only in the Old Testament reading and Psalm, and only
// across that span of the church year.
//
// Verified against Vanderbilt's RCL CSV exports (dated 2026-09-19: "Year A -
// All Seasons_25-26", "Year B - All Seasons_26-27", "Year C - All Seasons_
// 27-28", one calendar year of Sundays/feasts per year-letter) via
// build/verify_sundays.py. Every day key that appears in at least one of
// those three exports was checked and corrected to match. Not verifiable
// from these three specific calendar years (because that Sunday didn't
// occur in the corresponding export, not because the reading is in doubt):
// Epiphany 5-9 in at least one year-letter (short Epiphany seasons don't
// reach that far), and Proper 3-5 in at least one year-letter (the season
// after Pentecost starts later some years). Those entries remain as
// transcribed from published RCL tables and are unverified against this
// pass; re-run verify_sundays.py against a CSV export that covers them to
// close the gap.

var SUNDAYS = {
  "advent-1": {
    A: { first: "Isaiah 2:1-5", psalm: "Psalm 122", second: "Romans 13:11-14", gospel: "Matthew 24:36-44" },
    B: { first: "Isaiah 64:1-9", psalm: "Psalm 80:1-7,17-19", second: "1 Corinthians 1:3-9", gospel: "Mark 13:24-37" },
    C: { first: "Jeremiah 33:14-16", psalm: "Psalm 25:1-10", second: "1 Thessalonians 3:9-13", gospel: "Luke 21:25-36" }
  },
  "advent-2": {
    A: { first: "Isaiah 11:1-10", psalm: "Psalm 72:1-7,18-19", second: "Romans 15:4-13", gospel: "Matthew 3:1-12" },
    B: { first: "Isaiah 40:1-11", psalm: "Psalm 85:1-2,8-13", second: "2 Peter 3:8-15a", gospel: "Mark 1:1-8" },
    C: { first: { ref: "Baruch 5:1-9", alt: ["Malachi 3:1-4"] }, psalm: "Luke 1:68-79", second: "Philippians 1:3-11", gospel: "Luke 3:1-6" }
  },
  "advent-3": {
    A: { first: "Isaiah 35:1-10", psalm: { ref: "Psalm 146:5-10", alt: ["Luke 1:46b-55"] }, second: "James 5:7-10", gospel: "Matthew 11:2-11" },
    B: { first: "Isaiah 61:1-4,8-11", psalm: { ref: "Psalm 126", alt: ["Luke 1:46b-55"] }, second: "1 Thessalonians 5:16-24", gospel: "John 1:6-8,19-28" },
    C: { first: "Zephaniah 3:14-20", psalm: "Isaiah 12:2-6", second: "Philippians 4:4-7", gospel: "Luke 3:7-18" }
  },
  "advent-4": {
    A: { first: "Isaiah 7:10-16", psalm: "Psalm 80:1-7,17-19", second: "Romans 1:1-7", gospel: "Matthew 1:18-25" },
    B: { first: "2 Samuel 7:1-11,16", psalm: { ref: "Luke 1:46b-55", alt: ["Psalm 89:1-4,19-26"] }, second: "Romans 16:25-27", gospel: "Luke 1:26-38" },
    C: { first: "Micah 5:2-5a", psalm: { ref: "Luke 1:46b-55", alt: ["Psalm 80:1-7"] }, second: "Hebrews 10:5-10", gospel: "Luke 1:39-45,(46-55)" }
  },
  "christmas": {
    "*": { first: "Isaiah 9:2-7", psalm: "Psalm 96", second: "Titus 2:11-14", gospel: "Luke 2:1-14,(15-20)" }
  },
  "christmas-1": {
    A: { first: "Isaiah 63:7-9", psalm: "Psalm 148", second: "Hebrews 2:10-18", gospel: "Matthew 2:13-23" },
    B: { first: "Isaiah 61:10-62:3", psalm: "Psalm 148", second: "Galatians 4:4-7", gospel: "Luke 2:22-40" },
    C: { first: "1 Samuel 2:18-20,26", psalm: "Psalm 148", second: "Colossians 3:12-17", gospel: "Luke 2:41-52" }
  },
  "christmas-2": {
    "*": { first: { ref: "Jeremiah 31:7-14", alt: ["Sirach 24:1-12"] }, psalm: { ref: "Psalm 147:12-20", alt: ["Wisdom of Solomon 10:15-21"] }, second: "Ephesians 1:3-14", gospel: "John 1:(1-9),10-18" }
  },
  "holy-name": {
    "*": { first: "Numbers 6:22-27", psalm: "Psalm 8", second: { ref: "Galatians 4:4-7", alt: ["Philippians 2:5-11"] }, gospel: "Luke 2:15-21" }
  },
  "epiphany": {
    "*": { first: "Isaiah 60:1-6", psalm: "Psalm 72:1-7,10-14", second: "Ephesians 3:1-12", gospel: "Matthew 2:1-12" }
  },
  "baptism": {
    A: { first: "Isaiah 42:1-9", psalm: "Psalm 29", second: "Acts 10:34-43", gospel: "Matthew 3:13-17" },
    B: { first: "Genesis 1:1-5", psalm: "Psalm 29", second: "Acts 19:1-7", gospel: "Mark 1:4-11" },
    C: { first: "Isaiah 43:1-7", psalm: "Psalm 29", second: "Acts 8:14-17", gospel: "Luke 3:15-17,21-22" }
  },
  "epiphany-2": {
    A: { first: "Isaiah 49:1-7", psalm: "Psalm 40:1-11", second: "1 Corinthians 1:1-9", gospel: "John 1:29-42" },
    B: { first: "1 Samuel 3:1-10,(11-20)", psalm: "Psalm 139:1-6,13-18", second: "1 Corinthians 6:12-20", gospel: "John 1:43-51" },
    C: { first: "Isaiah 62:1-5", psalm: "Psalm 36:5-10", second: "1 Corinthians 12:1-11", gospel: "John 2:1-11" }
  },
  "epiphany-3": {
    A: { first: "Isaiah 9:1-4", psalm: "Psalm 27:1,4-9", second: "1 Corinthians 1:10-18", gospel: "Matthew 4:12-23" },
    B: { first: "Jonah 3:1-5,10", psalm: "Psalm 62:5-12", second: "1 Corinthians 7:29-31", gospel: "Mark 1:14-20" },
    C: { first: "Nehemiah 8:1-3,5-6,8-10", psalm: "Psalm 19", second: "1 Corinthians 12:12-31a", gospel: "Luke 4:14-21" }
  },
  "epiphany-4": {
    A: { first: "Micah 6:1-8", psalm: "Psalm 15", second: "1 Corinthians 1:18-31", gospel: "Matthew 5:1-12" },
    B: { first: "Deuteronomy 18:15-20", psalm: "Psalm 111", second: "1 Corinthians 8:1-13", gospel: "Mark 1:21-28" },
    C: { first: "Jeremiah 1:4-10", psalm: "Psalm 71:1-6", second: "1 Corinthians 13:1-13", gospel: "Luke 4:21-30" }
  },
  "epiphany-5": {
    A: { first: "Isaiah 58:1-9a,(9b-12)", psalm: "Psalm 112:1-9,(10)", second: "1 Corinthians 2:1-12,(13-16)", gospel: "Matthew 5:13-20" },
    B: { first: "Isaiah 40:21-31", psalm: "Psalm 147:1-11,20c", second: "1 Corinthians 9:16-23", gospel: "Mark 1:29-39" },
    C: { first: "Isaiah 6:1-8,(9-13)", psalm: "Psalm 138", second: "1 Corinthians 15:1-11", gospel: "Luke 5:1-11" }
  },
  "epiphany-6": {
    A: { first: "Deuteronomy 30:15-20", psalm: "Psalm 119:1-8", second: "1 Corinthians 3:1-9", gospel: "Matthew 5:21-37" },
    B: { first: "2 Kings 5:1-14", psalm: "Psalm 30", second: "1 Corinthians 9:24-27", gospel: "Mark 1:40-45" },
    C: { first: "Jeremiah 17:5-10", psalm: "Psalm 1", second: "1 Corinthians 15:12-20", gospel: "Luke 6:17-26" }
  },
  "epiphany-7": {
    A: { first: "Leviticus 19:1-2,9-18", psalm: "Psalm 119:33-40", second: "1 Corinthians 3:10-11,16-23", gospel: "Matthew 5:38-48" },
    B: { first: "Isaiah 43:18-25", psalm: "Psalm 41", second: "2 Corinthians 1:18-22", gospel: "Mark 2:1-12" },
    C: { first: "Genesis 45:3-11,15", psalm: "Psalm 37:1-11,39-40", second: "1 Corinthians 15:35-38,42-50", gospel: "Luke 6:27-38" }
  },
  "epiphany-8": {
    A: { first: "Isaiah 49:8-16a", psalm: "Psalm 131", second: "1 Corinthians 4:1-5", gospel: "Matthew 6:24-34" },
    B: { first: "Hosea 2:14-20", psalm: "Psalm 103:1-13,22", second: "2 Corinthians 3:1-6", gospel: "Mark 2:13-22" },
    C: { first: "Isaiah 55:10-13", psalm: "Psalm 92:1-4,12-15", second: "1 Corinthians 15:51-58", gospel: "Luke 6:39-49" }
  },
  "epiphany-9": {
    A: { first: "Deuteronomy 11:18-21,26-28", psalm: "Psalm 31:1-5,19-24", second: "Romans 1:16-17,3:22b-28,(29-31)", gospel: "Matthew 7:21-29" },
    B: { first: "Deuteronomy 5:12-15", psalm: "Psalm 81:1-10", second: "2 Corinthians 4:5-12", gospel: "Mark 2:23-3:6" },
    C: { first: "1 Kings 8:22-23,41-43", psalm: "Psalm 96:1-9", second: "Galatians 1:1-12", gospel: "Luke 7:1-10" }
  },
  "transfiguration": {
    A: { first: "Exodus 24:12-18", psalm: { ref: "Psalm 2", alt: ["Psalm 99"] }, second: "2 Peter 1:16-21", gospel: "Matthew 17:1-9" },
    B: { first: "2 Kings 2:1-12", psalm: "Psalm 50:1-6", second: "2 Corinthians 4:3-6", gospel: "Mark 9:2-9" },
    C: { first: "Exodus 34:29-35", psalm: "Psalm 99", second: "2 Corinthians 3:12-4:2", gospel: "Luke 9:28-36,(37-43a)" }
  },
  "ash-wednesday": {
    "*": { first: { ref: "Joel 2:1-2,12-17", alt: ["Isaiah 58:1-12"] }, psalm: "Psalm 51:1-17", second: "2 Corinthians 5:20b-6:10", gospel: "Matthew 6:1-6,16-21" }
  },
  "lent-1": {
    A: { first: "Genesis 2:15-17,3:1-7", psalm: "Psalm 32", second: "Romans 5:12-19", gospel: "Matthew 4:1-11" },
    B: { first: "Genesis 9:8-17", psalm: "Psalm 25:1-10", second: "1 Peter 3:18-22", gospel: "Mark 1:9-15" },
    C: { first: "Deuteronomy 26:1-11", psalm: "Psalm 91:1-2,9-16", second: "Romans 10:8b-13", gospel: "Luke 4:1-13" }
  },
  "lent-2": {
    A: { first: "Genesis 12:1-4a", psalm: "Psalm 121", second: "Romans 4:1-5,13-17", gospel: { ref: "John 3:1-17", alt: ["Matthew 17:1-9"] } },
    B: { first: "Genesis 17:1-7,15-16", psalm: "Psalm 22:23-31", second: "Romans 4:13-25", gospel: { ref: "Mark 8:31-38", alt: ["Mark 9:2-9"] } },
    C: { first: "Genesis 15:1-12,17-18", psalm: "Psalm 27", second: "Philippians 3:17-4:1", gospel: { ref: "Luke 13:31-35", alt: ["Luke 9:28-36,(37-43a)"] } }
  },
  "lent-3": {
    A: { first: "Exodus 17:1-7", psalm: "Psalm 95", second: "Romans 5:1-11", gospel: "John 4:5-42" },
    B: { first: "Exodus 20:1-17", psalm: "Psalm 19", second: "1 Corinthians 1:18-25", gospel: "John 2:13-22" },
    C: { first: "Isaiah 55:1-9", psalm: "Psalm 63:1-8", second: "1 Corinthians 10:1-13", gospel: "Luke 13:1-9" }
  },
  "lent-4": {
    A: { first: "1 Samuel 16:1-13", psalm: "Psalm 23", second: "Ephesians 5:8-14", gospel: "John 9:1-41" },
    B: { first: "Numbers 21:4-9", psalm: "Psalm 107:1-3,17-22", second: "Ephesians 2:1-10", gospel: "John 3:14-21" },
    C: { first: "Joshua 5:9-12", psalm: "Psalm 32", second: "2 Corinthians 5:16-21", gospel: "Luke 15:1-3,11b-32" }
  },
  "lent-5": {
    A: { first: "Ezekiel 37:1-14", psalm: "Psalm 130", second: "Romans 8:6-11", gospel: "John 11:1-45" },
    B: { first: "Jeremiah 31:31-34", psalm: { ref: "Psalm 51:1-12", alt: ["Psalm 119:9-16"] }, second: "Hebrews 5:5-10", gospel: "John 12:20-33" },
    C: { first: "Isaiah 43:16-21", psalm: "Psalm 126", second: "Philippians 3:4b-14", gospel: "John 12:1-8" }
  },
  "palm-sunday": {
    A: { first: "Isaiah 50:4-9a", psalm: "Psalm 31:9-16", second: "Philippians 2:5-11", gospel: { ref: "Matthew 26:14-27:66", alt: ["Matthew 27:11-54"] } },
    B: { first: "Isaiah 50:4-9a", psalm: "Psalm 31:9-16", second: "Philippians 2:5-11", gospel: { ref: "Mark 14:1-15:47", alt: ["Mark 15:1-39,(40-47)"] } },
    C: { first: "Isaiah 50:4-9a", psalm: "Psalm 31:9-16", second: "Philippians 2:5-11", gospel: { ref: "Luke 22:14-23:56", alt: ["Luke 23:1-49"] } }
  },
  "holy-monday": {
    "*": { first: "Isaiah 42:1-9", psalm: "Psalm 36:5-11", second: "Hebrews 9:11-15", gospel: "John 12:1-11" }
  },
  "holy-tuesday": {
    "*": { first: "Isaiah 49:1-7", psalm: "Psalm 71:1-14", second: "1 Corinthians 1:18-31", gospel: "John 12:20-36" }
  },
  "holy-wednesday": {
    "*": { first: "Isaiah 50:4-9a", psalm: "Psalm 70", second: "Hebrews 12:1-3", gospel: "John 13:21-32" }
  },
  "maundy-thursday": {
    "*": { first: "Exodus 12:1-4,(5-10),11-14", psalm: "Psalm 116:1-2,12-19", second: "1 Corinthians 11:23-26", gospel: "John 13:1-17,31b-35" }
  },
  "good-friday": {
    "*": { first: "Isaiah 52:13-53:12", psalm: "Psalm 22", second: { ref: "Hebrews 10:16-25", alt: ["Hebrews 4:14-16,5:7-9"] }, gospel: "John 18:1-19:42" }
  },
  "holy-saturday": {
    "*": { first: { ref: "Job 14:1-14", alt: ["Lamentations 3:1-9,19-24"] }, psalm: "Psalm 31:1-4,15-16", second: "1 Peter 4:1-8", gospel: { ref: "Matthew 27:57-66", alt: ["John 19:38-42"] } }
  },
  "easter": {
    A: { first: { ref: "Acts 10:34-43", alt: ["Jeremiah 31:1-6"] }, psalm: "Psalm 118:1-2,14-24", second: { ref: "Colossians 3:1-4", alt: ["Acts 10:34-43"] }, gospel: { ref: "John 20:1-18", alt: ["Matthew 28:1-10"] } },
    B: { first: { ref: "Acts 10:34-43", alt: ["Isaiah 25:6-9"] }, psalm: "Psalm 118:1-2,14-24", second: { ref: "1 Corinthians 15:1-11", alt: ["Acts 10:34-43"] }, gospel: { ref: "John 20:1-18", alt: ["Mark 16:1-8"] } },
    C: { first: { ref: "Acts 10:34-43", alt: ["Isaiah 65:17-25"] }, psalm: "Psalm 118:1-2,14-24", second: { ref: "1 Corinthians 15:19-26", alt: ["Acts 10:34-43"] }, gospel: { ref: "John 20:1-18", alt: ["Luke 24:1-12"] } }
  },
  "easter-2": {
    A: { first: "Acts 2:14a,22-32", psalm: "Psalm 16", second: "1 Peter 1:3-9", gospel: "John 20:19-31" },
    B: { first: "Acts 4:32-35", psalm: "Psalm 133", second: "1 John 1:1-2:2", gospel: "John 20:19-31" },
    C: { first: "Acts 5:27-32", psalm: { ref: "Psalm 118:14-29", alt: ["Psalm 150"] }, second: "Revelation 1:4-8", gospel: "John 20:19-31" }
  },
  "easter-3": {
    A: { first: "Acts 2:14a,36-41", psalm: "Psalm 116:1-4,12-19", second: "1 Peter 1:17-23", gospel: "Luke 24:13-35" },
    B: { first: "Acts 3:12-19", psalm: "Psalm 4", second: "1 John 3:1-7", gospel: "Luke 24:36b-48" },
    C: { first: "Acts 9:1-6,(7-20)", psalm: "Psalm 30", second: "Revelation 5:11-14", gospel: "John 21:1-19" }
  },
  "easter-4": {
    A: { first: "Acts 2:42-47", psalm: "Psalm 23", second: "1 Peter 2:19-25", gospel: "John 10:1-10" },
    B: { first: "Acts 4:5-12", psalm: "Psalm 23", second: "1 John 3:16-24", gospel: "John 10:11-18" },
    C: { first: "Acts 9:36-43", psalm: "Psalm 23", second: "Revelation 7:9-17", gospel: "John 10:22-30" }
  },
  "easter-5": {
    A: { first: "Acts 7:55-60", psalm: "Psalm 31:1-5,15-16", second: "1 Peter 2:2-10", gospel: "John 14:1-14" },
    B: { first: "Acts 8:26-40", psalm: "Psalm 22:25-31", second: "1 John 4:7-21", gospel: "John 15:1-8" },
    C: { first: "Acts 11:1-18", psalm: "Psalm 148", second: "Revelation 21:1-6", gospel: "John 13:31-35" }
  },
  "easter-6": {
    A: { first: "Acts 17:22-31", psalm: "Psalm 66:8-20", second: "1 Peter 3:13-22", gospel: "John 14:15-21" },
    B: { first: "Acts 10:44-48", psalm: "Psalm 98", second: "1 John 5:1-6", gospel: "John 15:9-17" },
    C: { first: "Acts 16:9-15", psalm: "Psalm 67", second: "Revelation 21:10,22-22:5", gospel: { ref: "John 14:23-29", alt: ["John 5:1-9"] } }
  },
  "easter-7": {
    A: { first: "Acts 1:6-14", psalm: "Psalm 68:1-10,32-35", second: "1 Peter 4:12-14,5:6-11", gospel: "John 17:1-11" },
    B: { first: "Acts 1:15-17,21-26", psalm: "Psalm 1", second: "1 John 5:9-13", gospel: "John 17:6-19" },
    C: { first: "Acts 16:16-34", psalm: "Psalm 97", second: "Revelation 22:12-14,16-17,20-21", gospel: "John 17:20-26" }
  },
  "ascension": {
    "*": { first: "Acts 1:1-11", psalm: { ref: "Psalm 47", alt: ["Psalm 93"] }, second: "Ephesians 1:15-23", gospel: "Luke 24:44-53" }
  },
  "pentecost": {
    A: { first: { ref: "Acts 2:1-21", alt: ["Numbers 11:24-30"] }, psalm: "Psalm 104:24-34,35b", second: { ref: "1 Corinthians 12:3b-13", alt: ["Acts 2:1-21"] }, gospel: { ref: "John 20:19-23", alt: ["John 7:37-39"] } },
    B: { first: { ref: "Acts 2:1-21", alt: ["Ezekiel 37:1-14"] }, psalm: "Psalm 104:24-34,35b", second: { ref: "Romans 8:22-27", alt: ["Acts 2:1-21"] }, gospel: "John 15:26-27,16:4b-15" },
    C: { first: { ref: "Acts 2:1-21", alt: ["Genesis 11:1-9"] }, psalm: "Psalm 104:24-34,35b", second: { ref: "Romans 8:14-17", alt: ["Acts 2:1-21"] }, gospel: "John 14:8-17,(25-27)" }
  },
  "trinity": {
    A: { first: "Genesis 1:1-2:4a", psalm: "Psalm 8", second: "2 Corinthians 13:11-13", gospel: "Matthew 28:16-20" },
    B: { first: "Isaiah 6:1-8", psalm: "Psalm 29", second: "Romans 8:12-17", gospel: "John 3:1-17" },
    C: { first: "Proverbs 8:1-4,22-31", psalm: "Psalm 8", second: "Romans 5:1-5", gospel: "John 16:12-15" }
  },
  "proper-3": {
    A: { first: { "1": "Genesis 1:1-2:4a", "2": "Isaiah 49:8-16a" }, psalm: { "1": "Psalm 136:1-9,23-26", "2": "Psalm 131" }, second: "1 Corinthians 3:10-11,16-23", gospel: "Matthew 6:24-34" },
    B: { first: { "1": "Hosea 2:14-20", "2": "Isaiah 43:18-25" }, psalm: { "1": "Psalm 103:1-13,22", "2": "Psalm 41" }, second: "2 Corinthians 3:1-6", gospel: "Mark 2:13-22" },
    C: { first: { "1": "Isaiah 55:10-13", "2": "Jeremiah 17:5-10" }, psalm: { "1": "Psalm 92:1-4,12-15", "2": "Psalm 1" }, second: "1 Corinthians 15:51-58", gospel: "Luke 6:39-49" }
  },
  "proper-4": {
    A: { first: { "1": "Genesis 6:9-22,7:24,8:14-19", "2": "Deuteronomy 11:18-21,26-28" }, psalm: { "1": "Psalm 46", "2": "Psalm 31:1-5,19-24" }, second: "Romans 1:16-17,3:22b-28,(29-31)", gospel: "Matthew 7:21-29" },
    B: { first: { "1": "1 Samuel 3:1-10,(11-20)", "2": "Deuteronomy 5:12-15" }, psalm: { "1": "Psalm 139:1-6,13-18", "2": "Psalm 81:1-10" }, second: "2 Corinthians 4:5-12", gospel: "Mark 2:23-3:6" },
    C: { first: { "1": "1 Kings 18:20-21,(22-29),30-39", "2": "1 Kings 8:22-23,41-43" }, psalm: { "1": "Psalm 96", "2": "Psalm 96:1-9" }, second: "Galatians 1:1-12", gospel: "Luke 7:1-10" }
  },
  "proper-5": {
    A: { first: { "1": "Genesis 12:1-9", "2": "Hosea 5:15-6:6" }, psalm: { "1": "Psalm 33:1-12", "2": "Psalm 50:7-15" }, second: "Romans 4:13-25", gospel: "Matthew 9:9-13,18-26" },
    B: { first: { "1": "1 Samuel 8:4-11,(12-15),16-20,(11:14-15)", "2": "Genesis 3:8-15" }, psalm: { "1": "Psalm 138", "2": "Psalm 130" }, second: "2 Corinthians 4:13-5:1", gospel: "Mark 3:20-35" },
    C: { first: { "1": "1 Kings 17:8-16,(17-24)", "2": "1 Kings 17:17-24" }, psalm: { "1": "Psalm 146", "2": "Psalm 30" }, second: "Galatians 1:11-24", gospel: "Luke 7:11-17" }
  },
  "proper-6": {
    A: { first: { "1": "Genesis 18:1-15,(21:1-7)", "2": "Exodus 19:2-8a" }, psalm: { "1": "Psalm 116:1-2,12-19", "2": "Psalm 100" }, second: "Romans 5:1-8", gospel: "Matthew 9:35-10:8,(9-23)" },
    B: { first: { "1": "1 Samuel 15:34-16:13", "2": "Ezekiel 17:22-24" }, psalm: { "1": "Psalm 20", "2": "Psalm 92:1-4,12-15" }, second: "2 Corinthians 5:6-10,(11-13),14-17", gospel: "Mark 4:26-34" },
    C: { first: { "1": "1 Kings 21:1-10,(11-14),15-21a", "2": "2 Samuel 11:26-12:10,13-15" }, psalm: { "1": "Psalm 5:1-8", "2": "Psalm 32" }, second: "Galatians 2:15-21", gospel: "Luke 7:36-8:3" }
  },
  "proper-7": {
    A: { first: { "1": "Genesis 21:8-21", "2": "Jeremiah 20:7-13" }, psalm: { "1": "Psalm 86:1-10,16-17", "2": "Psalm 69:7-10,(11-15),16-18" }, second: "Romans 6:1b-11", gospel: "Matthew 10:24-39" },
    B: { first: { "1": { ref: "1 Samuel 17:(1a,4-11,19-23),32-49", alt: ["1 Samuel 17:57-18:5,18:10-16"] }, "2": "Job 38:1-11" }, psalm: { "1": { ref: "Psalm 9:9-20", alt: ["Psalm 133"] }, "2": "Psalm 107:1-3,23-32" }, second: "2 Corinthians 6:1-13", gospel: "Mark 4:35-41" },
    C: { first: { "1": "1 Kings 19:1-4,(5-7),8-15a", "2": "Isaiah 65:1-9" }, psalm: { "1": "Psalm 42,43", "2": "Psalm 22:19-28" }, second: "Galatians 3:23-29", gospel: "Luke 8:26-39" }
  },
  "proper-8": {
    A: { first: { "1": "Genesis 22:1-14", "2": "Jeremiah 28:5-9" }, psalm: { "1": "Psalm 13", "2": "Psalm 89:1-4,15-18" }, second: "Romans 6:12-23", gospel: "Matthew 10:40-42" },
    B: { first: { "1": "2 Samuel 1:1,17-27", "2": { ref: "Wisdom of Solomon 1:13-15,2:23-24", alt: ["Lamentations 3:22-33"] } }, psalm: { "1": "Psalm 130", "2": "Psalm 30" }, second: "2 Corinthians 8:7-15", gospel: "Mark 5:21-43" },
    C: { first: { "1": "2 Kings 2:1-2,6-14", "2": "1 Kings 19:15-16,19-21" }, psalm: { "1": "Psalm 77:1-2,11-20", "2": "Psalm 16" }, second: "Galatians 5:1,13-25", gospel: "Luke 9:51-62" }
  },
  "proper-9": {
    A: { first: { "1": "Genesis 24:34-38,42-49,58-67", "2": "Zechariah 9:9-12" }, psalm: { "1": { ref: "Psalm 45:10-17", alt: ["Song of Solomon 2:8-13"] }, "2": "Psalm 145:8-14" }, second: "Romans 7:15-25a", gospel: "Matthew 11:16-19,25-30" },
    B: { first: { "1": "2 Samuel 5:1-5,9-10", "2": "Ezekiel 2:1-5" }, psalm: { "1": "Psalm 48", "2": "Psalm 123" }, second: "2 Corinthians 12:2-10", gospel: "Mark 6:1-13" },
    C: { first: { "1": "2 Kings 5:1-14", "2": "Isaiah 66:10-14" }, psalm: { "1": "Psalm 30", "2": "Psalm 66:1-9" }, second: "Galatians 6:(1-6),7-16", gospel: "Luke 10:1-11,16-20" }
  },
  "proper-10": {
    A: { first: { "1": "Genesis 25:19-34", "2": "Isaiah 55:10-13" }, psalm: { "1": "Psalm 119:105-112", "2": "Psalm 65:(1-8),9-13" }, second: "Romans 8:1-11", gospel: "Matthew 13:1-9,18-23" },
    B: { first: { "1": "2 Samuel 6:1-5,12b-19", "2": "Amos 7:7-15" }, psalm: { "1": "Psalm 24", "2": "Psalm 85:8-13" }, second: "Ephesians 1:3-14", gospel: "Mark 6:14-29" },
    C: { first: { "1": "Amos 7:7-17", "2": "Deuteronomy 30:9-14" }, psalm: { "1": "Psalm 82", "2": "Psalm 25:1-10" }, second: "Colossians 1:1-14", gospel: "Luke 10:25-37" }
  },
  "proper-11": {
    A: { first: { "1": "Genesis 28:10-19a", "2": { ref: "Wisdom of Solomon 12:13,16-19", alt: ["Isaiah 44:6-8"] } }, psalm: { "1": "Psalm 139:1-12,23-24", "2": "Psalm 86:11-17" }, second: "Romans 8:12-25", gospel: "Matthew 13:24-30,36-43" },
    B: { first: { "1": "2 Samuel 7:1-14a", "2": "Jeremiah 23:1-6" }, psalm: { "1": "Psalm 89:20-37", "2": "Psalm 23" }, second: "Ephesians 2:11-22", gospel: "Mark 6:30-34,53-56" },
    C: { first: { "1": "Amos 8:1-12", "2": "Genesis 18:1-10a" }, psalm: { "1": "Psalm 52", "2": "Psalm 15" }, second: "Colossians 1:15-28", gospel: "Luke 10:38-42" }
  },
  "proper-12": {
    A: { first: { "1": "Genesis 29:15-28", "2": "1 Kings 3:5-12" }, psalm: { "1": { ref: "Psalm 105:1-11,45b", alt: ["Psalm 128"] }, "2": "Psalm 119:129-136" }, second: "Romans 8:26-39", gospel: "Matthew 13:31-33,44-52" },
    B: { first: { "1": "2 Samuel 11:1-15", "2": "2 Kings 4:42-44" }, psalm: { "1": "Psalm 14", "2": "Psalm 145:10-18" }, second: "Ephesians 3:14-21", gospel: "John 6:1-21" },
    C: { first: { "1": "Hosea 1:2-10", "2": "Genesis 18:20-32" }, psalm: { "1": "Psalm 85", "2": "Psalm 138" }, second: "Colossians 2:6-15,(16-19)", gospel: "Luke 11:1-13" }
  },
  "proper-13": {
    A: { first: { "1": "Genesis 32:22-31", "2": "Isaiah 55:1-5" }, psalm: { "1": "Psalm 17:1-7,15", "2": "Psalm 145:8-9,14-21" }, second: "Romans 9:1-5", gospel: "Matthew 14:13-21" },
    B: { first: { "1": "2 Samuel 11:26-12:13a", "2": "Exodus 16:2-4,9-15" }, psalm: { "1": "Psalm 51:1-12", "2": "Psalm 78:23-29" }, second: "Ephesians 4:1-16", gospel: "John 6:24-35" },
    C: { first: { "1": "Hosea 11:1-11", "2": "Ecclesiastes 1:2,12-14,2:18-23" }, psalm: { "1": "Psalm 107:1-9,43", "2": "Psalm 49:1-12" }, second: "Colossians 3:1-11", gospel: "Luke 12:13-21" }
  },
  "proper-14": {
    A: { first: { "1": "Genesis 37:1-4,12-28", "2": "1 Kings 19:9-18" }, psalm: { "1": "Psalm 105:1-6,16-22,45b", "2": "Psalm 85:8-13" }, second: "Romans 10:5-15", gospel: "Matthew 14:22-33" },
    B: { first: { "1": "2 Samuel 18:5-9,15,31-33", "2": "1 Kings 19:4-8" }, psalm: { "1": "Psalm 130", "2": "Psalm 34:1-8" }, second: "Ephesians 4:25-5:2", gospel: "John 6:35,41-51" },
    C: { first: { "1": "Isaiah 1:1,10-20", "2": "Genesis 15:1-6" }, psalm: { "1": "Psalm 50:1-8,22-23", "2": "Psalm 33:12-22" }, second: "Hebrews 11:1-3,8-16", gospel: "Luke 12:32-40" }
  },
  "proper-15": {
    A: { first: { "1": "Genesis 45:1-15", "2": "Isaiah 56:1,6-8" }, psalm: { "1": "Psalm 133", "2": "Psalm 67" }, second: "Romans 11:1-2a,29-32", gospel: "Matthew 15:(10-20),21-28" },
    B: { first: { "1": "1 Kings 2:10-12,3:3-14", "2": "Proverbs 9:1-6" }, psalm: { "1": "Psalm 111", "2": "Psalm 34:9-14" }, second: "Ephesians 5:15-20", gospel: "John 6:51-58" },
    C: { first: { "1": "Isaiah 5:1-7", "2": "Jeremiah 23:23-29" }, psalm: { "1": "Psalm 80:1-2,8-19", "2": "Psalm 82" }, second: "Hebrews 11:29-12:2", gospel: "Luke 12:49-56" }
  },
  "proper-16": {
    A: { first: { "1": "Exodus 1:8-2:10", "2": "Isaiah 51:1-6" }, psalm: { "1": "Psalm 124", "2": "Psalm 138" }, second: "Romans 12:1-8", gospel: "Matthew 16:13-20" },
    B: { first: { "1": "1 Kings 8:(1,6,10-11),22-30,41-43", "2": "Joshua 24:1-2a,14-18" }, psalm: { "1": "Psalm 84", "2": "Psalm 34:15-22" }, second: "Ephesians 6:10-20", gospel: "John 6:56-69" },
    C: { first: { "1": "Jeremiah 1:4-10", "2": "Isaiah 58:9b-14" }, psalm: { "1": "Psalm 71:1-6", "2": "Psalm 103:1-8" }, second: "Hebrews 12:18-29", gospel: "Luke 13:10-17" }
  },
  "proper-17": {
    A: { first: { "1": "Exodus 3:1-15", "2": "Jeremiah 15:15-21" }, psalm: { "1": "Psalm 105:1-6,23-26,45b", "2": "Psalm 26:1-8" }, second: "Romans 12:9-21", gospel: "Matthew 16:21-28" },
    B: { first: { "1": "Song of Solomon 2:8-13", "2": "Deuteronomy 4:1-2,6-9" }, psalm: { "1": "Psalm 45:1-2,6-9", "2": "Psalm 15" }, second: "James 1:17-27", gospel: "Mark 7:1-8,14-15,21-23" },
    C: { first: { "1": "Jeremiah 2:4-13", "2": { ref: "Sirach 10:12-18", alt: ["Proverbs 25:6-7"] } }, psalm: { "1": "Psalm 81:1,10-16", "2": "Psalm 112" }, second: "Hebrews 13:1-8,15-16", gospel: "Luke 14:1,7-14" }
  },
  "proper-18": {
    A: { first: { "1": "Exodus 12:1-14", "2": "Ezekiel 33:7-11" }, psalm: { "1": "Psalm 149", "2": "Psalm 119:33-40" }, second: "Romans 13:8-14", gospel: "Matthew 18:15-20" },
    B: { first: { "1": "Proverbs 22:1-2,8-9,22-23", "2": "Isaiah 35:4-7a" }, psalm: { "1": "Psalm 125", "2": "Psalm 146" }, second: "James 2:1-10,(11-13),14-17", gospel: "Mark 7:24-37" },
    C: { first: { "1": "Jeremiah 18:1-11", "2": "Deuteronomy 30:15-20" }, psalm: { "1": "Psalm 139:1-6,13-18", "2": "Psalm 1" }, second: "Philemon 1:1-21", gospel: "Luke 14:25-33" }
  },
  "proper-19": {
    A: { first: { "1": "Exodus 14:19-31", "2": "Genesis 50:15-21" }, psalm: { "1": { ref: "Psalm 114", alt: ["Exodus 15:1b-11,20-21"] }, "2": "Psalm 103:(1-7),8-13" }, second: "Romans 14:1-12", gospel: "Matthew 18:21-35" },
    B: { first: { "1": "Proverbs 1:20-33", "2": "Isaiah 50:4-9a" }, psalm: { "1": { ref: "Psalm 19", alt: ["Wisdom of Solomon 7:26-8:1"] }, "2": "Psalm 116:1-9" }, second: "James 3:1-12", gospel: "Mark 8:27-38" },
    C: { first: { "1": "Jeremiah 4:11-12,22-28", "2": "Exodus 32:7-14" }, psalm: { "1": "Psalm 14", "2": "Psalm 51:1-10" }, second: "1 Timothy 1:12-17", gospel: "Luke 15:1-10" }
  },
  "proper-20": {
    A: { first: { "1": "Exodus 16:2-15", "2": "Jonah 3:10-4:11" }, psalm: { "1": "Psalm 105:1-6,37-45", "2": "Psalm 145:1-8" }, second: "Philippians 1:21-30", gospel: "Matthew 20:1-16" },
    B: { first: { "1": "Proverbs 31:10-31", "2": { ref: "Wisdom of Solomon 1:16-2:1,12-22", alt: ["Jeremiah 11:18-20"] } }, psalm: { "1": "Psalm 1", "2": "Psalm 54" }, second: "James 3:13-4:3,7-8a", gospel: "Mark 9:30-37" },
    C: { first: { "1": "Jeremiah 8:18-9:1", "2": "Amos 8:4-7" }, psalm: { "1": "Psalm 79:1-9", "2": "Psalm 113" }, second: "1 Timothy 2:1-7", gospel: "Luke 16:1-13" }
  },
  "proper-21": {
    A: { first: { "1": "Exodus 17:1-7", "2": "Ezekiel 18:1-4,25-32" }, psalm: { "1": "Psalm 78:1-4,12-16", "2": "Psalm 25:1-9" }, second: "Philippians 2:1-13", gospel: "Matthew 21:23-32" },
    B: { first: { "1": "Esther 7:1-6,9-10,9:20-22", "2": "Numbers 11:4-6,10-16,24-29" }, psalm: { "1": "Psalm 124", "2": "Psalm 19:7-14" }, second: "James 5:13-20", gospel: "Mark 9:38-50" },
    C: { first: { "1": "Jeremiah 32:1-3a,6-15", "2": "Amos 6:1a,4-7" }, psalm: { "1": "Psalm 91:1-6,14-16", "2": "Psalm 146" }, second: "1 Timothy 6:6-19", gospel: "Luke 16:19-31" }
  },
  "proper-22": {
    A: { first: { "1": "Exodus 20:1-4,7-9,12-20", "2": "Isaiah 5:1-7" }, psalm: { "1": "Psalm 19", "2": "Psalm 80:7-15" }, second: "Philippians 3:4b-14", gospel: "Matthew 21:33-46" },
    B: { first: { "1": "Job 1:1,2:1-10", "2": "Genesis 2:18-24" }, psalm: { "1": "Psalm 26", "2": "Psalm 8" }, second: "Hebrews 1:1-4,2:5-12", gospel: "Mark 10:2-16" },
    C: { first: { "1": "Lamentations 1:1-6", "2": "Habakkuk 1:1-4,2:1-4" }, psalm: { "1": { ref: "Lamentations 3:19-26", alt: ["Psalm 137"] }, "2": "Psalm 37:1-9" }, second: "2 Timothy 1:1-14", gospel: "Luke 17:5-10" }
  },
  "proper-23": {
    A: { first: { "1": "Exodus 32:1-14", "2": "Isaiah 25:1-9" }, psalm: { "1": "Psalm 106:1-6,19-23", "2": "Psalm 23" }, second: "Philippians 4:1-9", gospel: "Matthew 22:1-14" },
    B: { first: { "1": "Job 23:1-9,16-17", "2": "Amos 5:6-7,10-15" }, psalm: { "1": "Psalm 22:1-15", "2": "Psalm 90:12-17" }, second: "Hebrews 4:12-16", gospel: "Mark 10:17-31" },
    C: { first: { "1": "Jeremiah 29:1,4-7", "2": "2 Kings 5:1-3,7-15c" }, psalm: { "1": "Psalm 66:1-12", "2": "Psalm 111" }, second: "2 Timothy 2:8-15", gospel: "Luke 17:11-19" }
  },
  "proper-24": {
    A: { first: { "1": "Exodus 33:12-23", "2": "Isaiah 45:1-7" }, psalm: { "1": "Psalm 99", "2": "Psalm 96:1-9,(10-13)" }, second: "1 Thessalonians 1:1-10", gospel: "Matthew 22:15-22" },
    B: { first: { "1": "Job 38:1-7,(34-41)", "2": "Isaiah 53:4-12" }, psalm: { "1": "Psalm 104:1-9,24,35c", "2": "Psalm 91:9-16" }, second: "Hebrews 5:1-10", gospel: "Mark 10:35-45" },
    C: { first: { "1": "Jeremiah 31:27-34", "2": "Genesis 32:22-31" }, psalm: { "1": "Psalm 119:97-104", "2": "Psalm 121" }, second: "2 Timothy 3:14-4:5", gospel: "Luke 18:1-8" }
  },
  "proper-25": {
    A: { first: { "1": "Deuteronomy 34:1-12", "2": "Leviticus 19:1-2,15-18" }, psalm: { "1": "Psalm 90:1-6,13-17", "2": "Psalm 1" }, second: "1 Thessalonians 2:1-8", gospel: "Matthew 22:34-46" },
    B: { first: { "1": "Job 42:1-6,10-17", "2": "Jeremiah 31:7-9" }, psalm: { "1": "Psalm 34:1-8,(19-22)", "2": "Psalm 126" }, second: "Hebrews 7:23-28", gospel: "Mark 10:46-52" },
    C: { first: { "1": "Joel 2:23-32", "2": { ref: "Sirach 35:12-17", alt: ["Jeremiah 14:7-10,19-22"] } }, psalm: { "1": "Psalm 65", "2": "Psalm 84:1-7" }, second: "2 Timothy 4:6-8,16-18", gospel: "Luke 18:9-14" }
  },
  "proper-26": {
    A: { first: { "1": "Joshua 3:7-17", "2": "Micah 3:5-12" }, psalm: { "1": "Psalm 107:1-7,33-37", "2": "Psalm 43" }, second: "1 Thessalonians 2:9-13", gospel: "Matthew 23:1-12" },
    B: { first: { "1": "Ruth 1:1-18", "2": "Deuteronomy 6:1-9" }, psalm: { "1": "Psalm 146", "2": "Psalm 119:1-8" }, second: "Hebrews 9:11-14", gospel: "Mark 12:28-34" },
    C: { first: { "1": "Habakkuk 1:1-4,2:1-4", "2": "Isaiah 1:10-18" }, psalm: { "1": "Psalm 119:137-144", "2": "Psalm 32:1-7" }, second: "2 Thessalonians 1:1-4,11-12", gospel: "Luke 19:1-10" }
  },
  "proper-27": {
    A: { first: { "1": "Joshua 24:1-3a,14-25", "2": { ref: "Wisdom of Solomon 6:12-16", alt: ["Amos 5:18-24"] } }, psalm: { "1": "Psalm 78:1-7", "2": { ref: "Wisdom of Solomon 6:17-20", alt: ["Psalm 70"] } }, second: "1 Thessalonians 4:13-18", gospel: "Matthew 25:1-13" },
    B: { first: { "1": "Ruth 3:1-5,4:13-17", "2": "1 Kings 17:8-16" }, psalm: { "1": "Psalm 127", "2": "Psalm 146" }, second: "Hebrews 9:24-28", gospel: "Mark 12:38-44" },
    C: { first: { "1": "Haggai 1:15b-2:9", "2": "Job 19:23-27a" }, psalm: { "1": { ref: "Psalm 145:1-5,17-21", alt: ["Psalm 98"] }, "2": "Psalm 17:1-9" }, second: "2 Thessalonians 2:1-5,13-17", gospel: "Luke 20:27-38" }
  },
  "proper-28": {
    A: { first: { "1": "Judges 4:1-7", "2": "Zephaniah 1:7,12-18" }, psalm: { "1": "Psalm 123", "2": "Psalm 90:1-8,(9-11),12" }, second: "1 Thessalonians 5:1-11", gospel: "Matthew 25:14-30" },
    B: { first: { "1": "1 Samuel 1:4-20", "2": "Daniel 12:1-3" }, psalm: { "1": "1 Samuel 2:1-10", "2": "Psalm 16" }, second: "Hebrews 10:11-14,(15-18),19-25", gospel: "Mark 13:1-8" },
    C: { first: { "1": "Isaiah 65:17-25", "2": "Malachi 4:1-2a" }, psalm: { "1": "Isaiah 12", "2": "Psalm 98" }, second: "2 Thessalonians 3:6-13", gospel: "Luke 21:5-19" }
  },
  "proper-29": {
    A: { first: { "1": "Ezekiel 34:11-16,20-24", "2": "Ezekiel 34:11-16,20-24" }, psalm: { "1": "Psalm 100", "2": "Psalm 95:1-7a" }, second: "Ephesians 1:15-23", gospel: "Matthew 25:31-46" },
    B: { first: { "1": "2 Samuel 23:1-7", "2": "Daniel 7:9-10,13-14" }, psalm: { "1": "Psalm 132:1-12,(13-18)", "2": "Psalm 93" }, second: "Revelation 1:4b-8", gospel: "John 18:33-37" },
    C: { first: { "1": "Jeremiah 23:1-6", "2": "Jeremiah 23:1-6" }, psalm: { "1": "Luke 1:68-79", "2": "Psalm 46" }, second: "Colossians 1:11-20", gospel: "Luke 23:33-43" }
  },
  "all-saints": {
    A: { first: "Revelation 7:9-17", psalm: "Psalm 34:1-10,22", second: "1 John 3:1-3", gospel: "Matthew 5:1-12" },
    B: { first: { ref: "Wisdom of Solomon 3:1-9", alt: ["Isaiah 25:6-9"] }, psalm: "Psalm 24", second: "Revelation 21:1-6a", gospel: "John 11:32-44" },
    C: { first: "Daniel 7:1-3,15-18", psalm: "Psalm 149", second: "Ephesians 1:11-23", gospel: "Luke 6:20-31" }
  }
}

if (typeof module !== "undefined") {
  module.exports = SUNDAYS
}
