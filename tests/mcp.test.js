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
    assert.deepEqual(names, ["check_any_frame", "lens_report", "rank_frames", "remake_risk", "sight_by_material"]);
    const r = await client.callTool({ name: "remake_risk", arguments: { sph_right: -7, sph_left: -6.75, cyl: -0.5, frame_id: "juno", bridge: "low", oiliness: 40 } });
    const out = JSON.parse(r.content[0].text);
    assert.ok(out.score >= 0 && out.score <= 100);
    assert.ok(out.parts.fit && out.parts.sight);
    const ranked = JSON.parse((await client.callTool({ name: "rank_frames", arguments: { sph_right: -7, sph_left: -7 } })).content[0].text);
    assert.equal(ranked.length, 12);
    const any = JSON.parse((await client.callTool({ name: "check_any_frame", arguments: { sph_right: -6, sph_left: -6, size: "56□18 145", shape: "square", material: "acetate" } })).content[0].text);
    assert.equal(any.size, "56-18-145");
    assert.ok(any.score > 0 && any.edge_mm > 5);
    const bad = await client.callTool({ name: "check_any_frame", arguments: { sph_right: -6, sph_left: -6, size: "huge" } });
    assert.equal(bad.isError, true);
  } finally {
    await client.close();
  }
});
