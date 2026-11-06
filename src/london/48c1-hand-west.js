/* ==========================================================================================================
   HAND-WRITTEN FRONTAGES, WEST: Brick Lane end to Gosset Street (x streets with their middle west of -100, and
   Vallance Road, Mape Street, Gosset Street). Every street side is written as the real street reads: Bethnal Green
   Road's scruffy high street, Columbia Road's little painted shops, Cheshire Street's vintage and workshops, Three
   Colts Lane's garages, and the Victorian terraces round them with their corner shops, pubs, alleys and post-war infill.
   Items run west to east (x streets) or north to south (z streets); helpers and door letters in 48c-hub-plan.js.
   All names are made up.
   ========================================================================================================== */
var HAND=HAND||{};
/* ---------------- BETHNAL GREEN ROAD: chicken, phones, sweet centres, cash & carries, bookies, a pie shop, a pub on the corner ---------------- */
HAND['bgr:n:-353']=[
  hS('cashcarry','BENGAL CASH & CARRY',{w:9,disp:'veg',aw:'#c81e1e/#f0ece0',brick:'yellow'}), hS('phone','UNLOCK EXPRESS',{w:4.6}), hS('nails','PRETTY POLISH',{w:4.6,brick:'paintW'}),
  hS('kebab','ANTEP OCAKBASI',{w:6}), hS('curry','SHAPLA TANDOORI',{w:6.5,sub:'BANGLADESHI CUISINE · LICENSED'}),
];
HAND['bgr:s:-353']=[
  hS('offy','VALLANCE FOOD & WINE',{w:5.5,disp:'news'}), hS('laundry','BUBBLES LAUNDERETTE',{w:6.5}), hS('butcher','AL-MADINA HALAL MEAT',{w:5.5}), hS('travel','SURMA TRAVEL',{w:5}),
  hP('THE QUEEN ADELAIDE','oxblood',{w:9,brick:'red'}),
];
HAND['bgr:n:-254']=[
  hS('chemist','VALLANCE PHARMACY',{w:7}), hS('chicken','CHICKEN PALACE'), hS('agent','CROWN & CO ESTATES'), hS('cafe','THE CABIN CAFE',{disp:'chairs',aw:'#2a4a6a/#e8e4d8'}),
  hS('piemash','A. HARDING PIE & MASH',{w:7,sf:'trad',pc:'#1e4a2e',fg:'#f2e6c8',sub:'EST. 1902 · PIE · MASH · LIQUOR · EELS',brick:'yellow',st:3}), hS('gold','EAST END GOLD'), hG('alley',1.8),
  hS('pound','POUND KING',{w:6,disp:'bric'}), hS('vape','CLOUD CITY VAPES',{w:4.5}), hS('money','SONALI REMIT',{w:4.5}), hS('grocer','SURMA FISH & MEAT',{w:7.5,disp:'veg',aw:'#1e5a2a'}),
  hS('sweets','RAJ MAHAL SWEETS',{aw:'#e8b020'}), hS('tolet',null,{was:'KWIK PHONES',scaf:true}), hS('barber','BOSPHORUS BARBERS'), hS('kebab','KAZ KEBAB HOUSE'),
  hS('optician','BETHNAL EYECARE'), hS('fabric','ROSHNI FABRICS',{disp:'rail'}), hS('bookie','GOLDEN HORSESHOE BETS'), hS('tailor','NOOR TAILORS',{w:4.5}),
  hS('bakery','ISTANBUL PATISSERIE'), hS('phone','PHONE DOCTOR'), hS('travel','SHAHJALAL TRAVEL'), hS('cashcarry','EASTERN CASH & CARRY',{w:8,disp:'veg'}),
  hP('THE DUKE OF YORK','navy',{w:8.5,brick:'stock'}),
];
HAND['bgr:n:-140']=[
  hP('THE MARQUIS OF GRANBY','green',{w:8.5,sub:'TRUMAN\'S ALES · FREE HOUSE'}),
  hS('chicken','PERI PERI KINGS',{w:5}), hS('phone','FIXIT MOBILE',{w:4.4}), hS('sweets','SYLHET SWEET CENTRE',{w:6,aw:'#c81e1e'}),
  hS('money','DESH EXPRESS',{w:4.6}), hS('tolet',null,{was:'SUNNY VIDEO & DVD'}), hG('alley',1.7),
  hS('bakery','ANATOLIA BAKERY',{disp:'board'}), hS('barber','ISTANBUL GENTS',{w:4.4}),
  hS('grocer','BARAKAH SUPERSTORE',{w:8,disp:'veg',aw:'#1e5a2a/#e8e4d8'}), hS('charity','ST MARGARET\'S HOSPICE SHOP',{w:6}), hS('bookie','LUCKY 7 BETS'),
];
HAND['bgr:s:-140']=[
  hS('kebab','HACI BABA',{w:5}), hS('agent','HARVEY KANE LETTINGS'), hS('chicken','FLAMIN\' CHICKEN'), hS('laundry','KLEEN-A-MATIC',{w:6}), hS('nails','LUXE NAILS & BROWS'),
  hS('cashcarry','TAJ CASH & CARRY',{w:8,disp:'veg',aw:'#c81e1e'}), hS('phone','MOBILE ZONE'), hS('cafe','ROSIE\'S CAFE',{disp:'chairs',aw:'#c81e1e/#f0ece0'}), hS('tolet',null,{was:'JAYS DISCOUNT'}),
  hS('hardware','ABBEY DIY & KEYS',{w:6,disp:'bric'}), hS('offy','GREEN FOOD & WINE',{disp:'news'}),
];

