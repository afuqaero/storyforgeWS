# Publish the complete StoryForge v3.1 app from your Windows computer

The GitHub Pages preview is **static**; the real converter uses Node.js + FFmpeg on your PC.

## 1. Extract the StoryForge-v3.1-Localhost-Fix(1).zip file

Open PowerShell in the extracted **storyforge-60fps-v3** folder (the one containing `server.mjs`, `public`, and `src`).

## 2. Recommended safe publishing workflow

```powershell
# Run from the extracted StoryForge project folder:
git clone https://github.com/afuqaero/storyforgeWS.git ..\storyforgeWS-publish
Copy-Item -Path .\* -Destination ..\storyforgeWS-publish -Recurse -Force
Copy-Item -Path .\.gitignore -Destination ..\storyforgeWS-publish -Force
cd ..\storyforgeWS-publish
git add .
git commit -m "feat: publish complete StoryForge v3.1 backend and PWA"
git push origin main
```

When Windows asks to overwrite README.md, choose **No** or skip that file if you want to preserve the ADHD-friendly GitHub README; the app does not require the existing README to execute.

The `public/` directory in the ZIP contains the live local PWA. The `docs/site/` directory in the repo contains the static GitHub Pages preview. Keep both.

## Enable GitHub Pages (one time)

Repository → **Settings** → **Pages** → under **Build and deployment**, set **Source: GitHub Actions**. Then open **Actions → Deploy GitHub Pages preview → Run workflow**.

Your preview will appear at `https://afuqaero.github.io/storyforgeWS/` once the Pages deployment succeeds.

## Privacy check

Do not commit personal MOV/MP4 videos, `.env`, secrets, temp exports, or local caches. Inspect `git status` before pushing.
