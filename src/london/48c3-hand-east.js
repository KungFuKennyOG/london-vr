/* ==========================================================================================================
   HAND-WRITTEN FRONTAGES, EAST: Florida Street to Cambridge Heath Road (x streets with their middle east of 105,
   Barnet Grove and Cambridge Heath Road). The main road's taller shop parades by the Tube, Bethnal Green Road's east
   end, Cheshire Street's last workshops, Three Colts Lane by the gasholders, and the terraces of Barnet Grove,
   Teesdale and Kirkwall. Items run west to east (x streets) or north to south (z streets). Names made up.
   ========================================================================================================== */
var HAND=HAND||{};

/* ---------------- BETHNAL GREEN ROAD (east end) ---------------- */
HAND['bgr:n:143']=[
  hP('THE VICTORIA','cream',{w:8.5,brick:'stucco'}), hS('chicken','CHICKEN XPRESS',{w:5,brick:'stock'}), hS('kebab','MANGAL 2',{w:5.5,brick:'stock'}), hS('money','BENGAL EXCHANGE',{w:4.5,brick:'yellow'}),
  hS('grocer','FAMILY FOOD CENTRE',{w:8,disp:'veg',aw:'#1e3a6a/#e8e4d8',brick:'yellow'}), hS('barber','SHARP LINES',{w:4.5,brick:'red'}), hS('phone','CELL CITY',{w:4.5,brick:'red'}),
  hS('tolet',null,{w:5,was:'ABBEY NATIONAL',brick:'stock'}), hS('cafe','E2 CAFE',{w:5.5,disp:'chairs',aw:'#3a1a1a/#e8e0c8',brick:'stock'}), hS('optician','SEE CLEARLY',{w:5,brick:'paintW'}),
  hS('bookie','PRINCE BETS',{w:6,brick:'brown'}),
];
HAND['bgr:n:355']=[ hS('offy','HEATH FOOD & WINE',{w:6,disp:'news',st:4}), hS('chicken','HEATH CHICKEN',{w:5,st:4}), hS('travel','GREEN LINE TRAVEL',{w:5,st:4}), hS('cafe','CAFE ROMA',{w:6,disp:'chairs',st:4,aw:'#1e3a2a/#e8e4d8'}), hS('nails','NAIL BAR',{w:5,st:4}) ];
HAND['bgr:s:355']=[ hS('chemist','HEATH PHARMACY',{w:6.5,st:4}), hS('agent','PARADISE ESTATES',{w:5.5,st:4}), hS('curry','BENGAL BRASSERIE',{w:6.5,st:4}), hS('vape','VAPE STOP',{w:4.5,st:4}), hS('laundry','HEATH LAUNDERETTE',{w:6,st:4}) ];