/* ---------------- COLUMBIA ROAD: one even run of little Victorian shops, painted fronts and signwriting, the flower market's florists ---------------- */
HAND['columbia:s:-254']=[
  hP('THE FLORIST\'S ARMS','green',{w:8,brick:'stock'}),
  hS('flowers','PETAL & STEM',{w:4.6,disp:'flowers',pc:'#1e3a2a',brick:'stock'}), hS('plants','THE POTTING SHED',{w:4.6,disp:'plants',pc:'#2a2a3a',brick:'stock'}), hS('gallery','MAGPIE GALLERY',{w:4.6,pc:'#d8d0bc',brick:'paintW'}),
  hS('cafe','THE TEA ROOM',{w:4.6,disp:'chairs',pc:'#5a2a3a',aw:'#5a2a3a/#e8e0d0',brick:'stock'}), hS('antiques','OLD SPITAL ANTIQUES',{w:4.6,pc:'#3a1a1a',disp:'bric',brick:'yellow'}), hS('homeware','LILY & BONE',{w:4.6,pc:'#2a4a4a',brick:'yellow'}),
  hS('tailor','HAT & HEART MILLINERY',{w:4.6,pc:'#1a1a1c',sub:'HATS MADE TO MEASURE',brick:'yellow'}), hS('flowers','FERN & FROND',{w:4.6,disp:'flowers',pc:'#2a4a2a',brick:'red'}), hS('deli','COLUMBIA DELI',{w:4.6,pc:'#6a5a3a',aw:'#2a3a2a/#e8e0c8',brick:'red'}),
  hS('homeware','NICE THINGS',{w:4.6,pc:'#c8d8d0',fg:'#2a3a3a',brick:'paintBl'}), hS('gallery','IVY HOUSE PRINTS',{w:4.6,pc:'#1c2438',brick:'stock'}), hS('bakery','BELL\'S BAKERY',{w:4.6,pc:'#4a3a2a',disp:'board',brick:'stock'}),
  hS('plants','MOSS',{w:4.6,pc:'#1e3a2a',disp:'plants',brick:'stock'}), hS('tolet',null,{w:4.6,was:'A. GOLD BOOTMAKER',pc:'#3a3a3a',brick:'soot'}), hS('homeware','CANAL CERAMICS',{w:4.6,pc:'#d8d0bc',brick:'paintCr'}),
  hS('flowers','BUNCH',{w:4.6,disp:'flowers',pc:'#5a2a3a',brick:'stock'}), hS('records','THE WREN RECORDS',{w:4.6,pc:'#1a1a1c',brick:'stock'}), hS('deli','THE HONEY POT',{w:4.6,pc:'#c8a020',fg:'#1a1a1a',brick:'yellow'}),
  hS('vintage','WINIFRED\'S',{w:4.6,disp:'rail',pc:'#3a2a4a',brick:'yellow'}), hS('plants','NETTLE & THYME',{w:4.6,disp:'plants',pc:'#2a4a2a',brick:'yellow'}), hS('cafe','MARIGOLD CAFE',{w:4.6,pc:'#c8581a',aw:'#c8581a/#f0e8d8',disp:'chairs',brick:'red'}),
  hS('gallery','PAPER & PEN',{w:4.6,pc:'#2a2a3a',brick:'red'}), hS('flowers','THE FLOWER BARROW',{w:4.6,disp:'flowers',pc:'#1e3a2a',brick:'stock'}), hS('homeware','SOFT GOODS',{w:4.6,pc:'#7e8e72',brick:'paintGr'}),
  hS('sweets','TILLY\'S SWEETS',{w:4.6,pc:'#d8a0b0',fg:'#5a1a2a',brick:'stock',sub:'SWEETS IN JARS · FUDGE · ROCK'}), hS('antiques','BRASS & BOOK',{w:4.6,pc:'#3a2a1a',disp:'bric',brick:'stock'}), hS('plants','SPROUT',{w:4.6,pc:'#2e3a2a',disp:'plants',brick:'stock',scaf:true}),
];
HAND['columbia:s:-101']=[
  hS('offy','COLUMBIA STORES',{w:6,pc:'#0e3a2a',sf:'trad',disp:'news',brick:'yellow'}),
  hS('flowers','FOX & FERN',{w:4.6,disp:'flowers',pc:'#1c2438',brick:'yellow'}), hS('gallery','THE LONG ROOM',{w:4.6,pc:'#f0ece0',fg:'#1a1a1a',brick:'paintW'}), hS('cafe','ELSIE\'S',{w:4.6,disp:'chairs',pc:'#2a4a4a',aw:'#2a4a4a/#e8e4d8',brick:'stock'}),
  hS('homeware','STONE & STRAW',{w:4.6,pc:'#6a5a3a',brick:'stock'}), hS('flowers','STEMS',{w:4.6,disp:'flowers',pc:'#3a1a1a',brick:'stock'}), hS('vintage','THE BUTTON BOX',{w:4.6,pc:'#3a2a4a',disp:'rail',brick:'stock'}),
  hS('plants','THE GLASSHOUSE',{w:4.6,pc:'#1e3a2a',disp:'plants',brick:'red'}), hS('deli','PARMA & PEPPER',{w:4.6,pc:'#4a1a1a',aw:'#4a1a1a/#e8e0c8',brick:'red'}), hS('antiques','CURIOUS OF E2',{w:4.6,pc:'#1a1a1c',disp:'bric',brick:'red'}),
  hG('gate',3.2,{c:'#1e3a2a',sign:'EZRA YARD · MARKET TRADERS ONLY'}),
  hS('flowers','ROSEBAY',{w:4.6,disp:'flowers',pc:'#5a2a3a',brick:'stock'}), hS('bakery','THE BREAD STALL',{w:4.6,pc:'#d8d0bc',fg:'#3a2a1a',disp:'board',brick:'paintCr'}), hS('homeware','WICKER & WOOL',{w:4.6,pc:'#7a5a3a',brick:'stock'}),
  hS('tolet',null,{w:4.6,was:'CASTELLO BROS',pc:'#3a3a3a',brick:'soot'}), hS('records','SLOW SPIN',{w:4.6,pc:'#1a1a1c',brick:'stock'}), hS('flowers','GOODCHILD FLOWERS',{w:4.6,disp:'flowers',pc:'#2a4a2a',brick:'stock'}),
  hS('gallery','NORTH LIGHT',{w:4.6,pc:'#2a2a3a',brick:'yellow'}), hS('cafe','THE MILK BAR',{w:4.6,pc:'#e8e0c8',fg:'#2a2a2a',disp:'chairs',aw:'#3a6aa0/#f0f0e8',brick:'paintW'}), hS('plants','LEAF & LOAM',{w:4.6,pc:'#2e3a2a',disp:'plants',brick:'yellow'}),
  hS('homeware','THE SOAP KITCHEN',{w:4.6,pc:'#c8d8d0',fg:'#2a3a3a',brick:'paintBl',sub:'SOAPS · CANDLES · SCENTS'}), hS('flowers','HAWTHORN & HOLLY',{w:4.6,disp:'flowers',pc:'#1e3a2a',brick:'stock'}), hS('antiques','OLD TIN ANTIQUES',{w:4.6,pc:'#4a3a2a',disp:'bric',brick:'stock'}),
  hS('vintage','SUNDAY BEST',{w:4.6,pc:'#5a2a3a',disp:'rail',brick:'stock'}), hS('deli','THE CHEESE CELLAR',{w:4.6,pc:'#d8c8a0',fg:'#3a2a1a',brick:'paintCr'}), hS('flowers','BLOOMING MARVELLOUS',{w:4.6,disp:'flowers',pc:'#3a1a1a',brick:'red'}),
  hS('barber','JOE\'S GENTS HAIRDRESSER',{w:4.6,pc:'#1a1a1c',fg:'#f0f0e8',brick:'red',sub:'GENTS HAIRDRESSER · EST. 1961'}), hS('plants','THE CACTUS ROOM',{w:4.6,pc:'#c8a020',fg:'#1a1a1a',disp:'plants',brick:'red'}), hS('gallery','KITE GALLERY',{w:4.6,pc:'#f0ece0',fg:'#1a1a1a',brick:'paintW'}),
  hP('THE PRINCE REGENT','maroon',{w:8,brick:'stock'}),
];

