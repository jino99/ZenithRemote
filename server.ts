import express from "express";
import session from "express-session";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "zremote-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        // secure only in production (HTTPS); in dev HTTP it must be false
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(express.json());

  // ── Auth routes ──────────────────────────────────────────────────────────────

  app.get("/api/auth/me", (req, res) => {
    const user = (req.session as any).user;
    if (user) {
      res.json({ user });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, name } = req.body;
    const user = {
      uid: Math.random().toString(36).substring(7),
      email: email || "demo@zremote.com",
      displayName: name || "ZREMOTE User",
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || "zremote"}`,
      role: "Admin",
      licenseStatus: "free",
      emailVerified: true,
    };
    (req.session as any).user = user;
    req.session.save(() => res.json({ user }));
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  // ── SSO / OAuth mock ─────────────────────────────────────────────────────────

  // Simulates Google OAuth redirect
  app.get("/auth/google", (_req, res) => {
    res.redirect("/auth/callback?code=mock_code_123");
  });

  app.get("/auth/callback", (req, res) => {
    const user = {
      uid: "google_" + Math.random().toString(36).substring(7),
      email: "user@gmail.com",
      displayName: "Google User",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=google",
      role: "Admin",
      licenseStatus: "free",
      emailVerified: true,
    };
    (req.session as any).user = user;

    req.session.save(() => {
      res.send(`<!DOCTYPE html>
<html>
<head><title>Auth Success</title></head>
<body>
<script>
  const user = ${JSON.stringify(user)};
  const ch = new BroadcastChannel('zremote_auth');
  ch.postMessage({ type: 'AUTH_SUCCESS', user });
  if (window.opener) {
    try { window.opener.postMessage({ type: 'AUTH_SUCCESS', user }, '*'); } catch(e) {}
  }
  setTimeout(() => {
    ch.close();
    window.close();
    document.body.innerHTML = '<p style="font-family:sans-serif;text-align:center;margin-top:40px">Authentication successful. You may close this window.</p>';
  }, 300);
</script>
</body>
</html>`);
    });
  });

  // ── WebRTC signaling ─────────────────────────────────────────────────────────

  // sessionId -> { password, hostSocketId }
  const sessions = new Map<string, { password: string; hostId: string | null }>();

  io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    socket.on("create-session", ({ sessionId, password }) => {
      sessions.set(sessionId, { password, hostId: socket.id });
      socket.join(sessionId);
      console.log(`session created: ${sessionId}`);
    });

    socket.on("join-session", ({ sessionId, password }) => {
      const session = sessions.get(sessionId);
      if (session && session.password === password) {
        socket.join(sessionId);
        console.log(`${socket.id} joined ${sessionId}`);
        // Notify the host specifically
        if (session.hostId) {
          io.to(session.hostId).emit("client-joined", { clientId: socket.id });
        } else {
          socket.to(sessionId).emit("client-joined", { clientId: socket.id });
        }
      } else {
        socket.emit("session-not-found");
      }
    });

    socket.on("signal", ({ sessionId, signal, to }) => {
      if (to) {
        io.to(to).emit("signal", { signal, from: socket.id });
      } else {
        socket.to(sessionId).emit("signal", { signal, from: socket.id });
      }
    });

    socket.on("disconnect", () => {
      console.log("disconnected:", socket.id);
      // Clean up sessions where this socket was the host
      for (const [id, s] of sessions.entries()) {
        if (s.hostId === socket.id) {
          sessions.delete(id);
        }
      }
    });
  });

  // ── Static / Vite middleware ─────────────────────────────────────────────────

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`ZenithRemote running → http://localhost:${PORT}`);
  });
}

startServer();
