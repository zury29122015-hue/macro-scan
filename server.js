import 'dotenv/config';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `Eres un nutricionista experto que analiza fotos de comida.
Identifica cada alimento visible en la imagen y estima, de forma realista, su porción y sus macronutrientes.
Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown, sin backticks) con esta forma exacta:

{
  "items": [
    {
      "name": "string, nombre del alimento en español",
      "portion": "string, ej. '150 g' o '1 taza'",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ],
  "totals": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number
  },
  "confidence": "alta" | "media" | "baja",
  "notes": "string breve, en español, con supuestos hechos para la estimación"
}

Si la imagen no muestra comida claramente, responde igual con el JSON pero con items vacío, totals en 0, confidence "baja" y explica el motivo en notes.`;

function extractJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('No se pudo interpretar la respuesta del modelo');
  }
}

app.post('/api/analyze', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'Falta configurar GEMINI_API_KEY en el archivo .env del servidor.'
    });
  }

  const { imageBase64, mediaType } = req.body || {};
  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ error: 'Falta la imagen a analizar.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: imageBase64
        }
      },
      { text: 'Analiza esta comida y devuelve el JSON de macronutrientes como se indicó.' }
    ]);

    const text = result.response.text();
    const parsed = extractJson(text);
    res.json(parsed);
  } catch (err) {
    console.error('Error analizando la imagen:', err);
    res.status(500).json({ error: 'No se pudo analizar la imagen. Intenta de nuevo.' });
  }
});

app.listen(PORT, () => {
  console.log(`MacroScan corriendo en http://localhost:${PORT}`);
});
