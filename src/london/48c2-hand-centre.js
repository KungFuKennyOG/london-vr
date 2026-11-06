/* ==========================================================================================================
   HAND-WRITTEN FRONTAGES, CENTRE: Gosset Street to Florida Street (x streets with their middle between -100 and 105,
   and Wilmot Street, Pollard Row, Florida Street). Bethnal Green Road either side of the start, Cheshire Street's
   middle, the long Buckhurst Street terraces and Three Colts Lane's garages and workshops facing the arches, and the
   streets of little terraces between. Items run west to east (x streets) or north to south (z streets). Names made up.
   ========================================================================================================== */
var HAND=HAND||{};

/* ---------------- BETHNAL GREEN ROAD, either side of the start ---------------- */
HAND['bgr:n:-61']=[
  hS('offy','GOSSET FOOD & WINE',{w:6,disp:'news',brick:'stock'}), hS('kebab','SULTAN GRILL',{w:5.5,brick:'stock'}), hS('agent','ALDGATE & EAST',{w:5,brick:'yellow'}),
  hS('cafe','THE GREEN CAFE',{w:5.5,disp:'chairs',aw:'#1e3a2a/#e8e4d8',brick:'yellow'}), hS('bookie','STAR BETS',{w:6,brick:'red'}), hS('tolet',null,{w:5,was:'BARGAIN BOOZE & NEWS',brick:'red',scaf:true}),
  hS('sweets','DHAKA SWEETS & SAVOURIES',{w:6,aw:'#e8b020',brick:'stock'}), hG('alley',1.6), hS('phone','PHONE CLINIC',{w:4.5,brick:'stock'}), hS('vape','VAPOUR ROOM',{w:4.5,brick:'soot'}),
  hS('money','PADMA MONEY TRANSFER',{w:5,brick:'soot'}), hS('pound','EVERYTHING £1',{w:6,disp:'bric',brick:'yellow'}), hS('laundry','WILMOT LAUNDERETTE',{w:6,brick:'yellow'}),
];
HAND['bgr:s:-61']=[
  hP('THE GEORGE IV','oxblood',{w:8.5,brick:'red'}), hS('chicken','CHICKEN SPOT',{w:5,brick:'stock'}), hS('grocer','PADMA SUPERSTORE',{w:8,disp:'veg',aw:'#1e5a2a/#e8e4d8',brick:'stock'}),
  hS('gold','BG GOLD & PAWN',{w:5,brick:'stock'}), hS('barber','KINGSLAND BARBERS',{w:5,brick:'yellow'}), hS('chemist','GREEN CROSS PHARMACY',{w:6.5,brick:'yellow'}),
  hS('curry','TASTE OF SYLHET',{w:6.5,brick:'red',sub:'BALTI · BIRYANI · TAKEAWAY'}), hS('nails','GLAM NAILS',{w:4.5,brick:'paintPk'}), hS('agent','MARSH & CO',{w:5,brick:'stock'}),
  hS('kebab','DIYAR KEBAB',{w:5,brick:'stock'}), hS('offy','24 HOUR FOOD & WINE',{w:5.5,disp:'news',brick:'stock'}),
];
HAND['bgr:n:73']=[
  hS('cashcarry','POLLARD CASH & CARRY',{w:9,disp:'veg',aw:'#c81e1e/#f0ece0',brick:'soot'}), hS('chicken','KFRY CHICKEN',{w:5,brick:'stock'}), hS('travel','SYLHET AIR TRAVEL',{w:5,brick:'stock'}),
  hS('bakery','EUROPA BAKERY',{w:5.5,disp:'board',brick:'yellow'}), hS('tolet',null,{w:5,was:'TOP CUTS',brick:'yellow'}), hS('butcher','BISMILLAH HALAL BUTCHERS',{w:6,brick:'red'}),
  hS('phone','iFIX E2',{w:4.5,brick:'red'}), hS('charity','EAST END HOSPICE SHOP',{w:6,brick:'stock'}), hP('THE PRINCESS ALICE','navy',{w:8,brick:'stock'}),
];

