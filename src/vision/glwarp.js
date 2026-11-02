// Live prescription lens on the GPU (WebGL2). Every pixel inside a lens is re-sampled from
// where its light really comes from: the same maths as engine/placement.js#warpSource
// (per-eye optical centre, power along/across the cylinder axis, extra depth off-centre).
const VS = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_video;
uniform sampler2D u_mask;   // r = right-eye lens (od), g = left-eye lens (os)
uniform vec2 u_res;         // video size in px
uniform vec2 u_oc[2];       // optical centres in px
uniform vec2 u_axis[2];     // cylinder axis unit vectors (image coords, y down)
uniform vec2 u_pow[2];      // (power along axis, power across axis) in dioptres, already × t
uniform float u_mmpp;       // mm per px
uniform vec2 u_depth;       // (eye depth m, extra depth m per mm off-centre)

vec2 warp(vec2 p, int i) {
  vec2 d = p - u_oc[i];
  float dd = u_depth.x + u_depth.y * length(d) * u_mmpp;
  float ma = 1.0 / (1.0 - dd * u_pow[i].x);
  float mp = 1.0 / (1.0 - dd * u_pow[i].y);
  vec2 ax = u_axis[i];
  vec2 pe = vec2(-ax.y, ax.x);
  return u_oc[i] + (dot(d, ax) / ma) * ax + (dot(d, pe) / mp) * pe;
}

void main() {
  vec2 tc = vec2(v_uv.x, 1.0 - v_uv.y);
  vec2 p = tc * u_res;
  vec4 m = texture(u_mask, tc);
  vec4 c = texture(u_video, tc);
  float wr = m.r * m.a, wg = m.g * m.a; // coverage keeps the lens edge anti-aliased
  if (wr > 0.0) c = mix(c, texture(u_video, clamp(warp(p, 0) / u_res, 0.0, 1.0)), wr);
  if (wg > 0.0) c = mix(c, texture(u_video, clamp(warp(p, 1) / u_res, 0.0, 1.0)), wg);
  outColor = vec4(c.rgb, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function texture(gl, unit) {
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

// Returns null when WebGL2 isn't available (the page then falls back to photo mode).
export function createWarper(canvas) {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: false });
  if (!gl) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const videoTex = texture(gl, 0), maskTex = texture(gl, 1);
  const U = (n) => gl.getUniformLocation(prog, n);
  gl.uniform1i(U("u_video"), 0);
  gl.uniform1i(U("u_mask"), 1);

  // Lens masks are drawn on a small 2D canvas each frame (cheap) and uploaded as a texture.
  const mask = document.createElement("canvas");
  const mctx = mask.getContext("2d");

  return {
    dispose() { gl.getExtension("WEBGL_lose_context")?.loseContext(); },
    render(video, W, H, uniforms, polys) {
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      const k = 0.5;
      if (mask.width !== Math.round(W * k)) { mask.width = Math.round(W * k); mask.height = Math.round(H * k); }
      mctx.clearRect(0, 0, mask.width, mask.height);
      if (polys) {
        for (const [poly, color] of [[polys.od, "#ff0000"], [polys.os, "#00ff00"]]) {
          mctx.fillStyle = color;
          mctx.beginPath();
          poly.forEach(([x, y], i) => (i ? mctx.lineTo(x * k, y * k) : mctx.moveTo(x * k, y * k)));
          mctx.closePath();
          mctx.fill();
        }
      }
      gl.viewport(0, 0, W, H);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
      gl.uniform2f(U("u_res"), W, H);
      const u = uniforms || { od: { oc: [0, 0], axis: [1, 0], fa: 0, fp: 0 }, os: { oc: [0, 0], axis: [1, 0], fa: 0, fp: 0 }, mmPerPx: 0.2, depth: [0.012, 0.00035] };
      gl.uniform2fv(U("u_oc"), [...u.od.oc, ...u.os.oc]);
      gl.uniform2fv(U("u_axis"), [...u.od.axis, ...u.os.axis]);
      gl.uniform2fv(U("u_pow"), [u.od.fa, u.od.fp, u.os.fa, u.os.fp]);
      gl.uniform1f(U("u_mmpp"), u.mmPerPx);
      gl.uniform2fv(U("u_depth"), u.depth);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}
