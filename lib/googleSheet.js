import { google } from 'googleapis';

/**
 * FIX: Auth parsing for private key
 */
function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      '[Sheets] GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY is not set in .env.local'
    );
  }

  // Remove wrapping quotes
  key = key.replace(/^[\'"]|[\'"]$/g, '');

  // Convert \n → actual new lines
  key = key.replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

/** Sheet headers */
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

/** Initialize headers */
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

/** Append data */
export async function appendAdmissionToSheet(doc, rowNumber) {
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    console.warn('[Sheets] GOOGLE_SHEET_ID not set — skipping sheet sync');
    return false;
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

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

// ─────────────────────────────────────────────────────────────
//  CORE: BUILD ROW WITH REVISIT SUPPORT
// ─────────────────────────────────────────────────────────────
function buildRow(doc, rowNumber) {
  const acad = doc.academicDetails || [];
  const xth = acad[0] || {};

  const hasExam = (doc.entranceExamsGiven || []).some(
    (e) => e !== 'None / Not Applicable'
  );

  const examTypes = (doc.entranceExamsGiven || [])
    .filter((e) => e !== 'None / Not Applicable')
    .join(', ');

  // Extract AREA from address
  const addrParts = (doc.permanentAddress || '').split(/[\n,]/);
  const area =
    addrParts.length > 1
      ? addrParts[addrParts.length - 2]?.trim()
      : '';

  return [
    rowNumber || '',

    formatDate(doc.submittedAt || doc.createdAt),

    doc.fullName || '',
    doc.fatherName || '',
    doc.motherName || '',
    doc.permanentAddress || '',
    area,
    doc.emailId || '',

    formatRevisit(doc.revisitDates), // ✅ REVISIT AUTO FILLED

    doc.category || '',
    (doc.coursesInterested || []).join(', '),

    hasExam ? 'Yes' : 'No',
    examTypes || 'N/A',

    xth.schoolOrCollegeName || '',

    '', // REF NAME
    '', // COUNSELLOR

    doc.studentContactNo || '',
    doc.fatherContactNo || '',

    '', // VISITED BY
  ];
}

// ─────────────────────────────────────────────────────────────
// FORMAT MAIN DATE
// ─────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '';

  return new Date(d).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────
// FORMAT REVISIT FIELD
// ─────────────────────────────────────────────────────────────
function formatRevisit(revisitDates) {
  if (!revisitDates || revisitDates.length === 0) {
    return 'New'; // First visit
  }

  return revisitDates
    .map((d) =>
      new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    )
    .join(', ');
}