/* ---------------- CHESHIRE STREET (middle) ---------------- */
HAND['cheshire:n:-61']=[
  hS('vintage','THE JUMBLE ROOM',{disp:'rail',brick:'stock'}), hS('records','TWELVE INCH',{brick:'stock'}), hW('B. NATHAN','workshop',{w:9,sub:'UPHOLSTERY · CANE · RUSH',doors:'#5a1e30',brick:'soot'}),
  hS('tolet',null,{was:'HARRY\'S BARGAINS',brick:'soot'}), hS('vintage','MOTH & MOTHBALL',{disp:'rail',brick:'yellow'}), hG('alley',1.6), hS('gallery','BETHNAL PROJECT SPACE',{brick:'paintW'}),
  hS('cafe','DOUBLE SHOT',{disp:'chairs',brick:'yellow'}), hS('antiques','JUNK & DISORDERLY',{disp:'bric',brick:'red'}), hS('vintage','DENIM & DUST',{disp:'rail',brick:'red'}), hS('homeware','THE RUG ROOM',{brick:'stock'}),
];
HAND['cheshire:n:7']=[
  hS('records','BACK TO MONO',{brick:'soot'}), hW('CHESHIRE ST CYCLES','workshop',{w:8,open:true,sub:'REPAIRS · FRAMES · PARTS',bg:'#2a4a6a',brick:'soot'}), hS('vintage','DEAD MEN\'S SHOES',{disp:'rail',brick:'stock'}),
  hS('tolet',null,{was:'CHESHIRE CAFE',brick:'stock'}), hG('gate',3,{c:'#1a1a1c'}), hS('vintage','THE LOFT',{disp:'rail',brick:'stock'}), hS('cafe','THE ROLLING PIN',{disp:'board',brick:'yellow'}),
];
HAND['cheshire:n:73']=[
  hP('THE GREEN MAN','black',{w:8,brick:'stock'}), hS('vintage','REWIND VINTAGE',{disp:'rail',brick:'stock'}), hS('records','SEVENTY EIGHT',{brick:'stock'}),
  hW('KESSLER & CO','workshop',{w:9,sub:'SHEET METAL · FABRICATION',brick:'soot'}), hS('antiques','HOUSE CLEARANCE E2',{disp:'bric',brick:'soot'}), hS('gallery','SPACE 77',{brick:'paintW'}),
  hS('vintage','MOD & ROCKER',{disp:'rail',brick:'red'}), hS('cafe','THE YARD CAFE',{disp:'chairs',brick:'red'}),
];

/* ---------------- HEREFORD STREET (middle) ---------------- */
HAND['hereford:n:-61']=[ ...hT('stock',2,'kgrn'), hG('alley',1.4,{plank:true}), ...hT('stock',2,'bk'), hI('1–9 ALLEN HOUSE','estbrick',3,12), ...hT('red',2,'gnk'), hS('offy','HEREFORD STORES',{w:5.5,disp:'news'}) ];
HAND['hereford:s:-61']=[ hP('THE BLACK HORSE','black',{w:8}), ...hT('yellow',2,'krnygwb',{scaf:4}), hG('gate',3), ...hT('yellow',3,'GKRN') ];
HAND['hereford:n:7']=[ ...hT('soot',2,'kgrny'), hG('alley',1.4), ...hT('stock',2,'wbkr') ];
HAND['hereford:s:7']=[ ...hT('stock',2,'rkgn',{hv:'cottage'}), ...hT('paintW',2,'k'), ...hT('stock',2,'ygr',{hv:'cottage'}), hG('garage',5) ];
HAND['hereford:s:73']=[ hS('offy','KIRKWALL FOOD & WINE',{w:6,disp:'news'}), ...hT('red',3,'KRNGB'), hG('alley',1.5), ...hT('red',2,'wkrg') ];

/* ---------------- DERBYSHIRE STREET (east end) ---------------- */
HAND['derby:s:-61']=[ ...hT('yellow',2,'kgrnwy',{hv:'cottage'}), hG('alley',1.4,{plank:true}), ...hT('yellow',2,'bkrtg',{hv:'cottage'}), hP('THE FIVE BELLS','green',{w:8}) ];