/* ---------------- CAMBRIDGE HEATH ROAD: a wide main road, taller parades over shops, the station end ---------------- */
HAND['camheath:e:-233']=[ hS('cafe','HACKNEY ROAD CAFE',{w:6,disp:'chairs',st:4}), hS('kebab','ANADOLU OCAKBASI',{w:7,st:4}), hS('phone','PHONEWORLD',{w:5,st:4}), hS('offy','24-7 STORES',{w:5,st:4}) ];
HAND['camheath:w:-233']=[ /* the petrol station (48d) stands here */ hG('none',22.5) ];
HAND['camheath:e:-103']=[
  hS('cashcarry','HEATH CASH & CARRY',{w:9,disp:'veg',st:4,brick:'soot'}), hS('travel','SHAPLA TRAVEL',{w:5,st:4,brick:'soot'}), hS('cafe','THE PARADISE CAFE',{w:6,disp:'chairs',aw:'#2a4a2a/#e8e4d8',st:4,brick:'stock'}),
  hS('chemist','CAMBRIDGE PHARMACY',{w:6.5,st:4,brick:'stock'}), hS('agent','EASTSIDE PROPERTY',{w:5.5,st:4,brick:'stock'}), hS('fabric','SARI PALACE',{w:6,disp:'rail',st:4,brick:'red'}), hG('alley',1.8),
  hS('chicken','ROYAL FRIED CHICKEN',{w:5,st:4,brick:'red'}), hS('money','SONALI EXCHANGE',{w:4.5,st:4,brick:'red'}), hS('hardware','HEATH HARDWARE',{w:6.5,disp:'bric',st:4,brick:'yellow'}),
  hP('THE PARADISE ARMS','oxblood',{w:9,st:4,brick:'yellow'}), hS('curry','THE BENGAL LANCER',{w:7,st:4,brick:'stucco',sub:'INDIAN & BANGLADESHI · EST. 1976'}), hS('nails','DIAMOND NAILS',{w:4.5,st:4,brick:'stucco'}),
  hS('pound','POUNDS & PENCE',{w:6,disp:'bric',st:4,brick:'stock'}), hS('tolet',null,{w:5,was:'HEATH VIDEO',st:4,brick:'stock',scaf:true}), hS('records','HEATH RECORDS',{w:5,st:4,brick:'stock'}),
  hS('bakery','LA PATISSERIE',{w:5.5,disp:'board',st:4,brick:'brown'}), hS('laundry','CAMBRIDGE DRY CLEANERS',{w:6,st:4,brick:'brown'}), hS('kebab','ISTANBUL MANGAL',{w:6,st:4,brick:'brown'}),
  hS('optician','HEATH OPTICIANS',{w:5,st:4,brick:'red'}), hS('grocer','PARADISE SUPERSTORE',{w:8,disp:'veg',aw:'#1e5a2a/#e8e4d8',st:4,brick:'red'}), hS('vape','HEATH VAPES',{w:4.5,st:4,brick:'red'}),
  hS('gold','ROYAL GOLD',{w:5,st:4,brick:'stock'}), hS('bookie','ROYAL BETS',{w:6,st:4,brick:'stock'}), hS('cafe','MO\'S CAFE',{w:5.5,disp:'chairs',st:4,brick:'stock'}), hS('offy','PARADISE FOOD & WINE',{w:6,disp:'news',st:4,brick:'stock'}),
];
HAND['camheath:e:64']=[
  hS('cafe','STATION CAFE',{w:6,disp:'chairs',st:4,aw:'#c81e1e/#f0ece0'}), hS('phone','UNDERGROUND MOBILE',{w:5,st:4}), hS('offy','STATION NEWS',{w:5,disp:'news',st:4}), hS('chicken','CENTRAL CHICKEN',{w:5,st:4}),
  hS('travel','MUSEUM TRAVEL',{w:5,st:4}), hS('barber','CENTRAL BARBERS',{w:5,st:4}), hP('THE MUSEUM TAVERN','green',{w:9,st:4,brick:'red'}), hS('charity','CHILDREN\'S HOSPICE SHOP',{w:6,st:4}),
  hS('agent','HEATH & GREEN',{w:5.5,st:4}), hS('tolet',null,{w:5,st:4}), hS('bakery','HEATH BAKERY',{w:5.5,st:4}), hS('sweets','RUPCHANDA SWEETS',{w:6,st:4,aw:'#e8b020'}),
];
HAND['camheath:w:96']=[ hS('cafe','GARDEN CAFE',{w:6.5,disp:'chairs',st:4}), hS('offy','MUSEUM FOOD & WINE',{w:6.5,st:4}) ];
HAND['camheath:e:185']=[ hS('cashcarry','TOWER CASH & CARRY',{w:9,st:4}), hS('kebab','TOWER GRILL',{w:5.5,st:4}), hS('laundry','TOWER LAUNDERETTE',{w:6.5,st:4}), hS('offy','MILE END STORES',{w:6.5,st:4}) ];
HAND['camheath:w:185']=[ hP('THE WHITE HORSE','black',{w:9,st:4}), hS('tolet',null,{w:5,st:4}), hS('cafe','THE GASWORKS CAFE',{w:6.5,disp:'chairs',st:4}), hS('phone','FIX IT FAST',{w:5,st:4}) ];
HAND['camheath:e:230']=[ hS('chicken','SOUTHERN STAR CHICKEN',{w:8.5,st:4}) ];
HAND['camheath:w:230']=[ hS('offy','MILE END WINES',{w:8.5,st:4}) ];

