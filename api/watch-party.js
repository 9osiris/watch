// Real-time Watch Party room coordination endpoint.
// Persists active room metadata, playback state, member heartbeats, and room chat,
// with optional Supabase table/Realtime Broadcast fan-out when configured.

const MAX_ROOMS = 500;
const MAX_MESSAGES = 60;
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const MEMBER_STALE_MS = 45 * 1000;
const ALLOWED_PROVIDERS = new Set(["cinesrc", "vidking", "vidsrc", "vidsrc2", "111movies"]);

function getStore() {
  if (!globalThis.__orcWatchParties) {
    globalThis.__orcWatchParties = new Map();
  }
  return globalThis.__orcWatchParties;
}

function pruneStore(store, now = Date.now()) {
  for (const [code, room] of store.entries()) {
    if (!room || (now - (room.updatedAt || room.createdAt || 0)) > ROOM_TTL_MS) {
      store.delete(code);
      continue;
    }
    if (Array.isArray(room.members)) {
      room.members = room.members.filter(m => m && (now - (m.lastSeen || 0)) <= MEMBER_STALE_MS);
    }
  }
  while (store.size > MAX_ROOMS) {
    const oldestKey = store.keys().next().value;
    if (!oldestKey) break;
    store.delete(oldestKey);
  }
}

function normalizeCode(raw) {
  const cleaned = String(raw || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (cleaned.length < 4 || cleaned.length > 24) return "";
  return cleaned;
}

function generateRoomCode(store) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 12; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!store.has(code)) return code;
  }
  return "OW" + Date.now().toString(36).toUpperCase().slice(-4);
}

function sanitizeText(value, maxLen = 120, fallback = "") {
  const s = String(value || "").replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  return s ? s.slice(0, maxLen) : fallback;
}

function hasSupabaseRealtimeConfig() {
  return Boolean(
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
  );
}

function sanitizeRoomSnapshot(room) {
  return {
    code: room.code,
    mediaType: room.mediaType,
    mediaId: room.mediaId,
    title: room.title,
    posterPath: room.posterPath || "",
    season: room.season,
    episode: room.episode,
    provider: room.provider,
    isPlaying: Boolean(room.isPlaying),
    positionSec: Number.isFinite(room.positionSec) ? Math.max(0, Math.round(room.positionSec)) : 0,
    hostClientId: room.hostClientId,
    hostName: room.hostName,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    stateVersion: room.stateVersion,
    realtimeEnabled: hasSupabaseRealtimeConfig(),
    members: (room.members || []).map(m => ({
      clientId: m.clientId,
      name: m.name,
      avatar: m.avatar || "",
      role: m.clientId === room.hostClientId ? "host" : "guest",
      lastSeen: m.lastSeen,
    })),
    messages: (room.messages || []).slice(-MAX_MESSAGES),
  };
}

function parseJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
    if (raw.length > 32 * 1024) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function broadcastSupabaseRealtime(room, event, payload) {
  if (!hasSupabaseRealtimeConfig()) return;
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key || typeof fetch !== "function") return;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{
          topic: `realtime:watch-party-${room.code}`,
          event,
          payload,
        }],
      }),
      signal: controller.signal,
    }).catch(() => {});
    clearTimeout(timer);
  } catch {}
}

function setCommonHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function upsertMember(room, clientId, name, avatar, now) {
  if (!clientId) return;
  if (!Array.isArray(room.members)) room.members = [];
  const existing = room.members.find(m => m.clientId === clientId);
  const cleanName = sanitizeText(name, 32, existing?.name || "Guest");
  const cleanAvatar = sanitizeText(avatar, 400, existing?.avatar || "");
  if (existing) {
    existing.name = cleanName;
    if (cleanAvatar) existing.avatar = cleanAvatar;
    existing.lastSeen = now;
  } else if (room.members.length < 40) {
    room.members.push({
      clientId,
      name: cleanName,
      avatar: cleanAvatar,
      lastSeen: now,
    });
  }
}

