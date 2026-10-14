# Know the Number

A small local browser app for practicing French numbers with ElevenLabs text to speech.

## Requirements

- Node.js 18 or newer
- An ElevenLabs API key
- Firefox or another modern browser

## Setup

```sh
cp .env.example .env
```

Edit `.env` and set `ELEVENLABS_API_KEY`. You can also change `ELEVENLABS_VOICE_ID` there.

Start the app:

```sh
npm start
```

Open <http://localhost:3000> in Firefox. Stop it with `Ctrl-C`.

Run the number-conversion tests with:

```sh
npm test
```

## Configuration

The practice range and timer are near the top of `server.js`:

- `MIN_NUMBER`
- `MAX_NUMBER`
- `TIME_LIMIT_SECONDS`

The app asks ElevenLabs for French speech using `eleven_multilingual_v2`. The API key is never sent to the browser.
