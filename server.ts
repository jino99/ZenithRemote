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
    secret: process.env.SESSION_SECRET || "zenith-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: true, // Required for SameSite=None
      sameSite: "none", // Required for cross-origin iframe
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(express.json());

  // Stripe Integration
  const stripe = process.env.STRIPE_SECRET_KEY ? new (await import("stripe")).default(process.env.STRIPE_SECRET_KEY) : null;

  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }

    const { priceId } = req.body;
    const user = (req.session as any).user;

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId, // e.g., 'price_12345'
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}&upgrade=success`,
        cancel_url: `${req.headers.origin}/?upgrade=cancel`,
        customer_email: user.email,
        metadata: {
          userId: user.uid,
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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
      email: email || "demo@zenith.com",
      displayName: name || "Zenith User",
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'zenith'}`,
      role: "Admin",
      licenseStatus: "pro"
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
      licenseStatus: "pro"
    };
    (req.session as any).user = user;
    
    // Send a script to notify the opener and close the popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
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
