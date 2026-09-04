import { google } from 'googleapis';

export const TAB_NAMES = {
  rough: 'Rough Data',
  entries: 'For Hearing Entry',
  centre: 'Centre Wise Report',
  schedule: 'Hearing Schedule Report',
  date: 'Date wise Report',
} as const;

export type SheetRow = Record<string, string>;

function normalizePrivateKey(raw: string) {
  let value = raw.trim();

  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value) as { private_key?: unknown };
      if (typeof parsed.private_key === 'string') value = parsed.private_key;
    } catch {
      // Continue with normal PEM cleanup.
    }
  }

  value = value.replace(/\\n/g, '\n').trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1).replace(/\\n/g, '\n').trim();
  }

  return value;
}

function sheetsClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  let clientEmail = email || '';
  let privateKey = rawPrivateKey ? normalizePrivateKey(rawPrivateKey) : '';

  // Preferred method: paste the downloaded Google service-account JSON as one
  // environment variable. JSON.parse safely restores the escaped newlines in
  // private_key and avoids Vercel copy/paste formatting problems.
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson) as {
        client_email?: unknown;
        private_key?: unknown;
      };
      if (typeof parsed.client_email === 'string') clientEmail = parsed.client_email;
      if (typeof parsed.private_key === 'string') privateKey = normalizePrivateKey(parsed.private_key);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the complete downloaded Google service-account JSON file.');
    }
  }

  if (!clientEmail || !privateKey) {
    throw new Error('Google service-account credentials are not configured. Add GOOGLE_SERVICE_ACCOUNT_JSON using the downloaded Google service-account JSON file.');
  }

  if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
    throw new Error('The Google service-account private key is invalid. Use the complete downloaded service-account JSON file.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return { sheets: google.sheets({ version: 'v4', auth }), spreadsheetId };
}

export async function getTabRows(tabName: string): Promise<SheetRow[]> {
  const { sheets, spreadsheetId } = sheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:ZZ`,
    majorDimension: 'ROWS',
  });
  const values = response.data.values ?? [];
  if (!values.length) return [];

  const headers = (values[0] ?? []).map((h: unknown, i: number) =>
    String(h ?? `Column ${i + 1}`).trim() || `Column ${i + 1}`,
  );

  return values
    .slice(1)
    .filter((r) => r.some((v) => String(v ?? '').trim() !== ''))
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, String(row[i] ?? '')])));
}

export const getRoughData = () => getTabRows(TAB_NAMES.rough);
export const getHearingEntries = () => getTabRows(TAB_NAMES.entries);
export const getCentreWiseReport = () => getTabRows(TAB_NAMES.centre);
export const getHearingScheduleReport = () => getTabRows(TAB_NAMES.schedule);
export const getDateWiseReport = () => getTabRows(TAB_NAMES.date);

export async function getAllSheetData() {
  const [roughData, hearingEntries, centreWise, schedule, dateWise] = await Promise.all([
    getRoughData(),
    getHearingEntries(),
    getCentreWiseReport(),
    getHearingScheduleReport(),
    getDateWiseReport(),
  ]);

  return {
    roughData,
    hearingEntries,
    centreWise,
    schedule,
    dateWise,
    fetchedAt: new Date().toISOString(),
  };
}
