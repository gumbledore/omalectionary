# Omalectionary

(Full README lands in ticket 07. This is ticket 05's stub: original-language fonts and attribution only.)

## Fonts

The overlay's original-language and interlinear views render Greek (SBLGNT)
and Hebrew (WLC) text. Font availability is resolved at runtime against
`Qt.fontFamilies()` with a preference list, falling back through several
options before landing on the shell's own serif -- so nothing is required,
but the specialist fonts render noticeably better (full polytonic Greek
diacritics; Hebrew points and cantillation marks with correct spacing).

Checked on this machine with `fc-list : family | grep -iE "sbl|gentium|
libertinus|noto serif hebrew|noto sans hebrew|david|ezra|cardo|brill|
galatia|noto serif|frank"`:

- **Greek** -- preference order: SBL Greek, Gentium Plus, Cardo, Libertinus
  Serif, Noto Serif. `noto-fonts` (official `extra` repo, usually already
  installed) covers Greek reasonably via Noto Serif. For a purpose-built
  polytonic Greek face, install `ttf-gentium-plus` or `ttf-libertinus`
  (both in the official `extra` repo). SBL Greek itself isn't packaged for
  Arch; download it from https://sblgnt.com/ and install manually
  (`~/.local/share/fonts/`) if you want it specifically.
- **Hebrew** -- preference order: SBL Hebrew, Ezra SIL, Taamey Frank CLM,
  Noto Serif Hebrew, Noto Sans Hebrew, David CLM. `noto-fonts` (official
  `extra` repo) already ships Noto Serif Hebrew and Noto Sans Hebrew with
  full point/cantillation coverage -- no extra install needed for a good
  default. For a traditional Masoretic face, SBL Hebrew and Ezra SIL aren't
  packaged for Arch either; they're free downloads (SBL Hebrew from
  https://www.sbl-site.org/educational/biblicalfonts.aspx, Ezra SIL from
  https://software.sil.org/ezra/).

If fontconfig can't find any of the preferred families, the overlay falls
back to its normal English serif -- Hebrew/Greek glyphs missing from that
font render as tofu boxes rather than crashing, so installing better fonts
is a quality upgrade, not a requirement.

## Attribution

Scripture quotations marked SBLGNT are from the SBL Greek New Testament.
Copyright © 2010 Society of Biblical Literature and Logos Bible Software.
