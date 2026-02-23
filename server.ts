import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/creations', async (req, res) => {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
        // Return dummy data if not configured
        return res.json({
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
        return res.json({ success: true, data: [] });
      }

      const rows = await sheet.getRows();
      const data = rows.map(row => ({
        Timestamp: row.get('Timestamp'),
        User: row.get('User'),
        Content: row.get('Content'),
        Photo: row.get('Photo'),
        Location: row.get('Location')
      })).reverse(); // Newest first

      res.json({ success: true, data });
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch from Google Sheets' });
    }
  });

  app.post('/api/creations', async (req, res) => {
    try {
      const { user, content, photo, location, timestamp } = req.body;

      // Check if Google Sheets credentials are provided
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
        // If not configured, just return success for demo purposes
        console.warn('Google Sheets credentials not configured. Skipping sheet update.');
        return res.json({ success: true, message: 'Saved locally (Google Sheets not configured)' });
      }

      // Initialize auth
      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
      await doc.loadInfo(); // loads document properties and worksheets

      let sheet = doc.sheetsByIndex[0];
      
      // If sheet is empty, add headers
      if (!sheet) {
        sheet = await doc.addSheet({ headerValues: ['Timestamp', 'User', 'Content', 'Photo', 'Location'] });
      } else {
        try {
          await sheet.loadHeaderRow();
        } catch (e) {
          await sheet.setHeaderRow(['Timestamp', 'User', 'Content', 'Photo', 'Location']);
        }
      }

      // Append row
      await sheet.addRow({
        Timestamp: timestamp,
        User: user,
        Content: content,
        Photo: photo ? 'Photo attached' : 'No photo', // Storing base64 in sheets is bad, better to store a link or just a flag
        Location: location
      });

      res.json({ success: true, message: 'Saved to Google Sheets' });
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      res.status(500).json({ success: false, error: 'Failed to save to Google Sheets' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
