# London VR: quality bar

Read this at the start of every chat in this Project, before building or polishing anything. `HANDOFF.md` has the status, decisions and score history. Modelled on BAYHEM's `docs/QUALITY.md`.

## The bar
- **References.** Guy Ritchie's *Lock, Stock and Two Smoking Barrels* (1998) and *Snatch* (2000) for look and tone. Hitman (2016 onward: Sapienza, Paris) for density: every few metres there is something to look at, enter, pick up or use.
- **Stairwell's house style, London's own world.** The rendering is Stairwell's PS1 look on purpose (Kenny, Nov 5). Identity comes from everything else: the night palette, the signage, the dress, the street furniture and the Ritchie freeze-frame. Test: a reviewer shown one frame from each, UI cropped, must say "same studio, different game" and name what makes this one London.
- **Done = a fresh reviewer scores it 8/10 or higher** on the anchor's scale. A pass is not finished below 8 unless the plateau rule has been invoked.
- **Calibration anchor: not chosen yet.** Kenny picks it after the first full iteration of the level. Until then, the scale reference is BAYHEM Level 3's final frames (`bayhem-vr/docs/level3/`, scored 6.2/10), and every score is marked *provisional*.

## The look (each rule checkable in a frame)
*Revised by Kenny, Nov 5, 2026: back to the Stairwell engine and style.*
1. **PS1, on purpose.** Vertex snap, affine texture warp, nearest texels and the 15-bit Bayer dither stay on. Rendered at 480 lines on desktop. It is the house style, so it must look deliberate: chunky and readable, never muddy.
2. **A London night palette** in the post pass, under the dither: mid-tones a touch desaturated, a green-grey shadow floor, sodium amber in the highlights.
3. **Signature colours keep their punch:** chicken-shop red, phone-box red, sodium amber, Met blue, hi-vis. Everything else sits in the palette.
4. **No blending anywhere.** See-through things (wet-road light streaks, steam, lamp halos) are screen-door cut-outs (`cut: 2`), the way the PS1 did it.
5. **The freeze-frame intro is the signature** (the Snatch / Lock, Stock name card), done the VR way.
   - The first time you look at a key character up close (within 4 m, 0.6 s), that character holds still for about 3 s and their name card appears at their shoulder, facing you: an Anton name, a role line, and the verdict on a black strip.
   - The rest of the street keeps moving, and the colours stay normal. No world stop and no grey-out (Kenny, Nov 5: "doesn't make much sense").
   - The player's head and hands always keep moving. Code never moves the camera.
   - Each character gets it once.
6. **The UI is London's own:** Anton and Courier Prime. No Stairwell UI fonts (Big Shoulders Display, IBM Plex), card layout or page chrome.
7. **Characters use Stairwell's rig with London clothes:** painted faces, painted garments, London silhouettes (puffers, hoods, hi-vis, Met helmets) and props in hand. No semi-realistic sculpted people (see Recurring hits).

## The review artifact
- **Six frames, 1280×720, UI hidden,** rendered from the built `london.html` by `tools/london_shots.py <outdir>`. The cameras are fixed, so before and after line up:
  1. `01_street_orbit`: establishing shot of the street.
  2. `02_eye_street`: eye level (1.65 m) on the pavement, looking along the shops.
  3. `03_eye_shop_glass`: eye level, 2 m from the Golden Rooster's glass.
  4. `04_cast_lineup`: the cast line-up along the kerb.
  5. `05_freeze_degsy`: Degsy's freeze-frame, seen from eye level after walking up to him, with the world-space card.
  6. `06_face_close`: Degsy's face from 0.6 m, which is VR handshake distance.
- **Plus one identity reference:** `review/london/stairwell_ref.jpg` (the House Calls cast line-up from the Stairwell repo).
- Keep each pass's frames in `review/london/passN/` in the repo. When a level gets real gameplay beats, add frames for them and keep the six above.

## The review loop
1. Build (`./build.sh`) and capture the six frames.
2. Start a **fresh** reviewer agent. Give it only:
   - the frames,
   - the "Bar", "Look" and "Recurring hits" sections of this file,
   - the anchor frames with their score,
   - the Stairwell reference frame,
   - the previous pass's frames, labelled "previous".

   Never give it your conclusions or Kenny's.
3. It returns:
   - a score out of 10 on the anchor's scale,
   - the top 5 problems by impact, each with a concrete fix,
   - anything that got worse since the previous pass,
   - the identity verdict (does it read as its own thing, yes or no, and why).
4. Fix in order of impact, re-capture the same six frames, and review again with a new agent.
5. Record the score, its date and the open issues in `HANDOFF.md`.

**Plateau rule.** If three passes in a row don't move the score by at least 0.5, stop polishing. Say so, and name what would move it: a different approach (an engine feature, authored meshes, a new grade), more scope, or outside help.

