const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/watch-party.js");

function mockRes() {
  const headers = {};
  const state = { status: 200, headers, body: null };
  return {
    state,
    setHeader(k, v) { headers[k.toLowerCase()] = v; },
    status(code) { state.status = code; return this; },
    json(payload) { state.body = payload; return this; },
    end() { return this; },
  };
}

test("watch-party API supports create, join, chat, host-only sync, lookup, and delete", async () => {
  // 1. Create
  const createRes = mockRes();
  await handler({
    method: "POST",
    body: {
      action: "create",
      mediaType: "tv",
      mediaId: "94997",
      title: "Frieren: Beyond Journey's End",
      season: 1,
      episode: 3,
      provider: "cinesrc",
      hostName: "kindmops",
      clientId: "host-1",
    },
  }, createRes);

  assert.equal(createRes.state.status, 201);
  assert.equal(createRes.state.body.ok, true);
  const room = createRes.state.body.room;
  assert.ok(room.code && room.code.length >= 4);
  assert.equal(room.hostClientId, "host-1");
  assert.equal(room.season, 1);
  assert.equal(room.episode, 3);

  // 2. Join
  const joinRes = mockRes();
  await handler({
    method: "POST",
    body: { action: "join", code: room.code, clientId: "guest-1", name: "Alice" },
  }, joinRes);
  assert.equal(joinRes.state.status, 200);
  assert.equal(joinRes.state.body.room.members.length, 2);

  // 3. Chat message
  const chatRes = mockRes();
  await handler({
    method: "POST",
    body: { action: "chat", code: room.code, clientId: "guest-1", sender: "Alice", text: "Starting ep 3 now" },
  }, chatRes);
  assert.equal(chatRes.state.status, 200);
  assert.ok(chatRes.state.body.room.messages.some(m => m.text.includes("Starting ep 3 now")));

  // 4. Guest PATCH rejected (403), host PATCH succeeds
  const badPatch = mockRes();
  await handler({
    method: "PATCH",
    body: { code: room.code, clientId: "guest-1", episode: 4 },
  }, badPatch);
  assert.equal(badPatch.state.status, 403);

  const okPatch = mockRes();
  await handler({
    method: "PATCH",
    body: { code: room.code, clientId: "host-1", season: 1, episode: 4, provider: "vidking" },
  }, okPatch);
  assert.equal(okPatch.state.status, 200);
  assert.equal(okPatch.state.body.room.episode, 4);
  assert.equal(okPatch.state.body.room.provider, "vidking");

  // 5. GET room lookup returns updated room
  const getRes = mockRes();
  await handler({ method: "GET", query: { code: room.code } }, getRes);
  assert.equal(getRes.state.status, 200);
  assert.equal(getRes.state.body.room.episode, 4);

  // 6. DELETE closes room
  const delRes = mockRes();
  await handler({ method: "DELETE", query: { code: room.code } }, delRes);
  assert.equal(delRes.state.status, 200);

  const afterDel = mockRes();
  await handler({ method: "GET", query: { code: room.code } }, afterDel);
  assert.equal(afterDel.state.status, 404);
});

test("watch-party API validates missing room or bad requests", async () => {
  const res = mockRes();
  await handler({ method: "POST", body: { action: "create", mediaId: "abc" } }, res);
  assert.equal(res.state.status, 400);

  const joinMissing = mockRes();
  await handler({ method: "POST", body: { action: "join", code: "NOPE99" } }, joinMissing);
  assert.equal(joinMissing.state.status, 404);
});
