import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
        return res.status(200).json({
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
        });
      }

      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
      await doc.loadInfo();
      const sheet = doc.sheetsByIndex[0];
      
      if (!sheet) {
        return res.status(200).json({ success: true, data: [] });
      }

      const rows = await sheet.getRows();
      const data = rows.map(row => ({
        Timestamp: row.get('Timestamp'),
        User: row.get('User'),
        Content: row.get('Content'),
        Photo: row.get('Photo'),
        Location: row.get('Location')
      })).reverse();

      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('Error fetching from Google Sheets:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch from Google Sheets' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { user, content, photo, location, timestamp } = req.body;

      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
        return res.status(500).json({ 
          success: false, 
          error: '系統尚未設定 Google Sheets 憑證 (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID)。請在 Vercel 設定這些環境變數。' 
        });
      }

      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
      await doc.loadInfo();

      let sheet = doc.sheetsByIndex[0];
      
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

      return res.status(200).json({ success: true, message: 'Saved to Google Sheets' });
    } catch (error: any) {
      console.error('Error saving to Google Sheets:', error);
      return res.status(500).json({ success: false, error: 'Failed to save to Google Sheets' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