/* ---------------- CHESHIRE STREET (east end): the last workshops before the gasworks ---------------- */
HAND['cheshire:n:143']=[
  hS('vintage','THE WARDROBE',{disp:'rail',brick:'stock'}), hW('A. LEVY & SONS','workshop',{w:10,sub:'CABINET MAKERS · EST. 1921',doors:'#1e3a26',brick:'soot'}), hS('records','LOCKED GROOVE',{brick:'stock'}),
  hS('tolet',null,{was:'BLOOM\'S BAGELS',brick:'stock'}), hG('gate',3,{c:'#3a1a1a'}), hS('antiques','THE SALVAGE YARD',{w:7,disp:'bric',brick:'soot'}), hS('cafe','GASWORKS COFFEE',{disp:'chairs',brick:'yellow'}),
  hS('vintage','HAND ME DOWN',{disp:'rail',brick:'yellow'}), hP('THE ELEPHANT\'S HEAD','tile',{w:8,brick:'red'}),
];
HAND['cheshire:n:253']=[
  hS('offy','CHESHIRE FOOD & WINE',{w:6,disp:'news'}), hS('vintage','PAPER MOON VINTAGE',{disp:'rail'}), hW('COHEN BROS','workshop',{w:10,sub:'FURRIERS & LEATHER',doors:'#2a2a3a'}),
  hS('gallery','THE ENGINE SHED',{w:7}), hS('records','RUFF CUTS',{}), hS('tolet',null,{was:'MAX\'S RADIO & TV'}), hS('vintage','GOOD AS NEW',{disp:'rail'}), hG('alley',1.6),
  ...hT('soot',3,'KRGN'), hW('GASWORKS STUDIOS','workshop',{w:12,sub:'ARTISTS\' STUDIOS · NO ENTRY',open:true,st:3}), hS('cafe','BEIGEL & BREW',{disp:'chairs'}), ...hT('stock',2,'kgrny',{scaf:2}),
  hS('antiques','BRIC-A-BRAC',{disp:'bric'}), hS('vintage','THE SWAP SHOP',{disp:'rail'}), hP('THE BELL FOUNDRY','green',{w:8}),
];
HAND['cheshire:n:355']=[ hS('vintage','LAST STOP VINTAGE',{w:6,disp:'rail'}), hW('HEATH METALWORKS','workshop',{w:10}), hS('cafe','CORNER CAFE',{w:6,disp:'board'}), hS('tolet',null,{w:6}) ];

/* ---------------- THREE COLTS LANE (east): by the gasholders ---------------- */
HAND['colts:s:253']=[
  hW('GASHOLDER MOTORS','garage',{w:10,open:true,st:1,gh:4.6}), hG('yard',8), hW('KING\'S TIMBER','builders',{w:14,open:true,sub:'TIMBER · SHEET · CUT TO SIZE'}), ...hT('soot',2,'kgrnw'),
  hG('garage',10), hW('ACE MINICABS','garage',{w:8,st:2,sub:'24 HOURS · AIRPORTS · 020 7739 1111',bg:'#1a1a1a',fg:'#f2c200'}), hI('1–12 GASKELL HOUSE','lbuff',4,15), hW('RIVETT & SONS','workshop',{w:10,sub:'LIFT ENGINEERS'}),
  ...hT('stock',2,'bkry'), hG('yard',7), hP('THE BRUNSWICK','oxblood',{w:8.5}),
];
HAND['colts:s:355']=[ hW('HEATH TYRES','garage',{w:10,open:true,st:1,gh:4.4,bg:'#f2c200',fg:'#1a1a1a'}), hG('garage',8), hW('MILE END SCAFFOLD','builders',{w:10,open:true,st:1,gh:4.2}) ];

/* ---------------- OLD BETHNAL GREEN ROAD (east of the Overground) ---------------- */
HAND['oldbg:n:177']=[
  ...hT('stock',2,'kgrn'), hG('alley',1.4,{plank:true}), ...hT('stock',2,'bkrtgn'), hP('THE GLOBE','green',{w:8.5}), ...hT('yellow',3,'KRGNBWY',{scaf:3}), hI('1–20 MINTERN HOUSE','estbrick',5,18),
  ...hT('red',2,'gkyrnw'), hG('gate',3), ...hT('stock',2,'krgnyb',{hv:'cottage'}), hS('offy','GLOBE FOOD & WINE',{w:6,disp:'news'}), ...hT('paintBl',2,'k'), hP('THE CAMBRIDGE ARMS','navy',{w:9,st:4}),
  /* the petrol station's forecourt (48d) takes the rest of the side */ hG('none',90),
];
HAND['oldbg:n:355']=[ hS('cafe','HACKNEY RD CAFE',{w:6,disp:'chairs',st:4}), hS('kebab','HACKNEY KEBAB',{w:5.5,st:4}), hS('offy','NORTH STORES',{w:5.5,st:4}), hS('barber','TOP CUTS',{w:5,st:4}), hS('tolet',null,{w:5,st:4}) ];
HAND['oldbg:s:143']=[ ...hT('stock',2,'kgrnwy'), hG('alley',1.4), ...hT('stock',2,'bkrtg'), hS('offy','TEESDALE FOOD & WINE',{w:5.5,disp:'news'}) ];
HAND['oldbg:s:355']=[ hS('curry','THE GREAT EASTERN',{w:7,st:4}), hS('phone','HACKNEY FIX',{w:5,st:4}), hS('chicken','PERI HOUSE',{w:5,st:4}), hS('nails','GLOSS',{w:5,st:4}), hS('offy','HEATH STORES',{w:6,st:4}) ];

