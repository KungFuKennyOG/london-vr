# London VR: fresh review (round 6), Nov 6, 2026

**Overall: 5.7 / 10 (provisional, on the BAYHEM Level 3 = 6.2 scale)**

In daylight, Bethnal Green Road at eye level is the best thing in the game. Its trades, people, buses and cabs feel like that road, and it already plays at about a 6.5. Three things pull the whole game below the anchor:

1. **Headset distance.** At 0.6–1.5 m almost every built surface smears. Facades are painted at 24 px/m (`PXM=24`, `48b-hub-kit.js:49`), which is 40% of the bar's 60 px/m.
2. **The landmarks are generic boxes.** Arnold Circus, St John's and Weavers Fields could be anywhere.
3. **The view from above shows an island.** The hub sits in grey haze, ringed by a bright band, with cut-out towers floating over it.

Kenny's no-wobble and 95% sharpness settings are not marked down.

What I looked at: 15 standard frames, re-shot on the current build because the earlier set was incomplete and predated the 00:52 `london.html`. Also 26 close-ups and probes, including 2 HUD frames, the Arnold Circus ring and the BGR west vista. All were rendered in headless SwiftShader at 1280×720. I did not judge fps, comfort or hand-climbing in a headset. I did not trigger the freeze-frame. Two attempts to find a dog walker near Bethnal Green Road, at 08:00 and 17:30, found none.

---

## 1. What makes Bethnal Green feel like Bethnal Green (the reference)

1. **Bethnal Green Road as a working high street.** Two- and three-storey mid-Victorian terraces with shops below and flats above, and grey concrete paving.
   - Trades: chicken shops, phone repair, money transfer, £1 shops, Bangladeshi grocers and sweet centres, bookies, a launderette and Iceland.
   - Pavement market Mon–Sat between E. Pellicci and the Top Ten newsagent: rails of puffers, tables of slippers and scarves, trolleys and luggage at the east end, the traders' electric-blue bags. ([Tower Hamlets Slice photo essay](https://towerhamletsslice.co.uk/bethnalgreen/market-traders-shoppers-photoessay/))