/* ---------------- CHESHIRE STREET (west): vintage, records, workshops, a couple of shut units ---------------- */
HAND['cheshire:n:-353']=[
  hS('vintage','RAG & BONE VINTAGE',{w:7,disp:'rail',brick:'soot'}), hS('records','DEAD WAX RECORDS',{w:5,brick:'stock'}),
  hW('J. SALMON & SON','workshop',{w:10,sub:'FRENCH POLISHERS · EST. 1932',doors:'#2a3a2a'}), hS('tolet',null,{w:5,was:'MANNY\'S',brick:'yellow'}), hS('cafe','THE BRICK CAFE',{w:5,disp:'board',brick:'yellow'}),
];
HAND['cheshire:n:-140']=[
  hP('THE WEAVERS\' ARMS','black',{w:8,brick:'soot'}), hS('vintage','KILO VINTAGE',{disp:'rail',brick:'stock'}), hS('antiques','HOBBS & DAUGHTER',{disp:'bric',brick:'stock'}), hS('records','SIDE B RECORDS',{brick:'stock'}),
  hW('E2 PRINTWORKS','workshop',{w:9,sub:'SCREEN PRINTING · T-SHIRTS · POSTERS',open:true,brick:'soot'}), hS('tolet',null,{was:'LEVY & SONS',brick:'soot'}), hS('cafe','SUNDAY COFFEE',{disp:'chairs',brick:'yellow'}),
  hS('vintage','SECOND SKIN',{disp:'rail',brick:'yellow'}), hS('gallery','CHESHIRE ST GALLERY',{brick:'paintW'}), hG('gate',3,{c:'#3a2a1a'}), hS('homeware','BAZAAR E2',{brick:'red'}),
];