/* ---------------- HEREFORD STREET (east), TEESDALE STREET, KIRKWALL PLACE ---------------- */
HAND['hereford:s:143']=[ hP('THE FLYING SCUD','oxblood',{w:8}), ...hT('yellow',2,'kgrnwy'), hG('gate',3), ...hT('yellow',2,'bkrg'), ...hT('red',3,'KN') ];
HAND['hereford:s:253']=[
  hS('offy','HEREFORD MINI MARKET',{w:6,disp:'news'}), ...hT('stock',2,'kgrnwybt'), hG('alley',1.4,{plank:true}), ...hT('stock',2,'rkgnyw',{hv:'cottage'}), hI('1–10 HEREFORD HOUSE','estbrick',4,15),
  ...hT('red',3,'GKRNB'), hG('garden',6), ...hT('soot',2,'kygr'), hS('cafe','THE HEREFORD CAFE',{w:5.5,disp:'chairs'}),
];
HAND['teesdale:n:143']=[ ...hT('stock',2,'kgrnwy',{hv:'cottage'}), hG('alley',1.4,{plank:true}), ...hT('stock',2,'bkrtgn',{hv:'cottage'}) ];
HAND['teesdale:s:143']=[ hS('offy','TEESDALE STORES',{w:5.5}), ...hT('red',2,'gkrnw'), hG('gate',3), ...hT('red',2,'ykbrg') ];
HAND['kirkwall:n:143']=[ ...hT('yellow',2,'kgrnyw'), hI('1–6 KIRKWALL HOUSE','lbuff',3,12), ...hT('yellow',2,'brkt') ];
HAND['kirkwall:s:143']=[ ...hT('stock',3,'KRGN',{scaf:1}), hG('alley',1.5), ...hT('stock',2,'kwygrnbt') ];

/* ---------------- BUCKHURST STREET (east) ---------------- */
HAND['buckhurst:n:253']=[ hP('THE OLD GASWORKS','tile',{w:8.5}), ...hT('stock',2,'kgrnwybt'), hG('alley',1.4,{plank:true}), ...hT('yellow',3,'KRGNB'), hI('1–14 GAS HOUSE','estbrick',4,16), ...hT('stock',2,'rgnykw'), hS('offy','BARNET STORES',{w:5.5}) ];
HAND['buckhurst:s:253']=[ ...hT('yellow',2,'kgrnwybt',{hv:'cottage'}), hG('gate',3), ...hT('yellow',2,'rkgnyw',{hv:'cottage'}), ...hT('paintGr',2,'k',{hv:'cottage'}), ...hT('stock',2,'gnrkyb'), hG('alley',1.4), ...hT('red',2,'kgrnw') ];
HAND['buckhurst:n:355']=[ ...hT('stock',3,'KRGN',{w:5.6}), hS('offy','HEATH CORNER STORES',{w:6.5,st:3}) ];
HAND['buckhurst:s:355']=[ ...hT('stock',3,'NKRG',{w:5.6}), hS('cafe','MILE END CAFE',{w:6.5,st:3}) ];

/* ---------------- BARNET GROVE ---------------- */
HAND['barnet:w:-152']=[ hS('offy','BARNET FOOD & WINE',{w:6,disp:'news'}), ...hT('stock',2,'kgrnwy'), hG('alley',1.4,{plank:true}), ...hT('stock',2,'bkrtg'), ...hT('red',3,'GKR') ];
HAND['barnet:w:-71']=[ ...hT('yellow',2,'kgr') ];
HAND['barnet:w:-22']=[ ...hT('stock',2,'nkr'), hG('alley',1.5) ];
HAND['barnet:w:96']=[ ...hT('soot',2,'kg'), hH('soot',2,'r',{w:3.5}) ];
HAND['barnet:e:96']=[ ...hT('stock',2,'ny'), hG('gate',3.5) ];
HAND['barnet:w:185']=[ ...hT('stock',2,'kgrn'), hG('alley',1.5), hH('stock',2,'w',{w:4}) ];
HAND['barnet:e:185']=[ hS('offy','GROVE STORES',{w:5.5}), ...hT('yellow',2,'kgrny') ];
HAND['barnet:w:230']=[ hH('stock',2,'k',{w:4.25}), hH('stock',2,'r',{w:4.25}) ];
HAND['barnet:e:230']=[ hH('red',2,'g',{w:4.25}), hH('red',2,'n',{w:4.25}) ];

