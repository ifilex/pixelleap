import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent local data store for Cloud Saves & Leaderboards
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "cloud_db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CloudDb {
  saves: Record<string, any>;
  leaderboards: {
    global: Array<{
      id: string;
      userId: string;
      username: string;
      score: number;
      level: number;
      skinId: string;
      date: string;
    }>;
    daily: Record<string, Array<{
      id: string;
      userId: string;
      username: string;
      score: number;
      level: number;
      skinId: string;
      date: string;
    }>>;
  };
  events: Array<{
    id: string;
    title: string;
    body: string;
    tag: string;
    date: string;
    discountSkinId?: string;
    discountPercent?: number;
    endsAt?: string;
  }>;
}

const initialSeedData: CloudDb = {
  saves: {},
  leaderboards: {
    global: [
      { id: "g1", userId: "bot_retro", username: "PixelMaster_99", score: 14850, level: 12, skinId: "cyber_ronin", date: "2026-09-18" },
      { id: "g2", userId: "bot_jump", username: "ShadowJumper", score: 11200, level: 9, skinId: "shadow_ninja", date: "2026-09-19" },
      { id: "g3", userId: "bot_valk", username: "AuraKnight", score: 9800, level: 8, skinId: "solar_valkyrie", date: "2026-09-19" },
      { id: "g4", userId: "bot_speed", username: "NeonDash", score: 7950, level: 6, skinId: "chrono_glitcher", date: "2026-09-20" },
      { id: "g5", userId: "bot_slime", username: "BounceKing", score: 6200, level: 5, skinId: "slime_suit", date: "2026-09-20" },
      { id: "g6", userId: "bot_arcade", username: "RetroBoy89", score: 4800, level: 4, skinId: "retro_boy", date: "2026-09-20" },
    ],
    daily: {},
  },
  events: [
    {
      id: "ev1",
      title: "🔥 ¡Oferta Relámpago en Aspecto!",
      body: "El aspecto 'Cyber Ronin' tiene 30% de descuento en la tienda por las próximas 24 horas.",
      tag: "OFERTA LIMITADA",
      date: new Date().toISOString(),
      discountSkinId: "cyber_ronin",
      discountPercent: 30,
      endsAt: new Date(Date.now() + 86400000).toISOString()
    },
    {
      id: "ev2",
      title: "🏆 Torneo Diario: Gravedad Baja",
      body: "El desafío de hoy tiene física lunar. ¡Consigue el doble de puntos de altitud y corona el ranking!",
      tag: "DESAFÍO",
      date: new Date().toISOString()
    },
    {
      id: "ev3",
      title: "⚡ Fin de Semana: Botín Doble",
      body: "Todas las gemas recolectadas otorgan el doble de puntos para canjear en la tienda.",
      tag: "EVENTO ESPECIAL",
      date: new Date().toISOString()
    }
  ]
};

function readDb(): CloudDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading cloud DB, initializing defaults", e);
  }
  writeDb(initialSeedData);
  return initialSeedData;
}

function writeDb(data: CloudDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing cloud DB", e);
  }
}

// Ensure DB is initialized
readDb();

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Cloud Save: Get user save
app.get("/api/cloud-save/:userId", (req, res) => {
  const { userId } = req.params;
  const db = readDb();
  if (db.saves[userId]) {
    res.json({ success: true, save: db.saves[userId] });
  } else {
    res.json({ success: false, message: "No cloud save found for this user ID" });
  }
});

// Cloud Save: Upload user save
app.post("/api/cloud-save", (req, res) => {
  const { userId, profileData } = req.body;
  if (!userId || !profileData) {
    return res.status(400).json({ success: false, error: "Missing userId or profileData" });
  }

  const db = readDb();
  db.saves[userId] = {
    ...profileData,
    lastSyncedAt: new Date().toISOString(),
  };
  writeDb(db);

  res.json({
    success: true,
    lastSyncedAt: db.saves[userId].lastSyncedAt,
  });
});