## Hard constraints (non-negotiable)
- **Platform:** Meta Quest 3 browser, WebXR. It must hold 72 fps at the heaviest moment, measured in the headset, not estimated.
- **Everything procedural:** no model, texture or audio files. Google Fonts are the only external assets.
- **Engine:** the Stairwell engine (WebGL2, own renderer). London's look lives in `src/london/40-render.js` (it replaces `MAIN` and draws through its own post pass); the shared engine files are never edited for London.
  - At most 8 point lights; lights are set per scene, not added mid-frame.
  - Lighting is per vertex, so any lit surface is cut into cells of 1.2 m or less.
- **VR scale is 1:1:** eye height 1.65 m, doors 2.1 m, kerb 0.12 m, bollards 0.9 m. Anything within 3 m of the player has real depth (a recess, frame or thickness), never a flat picture.
- **Texel density:** at least 60 px/m on surfaces at eye level, and at least 50 px/m on the ground.
- **Comfort:** no player-driven vehicles and no wall-running. Smooth movement, 45° snap turn and a comfort vignette. Never move the player's head from code in VR.
- **Budget:** a solo hobby project with no deadline. Pick scope that one person can finish.

## Recurring hits (check before every review; add to this list)
- **Semi-real procedural people look creepy.** Sculpted, realistically lit heads and bodies land in the uncanny valley however much they're polished. *(Kenny, Nov 5: the three.js rebuild was "so ugly", even at a reviewer's 5.0/10)*
- **The Stairwell engine without its PS1 pass looks bare.** Per-vertex lighting and painted textures need the snap, dither and low resolution to read as a style. *(Kenny, Nov 5: "so ugly")*
- **Reads as a Stairwell level, not London:** the same lighting palette, empty streets, or Stairwell's UI kit. The PS1 rendering is shared on purpose; the world must not be.
- **A freeze-frame that only works on a monitor:** camera cuts, zooms or a 2D overlay card. In VR the card lives in the world. *(Kenny, Nov 5)*
- **Effects that need explaining:** if Kenny asks "why is it doing that?", it doesn't read. The grey-everything-but-red freeze was one. *(Kenny, Nov 5)*
- **Faces at 0.6 m:** muddy paint, eyes lost in shadow, a neck that looks too long or too thick. Check `06_face_close`.
- **Flat pictures at eye level:** shop interiors and signs painted on planes. *(fixed in the VR pass; keep it fixed)*
- **One-off art tiled:** a sign or interior texture repeated across its panel. Use one stretch (`whole: true`).
- **Text that doesn't fit:** sign, menu and card text must be measured and shrunk to fit its panel.
- **Rain as flat sheets:** it reads as panes of glass in stereo. Use a volume of crossed streaks only.
- **Steam or halos as solid blobs:** screen-door cut-outs need a soft alpha falloff and should stay small, or they read as ghosts.
- **Backlit characters:** cast members silhouetted against lit shopfronts. Every key character needs a front fill at their spot.
- **Bad freeze framing:** the freeze-frame camera must frame the subject's face at about 1.5 m, unobstructed, with the card not covering the face.
- **Block people on vehicles:** a moped rider made of boxes. Anyone riding or driving is a rig person, crowd-baked to one draw, or kept out of sight behind tinted glass. *(Kenny, Nov 6: "the guy riding motorcycle is a blocky dude")*
- **Cars as flat-coloured shapes:** a vehicle needs a painted texture (shut lines, handles, lamps, grille, plates, glass with a streak) on a silhouette with tumblehome and a rounded nose, or it reads as a toy. *(Kenny, Nov 6: "the cars still look like shit")*
- **Block hands and stiff poses** read badly up close. Check `06_face_close` for hands, props and how arms meet the body.
- **Too clean** *(from BAYHEM)*: no grime at wall bases, no wear on kerbs and doors, no litter.
- **Repetition** *(from BAYHEM)*: identical doors, windows or shopfronts in a row. Vary them with seeded colour and detail.
- **Dead ends:** a street that ends in a flat wall. There must always be a vista: the arch, a skyline, a light beyond.

## Pre-merge checklist
- [ ] `./build.sh` passes the syntax check for every page.
- [ ] `london.html` boots in headless Chromium with no page errors (`tools/london_shots.py` prints them).
- [ ] The six frames were captured, a fresh reviewer scored them, and the score and open issues are in `HANDOFF.md`.
- [ ] Any change to shared engine files (`src/10-engine.js`, `src/houses/*`) is checked against the other Stairwell pages: re-shoot one frame of `index.html` and `houses.html`.
- [ ] The identity check passes against `stairwell_ref.jpg` ("same studio, different game", and why it's London).
- [ ] Anything that still needs a headset check (fps at the heaviest moment, scale, comfort) is listed in `HANDOFF.md`.
