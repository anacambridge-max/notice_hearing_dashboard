import { google } from 'googleapis';

export const TAB_NAMES = {
  rough: 'Rough Data',
  entries: 'For Hearing Entry',
  centre: 'Centre Wise Report',
  schedule: 'Hearing Schedule Report',
  date: 'Date wise Report',
} as const;

export type SheetRow = Record<string, string>;

function sheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!email || !privateKey || !spreadsheetId) throw new Error('Google Sheets environment variables are not configured.');
  const auth = new google.auth.GoogleAuth({ credentials: { client_email: email, private_key: privateKey }, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  return { sheets: google.sheets({ version: 'v4', auth }), spreadsheetId };
}

export async function getTabRows(tabName: string): Promise<SheetRow[]> {
  const { sheets, spreadsheetId } = sheetsClient();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${tabName}!A:ZZ`, majorDimension: 'ROWS' });
  const values = response.data.values ?? [];
  if (!values.length) return [];
  const headers = (values[0] ?? []).map((h: unknown, i: number) => String(h ?? `Column ${i + 1}`).trim() || `Column ${i + 1}`);
  return values.slice(1).filter(r => r.some(v => String(v ?? '').trim() !== '')).map(row => Object.fromEntries(headers.map((h, i) => [h, String(row[i] ?? '')])));
}

export const getRoughData = () => getTabRows(TAB_NAMES.rough);
export const getHearingEntries = () => getTabRows(TAB_NAMES.entries);
export const getCentreWiseReport = () => getTabRows(TAB_NAMES.centre);
export const getHearingScheduleReport = () => getTabRows(TAB_NAMES.schedule);
export const getDateWiseReport = () => getTabRows(TAB_NAMES.date);

export async function getAllSheetData() {
  const [roughData, hearingEntries, centreWise, schedule, dateWise] = await Promise.all([
    getRoughData(), getHearingEntries(), getCentreWiseReport(), getHearingScheduleReport(), getDateWiseReport(),
  ]);
  return { roughData, hearingEntries, centreWise, schedule, dateWise, fetchedAt: new Date().toISOString() };
}
