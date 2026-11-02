import { test } from "node:test";
import assert from "node:assert/strict";
import { imageMime } from "../server/youcam.js";

test("image type comes from the bytes when YouCam sends a generic content type", () => {
  assert.equal(imageMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]), "binary/octet-stream"), "image/png");
  assert.equal(imageMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "application/octet-stream"), "image/jpeg");
  assert.equal(imageMime(Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), null), "image/webp");
  assert.equal(imageMime(Buffer.from([1, 2, 3]), "image/jpeg"), "image/jpeg");
});
