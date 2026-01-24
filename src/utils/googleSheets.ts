import { google } from 'googleapis';

export async function getSheetsClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error(
      'Missing Google Service Account credentials in environment variables.',
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      private_key: privateKey,
      client_email: clientEmail,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function readSheet(spreadsheetId: string, range: string) {
  const sheets = await getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values;
  } catch (error) {
    console.error('Google Sheets Read Error:', error);
    throw error;
  }
}

export async function updateSheet(
  spreadsheetId: string,
  range: string,
  values: any[][],
) {
  const sheets = await getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Google Sheets Update Error:', error);
    throw error;
  }
}

export async function appendToSheet(
  spreadsheetId: string,
  range: string,
  values: any[][],
) {
  const sheets = await getSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Google Sheets Append Error:', error);
    throw error;
  }
}