function createRoomHandler(req, res, store, body) {
  const mediaType = body.mediaType === "tv" ? "tv" : "movie";
  const rawId = Number(body.mediaId);
  if (!Number.isSafeInteger(rawId) || rawId <= 0) {
    res.status(400).json({ error: "Valid mediaId is required to host a Watch Party." });
    return;
  }

  const now = Date.now();
  const requestedCode = normalizeCode(body.code);
  const code = (requestedCode && !store.has(requestedCode)) ? requestedCode : generateRoomCode(store);
  const clientId = sanitizeText(body.clientId, 64, "host-" + Math.random().toString(36).slice(2, 10));
  const hostName = sanitizeText(body.hostName || body.name, 32, "Host");
  const provider = ALLOWED_PROVIDERS.has(body.provider) ? body.provider : "cinesrc";
  const season = mediaType === "tv" ? Math.max(0, Math.min(999, parseInt(body.season, 10) || 1)) : 1;
  const episode = mediaType === "tv" ? Math.max(1, Math.min(2000, parseInt(body.episode, 10) || 1)) : 1;

  const room = {
    code,
    mediaType,
    mediaId: String(rawId),
    title: sanitizeText(body.title, 120, mediaType === "tv" ? "TV Series" : "Movie"),
    posterPath: sanitizeText(body.posterPath, 180, ""),
    season,
    episode,
    provider,
    isPlaying: Boolean(body.isPlaying),
    positionSec: Math.max(0, Number(body.positionSec) || 0),
    hostClientId: clientId,
    hostName,
    createdAt: now,
    updatedAt: now,
    stateVersion: 1,
    members: [],
    messages: [{
      id: `sys-${now}`,
      type: "system",
      sender: hostName,
      text: `${hostName} started the Watch Party.`,
      timestamp: now,
    }],
  };
  upsertMember(room, clientId, hostName, body.avatar, now);
  store.set(code, room);

  res.status(201).json({ ok: true, room: sanitizeRoomSnapshot(room) });
}