/* ---------------- OLD BETHNAL GREEN ROAD (south side, middle) ---------------- */
HAND['oldbg:s:7']=[ hS('offy','OLD BG MINI MARKET',{w:6,disp:'news'}), ...hT('stock',3,'KRGNB'), hG('alley',1.4), ...hT('stock',2,'kyr') ];
HAND['oldbg:s:73']=[ ...hT('yellow',2,'kgrnwy'), hG('gate',3), ...hT('yellow',2,'bk'), hP('THE BUTCHER\'S ARMS','oxblood',{w:8}) ];

/* ---------------- TEESDALE STREET, KIRKWALL PLACE ---------------- */
HAND['teesdale:n:73']=[ ...hT('stock',2,'krgnwyb',{hv:'cottage'}), hG('alley',1.4,{plank:true}), ...hT('stock',2,'tkrg',{hv:'cottage'}) ];
HAND['teesdale:s:73']=[ ...hT('red',2,'gkrny'), hI('1–8 TEESDALE HOUSE','lbuff',3,12), ...hT('red',2,'wkr'), hS('cafe','TEESDALE CAFE',{w:5.5,disp:'chairs'}) ];
HAND['kirkwall:n:73']=[ ...hT('yellow',2,'kgrnyw'), hG('alley',1.4), ...hT('yellow',2,'brkt') ];
HAND['kirkwall:s:73']=[ hS('offy','KIRKWALL STORES',{w:5.5}), ...hT('stock',3,'RKGN',{scaf:2}), hG('gate',3), ...hT('stock',2,'kwygr') ];

/* ---------------- WILMOT STREET: a long west side of terraces, with infill and a pub ---------------- */
HAND['wilmot:e:-115']=[
  ...hT('stock',2,'kgrnwyb'), hG('alley',1.4,{plank:true}), ...hT('stock',2,'tkrgny'), hP('THE WHITE HART','cream',{w:8}), ...hT('yellow',3,'KRGNBW',{scaf:2}),
  hI('1–18 WILMOT HOUSE','estbrick',4,17), ...hT('red',2,'gkyrnw'), hG('garage',6), ...hT('stock',2,'bkrg'),
];
HAND['wilmot:e:41']=[ ...hT('yellow',2,'kgrn'), hG('alley',1.4), ...hT('yellow',2,'wyk'), hS('offy','WILMOT FOOD & WINE',{w:5}) ];
HAND['wilmot:e:96']=[ ...hT('stock',2,'kr'), hG('gate',3) ];
HAND['wilmot:w:-82']=[ ...hT('red',2,'gkrn') ];
HAND['wilmot:w:-26']=[ ...hT('stock',2,'krgn'), hS('cafe','WILMOT CAFE',{w:5,disp:'board'}) ];
HAND['wilmot:w:40']=[ ...hT('soot',2,'kgrny'), hG('alley',1.4) ];
HAND['wilmot:w:96']=[ ...hT('yellow',2,'nk'), hH('yellow',2,'r',{w:3.5}) ];

/* ---------------- POLLARD ROW: facing the Overground's arches; lock-ups, workshops, low council blocks ---------------- */
HAND['pollard:e:-152']=[
  hG('garage',10), hW('POLLARD JOINERY','workshop',{w:9,doors:'#2a3a2a',sub:'SASH WINDOWS · DOORS · STAIRS'}), hI('1–24 POLLARD HOUSE','estbrick',4,22),
  hG('yard',8), hW('ARCH AUTOS','garage',{w:9,open:true}), ...hT('stock',2,'kgrn'), hG('garage',7),
];
HAND['pollard:e:-71']=[ hW('E2 UPHOLSTERY','workshop',{w:9,sub:'RE-COVERS · FOAM CUT TO SIZE',bg:'#3a1a1a'}), hG('alley',1.5), hH('soot',2,'k') ];
HAND['pollard:e:-22']=[ hI('1–8 ROWLEY HOUSE','lbuff',3,13), hG('garage',5) ];
HAND['pollard:e:96']=[ hW('KWIK SCAFF','builders',{w:9,sub:'SCAFFOLDING · HIRE · ERECTION',open:true}), hG('yard',4.5) ];