/* ---------------- THREE COLTS LANE (west of Vallance): garages and yards facing the arches ---------------- */
HAND['colts:s:-353']=[
  hW('VALLANCE MOTORS','garage',{w:10,open:true,dw:4.2,st:1,gh:4.4,brick:'soot'}), hG('yard',6), hW('ACE TYRES','garage',{w:8,st:2,bg:'#f2c200',fg:'#1a1a1a',face:'anton'}), hG('garage',7),
];

/* ---------------- OLD BETHNAL GREEN ROAD (north side, west of the Overground): the long terrace, with its pubs, a corner shop, a council infill ---------------- */
HAND['oldbg:n:-353']=[ ...hT('stock',2,'krgn'), hS('offy','OLD BETHNAL STORES',{w:6,disp:'news'}), ...hT('stock',2,'y') ];
HAND['oldbg:s:-353']=[ hP('THE HARE & HOUNDS','green',{w:8.5}), ...hT('yellow',2,'wkr'), hG('alley',1.5), ...hT('yellow',2,'n') ];
HAND['oldbg:n:-147']=[
  hP('THE LORD NELSON','navy',{w:8.5,brick:'yellow'}), ...hT('yellow',2,'kngrywbt'), hG('alley',1.4,{plank:true}), ...hT('yellow',2,'rkgnp'),
  ...hT('stock',3,'BKRGN',{scaf:2}), hG('gate',3,{c:'#1a2a4a'}), ...hT('red',2,'wkytrn'), hI('1–15 GREENWOOD HOUSE','estbrick',4,16),
  ...hT('stock',2,'kgbr'), hS('offy','NELSON NEWS & WINE',{w:6,disp:'news'}), hG('alley',1.6), ...hT('soot',2,'ntrgk',{hv:'cottage'}),
  ...hT('paintW',2,'k',{}), hG('garage',6.5), ...hT('brown',2,'kmtrg'), hP('THE BRICKLAYERS ARMS','tile',{w:8.5,brick:'red'}),
  ...hT('yellow',3,'NKRWYG'), hG('alley',1.4,{plank:true}), ...hT('yellow',3,'GKBR'),
  ...hT('stock',2,'kyrnwg',{stuc:'#d8d0c0'}), hS('tolet',null,{w:5.5,was:'C. MARKS HABERDASHER'}), hG('gate',2.8),
  ...hT('red',2,'gy'), hS('cafe','THE KETTLE',{w:5.5,disp:'board'}),
];

