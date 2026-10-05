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
  const callback = e.parameter.callback; // JSONP support

  function respond(data) {
    const json = JSON.stringify(data);
    const output = ContentService.createTextOutput();
    if (callback) {
      output.setContent(callback + '(' + json + ')');
      output.setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      output.setContent(json);
      output.setMimeType(ContentService.MimeType.JSON);
    }
    return output;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = e.parameter.action;

    if (action === 'getData')   return respond(getData(ss));
    if (action === 'addEvent')  return respond(addEvent(ss, e.parameter));

    return respond({ ok: false, error: 'unknown action' });

  } catch (err) {
    return respond({ ok: false, error: err.toString() });
  }
}

function getData(ss) {
  const studentsSheet = ss.getSheetByName('תלמידים');
  if (!studentsSheet) return { ok: false, error: 'גיליון "תלמידים" לא נמצא' };

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
        id: name,
        name: name,
        class: String(studentsRaw[i][1] || '').trim()
      });
    }
  }

  const events = [];
  for (let i = 1; i < eventsRaw.length; i++) {
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

  return { ok: true, students, events };
}

function addEvent(ss, params) {
  let eventsSheet = ss.getSheetByName('מבדקים');
  if (!eventsSheet) {
    eventsSheet = ss.insertSheet('מבדקים');
    eventsSheet.appendRow(['מזהה', 'שם_תלמיד', 'נושא', 'עבר', 'תאריך_שעה']);
    eventsSheet.setRightToLeft(true);
  }

  const newId = eventsSheet.getLastRow();
  const passed = params.passed === 'true';

  eventsSheet.appendRow([
    newId,
    params.studentId,
    params.unit,
    passed,
    new Date()
  ]);

  return { ok: true, id: newId };
}