/* ---------------- FLORIDA STREET ---------------- */
HAND['florida:w:-152']=[ ...hT('stock',2,'kgrnwy'), hG('alley',1.4,{plank:true}), ...hT('stock',2,'bkrtgn'), hG('gate',3), ...hT('red',3,'KRG'), hS('offy','FLORIDA STORES',{w:5.5,disp:'news'}) ];
HAND['florida:e:-152']=[ hP('THE NAG\'S HEAD','green',{w:8}), ...hT('yellow',2,'kgrny'), hI('1–15 FLORIDA HOUSE','estbrick',4,16), ...hT('yellow',2,'wbkrg',{scaf:2}), hG('alley',1.4), ...hT('stock',2,'ky') ];
HAND['florida:w:-71']=[ ...hT('stock',2,'kgr') ];
HAND['florida:e:-71']=[ ...hT('red',2,'nwk') ];
HAND['florida:w:-22']=[ ...hT('yellow',2,'rkg') ];
HAND['florida:e:-22']=[ ...hT('stock',2,'gn'), hG('alley',1.5), hH('stock',2,'y',{w:4}) ];
HAND['florida:w:96']=[ ...hT('soot',2,'kr'), hG('gate',3) ];
HAND['florida:e:96']=[ ...hT('stock',2,'gnk') ];

/* ---------------- THREE COLTS LANE: garages, a hand car wash, builders' merchants and workshops facing the arches, a few houses and a pub ---------------- */
HAND['colts:s:-74']=[
  hP('THE THREE COLTS','tile',{w:9,brick:'soot'}), hW('COLTS MOT CENTRE','garage',{w:10,open:true,st:1,gh:4.6}), hG('yard',7), hW('BRADY BUILDERS MERCHANTS','builders',{w:14,open:true,st:2,dw:5}),
  ...hT('soot',2,'kgrn'), hG('garage',9.5), hW('S. KAPOOR & SONS','cashcarry',{w:12,sub:'WHOLESALE WAREHOUSE · TRADE ONLY',bg:'#d8201a',fg:'#ffffff',face:'anton',st:3}),
  hW('LANE HAND CAR WASH','garage',{w:10,open:true,st:1,gh:4.4,sub:'HAND CAR WASH · VALETING · £5',bg:'#2a6ac8'}), hG('yard',6), ...hT('stock',2,'krnyg',{hv:'cottage'}), hI('1–12 COLT HOUSE','estbrick',4,15),
  hW('M. GOLDSTEIN','workshop',{w:9,sub:'CABINET MAKERS · EST. 1928',doors:'#1e3a26'}), hW('PRESTIGE COACHWORKS','garage',{w:10,open:true,st:1,gh:4.6,sub:'ACCIDENT REPAIR · RESPRAYS'}),
  hG('garage',12.5), hW('EAST LONDON SCAFFOLDING','builders',{w:12,open:true,st:1,gh:4.4}), ...hT('yellow',2,'kgrwy',{scaf:2}), hS('cafe','THE COLTS CAFE',{w:6,disp:'chairs',aw:'#c81e1e/#f0ece0'}),
  hW('SIDDIQUI TEXTILES','workshop',{w:12,sub:'CUTTING · MAKING · TRIMMING',st:3,bg:'#4a1a4a'}), hG('yard',8), hW('TYRES 4 LESS','garage',{w:9,open:true,st:1,gh:4.4,bg:'#f2c200',fg:'#1a1a1a'}),
  ...hT('stock',2,'bkrg'), hP('THE GOODS YARD','black',{w:8.5}), hW('ROTHER PRINTERS','workshop',{w:11,sub:'LITHO · DIGITAL · BINDING',st:3}), hG('garage',9),
  hW('ACE MOTORS','garage',{w:10,open:true,st:1,gh:4.6}), hG('yard',7), ...hT('soot',2,'kgrny'), hW('T. MURPHY & SON','builders',{w:12,open:true,sub:'DEMOLITION · SKIP HIRE · GROUNDWORKS',bg:'#1e3a26'}),
  ...hT('stock',2,'rgnkybwt'), hW('J. & M. FISHER','workshop',{w:11,sub:'PIANO RESTORERS · EST. 1949',doors:'#3a2a4a'}), hG('yard',8), ...hT('yellow',3,'KRGNB'),
  hW('DOCKLANDS VAN HIRE','garage',{w:12,open:true,st:1,gh:4.4,bg:'#e86a10',fg:'#1a1a1a'}), hG('garage',10), hS('tolet',null,{w:5.5,was:'COLTS DINER'}),
  hI('1–9 VIADUCT HOUSE','lbuff',3,13), hW('BETHNAL GREEN MOTOR SPARES','garage',{w:10,st:2}), hS('offy','COLTS LANE STORES',{w:6,disp:'news'}),
];

