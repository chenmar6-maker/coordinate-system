# Working Context — coordinate-system project

Copy and paste this into a new conversation to restore full context.

---

## Who I am

Chen Margalit — math teacher building an interactive Hebrew math learning site for 7th grade (כיתה ז׳). The site is a standalone SPA (single HTML file per unit) hosted on Vercel with auto-deploy from GitHub.

---

## Project location

- **Local path:** `/Users/chenmargalit/Projects/coordinate-system/`
- **GitHub:** `chenmar6-maker/coordinate-system`
- **Deployed:** Vercel (auto-deploys on every push to `master`)
- **Workflow:** Always commit and push immediately after every change so the live site stays updated.

---

## Site structure

```
index.html                   ← homepage (unit selector)
unit1/index.html             ← מערכת הצירים ברביע הראשון
unit2/index.html             ← מספרים מכוונים
unit3/index.html             ← מערכת הצירים — כל הרביעים
unit4/index.html             ← חזקות ושורשים
unit5/index.html             ← משתנים וביטויים אלגבריים (בפיתוח)
worksheets/                  ← all printable worksheet HTML files
sequences_progress.csv       ← tracking file for sequences
```

**Homepage domains:**
- תחום מספרי: units 1–4 (all active)
- תחום אלגברי: unit5 (active but marked "בפיתוח")
- תחום גיאומטרי: placeholder only ("בקרוב")

---

## How each unit works (SPA architecture)

Every unit is a **single HTML file** with embedded JS. It uses a state machine:

```javascript
state = { screen: 'home' | 'learn' | 'game' | 'gameResults', sequence: 1|2|... }
```

Key functions in every unit:
- `renderHome()` — shows sequence cards
- `renderLearn()` — shows the הקנייה (teaching) content for the current sequence
- `renderGame()` — shows interactive practice questions
- `renderGameResults()` — shows score after practice
- `render()` — main dispatch, calls the right renderer and sets `app.innerHTML`

### seqRow pattern

`seqRow(seqNum, label, worksheetUrl?)` generates a row card with:
- 📖 הקנייה button → `startLearn(seqNum)`
- ✏️ תרגול button → `startGame(seqNum)`
- 📝 מבדק שליטה button (if `worksheetUrl` provided) → `showWorksheet(url)`

The worksheet opens in a **full-screen overlay iframe** (not a new tab). The overlay system:

```javascript
function showWorksheet(url) { ... }  // sets iframe src, shows overlay
function hideWorksheet() { ... }     // hides overlay, clears iframe
```

The overlay div lives at the bottom of `<body>`:
```html
<div id="ws-overlay" style="display:none;position:fixed;inset:0;z-index:9999;flex-direction:column;">
  <div style="background:#1E1B2E;..."><button onclick="hideWorksheet()">← חזור</button></div>
  <iframe id="ws-frame" src="" style="flex:1;border:0;width:100%;"></iframe>
</div>
```

Inside worksheets, the "סיימתי ✓" button calls:
```javascript
if(window.parent!==window){ window.parent.hideWorksheet(); } else { history.back(); }
```

### Game level types

```javascript
{ id:'mc', title:'...', options:['...'], correct:'...', explain:'...' }      // multiple choice
{ id:'typedSum', title:'...', answer: 42 }                                    // numeric input
```

---

## Worksheet conventions

### File naming
- Per-sequence mastery tests: `unit3_exam_part_a.html`, `unit3_exam_part_b.html`
- Per-sequence practice sheets: `algebra_writing_exam.html`, etc.
- Answer files: same name with `_answers` suffix
- Answer files are PIN-protected (PIN: **2357**)

### Structure of every worksheet HTML
- Font: **Rubik** (Google Fonts)
- RTL Hebrew page (`direction: rtl`)
- Math expressions: `<span class="m">` with `direction:ltr; unicode-bidi:isolate`
- Header: dark gradient bar with title + "חן מרגלית למידה אקטיבית" brand
- Part labels: colored badge (`.pa` = orange `#C05621`, `.pb` = blue `#1D4ED8`)
- Questions: white cards with colored right border matching part color
- Score bar at the bottom
- Fixed **הדפסה** button (bottom-left)
- Fixed **סיימתי ✓** button (bottom-right, green `#047857`) — calls hideWorksheet or history.back

### Math notation rules
- Negative sign: use `−` (unicode minus U+2212), not ASCII hyphen `-`
- First number negative in expression — no parens: `−5 − 3`
- Subtracting a negative — with parens: `5 − (−3)`
- Never `−−` without parens — always `− (−x)`
- Fractions: use ¼ ½ ¾ ⅓ ⅔ as unicode characters directly
- "הקיפו" not "עגלו" for circling answers
- In SVG coordinate labels in RTL pages: add `direction="ltr"` to SVG element and text elements, use `&#x2212;` for minus sign to avoid parenthesis flip

### Design details
- Worked examples: pale orange box, `background:#FEF9F0; border-right:3px solid #F6A35A`
- Answer lines: `<span class="ali">` (min-width 70px) or `<span class="ali-sm">` (40px)
- Work lines: `<span class="al">` (block, full width)
- Sub-questions: `<div class="sub-row">` with `<span class="sub-lbl">` for א. ב. ג.
- Coordinate grids: inline SVG with grid lines, labeled axes, colored point circles

---

## Units in detail

### unit2 — מספרים מכוונים
Sequences: ערך מוחלט, מספרים נגדיים, חיבור, חיבור עם שבר, חיסור, כפל וחילוק, סדר פעולות, סדר פעולות עם שבר, סדר פעולות מספרים מכוונים, סדר פעולות עם קו שבר.

The last seqRow uses "ליחידה הבאה" instead of תשובות (links back to homepage).

### unit3 — מערכת הצירים כל הרביעים
Sequences:
1. נקודות בכל הרביעים → `unit3_exam_part_a.html`
2. אורכים ושטחים → `unit3_exam_part_b.html`

### unit5 — משתנים וביטויים אלגבריים
Sequences:
1. כתיבת ביטויים
2. הצבה
3. כינוס איברים

Per-sequence exam + answers files exist for all 3 sequences.

---

## YouTube video embeds

Pattern used throughout:
```html
<div style="position:relative;width:100%;padding-bottom:56.25%;border-radius:14px;overflow:hidden;margin:16px 0;border:1.5px solid rgba(255,200,80,0.2);">
  <iframe src="https://www.youtube.com/embed/VIDEO_ID"
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
</div>
```

---

## Language / response preferences

- Always reply in **English**, even when I write in Hebrew
- Keep responses short and direct
- Commit and push after every change — the site must always be live and up to date
