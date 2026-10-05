// ═══════════════════════════════════════════════════════
// Google Apps Script — דף מורה
// ═══════════════════════════════════════════════════════
//
// הוראות התקנה:
//
// 1. בגיליון שלך: Extensions → Apps Script
// 2. בקובץ Code.gs — מחקי הכל, הדביקי את הקוד הזה
// 3. לחצי על + ליד "Files" → HTML → קראי לו: Index
// 4. בקובץ Index.html — מחקי הכל, הדביקי את הקוד מקובץ teacher_index.html
// 5. שמרי (Ctrl+S)
// 6. Deploy → New deployment → Web app
//    Execute as: Me | Who has access: Anyone → Deploy
// 7. העתיקי את ה-URL — זהו הכתובת של דף המורה
//
// מבנה הגיליון:
// גיליון "תלמידים": עמודה A = שם מלא, עמודה B = כיתה
// גיליון "מבדקים": נוצר אוטומטית
// ═══════════════════════════════════════════════════════

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('דף מורה — מבדקי שליטה')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function getDataServer() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // יצירת גיליון מבדקים אם לא קיים
    let eventsSheet = ss.getSheetByName('מבדקים');
    if (!eventsSheet) {
      eventsSheet = ss.insertSheet('מבדקים');
      eventsSheet.appendRow(['מזהה', 'שם_תלמיד', 'נושא', 'עבר', 'תאריך_שעה']);
      eventsSheet.setRightToLeft(true);
    }

    const studentsSheet = ss.getSheetByName('תלמידים');
    if (!studentsSheet) return { ok: false, error: 'גיליון "תלמידים" לא נמצא' };

    const studentsRaw = studentsSheet.getDataRange().getValues();
    const eventsRaw   = eventsSheet.getDataRange().getValues();

    // זיהוי אוטומטי של שורת כותרת
    const firstCell = String((studentsRaw[0] && studentsRaw[0][0]) || '').trim();
    const hasHeader = ['שם', 'name', 'שם מלא'].some(h =>
      firstCell.toLowerCase().startsWith(h.toLowerCase())
    );
    const startRow = hasHeader ? 1 : 0;

    const students = [];
    for (let i = startRow; i < studentsRaw.length; i++) {
      const name = String(studentsRaw[i][0] || '').trim();
      if (name) students.push({ id: name, name, class: String(studentsRaw[i][1] || '').trim() });
    }

    const events = [];
    for (let i = 1; i < eventsRaw.length; i++) {
      const rowId     = eventsRaw[i][0];
      const studentId = String(eventsRaw[i][1] || '').trim();
      if (rowId !== '' && rowId !== undefined && studentId) {
        const passed = eventsRaw[i][3] === true || String(eventsRaw[i][3]).toLowerCase() === 'true';
        events.push({
          id: String(rowId),
          studentId,
          unit: String(eventsRaw[i][2] || '').trim(),
          passed,
          timestamp: eventsRaw[i][4]
            ? new Date(eventsRaw[i][4]).toISOString()
            : new Date().toISOString()
        });
      }
    }

    return { ok: true, students, events };
  } catch (e) {
    return { ok: false, error: e.toString() };
  }
}

// ═══════════════════════════════════════════════════════
// פונקציית ייבוא חד-פעמית
// הרץ פעם אחת מה-Editor, אחר כך אפשר למחוק
// ═══════════════════════════════════════════════════════
function importLegacyData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const importSheet = ss.getSheetByName('ייבוא');
  if (!importSheet) throw new Error('גיליון "ייבוא" לא נמצא');

  // וודא שגיליון מבדקים קיים
  let eventsSheet = ss.getSheetByName('מבדקים');
  if (!eventsSheet) {
    eventsSheet = ss.insertSheet('מבדקים');
    eventsSheet.appendRow(['מזהה', 'שם_תלמיד', 'נושא', 'עבר', 'תאריך_שעה']);
    eventsSheet.setRightToLeft(true);
  }

  // וודא שגיליון תלמידים קיים
  let studentsSheet = ss.getSheetByName('תלמידים');
  if (!studentsSheet) {
    studentsSheet = ss.insertSheet('תלמידים');
    studentsSheet.appendRow(['שם מלא', 'כיתה']);
    studentsSheet.setRightToLeft(true);
  }

  const data = importSheet.getDataRange().getValues();
  const headers = data[0];

  // עמודות הרצפים מתחילות מעמודה D (אינדקס 3)
  // עמודה A = שם משפחה, B = שם פרטי, C = כמה עשה
  const seqCols = [];
  for (let c = 3; c < headers.length; c++) {
    const h = String(headers[c]).trim();
    if (h) seqCols.push({ col: c, name: h });
  }

  // תלמידים קיימים (למניעת כפילויות)
  const existingStudents = new Set(
    studentsSheet.getDataRange().getValues().map(r => String(r[0]).trim())
  );

  const now = new Date();
  let evtId = eventsSheet.getLastRow();
  let imported = 0;

  for (let i = 1; i < data.length; i++) {
    const lastName  = String(data[i][0] || '').trim();
    const firstName = String(data[i][1] || '').trim();
    if (!firstName && !lastName) continue;

    const fullName = firstName + ' ' + lastName;

    // הוסף לתלמידים אם לא קיים
    if (!existingStudents.has(fullName)) {
      studentsSheet.appendRow([fullName, '']);
      existingStudents.add(fullName);
    }

    // ייבא רצפים שסומנו TRUE
    for (const seq of seqCols) {
      const val = data[i][seq.col];
      const passed = val === true || String(val).toLowerCase() === 'true';
      if (!passed) continue;

      evtId++;
      eventsSheet.appendRow([evtId, fullName, seq.name, true, now]);
      imported++;
    }
  }

  SpreadsheetApp.getUi().alert('ייבוא הושלם! ' + imported + ' רשומות נוספו.');
}

function addEventServer(studentId, unit, passed) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let eventsSheet = ss.getSheetByName('מבדקים');
    if (!eventsSheet) {
      eventsSheet = ss.insertSheet('מבדקים');
      eventsSheet.appendRow(['מזהה', 'שם_תלמיד', 'נושא', 'עבר', 'תאריך_שעה']);
      eventsSheet.setRightToLeft(true);
    }
    const newId = eventsSheet.getLastRow();
    eventsSheet.appendRow([newId, studentId, unit, passed === true || passed === 'true', new Date()]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.toString() };
  }
}
