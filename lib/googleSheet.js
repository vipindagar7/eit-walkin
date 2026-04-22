import { google } from 'googleapis';

/**
 * Returns an authenticated Google Sheets client using a Service Account.
 * Set these env vars in .env.local:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 *   GOOGLE_SHEET_ID=your_spreadsheet_id_from_url
 */
function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    // .env stores \n as literal \\n — convert back
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

/**
 * Appends one admission record as a new row in the Google Sheet.
 * The first row in the sheet should be the header row (see SHEET_HEADERS below).
 */
export async function appendAdmissionToSheet(doc) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    console.warn('[Sheets] GOOGLE_SHEET_ID not set — skipping sheet sync');
    return false;
  }

  const row = buildRow(doc);

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A1',          // appends after last row with data
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return true;
}

/**
 * Header row — run appendHeaders() once to initialise a blank sheet.
 */
export const SHEET_HEADERS = [
  'Submitted At',
  'Full Name', 'Gender', 'Date of Birth', 'Age',
  'Student Contact', "Father's Contact", 'Alternate Contact',
  'Email ID', 'Aadhaar Number', 'Permanent Address', 'Nationality',
  "Father's Name", "Mother's Name",
  'Entrance Exams', 'Entrance Score', 'Rank Details', 'Category',
  'Xth School', 'Xth Board', 'Xth Year', 'Xth %',
  'XIIth School', 'XIIth Board', 'XIIth Year', 'XIIth %', 'XIIth PCM %',
  'Diploma School', 'Diploma Board', 'Diploma Year', 'Diploma %',
  'Courses Interested',
  'Source of Information', 'Source Other',
  'College Choice Factors',
  'MongoDB ID',
];

export async function appendHeaders() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetId = process.env.GOOGLE_SHEET_ID;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [SHEET_HEADERS] },
  });
}

// ── Internal: map a Mongoose doc → flat array matching SHEET_HEADERS ──────────
function buildRow(doc) {
  const acad = doc.academicDetails || [];
  const xth = acad[0] || {};
  const xiith = acad[1] || {};
  const dip = acad[2] || {};

  return [
    formatDate(doc.submittedAt || doc.createdAt),
    doc.fullName,
    doc.gender,
    doc.dateOfBirth,
    doc.age,
    doc.studentContactNo,
    doc.fatherContactNo,
    doc.alternateContact,
    doc.emailId,
    doc.aadhaarNumber,
    doc.permanentAddress,
    doc.nationality,
    doc.fatherName,
    doc.motherName,
    (doc.entranceExamsGiven || []).join(', '),
    doc.entranceScore,
    doc.rankDetails,
    doc.category,
    xth.schoolOrCollegeName,
    xth.boardOrUniversity,
    xth.yearOfPassing,
    xth.aggregatePercentageCGPA,
    xiith.schoolOrCollegeName,
    xiith.boardOrUniversity,
    xiith.yearOfPassing,
    xiith.aggregatePercentageCGPA,
    xiith.pcmPercentage,
    dip.schoolOrCollegeName,
    dip.boardOrUniversity,
    dip.yearOfPassing,
    dip.aggregatePercentageCGPA,
    (doc.coursesInterested || []).join(', '),
    (doc.sourceOfInformation || []).join(', '),
    doc.sourceOther,
    (doc.collegeChoiceFactors || []).join(', '),
    doc._id?.toString(),
  ];
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}