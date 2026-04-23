import { google } from 'googleapis';

/**
 * FIX: The auth error "Request is missing required authentication credential"
 * is caused by the private key not being parsed correctly from .env.
 *
 * Root causes (all handled below):
 * 1. Next.js reads .env and KEEPS literal \n as \\n — must replace
 * 2. Some .env editors wrap the key in quotes that get included in the value
 * 3. googleapis JWT needs REAL newlines, not the string \n
 *
 * In .env.local the key must be ONE line:
 *   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
 */
function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      '[Sheets] GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY is not set in .env.local'
    );
  }

  // Strip surrounding quotes if the value was stored with them
  key = key.replace(/^[\'"]|[\'"]$/g, '');

  // Convert literal \\n sequences → real newline characters
  key = key.replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

/** Exactly the 19 columns from walk_in_format.xlsx — nothing more. */
export const SHEET_HEADERS = [
  'S.NO.',
  'DATE',
  "CANDIDATE'S NAME",
  "FATHER'S NAME",
  'MOTHER NAME',
  'ADDRESS',
  'AREA',
  'E-MAIL',
  'REVISIT',
  'CATEGORY-GEN/OBC/SC/ST',
  'COURSE',
  'ENTRANCE EXAM GIVEN (yes/no)',
  'TYPE OF ENTRANCE EXAM (JEE/CUET/CET)',
  'SCHOOL NAME',
  'REF. NAME',
  'NPF COUNSELLOR',
  "STUDENT'S MOBILE NO",
  "FATHER'S MOBILE NO",
  'VISITED BY',
];

/** Write headers to row 1 — call once to initialise a blank sheet. */
export async function appendHeaders() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error('[Sheets] GOOGLE_SHEET_ID is not set');
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  await auth.authorize();
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [SHEET_HEADERS] },
  });
}

/**
 * Appends one admission record as a new row matching the walk-in format.
 * Returns true on success, false if GOOGLE_SHEET_ID is not configured.
 */
export async function appendAdmissionToSheet(doc, rowNumber) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    console.warn('[Sheets] GOOGLE_SHEET_ID not set — skipping sheet sync');
    return false;
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // authorize() surfaces auth errors immediately with a clear message
  await auth.authorize();

  const row = buildRow(doc, rowNumber);
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return true;
}

// ── Map Mongoose doc → exactly the 19 walk-in columns ───────────────────────
function buildRow(doc, rowNumber) {
  const acad = doc.academicDetails || [];
  const xth = acad[0] || {};
  const hasExam = (doc.entranceExamsGiven || []).some(e => e !== 'None / Not Applicable');
  const examTypes = (doc.entranceExamsGiven || [])
    .filter(e => e !== 'None / Not Applicable').join(', ');

  // Infer AREA: second-to-last segment when splitting address by comma/newline
  const addrParts = (doc.permanentAddress || '').split(/[\n,]/);
  const area = addrParts.length > 1 ? addrParts[addrParts.length - 2]?.trim() : '';

  return [
    rowNumber || '',                               // A: S.NO.
    formatDate(doc.submittedAt || doc.createdAt),  // B: DATE
    doc.fullName || '',                            // C: CANDIDATE'S NAME
    doc.fatherName || '',                          // D: FATHER'S NAME
    doc.motherName || '',                          // E: MOTHER NAME
    doc.permanentAddress || '',                    // F: ADDRESS
    area,                                          // G: AREA
    doc.emailId || '',                             // H: E-MAIL
    '',                                            // I: REVISIT (filled by counsellor)
    doc.category || '',                            // J: CATEGORY
    (doc.coursesInterested || []).join(', '),      // K: COURSE
    hasExam ? 'Yes' : 'No',                        // L: ENTRANCE EXAM GIVEN
    examTypes || 'N/A',                            // M: TYPE OF ENTRANCE EXAM
    xth.schoolOrCollegeName || '',                 // N: SCHOOL NAME
    '',                                            // O: REF. NAME (filled by staff)
    '',                                            // P: NPF COUNSELLOR (filled by staff)
    doc.studentContactNo || '',                    // Q: STUDENT'S MOBILE NO
    doc.fatherContactNo || '',                     // R: FATHER'S MOBILE NO
    '',                                            // S: VISITED BY (filled by staff)
  ];
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}