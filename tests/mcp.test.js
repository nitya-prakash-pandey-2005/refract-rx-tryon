import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("MCP server exposes Rx-aware tools to AI agents", async () => {
  const client = new Client({ name: "refract-test", version: "1.0.0" });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: ["server/mcp.js"] }));
  try {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    assert.deepEqual(names, ["lens_report", "rank_frames", "remake_risk", "sight_by_material"]);
    const r = await client.callTool({ name: "remake_risk", arguments: { sph_right: -7, sph_left: -6.75, cyl: -0.5, frame_id: "juno", bridge: "low", oiliness: 40 } });
    const out = JSON.parse(r.content[0].text);
    assert.ok(out.score >= 0 && out.score <= 100);
    assert.ok(out.parts.fit && out.parts.sight);
    const ranked = JSON.parse((await client.callTool({ name: "rank_frames", arguments: { sph_right: -7, sph_left: -7 } })).content[0].text);
    assert.equal(ranked.length, 12);
  } finally {
    await client.close();
  }
});
