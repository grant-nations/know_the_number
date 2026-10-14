const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { numberToFrench } = require('./french');

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const MIN_NUMBER = -10000;
const MAX_NUMBER = 10000;
const TIME_LIMIT_SECONDS = 20;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
const API_KEY = process.env.ELEVENLABS_API_KEY;
const PUBLIC_DIR = path.join(__dirname, 'public');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

function randomNumber() {
  return Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
}

async function synthesize(text) {
  if (!API_KEY) throw new Error("La clé API ElevenLabs manque. Ajoute-la dans le fichier .env.");

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      language_code: 'fr',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error(`ElevenLabs returned ${response.status}: ${details}`);
    throw new Error(`ElevenLabs a renvoyé une erreur (${response.status}).`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function sendJson(response, statusCode, body) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
  response.end(payload);
}

async function handleRound(response) {
  const number = randomNumber();
  try {
    const audio = await synthesize(numberToFrench(number));
    response.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audio.length,
      'X-Correct-Number': String(number),
      'X-Time-Limit-Seconds': String(TIME_LIMIT_SECONDS),
      'Access-Control-Expose-Headers': 'X-Correct-Number, X-Time-Limit-Seconds',
    });
    response.end(audio);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

function serveStatic(request, response) {
  const requestedPath = request.url === '/' ? '/index.html' : request.url;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));
  if (!filePath.startsWith(PUBLIC_DIR)) return sendJson(response, 404, { error: 'Page introuvable.' });

  fs.readFile(filePath, (error, content) => {
    if (error) return sendJson(response, 404, { error: 'Page introuvable.' });
    const contentTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/api/config') {
    return sendJson(response, 200, { timeLimitSeconds: TIME_LIMIT_SECONDS });
  }
  if (request.method === 'GET' && request.url === '/api/round') return handleRound(response);
  if (request.method === 'GET') return serveStatic(request, response);
  return sendJson(response, 405, { error: 'Méthode non autorisée.' });
});

server.listen(PORT, () => {
  console.log(`Know the Number is running at http://localhost:${PORT}`);
});
