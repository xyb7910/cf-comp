<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Codeforces Companion

A powerful competitive programming companion with AI assistance.

View your app in AI Studio: https://ai.studio/apps/fb27dd62-d778-4ca4-8f7e-c9c99a283ef9

## 🚀 Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

## 📦 Build & Deploy

### Build the Project
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## 🎯 Deployment Options

### Option 1: Railway (Recommended)

This project is pre-configured for Railway deployment!

#### Steps to Deploy:

1. **Push your code to GitHub**
2. **Sign up/login to [Railway](https://railway.app)**
3. **Create a new project** and "Deploy from repo"
4. **Select your repository**
5. **Configure environment variables**:
   - Add `GEMINI_API_KEY` with your Gemini API key
6. **Deploy!** 🚀

Railway will automatically:
- Detect the Node.js project
- Install dependencies
- Build the project
- Start the server

### Option 2: Render
1. Connect your GitHub repo
2. Set environment variable `GEMINI_API_KEY`
3. Set build command to `npm run build`
4. Set start command to `npm start`

### Option 3: Vercel
The project is packaged for Vercel static deployment. For full backend functionality, consider:
- Using Vercel Serverless Functions for API endpoints
- Or deploy backend separately

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Gemini API key for AI features |
| `APP_URL` | No | Your app's public URL |
| `PORT` | No | Server port (default: 3000) |

## 🐳 Docker

A Dockerfile is included for containerized deployments.

Build and run locally:
```bash
docker build -t codeforces-companion .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key codeforces-companion
```


