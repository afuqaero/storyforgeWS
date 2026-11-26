# 🎬 StoryForge WS — WhatsApp Status Video Studio

> **Upload a video → convert on your PC → download Status-ready clips → share to WhatsApp.**
>
> Built by **feeqazmir**. Local-first, no AI API, no cloud rendering.

## ⚡ 30-second explanation

StoryForge prepares your original iPhone/Android MOV or MP4 footage for WhatsApp Status.

1. 📁 Choose a video.
2. 🎞️ StoryForge converts HDR to SDR where needed and prepares **1080 × 1920 / 60 FPS** H.264 MP4s.
3. ✂️ Longer videos are split into clips of **up to 30 seconds**.
4. ✅ Each clip is checked for compatibility, duration and size.
5. 📲 Download or share the finished clips to WhatsApp yourself.

**Important:** WhatsApp can recompress Status videos. This tool optimizes the file you upload; it cannot force WhatsApp to preserve the original quality.

## 🖥️ Run locally (the real converter)

The video engine needs a **Windows/macOS/Linux computer running Node.js and FFmpeg**. GitHub Pages cannot execute FFmpeg server processes.

1. Install **Node.js 20+** and FFmpeg with `libx264`, `zscale`, and `tonemap`.
2. On Windows, install FFmpeg via `winget install --id Gyan.FFmpeg -e`.
3. Extract the StoryForge v3.1 project, then run `start-windows.cmd`.
4. Open **http://localhost:3000** and upload your video.

No `npm install` is required for v3.1. The included `npm test` command uses Node's built-in test runner.

## 🎯 Locked export profile

| Setting | Value |
|---|---|
| Resolution | **1080 × 1920**, aspect-preserving fit |
| Frame rate | **60 FPS CFR** |
| Video | H.264 High Level 4.2, 8-bit yuv420p |
| Colour | SDR BT.709 limited; Hable HDR tone mapping when needed |
| Audio | AAC stereo, 44.1 kHz, 128 kb/s |
| Compression | Two-pass ABR/VBV for offline modes |
| Target bitrate | 8,200 kb/s; deterministic 8,000 → 7,800 → 7,600 → 7,400 fallback |
| Segments | ≤30 seconds, ≤31.5 MB safety target |
| Metadata | Source location metadata removed |

## ✂️ Choose a split mode

- **Auto (recommended):** split into 30-second parts.
- **Manual:** enter your own cut points, each part ≤30 seconds.
- **Real-time:** encode segments sequentially, then validate the entire set before sharing.

## 📱 Phone / PWA / Cloudflare

The local FFmpeg engine stays on **your computer**. For access from your phone, you may optionally start a **Cloudflare Tunnel** pointed at `http://localhost:3000`. Use Cloudflare Access authentication before exposing personal videos. Quick Tunnel links are public to anyone who knows the URL.

Once converted, use your phone's Share Sheet → **WhatsApp → Message yourself** and select **HD manually** if WhatsApp offers the option. A website cannot force HD, pick your chat, or post a Status automatically.

## 🧠 Troubleshooting — quick answers

**“Engine offline”** → Open `http://localhost:3000/api/health` on the PC. Start the Windows launcher and wait for **[READY]**.

**FFmpeg missing** → Run `ffmpeg -version` and `ffprobe -version` in a new terminal.

**Phone cannot use localhost** → Phone's localhost is not the PC. Use the private tunnel address.

**Videos look blurry on Status** → Compare the local exported MP4 first. WhatsApp can compress it again.

## 🌐 GitHub Pages

[Open the StoryForge public overview](https://afuqaero.github.io/storyforgeWS/). This is a **static product overview, not the FFmpeg converter**.

## 🔒 Privacy

Local conversions stay on your computer. If you use Cloudflare Tunnel from your phone, uploads/downloads travel through Cloudflare en route to your PC. No account or AI service is needed for FFmpeg encoding.

## 🧪 Testing limitations

The previous v3.1 project passed automated FFmpeg and localhost API tests on synthetic samples. Real-world camera footage and the final mobile WhatsApp handoff still require device-specific testing.

---

*Independent project; not affiliated with WhatsApp or Meta.*
