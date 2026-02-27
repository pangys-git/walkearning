import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. 請在 Vercel 設定環境變數。' });
    }

    const { preferences, distanceKm, durationMin } = req.body;

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
}
