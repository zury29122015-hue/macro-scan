import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'Falta configurar ANTHROPIC_API_KEY en el archivo .env del servidor.'
    });
  }

  const { imageBase64, mediaType } = req.body || {};
  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ error: 'Falta la imagen a analizar.' });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: 'Analiza esta comida y devuelve el JSON de macronutrientes como se indicó.'
            }
          ]
        }
      ]
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock) {
      throw new Error('El modelo no devolvió texto.');
    }

    const parsed = extractJson(textBlock.text);
    res.json(parsed);
  } catch (err) {
    console.error('Error analizando la imagen:', err);
    res.status(500).json({ error: 'No se pudo analizar la imagen. Intenta de nuevo.' });
  }
});

app.listen(PORT, () => {
  console.log(`MacroScan corriendo en http://localhost:${PORT}`);
});