/* ---------------- DERBYSHIRE STREET: two-storey cottages off Columbia Road ---------------- */
HAND['derby:n:-254']=[
  hS('offy','DERBY FOOD & WINE',{w:6,disp:'news'}), ...hT('yellow',2,'kngrYwbt'), hG('alley',1.4), ...hT('stock',2,'rktgn',{hv:'cottage'}),
  hI('1–9 MOLLOY HOUSE','lbuff',3,13), ...hT('red',2,'bwkr'), hG('gate',2.6), ...hT('stock',2,'gyn'), hP('THE ALBION','black',{w:8}),
];
HAND['derby:s:-254']=[
  ...hT('stock',2,'rkgnwy',{hv:'cottage'}), hG('alley',1.4), ...hT('stock',2,'tbkr',{hv:'cottage'}), ...hT('paintCr',2,'g'), ...hT('yellow',2,'knrpyk',{scaf:3}),
  hG('garden',6), ...hT('yellow',2,'wgbr'), ...hT('soot',2,'kyn'), hS('offy','DERBYSHIRE STORES',{w:6}),
];
HAND['derby:n:-101']=[
  ...hT('stock',2,'kgrnwy',{hv:'cottage'}), hG('alley',1.4,{plank:true}), ...hT('stock',2,'bktr',{hv:'cottage'}), ...hT('paintPk',2,'k'), ...hT('red',3,'GNKRB'),
  hG('gate',3), ...hT('yellow',2,'nkyrgw'), hI('1–12 FOURNIER HOUSE','estbrick',4,15), ...hT('stock',2,'rgkn'), hS('cafe','DERBY CAFE',{w:5.5,disp:'chairs'}),
];
HAND['derby:s:-140']=[ hP('THE CROWN & ANCHOR','oxblood',{w:8}), ...hT('yellow',2,'kgrny'), hG('alley',1.4), ...hT('yellow',2,'wbktr',{scaf:1}), ...hT('red',2,'gk') ];

/* ---------------- HEREFORD STREET (west) ---------------- */
HAND['hereford:n:-140']=[
  hS('offy','HEREFORD FOOD & WINE',{w:6,disp:'news'}), ...hT('yellow',2,'kn'), hG('gate',3), ...hT('red',3,'BK',{scaf:1}),
  hI('1–12 COLVILLE HOUSE','estbrick',4,13), ...hT('paintW',2,'n',{}), hG('alley',1.6), ...hT('soot',2,'ygr'),
];
HAND['hereford:s:-140']=[ ...hT('stock',2,'rkgnwyb'), hG('alley',1.4,{plank:true}), ...hT('stock',2,'tkrg'), ...hT('brown',2,'nwk'), hP('THE OLD KING JOHN','green',{w:8}) ];

