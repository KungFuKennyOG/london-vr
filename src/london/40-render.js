/* =====================================================================================================
   LONDON VR'S LOOK: the Stairwell PS1 renderer (vertex snap, affine warp, nearest texels, 15-bit dither) with
   London's own night palette laid over it in the same full-screen pass, so it costs nothing extra in the headset:
   - sodium night: warm amber highlights, a green-grey shadow floor, mid-tones a touch desaturated;
   - the signature colours keep their punch: chicken-shop red, phone-box red, sodium amber, Met blue, hi-vis;
   - LOOK.freeze 0..1 is the Guy Ritchie freeze-frame: the world drains to ~15% saturation, only red survives.
   The material shader adds screen-door transparency (cut = 2): wet-road light streaks and steamed glass are
   dithered cut-outs, the way the PS1 did see-through, so there is still no blending anywhere.
   ===================================================================================================== */
const FS_LDN=FS.replace('uniform sampler2D map; uniform float uHasMap, uCut;','uniform sampler2D map; uniform float uHasMap, uCut;\nfloat sdBayer(vec2 a){ a = floor(mod(a, 4.0)); float b2 = fract(dot(floor(a * 0.5), vec2(0.5, floor(a.y * 0.5) * 0.75))); float b1 = fract(dot(a, vec2(0.5, a.y * 0.75))); return b2 * 0.25 + b1; }')
  .replace('if(uCut > 0.5 && t.a < 0.5) discard;','if(uCut > 1.5){ if(t.a < sdBayer(gl_FragCoord.xy) * 0.94 + 0.03) discard; } else if(uCut > 0.5 && t.a < 0.5) discard;');
const PFS_LDN=`#version 300 es
precision highp float;
uniform sampler2D tScene; uniform vec2 uRes; uniform float uDither, uGrade, uFreeze, uDay;
in vec2 vUv; out vec4 outColor;
float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
void main(){
  vec2 px = floor(gl_FragCoord.xy);                       /* dither on screen pixels, so it stays fine at any scale */
  vec3 c = clamp(texture(tScene, vUv).rgb, 0.0, 1.0);
  if(uGrade > 0.5){
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), s = (mx - mn) / (mx + 1e-4);
    float red = step(c.g * 1.7, c.r) * step(c.b * 1.5, c.r);
    float amber = step(c.b * 2.0, c.r) * step(c.r * 0.4, c.g) * step(c.g, c.r * 0.95);
    float blue = step(c.r * 1.4, c.b) * step(c.g * 1.02, c.b);
    float hivis = step(c.b * 2.0, c.g) * step(c.r * 0.7, c.g) * step(c.r, c.g * 1.15);
    float sig = smoothstep(0.35, 0.6, s) * clamp(red + amber + blue + hivis, 0.0, 1.0);
    float skin = step(c.b, c.g) * step(c.g, c.r) * smoothstep(0.1, 0.2, s) * (1.0 - smoothstep(0.55, 0.75, s)) * (1.0 - red);
    float sat = mix(mix(mix(0.74, 0.92, skin), 1.12, sig), mix(0.9, 1.0, skin), uDay*.6);
    sat = mix(sat, mix(0.12, 1.0, sig * red), uFreeze);
    vec3 g = mix(vec3(l), c, sat);
    g = mix(g, g * g * (3.0 - 2.0 * g), 0.22 + 0.3 * uFreeze);                       /* contrast, harder on a freeze */
    float sh = 1.0 - smoothstep(0.0, 0.28, l);
    g = g * mix(vec3(1.0), vec3(0.9, 1.0, 0.97), sh*(1.0-uDay)) + vec3(0.012, 0.02, 0.018) * sh * (1.0-uDay);  /* green-grey night floor */
    g *= mix(vec3(1.0), mix(vec3(1.06, 1.0, 0.86), vec3(0.98, 1.0, 1.03), uDay), smoothstep(0.5, 1.0, l));  /* sodium in the highlights at night, a cool London grey by day */
    c = g;
  }
  if(uDither > 0.5){ float L = 31.0; c += (bayer4(px) - 0.5) / L; c = floor(c * L + 0.5) / L; }
  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
MAIN=program(VS,FS_LDN,['position','normal','uv','aRect']);
const POST_LDN=program(PVS,PFS_LDN);
const LOOK={grade:true,freeze:0,time:0};
texMips=true; /* London: mipmapped nearest texels, so brick and paving don't crawl in the distance (VR) */
/* name cards are world objects, so they take the palette like everything else; their art is painted to survive it */
function ungraded(m){ return m; }
/* draw at state.sharp of the screen into the engine's framebuffer, then the London post pass grades, dithers and scales it up */
/* Kenny, before the first Quest test: no wobble (no vertex snap, no affine warp) and the picture at 95% of native.
   At 95% a nearest-texel upscale would double every twentieth row, so the scene buffer is sampled with linear filtering */
function fbSmooth(){ gl.bindTexture(gl.TEXTURE_2D,fbTex); for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR); }
function drawLondon(eye,tgt){
  if(!state.ps1){ gl.bindFramebuffer(gl.FRAMEBUFFER,null); renderLDN(world,eye,tgt,cv.width,cv.height); return; }
  const h=Math.max(1,Math.round(cv.height*state.sharp)),w=Math.max(1,Math.round(cv.width*state.sharp)); ensureFB(w,h); fbSmooth(); gl.bindTexture(gl.TEXTURE_2D,null);
  gl.bindFramebuffer(gl.FRAMEBUFFER,fb); renderLDN(world,eye,tgt,w,h);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,cv.width,cv.height); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); curCull=null; curTex=null;
  gl.useProgram(POST_LDN.p); gl.bindVertexArray(emptyVAO); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,fbTex);
  gl.uniform1i(POST_LDN.loc.tScene,0); gl.uniform2f(POST_LDN.loc.uRes,w,h); gl.uniform1f(POST_LDN.loc.uDither,state.dither?1:0);
  gl.uniform1f(POST_LDN.loc.uGrade,LOOK.grade?1:0); gl.uniform1f(POST_LDN.loc.uFreeze,LOOK.freeze); gl.uniform1f(POST_LDN.loc.uDay,LOOK.day||0);
  gl.drawArrays(gl.TRIANGLES,0,3); gl.bindVertexArray(null); gl.bindTexture(gl.TEXTURE_2D,null); }