2. **Named institutions on the road.**
   - E. Pellicci: Grade II, chrome and yellow vitrolite front.
   - G. Kelly: pie, mash and liquor.
   - Old pubs: the Old George, Star of Bethnal Green. ([Time Out](https://timeout.com/london/blog/16-reasons-to-go-to-bethnal-green-road-e2-021717))
3. **London stock-brick terraces.** Yellow-grey brick sooted dark, sash windows with stucco or gauged lintels, and parapets hiding butterfly roofs. Chimney stacks with clay pots on every party wall. Front doors in strong colours with fanlights, and small front areas with railings or low walls and wheelie bins.
4. **Post-war council estates jammed in among the terraces.**
   - Deck-access blocks, LCC walk-ups, and 1960s towers with balconies.
   - Keeling House, Lasdun's 16-storey cluster block, sits "out of keeping with the surrounding Victorian terraces". ([Municipal Dreams](https://municipaldreams.substack.com/p/keeling-house-bethnal-green-we-loved))
   - Blue council signage and "NO BALL GAMES".
5. **The Boundary Estate and Arnold Circus.**
   - The world's first council estate: red-brick Arts & Crafts mansion blocks with "dignified curves and embellishments", banded brick, tall chimneys and gables.
   - Laid out in an irregular spiral of seven streets radiating from Arnold Circus.
   - The circus is a raised mound, built from the slum rubble, with a bandstand (c.1903) under big plane trees, reached by steps. ([Londonist](https://londonist.com/2015/02/worlds-oldest-council-estate-at-125-then-and-now))
6. **Columbia Road.** A narrow street of small Victorian shopfronts. The Sunday flower market runs 8–2: buckets of cut flowers, barrows, traders shouting, and the Birdcage pub at the end. ([Wikiwand](https://www.wikiwand.com/en/Columbia_Road_market))
7. **The railway viaducts and arches.** The Great Eastern main line into Liverpool Street is brick, with overhead wires and lots of trains. The arches below hold garages, MOT bays, bakeries, cafés and bars behind roller shutters, and spill out into yards.
   - Vallance Road's tunnel garage plays 80s radio. Three Colts Lane has Breid bakery and the Arches Café. ([Tower Hamlets Slice](https://towerhamletsslice.co.uk/?p=52064))
8. **Cheshire Street.** Vintage shops and bric-a-brac stalls on market Sundays. The Repton Boxing Club, London's oldest boxing gym, in the old bath house. It runs alongside the Braithwaite Viaduct and the Bishopsgate goods yard. ([Wikipedia](https://en.wikipedia.org/wiki/Cheshire_Street))
9. **Weavers Fields.** A 6 ha post-war park off Vallance Road and Derbyshire Street: open grass sports pitches, a hedged and tree-lined east–west path, a playground, and a scrubby dog-walking edge. ([London Gardens Trust](https://londongardenstrust.org/site-record?ID=THM069))
10. **St John on Bethnal Green.** Soane, 1826–28, Grade I. Stock brick and stone, with a tall, odd stepped tower and a clock, crowned by a cupola. It stands right on the junction of Cambridge Heath Road, Roman Road and Bethnal Green Road, next to the Tube, Bethnal Green Gardens and the Museum of Childhood. ([Wikipedia](https://en.wikipedia.org/wiki/St_John_on_Bethnal_Green))
11. **The gasholders** at Marian Place by the canal: the only surviving side-by-side pair in London, with lattice guide frames. ([Love Bethnal Green](https://www.lovebethnalgreen.com/marian-place-gasholders-part-two-history-significance/), [Historic England](https://historicengland.org.uk/content/docs/planning/marian-place-gasholders-case-study))
12. **The City looming to the west.** From Bethnal Green Road looking west, and from any roof, the eastern cluster stacks up 2 km away: 22 Bishopsgate, Heron, the Gherkin, the Cheesegrater, the Scalpel. The Shard sits behind to the south-west and Canary Wharf to the south-east.
13. **People and street life.**
    - The UK's largest Bangladeshi community: hijabs and abayas, men in topi and kurta.
    - Old East End nans with tartan trolleys, builders in hi-vis, creatives, moped delivery riders, and black cabs and red double-deckers (8, 388, D3).
14. **Street furniture.** Black bollards, Tower Hamlets street plates with "E2", green BT cabinets, red pillar boxes, bus shelters with countdowns, Santander bike docks, and the LTN planters and bollards on Old Bethnal Green Road.
15. **The light.** Flat, wet, grey London daylight. At night, sodium amber (LED now, but sodium is right for the Ritchie tone) on wet tarmac, with lit takeaway fronts.

---

## 2. Sub-scores (provisional)

| Area | Score | Evidence |
|---|---|---|
| Street-level density & dressing | **6.5** | Bethnal Green Road is properly dressed: fruit stalls, awnings, pillar boxes, bins, shoppers with bags, the nan and her trolley (`15_bgr_long_day`, `c15_dog_walker`, `c23_bgr_west_vista_day`). Residential streets are good but thinner (`12_wilmot_day`, `03_terrace_day`). Open spaces are empty (`05_weavers_dusk`, `c07b_roof_edge_tower`). There is no litter, and the slab grime repeats on every slab (`c15b_dog_morning`). |
| Place fidelity to real Bethnal Green | **5.5** | The trades and the people are spot on: TASTE OF SYLHET, PADMA MONEY TRANSFER, EVERYTHING £1, WILMOT LAUNDERETTE, hijabs, a kufi and beard, the TX cab, the red bus (`c14_kerb_traffic_day`, `c03_person_day`, `c17_person_night`). Satellite dishes and coloured doors on the terraces ring true (`12_wilmot_day`). The landmarks are generic: the Boundary Estate is plain boxes (`07_arnold_circus`, `c11_boundary_brick`), St John's is a white temple in a lawn (`09_church_day`), Weavers Fields is a black field (`05`). The City barely reads from the street (`c23`, `15`). |
| Architecture up close | **4.0** | `c16_brick_window_oldbg`: brick smears and the window is a black hole. `c13b_terrace_door_day`: doors are soft paintings. `c13_terrace_door_day`: 30 m of drip-streaked cream wall. `c04_scaffold_board`: brick blurs at 0.5 m. |
| People | **5.5** | Faces read fine at 2–4 m, and the cultural mix is right. At 0.8 m (`c14`) the shoulders are cubes and the hands are orange mittens gripping a phone, and the hijab is a hood with two flaps. The pose is stiff. |
| Vehicles | **6.5** | The kit works at 3–10 m: van livery "D. MORRIS BUILDING SERVICES", TX cab grille and lamps, Battenburg estate, bus (`08_decks`, `09_church_day`, `c23`, `15`). Up close the mirrors are red cubes and the glass is a blurry streak (`c05_car_side`), and the wheels are octagons (`c06_car_front`). |
| Lighting & day/night | **6.0** | The night high street is atmospheric: sodium, wet streaks, rain, lit takeaways (`02_highstreet_night`, `c17_person_night`). The lit church windows at night are lovely (`11_church_night`). Day is a correct London grey. Dusk is purple and muddy (`05`, `14`). The estate and the park go nearly black (`07`, `05`). The start street's left block is a black void with floating windows (`01_start_night`). |
| Skyline & distance | **3.5** | `13_church_tower_view`, `c09b_skyline_tower_west`, `c19_skyline_tower_sw`: the hub ends in a grey floor, then a bright white horizon band, then cut-out towers floating above it with dotted-line artefacts (also `c08_skyline_viaduct`). There is no roofscape between 150 m and 2 km. The landmark bearings in `SKYL` are right; the presentation is what fails. |
| Verticality / parkour readability | **6.0** | Scaffolds with TO LET boards, ladders, fire escapes, garage roofs and viaduct stairs are all visible from the street (`c04`, `c20_gable_scaffold_day`, `12`). From above, the roof layer is bare flat grey with almost no chimneys, stacks or tanks (`c09b`, `c19`). The scaffold board is a plain orange slab. Vault and climb failures are being reworked and are not scored here. |
| **Up-close (VR distance) quality** | **3.5** | Shop interiors are coloured dots on a beige wall with a grey box counter (`c01_shopglass_day`, `c18_shopglass_night`). The pub at 1.1 m is a smeared bar-back painting (`c02_pub_night`). The arch shutter is mush (`c12_arch_night`). The boxing-club arch is a flat lit picture (`04_boxing_club`). Columbia Road's bookshop holds up best: real glazing bars and readable spines (`c10_columbia_shop`). |
| UI / objective clarity | **7.0** | Anton and Courier Prime, a clear one-line objective, and an arrow that says "DEGSY · behind you 145 m" (`u01_hud_start`, `u02_hud_street_night`). The start card is strong and in voice. |
| Fun / aliveness | **6.0** | Fifty locals, traffic with buses and cabs, coppers on beats, jobs and stashes: it feels inhabited by day. The parks and estates are dead, and dogs are rare. Side quests are mid-rework. |

**Identity check:** yes, "same studio, different game". The London-ness comes from the signage, the trades, the people, the double-decker and the cab. It does not come from the architecture or the landmarks.

---

## 3. Ranked fixes to reach 8/10

1. **Raise eye-level texel density, and give doors and windows real depth.** Expected gain: about +0.6. This is the biggest gain available.
   - **What's wrong:** facades and house fronts paint at `PXM=24` px/m (`48b-hub-kit.js:49`; `houseFront`, `ARCHT` and `churchFacade` use it too). A whole door is about 24 px wide. At 1 m in a headset that is soft mush (`c13b`, `c16`, `c12`, `c04`, `c13`). It breaks the QUALITY bar of 60 px/m at eye level.
   - **Why it matters:** in VR Kenny will put his face against a door. Bethnal Green is a place of front doors, letterboxes and sash windows.
   - **Fix:**
     - Paint the ground-floor band (0–3.5 m: house fronts, shopfronts, arch fronts, pub fronts) at 64–80 px/m in its own texture. Keep 24 px/m above the first floor, where nobody gets close.
     - Model the door as geometry: a 12 cm reveal, raised panels as 1–2 cm insets, a letterbox and knocker as boxes, a door number, a stone step and a fanlight with glazing bars.
     - Windows: a 10–12 cm reveal, sash frames as thin boxes, glass that samples a vertical sky gradient and cut-out reflection, and nets or curtains behind. No more black voids.

2. **Kill the island look: build a mid-ground roofscape and bring the City in.** Expected gain: about +0.5.
   - **What's wrong:** from any height (`13`, `c09b`, `c19`, `c07b`) the hub stops at about 140 m and becomes a grey floor. A bright horizon line follows, then flat tower cut-outs float above a pale band with dashed-line artefacts (`c08`, `c09b`). From the street, the City cluster is a ghost (`c23`, `15`).
   - **Why it matters:** the City looming over East London is the defining vista, and the rooftops are the parkour layer.
   - **Fix:**
     - Paint a dense, low roofscape band on the sky ring: slate pitches, chimney stacks with pots, the odd council tower and church spire. Make it continuous with no gaps, and darker than the sky.
     - Lower the sky-ring horizon so the band sits under the tower bases. Remove the dotted lines.
     - Thin the day haze toward the west so 22 Bishopsgate, the Gherkin, Heron and the Cheesegrater stand clearly at the end of Bethnal Green Road at street level.
     - Put Keeling House and two or three 1960s slab blocks at real bearings in the 300–800 m ring.

3. **Rebuild the Boundary Estate and Arnold Circus.** Expected gain: about +0.4 for place fidelity.
   - **What's wrong:** uniform red boxes with grid windows on a paved plaza (`07`, `c11`). The mound is a three-tier green cake with a mushroom bandstand (`c21`), and the mound top is smeared grass (`c22`).
   - **Why it matters:** this is the world's first council estate and the most photographed place in the hub.
   - **Fix:**
     - Blocks five storeys tall: red brick with buff or orange banding every floor, steep slate roofs with tall chimney stacks, Dutch gables at the ends, arched entrance doorways with names in stone, and each block different.
     - Blocks curved to follow the circus.
     - Seven proper radiating streets with kerbs, parked cars and plane trees, instead of a paved plaza.
     - The mound as a single grassy dome with stone steps and railings.
     - An octagonal Victorian bandstand: cast-iron columns, an ogee or domed roof and a finial.
     - Big plane trees ringing the mound.

4. **Make St John on Bethnal Green look like Soane's church and put it back on the junction.** Expected gain: about +0.25.
   - **What's wrong:** a white Greek-temple box streaked with vertical drip texture, sitting in a big empty lawn (`09`, `11`, `c07b`). From the street the tower top is cut off, and from up the tower it is a flat cream slab.
   - **Why it matters:** St John's is the landmark at the hub's east end and the obvious climb.
   - **Fix:**
     - Stock brick with Portland-stone dressings.
     - The real tower silhouette: square stages stepping in, clock faces, and the cupola with corner vases. It should read from anywhere in the hub.
     - Shrink the lawn to a railed churchyard with plane trees, with the busy junction, the Tube entrance and Museum Gardens tight around it.
     - Replace the drip-streak wall texture.

5. **Shop and pub interiors that hold up at 1 m.** Expected gain: about +0.3 for close-ups.
   - **What's wrong:** the sweet centre is coloured dots on a beige wall with a grey box counter (`c01`, `c18`). The pub is a blurred painting behind a pilaster (`c02`). There is no sense of glass anywhere.
   - **Fix:**
     - Shelving as geometry: two or three shelf boards with box and jar blocks at 64+ px/m.
     - Lit drinks fridges.
     - A counter with a front panel, a till and a scratch-card stand.
     - A glass pane as a cut-out reflection layer with a door-hours sticker.
     - Pubs: glazed-tile pilasters, frosted or etched lower glass, gilded fascia letters, hanging baskets, and a real bar counter 3 m back.
     - Do the named fronts properly: Pellicci's yellow vitrolite, a G. Kelly pie-and-mash with green tiles. The kit has a PELLICCI sign; give it its real front.

6. **Arches with real depth.** Expected gain: about +0.2.
   - **What's wrong:** the boxing club is a glowing flat picture inside the arch: ring ropes and punch bags painted on a card (`04`). The neighbouring shutter is low-res blur at 1.5 m (`c12`). This breaks QUALITY's rule that anything within 3 m has real depth.
   - **Fix:**
     - Every open arch is a 4–6 m barrel-vault room.
     - Boxing club: the ring as geometry, bags hanging, a bench and posters.
     - Garage arch: a car on a ramp, tyres and a radio.
     - Shutters: corrugation as geometry ribs or a 64 px/m texture, a padlock and graffiti.
     - Dress the yard spill-outs: picnic benches, fairy lights.

7. **People at handshake distance.** Expected gain: about +0.2.
   - **What's wrong:** at 0.8 m (`c14`) the shoulders are cubes and the hands are blocky mittens. The hijab is a hood with two flaps either side of the face. The arms join the torso at hard right angles (`c03`, `15`).
   - **Fix:**
     - Lathe shoulder caps and a tapered upper arm.
     - Three-block fingers posed as a fist, a phone grip or a bag grip.
     - The hijab as one draped shell that frames the face and falls over the shoulders.
     - Puffer and abaya hems with flare.
   - These match the Recurring hits list. This is still the Stairwell rig, not sculpting.

8. **Fill the open spaces.** Expected gain: about +0.2.
   - **What's wrong:** Weavers Fields at dusk is a black field behind railings (`05`). The grass around St John's and the estates is huge and featureless (`c07b`, `c09b`).
   - **Fix:**
     - Weavers Fields: marked football pitches with goals, a caged MUGA, a playground, the hedged and tree-lined east–west path with lamps and benches, and the circular raised bed.
     - People there by schedule: dog walkers, five-a-side, joggers, teenagers on the benches.
     - Path lamps at night, so it is a dark park and not a void.
     - Cut every other big lawn down by half with hedges, parked cars, bin stores or garages.

9. **The first frame of the game.** Expected gain: about +0.15, for first impressions.
   - **What's wrong:** in `01_start_night` the left building is a black void with a floating window grid. The guard railings either side of the zebra are flat planes with blurry bars. The Belisha globe is a yellow cylinder. The street is empty.
   - **Fix:**
     - Sodium spill on that facade.
     - Railings as bar geometry: the Weavers Fields railing in `05` already does it.
     - A round amber Belisha globe.
     - One or two people and a passing car or night bus in the first 5 seconds.

10. **The viaduct deck as a railway, not a dirt road.**
    - **What's wrong:** smooth brown ground with four rails and nothing else (`14`, `c08`).
    - **Fix:** sleepers and ballast at 50 px/m, OHLE gantries every 50–60 m (the iconic silhouette of the Liverpool Street line), cable troughs, signal heads, and lineside palisade fencing. It is a traversal route, so it is cover too.

11. **Terrace-street dressing.**
    - **What's wrong:**
      - There are no front-area railings or walls, and wheelie bins are rare (`03`, `12`).
      - Parked cars are nearly all white or silver: five in `12_wilmot_day`.
      - Satellite dishes read as white blobs (`c20`).
      - Hereford Street has a 30 m blank cream wall (`03`, `c13`).
    - **Fix:**
      - Seed a front-yard kit per house: low wall or railings, bins, a recycling box, a plant or a bike under a cover.
      - Widen the car paint mix toward London's black, grey, blue and red.
      - Make dishes as discs on arms.
      - Turn the blank wall into a dressed side: a ghost sign, a mural, a bin store, fly-posters.
      - Add Tower Hamlets street plates with "E2", LTN planters on Old Bethnal Green Road, and cycle hangars.

12. **The Bethnal Green Road market.**
    - **What's wrong:** there is a fruit stall and awnings, but not the pavement market that defines the road Mon–Sat (`15`, `c15`).
    - **Fix:** a run of stalls between Pellicci and the east end: rails of puffers and jumpers, tables of slippers, hats and rugs, trolleys and suitcases at the east end, and electric-blue bags. Traders call out. Close it by evening. It is cheap, it adds parkour (stall roofs) and it is pure Bethnal Green.

13. **Grime and repetition.**
    - **What's wrong:** the same dark stain sits on every paving slab (`c15b`). Cream walls are combed with identical drips (`c13`, `09`). There is no litter anywhere in the day frames.
    - **Fix:** seed stains per slab, add chewing-gum dots, crushed cans, chicken boxes and leaflets near shops, black mould at wall bases, and pigeon mess under ledges.

14. **Vehicle close-ups.**
    - **What's wrong:** mirrors are cubes, glass is a blurry grey streak at 0.7 m (`c05`), and wheels are octagons (`c06`).
    - **Fix:** 12–16-sided wheels, wedge mirrors on a stalk, glass at 64 px/m with a sharp reflection streak, and readable plates.

15. **Tower blocks with structure.**
    - **What's wrong:** the Bramley towers are smooth grid boxes (`06`).
    - **Fix:** balconies, or recessed balcony strips with washing and dishes, an expressed stair or lift core, a concrete frame grid and a blank gable with the block name. Make one tower a Keeling-style cluster block as a landmark.

**Not top fixes, since they are being reworked:** vault and climb failures, civilians walking through solids, and side quests. **Headset checks still pending:** fps at the heaviest view (Bethnal Green Road day with the bus and crowd), texture memory after fix 1 (budget the ground-floor band in one or two atlases), and comfort.

**Where 8 comes from:**
- Fixes 1, 2 and 5 take the close-ups and skyline from about 3.5 to 6.
- Fixes 3, 4, 6 and 8 make the landmarks and open spaces Bethnal Green and not anywhere.
- Fix 7 makes the people stand up to a handshake.
- With those done, the street level is good enough that the whole game should land around 7.5–8.

---

## 4. The six most telling frames

1. `/tmp/claude-0/review6/close/c13b_terrace_door_day.jpg`: front doors at 1.2 m are soft paintings (24 px/m).
2. `/tmp/claude-0/review6/close/c09b_skyline_tower_west.jpg`: the island look, with a grey floor, white band, floating City cut-outs and flat bare roofs.
3. `/tmp/claude-0/review6/close/c21_arnold_ring_day.jpg`: Arnold Circus as generic boxes around a tiered cake and a mushroom bandstand.
4. `/tmp/claude-0/review6/close/c01_shopglass_day.jpg`: the shop interior at headset distance, coloured dots and a grey box counter.
5. `/tmp/claude-0/review6/close/c14_kerb_traffic_day.jpg`: people at 0.8 m, with mitten hands and cube shoulders, but the Bethnal Green Road shopfronts behind them are excellent.
6. `/tmp/claude-0/review6/std/15_bgr_long_day.jpg`: the game at its best, a busy day on Bethnal Green Road with a red bus, the right trades and the right people.

All frames: `/tmp/claude-0/review6/std/` (15) and `/tmp/claude-0/review6/close/` (26: c01–c23 plus b-reshoots, u01–u02 HUD).
