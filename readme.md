# 🎯 Jazz's Smartass Silencer

A brutally witty AI-powered tool that analyzes pretentious statements and generates devastating comebacks. Choose between British Cynicism or German Efficiency.

## Features

- 💀 **Kill Shot Generator** - One-liners that roll eyes
- 🔬 **Technical Autopsy** - Why they're wrong, explained with wit
- 🎯 **Trap Questions** - Force them to admit defeat
- 🎤 **Voice Input** - Dictate the stupidity
- 🔊 **TTS Output** - Hear the roast read back to you
- 🇬🇧/🇩🇪 **Bilingual** - English & German support
- 🎮 **Pong** - Play while waiting

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run locally:
   ```bash
   npm run dev
   ```

## Deployment to GitHub Pages

### Automatic (GitHub Actions)

1. Push to the `main` branch
2. Go to repo **Settings → Pages → Source**: select "GitHub Actions"
3. Add your `GEMINI_API_KEY` as a repository secret:
   - **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `GEMINI_API_KEY`
   - Value: your API key

The site will auto-deploy on every push to `main`.

## Configuration

If your repo name is different from `smartassilencer`, edit `vite.config.ts`:

```ts
base: mode === 'production' ? '/your-repo-name/' : '/',
```

## Tech Stack

- React 19 + Vite
- Tailwind CSS
- Google Gemini AI (Text + TTS)
- Rough Notation
- Lucide Icons

---

*Use responsibly, you muppet.*

