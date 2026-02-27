import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. 請在 Vercel 設定環境變數。' });
    }

    const { locationName, mood } = req.body;

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
}