/* ---------------- BUCKHURST STREET: the long terraces, both sides, with infill, pubs and the odd shop ---------------- */
HAND['buckhurst:n:-74']=[
  hP('THE THREE CROWNS','green',{w:8.5}), ...hT('stock',2,'kngrywbtkr'), hG('alley',1.4,{plank:true}), ...hT('yellow',3,'BKRGNWYB',{scaf:3}), hI('1–20 HARVEY HOUSE','estbrick',4,18),
  ...hT('red',2,'gkyrnwtb'), hG('gate',3), ...hT('stock',2,'krgnybwk',{hv:'cottage'}), hS('offy','BUCKHURST MINI MARKET',{w:6,disp:'news'}), ...hT('paintW',2,'k'), ...hT('stock',2,'rgnyk'),
  hG('garage',7), ...hT('yellow',2,'nkrgwytb'), hP('THE WHEATSHEAF','black',{w:8.5}), ...hT('soot',3,'GKRNB'), hG('alley',1.4,{plank:true}), ...hT('stock',2,'kyrgnwbt'),
  hI('1–16 CHEVIOT HOUSE','lbuff',4,16), ...hT('red',2,'rkgnyw'), hG('garden',7), ...hT('stock',2,'bknrgy'), ...hT('yellow',2,'krgnyw',{stuc:'#d0c8b4'}), hS('cafe','BUCKHURST CAFE',{w:5.5,disp:'chairs'}),
];
HAND['buckhurst:s:-74']=[
  hS('offy','DUNBRIDGE FOOD & WINE',{w:6,disp:'news'}), ...hT('yellow',2,'kgrnwybt',{hv:'cottage'}), hG('alley',1.4,{plank:true}), ...hT('yellow',2,'rkgnyw',{hv:'cottage'}), ...hT('paintBl',2,'k',{hv:'cottage'}),
  ...hT('stock',2,'gnrkybw'), hI('1–12 ALDGATE HOUSE','estbrick',3,15), ...hT('stock',2,'krgnw',{scaf:2}), hG('gate',3), ...hT('red',3,'GKRNBW'), hP('THE GREYHOUND','oxblood',{w:8.5}),
  ...hT('stock',2,'kyrgnbwt'), hG('alley',1.4,{plank:true}), ...hT('soot',2,'kgrn',{hv:'cottage'}), ...hT('paintCr',2,'g',{hv:'cottage'}), ...hT('stock',2,'rkynwg',{hv:'cottage'}),
  hG('garage',7), ...hT('stock',2,'kgrnwybtk'), ...hT('yellow',3,'NKRGBWYK'), ...hT('yellow',2,'bkrgny'), hI('13–24 ALDGATE HOUSE','lbuff',3,15), ...hT('yellow',2,'krgwny'), hG('alley',1.4), ...hT('red',2,'gkbyr'), hS('tolet',null,{w:5.5,was:'S. COHEN NEWSAGENT'}),
];
