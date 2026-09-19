// Parses the widget's small config file: { "track": 1 | 2 }. Parsed
// defensively — missing file, unparsable JSON, or a bad `track` value all
// fall back to the default (Track 2, complementary). Pure JS, dual export.
// The widget is responsible for reading the file (via Quickshell FileView)
// and handing the raw text (or lack thereof) to parseConfig; this module
// never touches the filesystem, so node tests can call it directly.

function parseConfig(text) {
  var config = { track: 2 }
  if (!text) return config

  var parsed
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return config
  }

  if (parsed && (parsed.track === 1 || parsed.track === 2)) config.track = parsed.track
  return config
}

if (typeof module !== "undefined") {
  module.exports = { parseConfig: parseConfig }
}