/* ---------------- BUCKHURST STREET (west of Vallance) ---------------- */
HAND['buckhurst:n:-353']=[ ...hT('stock',2,'krgnb'), hS('offy','BUCKHURST STORES',{w:6,disp:'news'}) ];
HAND['buckhurst:s:-353']=[ ...hT('yellow',2,'ytk'), hG('alley',1.5), ...hT('yellow',2,'rng') ];

/* ---------------- VALLANCE ROAD: a wide road of terraces, a laundrette and a café on the west side, council blocks ---------------- */
HAND['vallance:w:-233']=[ hS('laundry','VALLANCE LAUNDERETTE',{w:6.5}), ...hT('stock',3,'KRG') ];
HAND['vallance:e:-233']=[ ...hT('stock',3,'NBW'), hS('cafe','THE VALLANCE CAFE',{w:6,disp:'chairs',aw:'#2a4a2a/#e8e4d8'}) ];
HAND['vallance:w:-103']=[
  hS('offy','VAL\'S FOOD & WINE',{w:6,disp:'news'}), ...hT('yellow',3,'KRNGYW',{scaf:3}), hG('alley',1.6), ...hT('yellow',2,'knrg'), hI('1–20 PEMELL HOUSE','estbrick',5,18),
  ...hT('stock',2,'rgkwny',{stuc:'#cfc6b2'}), hG('gate',3), ...hT('red',2,'bkyrg'), ...hT('red',3,'GKB'),
  hG('garage',6.5), ...hT('stock',2,'ynk'), hP('THE ROSE & CROWN','oxblood',{w:8.5}),
];
HAND['vallance:e:-82']=[ ...hT('yellow',3,'KRGN') ];
HAND['vallance:e:-26']=[ ...hT('stock',2,'nrgk'), hS('offy','EAST STORES',{w:5.5}) ];
HAND['vallance:w:64']=[
  hS('chicken','VALLANCE FRIED CHICKEN',{w:5.5}), hS('barber','KUTZ BARBERS',{w:5}), ...hT('stock',3,'RKNG'), hG('alley',1.5), ...hT('yellow',2,'kg'),
  hI('1–12 KINDER HOUSE','lbuff',4,14), ...hT('stock',2,'bkrg'),
];
HAND['vallance:w:185']=[ ...hT('soot',2,'krgn'), hG('gate',3), hH('soot',2,'y') ];
HAND['vallance:e:185']=[ hH('stock',2,'r'), ...hT('stock',2,'kgnw'), hG('alley',1.5) ];
HAND['vallance:w:230']=[ hS('offy','BUCKHURST FOOD & WINE',{w:8.5}) ];
HAND['vallance:e:230']=[ hH('yellow',2,'k',{w:4.25}), hH('yellow',2,'g',{w:4.25}) ];

/* ---------------- MAPE STREET ---------------- */
HAND['mape:w:-82']=[ ...hT('stock',2,'kgrn') ];
HAND['mape:e:-82']=[ ...hT('yellow',2,'rkyw') ];
HAND['mape:w:-26']=[ ...hT('red',2,'bkrg'), hG('alley',1.4) ];
HAND['mape:e:-26']=[ hS('cafe','MAPE ST CAFE',{w:6,disp:'board'}), ...hT('stock',2,'nkry') ];
HAND['mape:e:40']=[ ...hT('stock',2,'krgnwt') ];
HAND['mape:e:96']=[ ...hT('yellow',2,'rk'), hG('gate',3) ];

/* ---------------- GOSSET STREET ---------------- */
HAND['gosset:w:-26']=[ ...hT('yellow',2,'kngrw') ];
HAND['gosset:e:-26']=[ ...hT('stock',2,'rgk'), hG('alley',1.4), ...hT('stock',2,'nw') ];
HAND['gosset:w:40']=[ ...hT('red',3,'KRGNB',{w:5.5}), hH('red',3,'w') ];
HAND['gosset:e:40']=[ hS('offy','GOSSET MINI MARKET',{w:6,disp:'news'}), ...hT('stock',2,'kgrny') ];
HAND['gosset:w:96']=[ ...hT('yellow',2,'kr'), hG('alley',1.5) ];
HAND['gosset:e:96']=[ ...hT('soot',2,'gnk') ];
