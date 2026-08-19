# MacroScan

Toma o sube una foto de tu comida y obtén una estimación de sus macronutrientes (calorías, proteína, carbohidratos y grasa), tanto en total como por cada alimento detectado. El análisis lo hace un modelo de visión de Claude (Anthropic).

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar tu API key de Anthropic

1. Crea una cuenta y consigue una API key en [console.anthropic.com](https://console.anthropic.com).
2. Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

3. Abre `.env` y pega tu key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## 3. Ejecutar la app

```bash
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador (o en el celular, si está en la misma red, usando la IP de tu compu).

## Cómo funciona

- El frontend (`public/`) deja tomar una foto con la cámara o elegir una de la galería.
- Al pulsar "Analizar macronutrientes", la imagen se envía en base64 al backend (`server.js`).
- El backend llama a la API de Claude con visión, pidiéndole un JSON estructurado con los alimentos detectados y sus macros.
- El frontend muestra los totales y el detalle por alimento.

Sin una `ANTHROPIC_API_KEY` válida en `.env`, la app funciona (puedes tomar/subir fotos) pero el análisis mostrará un error indicando que falta configurarla.
