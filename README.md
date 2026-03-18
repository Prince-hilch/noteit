# Dear Me - Journal App

A beautiful, customizable journaling app with daily word goals, custom themes, and gamification features.

## Deployment to Netlify

This project is ready to be deployed to Netlify! 

### Steps to Deploy:

1. **Push to GitHub:**
   - Initialize a git repository if you haven't already: `git init`
   - Add your files: `git add .`
   - Commit your changes: `git commit -m "Initial commit"`
   - Create a new repository on GitHub and push your code.

2. **Connect to Netlify:**
   - Log in to your [Netlify](https://www.netlify.com/) account.
   - Click **"Add new site"** -> **"Import an existing project"**.
   - Choose **GitHub** and authorize Netlify.
   - Select your repository.

3. **Configure Build Settings:**
   Netlify will automatically detect the settings from the `netlify.toml` file included in this repository.
   - **Base directory:** (leave blank)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

4. **Environment Variables (Important!):**
   If your app uses the Gemini API, you need to add your API key to Netlify.
   - Click on **"Show advanced"** during the setup, or go to **Site settings > Environment variables** after deployment.
   - Add a new variable:
     - **Key:** `GEMINI_API_KEY`
     - **Value:** `your_actual_api_key_here`

5. **Deploy!**
   - Click **"Deploy site"**. Netlify will build and publish your app.

## Features
- Custom Backgrounds & Dynamic Themes
- Optional Daily Word Goals
- Focus Mode
- Achievements & Streaks
- Data Export/Import
