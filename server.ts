import express from "express";
import session from "express-session";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "zremote-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: true, // Required for SameSite=None
      sameSite: "none", // Required for cross-origin iframe
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(express.json());

  // Mock SSO Routes
  app.get("/api/auth/me", (req, res) => {
    if ((req.session as any).user) {
      res.json({ user: (req.session as any).user });
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
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'zremote'}`,
      role: "Admin",
      licenseStatus: "free"
    };
    (req.session as any).user = user;
    res.json({ user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  // Mock SSO Redirect (Simulating Google Login)
  app.get("/auth/google", (req, res) => {
    // In a real app, redirect to Google
    // Here we just redirect back to a callback with a mock code
    res.redirect("/auth/callback?code=mock_code_123");
  });

  app.get("/auth/callback", (req, res) => {
    // Mock successful authentication
    const user = {
      uid: "google_" + Math.random().toString(36).substring(7),
      email: "user@gmail.com",
      displayName: "Google User",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=google",
      role: "Admin",
      licenseStatus: "free"
    };
    (req.session as any).user = user;
    
    // Send a script to notify the opener and close the popup
    res.send(`
      <html>
        <body>
          <script>
            const userData = ${JSON.stringify(user)};
            const authChannel = new BroadcastChannel('zremote_auth');
            
            if (window.opener) {
              try {
                window.opener.postMessage({ type: 'AUTH_SUCCESS', user: userData }, '*');
              } catch (e) {
                console.error('postMessage failed:', e);
              }
            }
            
            authChannel.postMessage({ type: 'AUTH_SUCCESS', user: userData });
            
            // Give some time for the message to be sent before closing
            setTimeout(() => {
              window.close();
              // Fallback if window.close() is blocked
              document.body.innerHTML = '<h1>Authentication Successful</h1><p>You can close this window now.</p>';
            }, 500);
          </script>
        </body>
      </html>
    `);
  });

  // Signaling logic
  const sessions = new Map<string, string>(); // sessionId -> password

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create-session", ({ sessionId, password }) => {
      sessions.set(sessionId, password);
      socket.join(sessionId);
      console.log(`Session created: ${sessionId} by ${socket.id}`);
    });

    socket.on("join-session", ({ sessionId, password }) => {
      const storedPassword = sessions.get(sessionId);
      if (storedPassword && storedPassword === password) {
        socket.join(sessionId);
        console.log(`User ${socket.id} joined session ${sessionId}`);
        socket.to(sessionId).emit("client-joined", { clientId: socket.id });
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
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
