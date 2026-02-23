import { Handler } from '@netlify/functions';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export const handler: Handler = async (event) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      if (event.httpMethod === 'GET') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: [
              {
                Timestamp: new Date().toISOString(),
                User: '陳伯伯',
                Content: '今天在維多利亞公園散步，微風徐徐，非常舒服。',
                Photo: 'No photo',
                Location: '香港維多利亞公園'
              }
            ]
          })
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Saved locally (Google Sheets not configured)' })
      };
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    let sheet = doc.sheetsByIndex[0];

    if (event.httpMethod === 'GET') {
      if (!sheet) {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: [] }) };
      }
      const rows = await sheet.getRows();
      const data = rows.map(row => ({
        Timestamp: row.get('Timestamp'),
        User: row.get('User'),
        Content: row.get('Content'),
        Photo: row.get('Photo'),
        Location: row.get('Location')
      })).reverse();
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };
    }

    if (event.httpMethod === 'POST') {
      const { user, content, photo, location, timestamp } = JSON.parse(event.body || '{}');
      
      if (!sheet) {
        sheet = await doc.addSheet({ headerValues: ['Timestamp', 'User', 'Content', 'Photo', 'Location'] });
      } else {
        try {
          await sheet.loadHeaderRow();
        } catch (e) {
          await sheet.setHeaderRow(['Timestamp', 'User', 'Content', 'Photo', 'Location']);
        }
      }

      await sheet.addRow({
        Timestamp: timestamp,
        User: user,
        Content: content,
        Photo: photo ? 'Photo attached' : 'No photo',
        Location: location
      });

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Saved to Google Sheets' }) };
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Internal Server Error' }) };
  }
};
