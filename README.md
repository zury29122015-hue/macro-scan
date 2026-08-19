# MacroScan

Toma o sube una foto de tu comida y obtén una estimación de sus macronutrientes (calorías, proteína, carbohidratos y grasa), tanto en total como por cada alimento detectado. El análisis lo hace Gemini (Google), usando su nivel gratuito.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar tu API key de Gemini (gratis)

1. Entra a [aistudio.google.com](https://aistudio.google.com) con tu cuenta de Google.
2. Clic en "Get API key" → "Create API key" (no pide tarjeta, tiene nivel gratuito).
3. Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

4. Abre `.env` y pega tu key:

```
GEMINI_API_KEY=AIza...
```

## 3. Ejecutar la app

```bash
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador (o en el celular, si está en la misma red, usando la IP de tu compu).

## Cómo funciona

- El frontend (`public/`) deja tomar una foto con la cámara o elegir una de la galería.
- Al pulsar "Analizar macronutrientes", la imagen se envía en base64 al backend (`server.js`).
- El backend llama a Gemini con visión, pidiéndole un JSON estructurado con los alimentos detectados y sus macros.
- El frontend muestra los totales y el detalle por alimento.

Sin una `GEMINI_API_KEY` válida en `.env` (o en las variables de entorno de Vercel), la app funciona (puedes tomar/subir fotos) pero el análisis mostrará un error indicando que falta configurarla.

## Deploy en Vercel

En el dashboard del proyecto en Vercel, ve a **Settings → Environment Variables** y agrega `GEMINI_API_KEY` con tu key. Luego vuelve a desplegar.
