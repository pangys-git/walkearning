import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    return res.status(500).json({ 
      success: false, 
      error: '系統尚未設定 GOOGLE_SCRIPT_URL。請在 Vercel 設定此環境變數。' 
    });
  }

  if (req.method === 'GET') {
    try {
      const response = await fetch(scriptUrl);
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Error fetching from Google Script:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch from Google Script' });
    }
  }

  if (req.method === 'POST') {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(req.body),
        // Google Apps Script requires text/plain or it will preflight and fail sometimes, 
        // but since we call it from backend (Node.js), application/json is fine, 
        // though GAS handles postData.contents perfectly either way.
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Error saving to Google Script:', error);
      return res.status(500).json({ success: false, error: 'Failed to save to Google Script' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
