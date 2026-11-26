# 🎬 StoryForge WS — browser video converter

**Pick video → Convert in the browser → Download or Share. No localhost installation.**

🌐 **Open the website:** https://afuqaero.github.io/storyforgeWS/

## ⚡ 30-second overview

1. 📁 Choose an **SDR or iPhone HDR/HLG/PQ** MP4 or MOV video.
2. 🎞️ Choose **60 FPS** or **29.97 FPS**.
3. 🧩 Select **Status-ready** (8.2 Mbps with size fallback) or **Higher quality** (CRF 20).
4. ✂️ Convert into consecutive clips of **up to 30 seconds each**.
5. ⬇️ Download MP4 clips or 📲 share them with your phone's share sheet.

No account. No video upload to StoryForge or GitHub. Browser FFmpeg runs on your device.

## ✨ Features at a glance

| Feature | Browser edition |
|---|---|
| Works on GitHub Pages | ✅ |
| No install / no localhost server | ✅ |
| Video stays on your device | ✅ |
| Portrait 1080 × 1920, aspect-preserving fit | ✅ |
| 60 FPS or 29.97 FPS | ✅ |
| H.264 / AAC MP4 | ✅ (depends on the included WebAssembly engine) |
| Automatic 30-second parts | ✅ |
| Status mode checks for 31.5 MB safety target | ✅ |
| Mobile share sheet | ✅ where the browser supports file sharing |
| HDR / HLG / PQ tone mapping | ✅ **Hable HDR→SDR filter chain tested in Chromium**; real iPhone files remain device-dependent |
| Dolby Vision metadata / enhancement layer | ⚠️ HLG/PQ-compatible base layer only; no proprietary DV enhancement processing |
| Two-pass ABR and desktop parity | ❌ browser version uses **one-pass** |
| Runs well on all phones | ⚠️ no; browser RAM and speed vary |

**Important:** A video being 1080p doesn't guarantee WhatsApp will preserve its quality. WhatsApp may re-encode uploaded Status videos. HD selection and recipient choice are controlled by WhatsApp, not by this website.

## 🛠️ How it works

- **FFmpeg WebAssembly** loads from a CDN the first time you convert.
- Your video is copied into browser memory, not uploaded.
- Video is resized and padded to preserve the entire frame, then encoded with H.264.
- Status-ready mode starts at **8,200 kb/s** and retries *all* parts together at **8,000 / 7,800 / 7,600 / 7,400 kb/s** if any part exceeds the 31.5 MB safety threshold.
- Outputs are offered as individual MP4 downloads. Clips must remain below 32 MB in this mode.

## 🧠 Quick troubleshooting

**My video won't process?** Start with a short SDR MP4 (under 30 seconds). Large videos can exhaust phone memory.

**Why is it slow?** The FFmpeg WebAssembly engine runs inside the browser and is slower than native desktop FFmpeg.

**Does iPhone HDR work?** The HLG/PQ-to-BT.709 Hable pipeline passed a real Chromium WebAssembly conversion test. Try a short iPhone HDR MOV first. Some HEVC/Dolby Vision files may still fail due to browser memory, codec, or metadata limitations; the app refuses unsupported HDR signalling rather than mislabeling colours.

**Does sharing automatically send to myself in HD?** No. Your phone's share sheet can open WhatsApp, but you'll select **Message yourself** and any **HD** option manually.

**Why does the website need internet?** GitHub Pages supplies both the website and the packaged FFmpeg WebAssembly engine. Your video file itself is not uploaded.

## 🎨 iPhone HDR processing

StoryForge inspects FFmpeg source logs for HLG (`arib-std-b67`) and PQ (`smpte2084`) transfer signalling. For recognised HDR, the encoder runs `zscale → floating-point RGB → Hable tonemap → BT.709 limited-range → yuv420p`, preserving the full portrait frame. This matches the colour-processing approach from the original local converter. It does **not** apply tone mapping to normal BT.709 SDR.

**Verification:** A one-frame synthetic HLG-to-BT.709 x264 encode passed in headless Chromium using the packaged FFmpeg WebAssembly engine. This is not proof that all iPhone Dolby Vision files or full-length 60 FPS clips will process reliably; browser memory and HEVC decoding are still important constraints.

## 🧑‍💻 Run it yourself (optional)

```bash
npm install
npm run dev
```

Visit the local URL printed by Vite.

## 🚀 Deploy

A GitHub Actions workflow builds the Vite app and publishes its `dist/` folder to GitHub Pages after updates to `main`.

## 🔐 Privacy & limitations

The converter handles the input within browser memory. CDN requests fetch **code**, not your footage. No logging/analytics are intentionally built into the app. On phones, use smaller videos and verify output colours and sharpness before posting.

**StoryForge WS is independent of WhatsApp and Meta.** Built by feeqazmir.
