# Preview the app (no port forwarding needed)

The dev server runs on **port 3000**. You can open the app in your browser without using Cursor’s Ports / port forwarding.

## 1. Start the dev server

From the project root in a terminal:

```bash
npm run dev
```

Wait until you see something like: `Local: http://localhost:3000/`

## 2. Open the app in your browser

**Option A – use the script (recommended)**

In another terminal (or after the server is up):

```bash
npm run open-app
```

That opens **http://localhost:3000** in your default browser.

**Option B – open the URL yourself**

In your browser’s address bar go to:

**http://localhost:3000**

(If Vite picked another port, use that port, e.g. http://localhost:3004)

---

## Access over the internet (tunnel)

You need the dev server running first (`npm run dev`). Then use **one** of these:

### Option A: Cloudflare Tunnel (no password prompt)

```bash
npm run tunnel:public
```

Use the `https://...trycloudflare.com` URL it prints. No signup, no password, no IP step.

### Option B: Localtunnel (asks for your IP, not a password)

```bash
npm run tunnel
```

When you open the `https://....loca.lt` URL, the page asks for your **public IP** (it’s a security check, not a real password):

1. Get your IP: open **https://icanhazip.com** in a browser, or run `curl https://ipv4.icanhazip.com` in a terminal.
2. Enter that IP on the localtunnel page and continue. Only you (from that IP) need to do this once per URL.

No Cursor port forwarding or `code-tunnel.exe` needed.
