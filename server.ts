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

  app.post('/api/generate-route', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. 請在 Vercel 設定環境變數。' });
      }

      const { preferences, distanceKm, durationMin } = req.body;

      // Dynamically import to avoid breaking if not installed
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        你是一個專業的香港導遊與路線規劃專家。
        請根據以下條件，為我規劃一條散步路線：
        - 出發地：${preferences.start}
        - 主題：${preferences.theme}
        - 行動便利度：${preferences.mobility}
        - 預計行走距離：約 ${distanceKm.toFixed(2)} 公里
        - 預計時長：約 ${durationMin.toFixed(0)} 分鐘

        請提供一條包含 3-5 個景點的路線，並回傳 JSON 格式。
        必須包含精確的經緯度 (lat, lng)。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              routeName: { type: Type.STRING, description: "路線名稱" },
              description: { type: Type.STRING, description: "路線整體描述與注意事項" },
              waypoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "景點名稱" },
                    lat: { type: Type.NUMBER, description: "緯度" },
                    lng: { type: Type.NUMBER, description: "經度" },
                    description: { type: Type.STRING, description: "景點特色介紹" }
                  },
                  required: ["name", "lat", "lng", "description"]
                }
              }
            },
            required: ["routeName", "description", "waypoints"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Error generating route:', error);
      res.status(500).json({ error: error.message || 'Failed to generate route' });
    }
  });

  app.post('/api/generate-poetry', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. 請在 Vercel 設定環境變數。' });
      }

      const { locationName, mood } = req.body;

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Role: 充滿文學氣息的詩人與作家
        Task: 為位於 [${locationName}] 的用戶創作一首 [現代詩] 或 [短文]。
        Context: 用戶剛完成散步，心情 [${mood}]。
        Constraint: 內容需包含鼓勵運動與探索的元素，長度不超過 100 字。
        請直接輸出創作內容，不需其他解釋。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      res.status(200).json({ text: response.text || '無法生成內容，請稍後再試。' });
    } catch (error: any) {
      console.error('Error generating poetry:', error);
      res.status(500).json({ error: error.message || 'Failed to generate poetry' });
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