// Leaderboard: Get
app.get("/api/leaderboard", (req, res) => {
  const mode = (req.query.mode as string) || "global";
  const dateStr = (req.query.date as string) || new Date().toISOString().split("T")[0];
  const db = readDb();

  if (mode === "daily") {
    const dailyScores = db.leaderboards.daily[dateStr] || [
      { id: "d1", userId: "bot_1", username: "SpeedyGonz", score: 8200, level: 7, skinId: "cyber_ronin", date: dateStr },
      { id: "d2", userId: "bot_2", username: "JumpMaster", score: 5400, level: 5, skinId: "solar_valkyrie", date: dateStr },
      { id: "d3", userId: "bot_3", username: "PixelFan", score: 3900, level: 4, skinId: "default_blue", date: dateStr }
    ];
    dailyScores.sort((a, b) => b.score - a.score);
    return res.json({ success: true, mode: "daily", date: dateStr, leaderboard: dailyScores });
  }

  const globalScores = [...db.leaderboards.global];
  globalScores.sort((a, b) => b.score - a.score);
  res.json({ success: true, mode: "global", leaderboard: globalScores.slice(0, 50) });
});

// Leaderboard: Submit score
app.post("/api/leaderboard", (req, res) => {
  const { userId, username, score, level, skinId, mode, date } = req.body;
  if (!userId || score === undefined) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const db = readDb();
  const entry = {
    id: "lb_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    userId,
    username: username || "PixelRunner",
    score: Number(score),
    level: Number(level) || 1,
    skinId: skinId || "default_blue",
    date: date || new Date().toISOString().split("T")[0],
  };

  if (mode === "daily") {
    const today = entry.date;
    if (!db.leaderboards.daily[today]) {
      db.leaderboards.daily[today] = [];
    }
    db.leaderboards.daily[today].push(entry);
    db.leaderboards.daily[today].sort((a, b) => b.score - a.score);
    // Keep top 50
    db.leaderboards.daily[today] = db.leaderboards.daily[today].slice(0, 50);
  } else {
    db.leaderboards.global.push(entry);
    db.leaderboards.global.sort((a, b) => b.score - a.score);
    db.leaderboards.global = db.leaderboards.global.slice(0, 100);
  }

  writeDb(db);
  res.json({ success: true, entry });
});

// Daily Challenge Config
app.get("/api/daily-challenge", (_req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];
  // Deterministic seed based on date
  let seedNum = 0;
  for (let i = 0; i < todayStr.length; i++) {
    seedNum = (seedNum << 5) - seedNum + todayStr.charCodeAt(i);
    seedNum |= 0;
  }
  const absSeed = Math.abs(seedNum);

  const modifiers = [
    {
      id: "low_gravity",
      name: "Gravedad Cero / Lunar",
      desc: "Los saltos alcanzan 1.5x de altura y caes suavemente. ¡Cuidado con el timing!",
      gravityFactor: 0.65,
      jumpFactor: 1.15,
      speedFactor: 1.0,
      rewardCoins: 350
    },
    {
      id: "fast_speed",
      name: "Hipervelocidad",
      desc: "La velocidad de movimiento aumenta un 35%. Reacciones de rayo necesarias.",
      gravityFactor: 1.0,
      jumpFactor: 1.0,
      speedFactor: 1.35,
      rewardCoins: 400
    },
    {
      id: "coin_rush",
      name: "Fiebre de Oro",
      desc: "El doble de monedas en el camino y los enemigos sueltan gemas al ser aplastados.",
      gravityFactor: 1.0,
      jumpFactor: 1.0,
      speedFactor: 1.0,
      rewardCoins: 500
    },
    {
      id: "one_hit",
      name: "Modo Superviviente",
      desc: "Solo tienes 1 corazón. La máxima tensión para los más intrépidos.",
      gravityFactor: 1.0,
      jumpFactor: 1.0,
      speedFactor: 1.0,
      rewardCoins: 600
    }
  ];

  const modifier = modifiers[absSeed % modifiers.length];

  res.json({
    date: todayStr,
    seed: absSeed,
    modifier,
    targetScore: 3000,
    dailyBonusPoints: 250
  });
});

// Push events and active offers
app.get("/api/push-events", (_req, res) => {
  const db = readDb();
  res.json({ events: db.events });
});

// -------------------------------------------------------------
// Server & Vite integration
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Pixel Leap 2D] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