async function handler(req, res) {
  setCommonHeaders(res);

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET, POST, PATCH, DELETE, OPTIONS");
    res.status(204).end();
    return;
  }

  const store = getStore();
  const now = Date.now();
  pruneStore(store, now);

  if (req.method === "GET") {
    const rawCode = req.query?.code;
    const code = normalizeCode(rawCode);
    if (!code) {
      res.status(400).json({ error: "A valid Watch Party room code is required." });
      return;
    }
    const room = store.get(code);
    if (!room) {
      res.status(404).json({ error: "Watch Party room not found or expired.", code });
      return;
    }
    const clientId = sanitizeText(req.query?.clientId, 64, "");
    const memberName = sanitizeText(req.query?.name, 32, "");
    if (clientId) {
      upsertMember(room, clientId, memberName, req.query?.avatar, now);
    }
    res.status(200).json({ ok: true, room: sanitizeRoomSnapshot(room) });
    return;
  }

  const body = parseJsonBody(req);
  if (!body) {
    res.status(400).json({ error: "Malformed or oversized JSON body." });
    return;
  }

  if (req.method === "POST") {
    const action = sanitizeText(body.action, 24, "create").toLowerCase();
    if (action === "create") {
      createRoomHandler(req, res, store, body);
      return;
    }

    const code = normalizeCode(body.code);
    let room = store.get(code);

    // Hydrate ephemeral lambda if a client passes seed room descriptor while joining/syncing
    if (!room && code && body.mediaId) {
      createRoomHandler(req, res, store, { ...body, code });
      return;
    }

    if (!room) {
      res.status(404).json({ error: "Watch Party room not found or expired.", code });
      return;
    }

    const clientId = sanitizeText(body.clientId, 64, "");
    const senderName = sanitizeText(body.name || body.sender, 32, "Guest");

    if (action === "join" || action === "heartbeat") {
      const alreadyMember = clientId && room.members.some(m => m.clientId === clientId);
      upsertMember(room, clientId, senderName, body.avatar, now);
      if (action === "join" && !alreadyMember && senderName) {
        room.messages.push({
          id: `sys-${now}-${Math.random().toString(36).slice(2, 6)}`,
          type: "system",
          sender: senderName,
          text: `${senderName} joined the party.`,
          timestamp: now,
        });
        if (room.messages.length > MAX_MESSAGES) room.messages = room.messages.slice(-MAX_MESSAGES);
      }
      room.updatedAt = now;
      res.status(200).json({ ok: true, room: sanitizeRoomSnapshot(room) });
      return;
    }

    if (action === "chat" || action === "reaction") {
      const text = sanitizeText(body.text || body.emoji, 300, "");
      if (!text) {
        res.status(400).json({ error: "Message text is required." });
        return;
      }
      if (clientId) upsertMember(room, clientId, senderName, body.avatar, now);
      const msgId = sanitizeText(body.id, 64, `msg-${now}-${Math.random().toString(36).slice(2, 7)}`);
      if (!room.messages.some(m => m.id === msgId)) {
        const entry = {
          id: msgId,
          type: action === "reaction" ? "reaction" : "chat",
          clientId,
          sender: senderName,
          avatar: sanitizeText(body.avatar, 400, ""),
          text,
          timestamp: now,
        };
        room.messages.push(entry);
        if (room.messages.length > MAX_MESSAGES) room.messages = room.messages.slice(-MAX_MESSAGES);
        await broadcastSupabaseRealtime(room, "CHAT_MESSAGE", entry);
      }
      room.updatedAt = now;
      res.status(200).json({ ok: true, room: sanitizeRoomSnapshot(room) });
      return;
    }

    if (action === "leave") {
      if (clientId) {
        room.members = (room.members || []).filter(m => m.clientId !== clientId);
      }
      room.updatedAt = now;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: "Unsupported Watch Party action." });
    return;
  }

  if (req.method === "PATCH") {
    const code = normalizeCode(body.code);
    const room = store.get(code);
    if (!room) {
      res.status(404).json({ error: "Watch Party room not found.", code });
      return;
    }

    const clientId = sanitizeText(body.clientId, 64, "");
    if (clientId) upsertMember(room, clientId, body.hostName || body.name, body.avatar, now);

    // Allow host (or any participant if host disconnected) to push sync state
    const hostStillPresent = room.members.some(m => m.clientId === room.hostClientId);
    const isHost = !clientId || clientId === room.hostClientId || !hostStillPresent;
    if (!isHost && !body.allowGuestSync) {
      res.status(403).json({ error: "Only the room host can change party playback state." });
      return;
    }
    if (!hostStillPresent && clientId) {
      room.hostClientId = clientId;
      if (body.name) room.hostName = sanitizeText(body.name, 32, room.hostName);
    }

    if (room.mediaType === "tv") {
      if (body.season !== undefined) room.season = Math.max(0, Math.min(999, parseInt(body.season, 10) || 1));
      if (body.episode !== undefined) room.episode = Math.max(1, Math.min(2000, parseInt(body.episode, 10) || 1));
    }
    if (ALLOWED_PROVIDERS.has(body.provider)) room.provider = body.provider;
    if (typeof body.isPlaying === "boolean") room.isPlaying = body.isPlaying;
    if (Number.isFinite(Number(body.positionSec))) room.positionSec = Math.max(0, Math.round(Number(body.positionSec)));
    room.stateVersion = (room.stateVersion || 1) + 1;
    room.updatedAt = now;

    const snapshot = sanitizeRoomSnapshot(room);
    await broadcastSupabaseRealtime(room, "SYNC_PLAYBACK", {
      season: snapshot.season,
      episode: snapshot.episode,
      provider: snapshot.provider,
      isPlaying: snapshot.isPlaying,
      positionSec: snapshot.positionSec,
      stateVersion: snapshot.stateVersion,
      senderId: clientId,
      senderName: room.hostName,
      countdown: Boolean(body.countdown),
    });

    res.status(200).json({ ok: true, room: snapshot });
    return;
  }

  if (req.method === "DELETE") {
    const code = normalizeCode(req.query?.code || body.code);
    if (!code) {
      res.status(400).json({ error: "Room code required." });
      return;
    }
    store.delete(code);
    res.status(200).json({ ok: true, closed: code });
    return;
  }

  res.setHeader("Allow", "GET, POST, PATCH, DELETE, OPTIONS");
  res.status(405).json({ error: "Method not allowed." });
}

module.exports = handler;
module.exports._internal = {
  getStore,
  pruneStore,
  normalizeCode,
  sanitizeRoomSnapshot,
};
