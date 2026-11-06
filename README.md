# London VR

A GTA-like on-foot crime caper for Meta Quest 3 in the browser (WebXR), set in a compressed Bethnal Green, East London. Guy Ritchie tone, light parkour, a 1.5 km hub (about 7½ minutes end to end at a run), a day/night cycle, people and traffic, cops who chase you round corners.

**Play:** open `london.html` in a browser (desktop, phone or Quest Browser). *Play* for desktop/phone, *Enter VR* on a headset.

**Build:** `./build.sh` writes `london.html` from `src/`.

| Path | What |
|---|---|
| `src/engine/` | The renderer, rig and gait, forked from the Stairwell engine |
| `src/london/` | Everything London: look, cast, crowd, street, the hub kit and plan, landmarks, nav, life, clock, sound, jobs, dressing, game, UI |
| `tools/` | Headless capture and playtest bots (`london_run.py`, `london_play.py`, `london_map.py`, `london_cam.py`, `london_shots.py`) |
| `docs/` | `HANDOFF.md` (state and decisions) and `QUALITY.md` (the review bar) |

Fonts in `assets/fonts` are Lilita One, Oswald, Archivo and Anton, all SIL Open Font License, via @fontsource.
