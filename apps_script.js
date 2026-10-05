// ═══════════════════════════════════════════════════════
// Google Apps Script — דף מורה / מעקב מבדקי שליטה
// ═══════════════════════════════════════════════════════
//
// הוראות התקנה (פעם אחת בלבד):
//
// 1. פתחי גיליון Google חדש
// 2. שמי את הטאב הראשון: תלמידים
//    עמודה A = שם מלא, עמודה B = כיתה
//    הדביקי את רשימת התלמידים ישירות (ללא שורת כותרת)
// 3. בגיליון: פתחי Extensions → Apps Script
// 4. מחקי את כל הקוד הקיים, הדביקי את הקוד הזה
// 5. שמרי (Ctrl+S)
// 6. לחצי Deploy → New deployment
//    Type: Web app
//    Execute as: Me
//    Who has access: Anyone
//    לחצי Deploy ואשרי הרשאות
// 7. העתיקי את ה-URL שמופיע — הדביקי אותו בדף המורה
//
// הערה: אל תמחקי שורות מגיליון "תלמידים" — רק השאירי ריק
// ═══════════════════════════════════════════════════════

function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = e.parameter.action;

    if (action === 'getData') {
      return getData(ss, output);
    }
    if (action === 'addEvent') {
      return addEvent(ss, output, e.parameter);
    }

    output.setContent(JSON.stringify({ ok: false, error: 'unknown action' }));
    return output;

  } catch (err) {
    output.setContent(JSON.stringify({ ok: false, error: err.toString() }));
    return output;
  }
}

function getData(ss, output) {
  const studentsSheet = ss.getSheetByName('תלמידים');
  if (!studentsSheet) {
    output.setContent(JSON.stringify({ ok: false, error: 'גיליון "תלמידים" לא נמצא' }));
    return output;
  }

  // יצירת גיליון מבדקים אם לא קיים
  let eventsSheet = ss.getSheetByName('מבדקים');
  if (!eventsSheet) {
    eventsSheet = ss.insertSheet('מבדקים');
    eventsSheet.appendRow(['מזהה', 'שם_תלמיד', 'נושא', 'עבר', 'תאריך_שעה']);
    eventsSheet.setRightToLeft(true);
  }

  const studentsRaw = studentsSheet.getDataRange().getValues();
  const eventsRaw = eventsSheet.getDataRange().getValues();

  // זיהוי אוטומטי של שורת כותרת
  const firstCell = String(studentsRaw[0] && studentsRaw[0][0] || '').trim();
  const hasHeader = ['שם', 'name', 'שם מלא'].some(h =>
    firstCell.toLowerCase().startsWith(h.toLowerCase())
  );
  const startRow = hasHeader ? 1 : 0;

  const students = [];
  for (let i = startRow; i < studentsRaw.length; i++) {
    const name = String(studentsRaw[i][0] || '').trim();
    if (name) {
      students.push({
        id: name, // השם הוא המזהה — יציב גם אם מוסיפים שורות
        name: name,
        class: String(studentsRaw[i][1] || '').trim()
      });
    }
  }

  const events = [];
  for (let i = 1; i < eventsRaw.length; i++) { // דילוג על כותרת
    const rowId = eventsRaw[i][0];
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

  output.setContent(JSON.stringify({ ok: true, students, events }));
  return output;
}

function addEvent(ss, output, params) {
  let eventsSheet = ss.getSheetByName('מבדקים');
  if (!eventsSheet) {
    eventsSheet = ss.insertSheet('מבדקים');
    eventsSheet.appendRow(['מזהה', 'שם_תלמיד', 'נושא', 'עבר', 'תאריך_שעה']);
    eventsSheet.setRightToLeft(true);
  }

  const newId = eventsSheet.getLastRow(); // שורה 1 = כותרת → id ראשון = 1
  const passed = params.passed === 'true';

  eventsSheet.appendRow([
    newId,
    params.studentId,
    params.unit,
    passed,
    new Date()
  ]);

  output.setContent(JSON.stringify({ ok: true, id: newId }));
  return output;
}
