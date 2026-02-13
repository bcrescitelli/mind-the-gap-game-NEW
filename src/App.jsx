
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, 
  updateDoc, arrayUnion, arrayRemove, runTransaction 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Train, Map, Users, RotateCw, CheckCircle, 
  AlertCircle, Trophy, Coffee, Landmark, Trees, 
  ShoppingBag, Zap, Crown, Play, User, Music, Volume2, VolumeX, 
  Link as LinkIcon, RefreshCw, Star, Ticket, Cone, Construction, Shuffle, Move, Repeat,
  Plane, Banknote, Ghost, Heart, Smile, LogOut, X, Check, FastForward, Ban, HelpCircle
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCi6ow177aGwqxoZ1ygZ8SgEx8JbLcSoEw",
  authDomain: "mind-the-gap-game-96226.firebaseapp.com",
  projectId: "mind-the-gap-game-96226",
  storageBucket: "mind-the-gap-game-96226.firebasestorage.app",
  messagingSenderId: "22609086436",
  appId: "1:22609086436:web:7fbc397f190fcedd59a9f1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "mind-the-gap-v1"; 

// --- GAME CONSTANTS ---
const GRID_SIZE = 19; 
const CENTER = Math.floor(GRID_SIZE / 2); 
const COLORS = ['red', 'blue', 'green', 'yellow'];
const WIN_SCORE = 10; 

// THEME COLORS
const THEME = {
  bg: '#1e1e2e',       // Dark Navy
  cream: '#efe6d5',    // Cream/Bone
  plum: '#782e53',     // Plum
  red: '#e66a4e',      // Terra Cotta
  yellow: '#f2ca50',   // Mustard
  green: '#63a669',    // Sage
  blue: '#5d76f2',     // Periwinkle
};

// Decoration Assets
const DECOR_IMAGES = [
  'decor-1.png', 'decor-2.png', 'decor-3.png', 
  'decor-4.png', 'decor-5.png', 'decor-6.png'
];

// Passenger Character Assets
const PASSENGER_IMAGES = [
  'passenger1.png', 'passenger2.png', 'passenger3.png',
  'passenger4.png', 'passenger5.png', 'passenger6.png'
];

// Categories
const CATEGORIES = {
  GASTRONOMY: { id: 'gastronomy', label: 'Gastronomy', icon: <Coffee size={16} />, color: 'text-amber-700' },
  HERITAGE: { id: 'heritage', label: 'Heritage', icon: <Landmark size={16} />, color: 'text-stone-600' },
  NATURE: { id: 'nature', label: 'Nature', icon: <Trees size={16} />, color: 'text-green-700' },
  SERVICES: { id: 'services', label: 'Services', icon: <Banknote size={16} />, color: 'text-blue-700' },
  SPIRITUAL: { id: 'spiritual', label: 'Spiritual', icon: <Ghost size={16} />, color: 'text-purple-700' },
  THRILLING: { id: 'thrilling', label: 'Thrilling', icon: <Zap size={16} />, color: 'text-red-700' },
};

// Landmarks Data
const LANDMARKS_DATA = [
  { name: "Ice Cream Shop", cat: 'gastronomy' }, { name: "Candy Store", cat: 'gastronomy' }, { name: "Farmer's Market", cat: 'gastronomy' },
  { name: "Spice Village", cat: 'gastronomy' }, { name: "Food Truck", cat: 'gastronomy' }, { name: "The Melting Pot", cat: 'gastronomy' },
  { name: "Cafe", cat: 'gastronomy' }, { name: "Bakery", cat: 'gastronomy' }, { name: "Bodega", cat: 'gastronomy' }, { name: "Rooftop Bar", cat: 'gastronomy' },
  { name: "Old Cathedral", cat: 'heritage' }, { name: "Museum", cat: 'heritage' }, { name: "Theatre", cat: 'heritage' },
  { name: "Opera House", cat: 'heritage' }, { name: "Observatory", cat: 'heritage' }, { name: "Clocktower", cat: 'heritage' },
  { name: "University", cat: 'heritage' }, { name: "Cinema", cat: 'heritage' },
  { name: "Botanic Gardens", cat: 'nature' }, { name: "Dog Park", cat: 'nature' }, { name: "Butterfly House", cat: 'nature' },
  { name: "Country Club", cat: 'nature' }, { name: "Flower Shop", cat: 'nature' }, { name: "Mountain Trail", cat: 'nature' },
  { name: "Airport", cat: 'services' }, { name: "Bank", cat: 'services' }, { name: "Mall", cat: 'services' },
  { name: "Gym", cat: 'services' }, { name: "Fire Department", cat: 'services' }, { name: "Post Office", cat: 'services' },
  { name: "Library", cat: 'services' }, { name: "Tailors", cat: 'services' },
  { name: "Haunted House", cat: 'spiritual' }, { name: "Cemetery", cat: 'spiritual' }, 
  { name: "Fortune Teller", cat: 'spiritual' }, { name: "Antique Store", cat: 'spiritual' },
  { name: "Theme Park", cat: 'thrilling' }, { name: "Casino", cat: 'thrilling' }, { name: "Rock Climbing Gym", cat: 'thrilling' },
  { name: "Comedy Club", cat: 'thrilling' }, { name: "Skate Park", cat: 'thrilling' }, { name: "Zoo", cat: 'thrilling' },
  { name: "Tattoo Parlor", cat: 'thrilling' }, { name: "The Stadium", cat: 'thrilling' }
];

const PERSONAS_BY_CAT = {
  gastronomy: ["The Head Chef", "The Food Critic", "The Glutton", "The Barista", "The Baker", "The Sommelier"],
  heritage: ["The Historian", "The Widow", "The Archaeologist", "The Monk", "The Duke", "The Architect"],
  nature: ["The Botanist", "The Hiker", "The Scout", "The Druid", "The Birdwatcher", "The Gardener"],
  services: ["The Pilot", "The Doctor", "The Mailman", "The Librarian", "The Banker", "The Tailor"],
  spiritual: ["The Medium", "The Ghost Hunter", "The Psychic", "The Goth", "The Vampire", "The Believer"],
  thrilling: ["The Daredevil", "The Gambler", "The Adrenaline Junkie", "The Racer", "The Stuntman", "The Teenager"]
};

// --- HELPERS ---
const getPersonaForCategory = (catId) => {
  const list = PERSONAS_BY_CAT[catId];
  if (!list) return "The Passenger";
  return list[Math.floor(Math.random() * list.length)];
};

const getRandomPassengerImage = () => {
  return PASSENGER_IMAGES[Math.floor(Math.random() * PASSENGER_IMAGES.length)];
};

const getCell = (grid, x, y) => {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
  return grid[y][x];
};

const isStart = (x, y) => x === CENTER && y === CENTER;

const getExits = (shape, rotation) => {
  let baseExits = [];
  if (shape === 'straight') baseExits = [0, 2]; 
  if (shape === 'curved') baseExits = [2, 1];   
  if (shape === 't-shape') baseExits = [1, 2, 3]; 
  return baseExits.map(e => (e + Math.floor(rotation / 90)) % 4);
};

const getNeighborCoords = (x, y, dir) => {
  if (dir === 0) return { x, y: y - 1 };
  if (dir === 1) return { x: x + 1, y };
  if (dir === 2) return { x, y: y + 1 };
  if (dir === 3) return { x: x - 1, y };
  return { x, y };
};

const getOppositeDir = (dir) => (dir + 2) % 4;

const areConnected = (cellA, cellB, dirFromAtoB) => {
  if (!cellA || !cellB) return false;
  const isA_Wild = cellA.type === 'landmark' || cellA.isStart;
  const isB_Wild = cellB.type === 'landmark' || cellB.isStart;
  if (isA_Wild && isB_Wild) return false;

  const entryB = getOppositeDir(dirFromAtoB);
  if (cellA.type === 'track') {
    const exitsA = getExits(cellA.shape, cellA.rotation);
    if (!exitsA.includes(dirFromAtoB)) return false;
  }
  if (cellB.type === 'track') {
    const exitsB = getExits(cellB.shape, cellB.rotation);
    if (!exitsB.includes(entryB)) return false;
  }
  return true;
};

const check3TrackRule = (grid, startX, startY, playerColor) => {
  const queue = [];
  const visited = new Set();
  [0,1,2,3].forEach(dir => {
    const nc = getNeighborCoords(startX, startY, dir);
    const cell = getCell(grid, nc.x, nc.y);
    if (isStart(nc.x, nc.y)) { queue.push({ x: nc.x, y: nc.y, dist: 1 }); visited.add(`${nc.x},${nc.y}`); } 
    else if (cell && cell.type === 'track' && cell.owner === playerColor) {
       const entry = getOppositeDir(dir);
       const exits = getExits(cell.shape, cell.rotation);
       if (exits.includes(entry)) { queue.push({ x: nc.x, y: nc.y, dist: 1 }); visited.add(`${nc.x},${nc.y}`); }
    }
  });
  if (queue.length === 0) return false;
  while (queue.length > 0) {
    const current = queue.shift();
    const cell = getCell(grid, current.x, current.y);
    const isCityHall = isStart(current.x, current.y);
    const isLandmark = cell && cell.type === 'landmark';
    if (isCityHall || isLandmark) { if (current.dist < 4) return false; continue; }
    [0,1,2,3].forEach(dir => {
      const nc = getNeighborCoords(current.x, current.y, dir);
      const key = `${nc.x},${nc.y}`;
      if (!visited.has(key)) {
        const nextCell = getCell(grid, nc.x, nc.y);
        const currObj = isCityHall ? { isStart: true, type: 'start' } : cell;
        const nextObj = isStart(nc.x, nc.y) ? { isStart: true, type: 'start' } : nextCell;
        if (nextObj && (nextObj.isStart || nextObj.owner === playerColor || nextObj.type === 'landmark')) {
           if (areConnected(currObj, nextObj, dir)) { visited.add(key); queue.push({ x: nc.x, y: nc.y, dist: current.dist + 1 }); }
        }
      }
    });
  }
  return true;
};

// --- GENERATORS ---

const generateLandmarks = () => {
  const landmarks = [];
  let idCounter = 1;
  LANDMARKS_DATA.forEach(data => {
      landmarks.push({
          id: `L-${idCounter++}`,
          name: data.name,
          category: data.cat,
          type: 'landmark',
          connections: {}
      });
  });
  return landmarks.sort(() => Math.random() - 0.5);
};

const generatePassengers = (allLandmarks) => {
  const passengers = [];
  let idCounter = 1;
  const findL = (name) => allLandmarks.find(l => l.name === name);

  const tier1 = [
    { name: "The Foodie", req: 'category', target: 'gastronomy', pts: 1, desc: "I'd like to visit any Gastronomy spot." },
    { name: "The Tourist", req: 'category', target: 'heritage', pts: 1, desc: "I'd like to visit any Heritage spot." },
    { name: "The Outdoorsman", req: 'category', target: 'nature', pts: 1, desc: "I'd like to visit any Nature spot." },
    { name: "The Local", req: 'category', target: 'services', pts: 1, desc: "I'd like to visit any Services spot." },
    { name: "The Adrenaline Junkie", req: 'category', target: 'thrilling', pts: 1, desc: "I'd like to visit any Thrilling spot." },
    { name: "The Medium", req: 'category', target: 'spiritual', pts: 2, desc: "I'd like to visit any Spiritual spot." } 
  ];
  const tier2 = [
      { name: "The Sweet Tooth", req: 'list', targets: ["Ice Cream Shop", "Candy Store", "Bakery"], pts: 2 },
      { name: "The Scholar", req: 'list', targets: ["University", "Library", "Museum"], pts: 2 },
      { name: "The Pet Owner", req: 'list', targets: ["Dog Park", "Bodega", "Cafe"], pts: 2 },
      { name: "The Shopper", req: 'list', targets: ["Mall", "Antique Store", "Flower Shop"], pts: 2 },
      { name: "The Athlete", req: 'list', targets: ["Gym", "The Stadium", "Mountain Trail"], pts: 2 },
      { name: "The Night Owl", req: 'list', targets: ["Rooftop Bar", "Casino", "Comedy Club"], pts: 2 },
      { name: "The Artist", req: 'list', targets: ["Opera House", "Theatre", "Tattoo Parlor"], pts: 2 },
      { name: "The Errand Runner", req: 'list', targets: ["Bank", "Post Office", "Tailors"], pts: 2 }
  ];
  const tier3 = [
      { name: "The Pilot", target: "Airport", pts: 3 },
      { name: "The Astronomer", target: "Observatory", pts: 3 },
      { name: "The Fire Chief", target: "Fire Department", pts: 3 },
      { name: "The Skater", target: "Skate Park", pts: 3 },
      { name: "The Clockmaker", target: "Clocktower", pts: 3 },
      { name: "The Lepidopterist", target: "Butterfly House", pts: 3 },
      { name: "The Widow", target: "Cemetery", pts: 3 },
      { name: "The Gambler", target: "Casino", pts: 3 }
  ];
  const tier4 = [
      { name: "The Date Night", targets: ["Cafe", "Cinema"], pts: 5 },
      { name: "The Ghost Tour", type: 'ghost', target1: "Haunted House", cat2: "heritage", pts: 4, desc: "I need to visit Haunted House and any Heritage spot." },
      { name: "The Vacationer", targets: ["Airport", "Theme Park"], pts: 5 },
      { name: "The Graduate", targets: ["University", "Rooftop Bar"], pts: 5 },
      { name: "The Health Nut", targets: ["Gym", "Farmer's Market"], pts: 5 },
      { name: "The Botanist", type: 'botanist', target1: "Botanic Gardens", cat2: "nature", pts: 4, desc: "I need to visit Botanic Gardens and any Nature spot." },
      { name: "The Investigator", targets: ["Fortune Teller", "Antique Store"], pts: 5 },
      { name: "The Critic", targets: ["The Melting Pot", "Theatre"], pts: 5 }
  ];

  tier1.forEach(p => passengers.push({ 
      id: `P-${idCounter++}`, name: p.name, reqType: 'category', targetCategory: p.target, points: p.pts, 
      desc: p.desc, img: getRandomPassengerImage() 
  }));
  tier2.forEach(p => {
      const ts = p.targets.map(n => findL(n)?.id).filter(Boolean);
      if(ts.length > 0) passengers.push({ 
          id: `P-${idCounter++}`, name: p.name, reqType: 'list', targets: ts, points: p.pts, 
          desc: `I want to go to ${p.targets.join(", or ")}.`, img: getRandomPassengerImage() 
      });
  });
  tier3.forEach(p => {
      const t = findL(p.target);
      if(t) passengers.push({ 
          id: `P-${idCounter++}`, name: p.name, reqType: 'specific', targetId: t.id, targetName: t.name, points: p.pts, 
          desc: `Take me to ${t.name} please!`, img: getRandomPassengerImage() 
      });
  });
  tier4.forEach(p => {
      if (p.targets) {
          const t1 = findL(p.targets[0]);
          const t2 = findL(p.targets[1]);
          if(t1 && t2) passengers.push({ 
              id: `P-${idCounter++}`, name: p.name, reqType: 'combo', targets: [t1.id, t2.id], points: p.pts, 
              desc: `I need to visit ${t1.name} and ${t2.name}.`, img: getRandomPassengerImage() 
          });
      } else if (p.type === 'ghost') {
          const t1 = findL(p.target1);
          if(t1) passengers.push({ 
              id: `P-${idCounter++}`, name: p.name, reqType: 'combo_cat', targetId: t1.id, cat2: p.cat2, points: p.pts, 
              desc: p.desc, img: getRandomPassengerImage() 
          });
      } else if (p.type === 'botanist') {
          const t1 = findL(p.target1);
          if(t1) passengers.push({ 
              id: `P-${idCounter++}`, name: p.name, reqType: 'combo_cat', targetId: t1.id, cat2: p.cat2, points: p.pts, 
              desc: p.desc, img: getRandomPassengerImage() 
          });
      }
  });

  return passengers.sort(() => Math.random() - 0.5);
};

const METRO_CARDS_DATA = {
  rush_hour: { name: 'Rush Hour', desc: 'Swap all 3 Passengers for new ones.', icon: <Shuffle size={16}/> },
  track_maint: { name: 'Track Maintenance', desc: 'Block a grid square permanently.', icon: <Cone size={16}/> },
  carpool: { name: 'Carpool', desc: 'Steal a random card from an opponent.', icon: <Users size={16}/> },
  grand_opening: { name: 'Renovation', desc: 'Replace a board Landmark with one from your hand.', icon: <RefreshCw size={16}/> },
  rezoning: { name: 'Rezoning', desc: 'Swap your landmarks for 2 new ones.', icon: <RefreshCw size={16}/> },
  express_service: { name: 'Express Service', desc: 'Place TWO Track cards this turn.', icon: <FastForward size={16}/> },
  signal_failure: { name: 'Signal Failure', desc: 'Skip a chosen opponent for one round.', icon: <Ban size={16}/> },
};

const generateMetroDeck = () => {
  const deck = [];
  Object.keys(METRO_CARDS_DATA).forEach(key => {
    for(let i=0; i<5; i++) deck.push({ id: key, uid: Math.random().toString(36).substr(2,9) });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const generateTrackDeck = () => {
  const deck = [];
  for(let i=0; i<70; i++) deck.push({ id: `T-S-${i}`, type: 'track', shape: 'straight' });
  for(let i=0; i<50; i++) deck.push({ id: `T-C-${i}`, type: 'track', shape: 'curved' });
  for(let i=0; i<30; i++) deck.push({ id: `T-T-${i}`, type: 'track', shape: 't-shape' });
  return deck.sort(() => Math.random() - 0.5);
};

// --- REACT COMPONENTS ---

const TrackSvg = ({ shape, rotation, color, animate }) => {
  const colorMap = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', gray: '#9ca3af' };
  const strokeColor = THEME[color] || colorMap[color] || '#9ca3af';
  
  const pathId = `track-${shape}-${Math.random().toString(36).substr(2, 5)}`;
  let d = "";
  if (shape === 'straight') d = "M 50 0 L 50 100";
  if (shape === 'curved') d = "M 50 100 Q 50 50 100 50";
  if (shape === 't-shape') d = "M 0 50 L 100 50 M 50 50 L 50 100"; 

  return (
    <div className="w-full h-full" style={{ transform: `rotate(${rotation}deg)` }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" shapeRendering="geometricPrecision">
        {/* SURGE EFFECT STYLES */}
        <defs>
            <style>
                {`
                 .surge-anim { animation: surge 2s ease-out infinite; }
                 @keyframes surge {
                     0% { stroke-opacity: 0.2; stroke-width: 30; filter: brightness(1); }
                     50% { stroke-opacity: 1; stroke-width: 35; filter: brightness(2) drop-shadow(0 0 4px white); }
                     100% { stroke-opacity: 0.2; stroke-width: 30; filter: brightness(1); }
                 }
                `}
            </style>
        </defs>

        {shape === 'straight' && (
            <>
                <path id={pathId} d="M 50 0 L 50 100" stroke={strokeColor} strokeWidth="30" strokeLinecap="butt" fill="none" />
                {animate && <path d="M 50 0 L 50 100" stroke="white" strokeWidth="30" className="surge-anim" fill="none" />}
            </>
        )}
        {shape === 'curved' && (
            <>
                <path id={pathId} d="M 50 100 Q 50 50 100 50" stroke={strokeColor} strokeWidth="30" strokeLinecap="butt" fill="none" />
                {animate && <path d="M 50 100 Q 50 50 100 50" stroke="white" strokeWidth="30" className="surge-anim" fill="none" />}
            </>
        )}
        {shape === 't-shape' && (
          <>
            <path d="M 0 50 L 100 50" stroke={strokeColor} strokeWidth="30" strokeLinecap="butt" />
            <path d="M 50 50 L 50 100" stroke={strokeColor} strokeWidth="30" strokeLinecap="butt" />
            {animate && (
                <>
                    <path d="M 0 50 L 100 50" stroke="white" strokeWidth="30" className="surge-anim" />
                    <path d="M 50 50 L 50 100" stroke="white" strokeWidth="30" className="surge-anim" />
                </>
            )}
          </>
        )}
      </svg>
    </div>
  );
};

// REVERTED MEMOIZATION FOR FUNCTIONALITY
const Cell = ({ x, y, cellData, onClick, view, isBlocked, isSurge, decorImage }) => {
  const isCenter = x === CENTER && y === CENTER;
  const isHost = view === 'host';
  
  let content = null;
  // Host bg is transparent to show map. Player bg is transparent to allow underlying image to show.
  let bgClass = isHost ? "bg-transparent" : "bg-transparent"; 
  // Borders: None for Host, Thin Cream for Players
  let borderClass = isHost ? "border-0" : "border border-[#efe6d5]/20";
  
  const colorDotMap = { red: 'bg-[#e66a4e]', blue: 'bg-[#5d76f2]', green: 'bg-[#63a669]', yellow: 'bg-[#f2ca50]' };

  if (isBlocked) {
    content = <div className="w-full h-full flex items-center justify-center bg-yellow-900/50"><Cone size={24} className="text-yellow-500 animate-pulse" /></div>;
  } else if (isCenter) {
    content = <div className="flex flex-col items-center justify-center h-full w-full bg-[#efe6d5] text-[#1e1e2e] font-bold text-[6px] md:text-[10px] z-10 text-center leading-none border-2 border-black font-retro">CITY HALL</div>;
    bgClass = "bg-[#efe6d5]";
  } else if (cellData?.type === 'track') {
    // Make placed tracks visible but allow map to show through slightly
    if (!isHost) bgClass = "bg-transparent"; 
    // ONLY animate if it is a surge event
    content = <TrackSvg shape={cellData.shape} rotation={cellData.rotation} color={cellData.owner} animate={isSurge} />;
  } else if (cellData?.type === 'landmark') {
    content = (
      <div className="w-full h-full bg-[#efe6d5] flex flex-col items-center justify-center p-0.5 border-2 border-black shadow-md relative">
         <div className={`text-[#1e1e2e] scale-75 md:scale-100 ${CATEGORIES[cellData.category?.toUpperCase()]?.color}`}>{CATEGORIES[cellData.category?.toUpperCase()]?.icon}</div>
         <div className="text-[5px] md:text-[8px] text-black font-bold text-center leading-none mt-0.5 break-words w-full overflow-hidden font-pixel">{cellData.name}</div>
         {cellData.connections && Object.keys(cellData.connections).map((c, i) => (
           <div key={c} className={`absolute w-2 h-2 rounded-full border border-black ${colorDotMap[c]} bottom-0.5 right-${i * 2 + 1}`}></div>
         ))}
      </div>
    );
    if (isHost) bgClass = "bg-transparent"; 
  } else if (isHost && decorImage) {
    // Show decor only on empty cells on host
    content = <img src={`/${decorImage}`} className="w-2/5 h-2/5 opacity-90 object-contain drop-shadow-md" alt="decor" />;
    bgClass = "bg-transparent flex items-center justify-center";
  }

  return (
    <div 
      onClick={() => onClick(x, y)}
      className={`w-full h-full aspect-square ${borderClass} ${bgClass} relative flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/5 transition-colors touch-manipulation`}
    >
      {content}
    </div>
  );
};

const GameCard = ({ data, selected, onClick, type }) => {
  if (!data) return <div className="w-16 h-24 bg-[#1e1e2e] rounded opacity-50"></div>;
  
  if (type === 'metro') {
    const info = METRO_CARDS_DATA[data.id] || {};
    return (
      <div 
        onClick={onClick}
        className={`relative w-16 h-24 md:w-24 md:h-32 rounded-lg border-4 flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] shrink-0 bg-[#f2ca50] ${selected ? 'border-white -translate-y-2' : 'border-black hover:border-white'}`}
      >
        <div className="text-black mb-1">{info.icon}</div>
        <div className="text-[9px] md:text-xs text-center font-bold text-black leading-tight font-cal-sans">{info.name}</div>
        <div className="text-[7px] text-center text-yellow-200 mt-1 leading-tight font-questrial px-0.5 overflow-hidden text-ellipsis line-clamp-3 w-full">{info.desc}</div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`relative w-16 h-24 md:w-24 md:h-32 rounded-lg border-4 flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] shrink-0
        ${selected ? 'border-white -translate-y-2' : 'border-black hover:border-white'}
        ${type === 'track' ? 'bg-[#1e1e2e]' : 'bg-[#efe6d5]'}
      `}
    >
      {type === 'track' && (
        <>
          <div className="text-[10px] md:text-xs text-[#efe6d5] mb-1 md:mb-2 uppercase font-bold text-center truncate w-full font-retro">{data.shape}</div>
          <div className="w-8 h-8 md:w-12 md:h-12 border-2 border-[#efe6d5] rounded flex items-center justify-center bg-[#1e1e2e]">
             <TrackSvg shape={data.shape} rotation={0} color="gray" />
          </div>
        </>
      )}

      {type === 'landmark' && (
        <>
          <div className="absolute top-1 right-1 text-black scale-75 md:scale-100">
             {CATEGORIES[data.category?.toUpperCase()]?.icon}
          </div>
          <div className="text-[8px] md:text-[10px] text-center font-bold text-black leading-tight mt-2 line-clamp-2 w-full font-retro overflow-hidden leading-tight break-words px-0.5">{data.name}</div>
          <div className="text-[8px] md:text-[9px] text-gray-600 mt-1 font-pixel uppercase">{CATEGORIES[data.category?.toUpperCase()]?.label}</div>
        </>
      )}
    </div>
  );
};

const WinnerModal = ({ winner, onRestart, onExit }) => {
  if (!winner) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Simple CSS Confetti */}
        {[...Array(50)].map((_, i) => (
          <div key={i} className="absolute w-2 h-2 bg-[#f2ca50] rounded-full animate-ping" style={{ 
            top: `${Math.random()*100}%`, left: `${Math.random()*100}%`, 
            animationDuration: `${0.5 + Math.random()}s`, animationDelay: `${Math.random()}s` 
          }}></div>
        ))}
      </div>
      <div className="bg-[#1e1e2e] p-8 rounded-none border-4 border-[#efe6d5] shadow-[8px_8px_0px_0px_#efe6d5] text-center max-w-md w-full transform scale-110">
        <Crown size={64} className="text-[#f2ca50] mx-auto mb-4 animate-bounce" />
        <h2 className="text-4xl font-black text-[#efe6d5] mb-4 uppercase tracking-widest font-retro">Winner!</h2>
        <div className={`text-5xl font-black mb-6 drop-shadow-lg font-retro`} style={{ color: THEME[winner.color] }}>{winner.name}</div>
        <p className="text-[#efe6d5] mb-8 text-xl font-pixel uppercase">Final Score: <span className="text-white font-bold">{winner.score}</span></p>
        <button onClick={onRestart} className="px-8 py-4 bg-[#63a669] hover:bg-[#528a57] text-[#1e1e2e] border-4 border-black font-bold text-xl shadow-[4px_4px_0px_0px_black] transition-transform hover:translate-y-1 hover:shadow-none flex items-center justify-center gap-2 w-full font-retro mb-4">
          <RefreshCw size={20}/> Play Again
        </button>
        <button onClick={onExit} className="text-[#efe6d5] hover:text-white underline text-sm font-pixel uppercase tracking-widest">Exit to Menu</button>
      </div>
    </div>
  );
};

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
    <div className="bg-[#1e1e2e] text-[#efe6d5] p-6 rounded-none border-4 border-[#efe6d5] shadow-[8px_8px_0px_0px_#000] max-w-sm w-full">
      <h2 className="text-2xl font-black font-retro text-center mb-6 text-[#f2ca50] uppercase tracking-wide border-b-4 border-[#f2ca50] pb-2">How to Play</h2>
      <ul className="space-y-4 font-pixel text-xl leading-snug">
        <li className="flex items-start gap-3"><span className="text-[#5d76f2] font-bold">1.</span> <span>Connect tracks from City Hall to Landmarks.</span></li>
        <li className="flex items-start gap-3"><span className="text-[#5d76f2] font-bold">2.</span> <span>Pick up Passengers by connecting to their destinations.</span></li>
        <li className="flex items-start gap-3"><span className="text-[#5d76f2] font-bold">3.</span> <span>Landmarks need breathing room (3 tracks apart).</span></li>
        <li className="flex items-start gap-3"><span className="text-[#5d76f2] font-bold">4.</span> <span>Max 2 connections per Landmark (In & Out).</span></li>
        <li className="flex items-start gap-3"><span className="text-[#5d76f2] font-bold">5.</span> <span>Bonus +2 Points for the Longest Network.</span></li>
      </ul>
      <button onClick={onClose} className="mt-8 w-full py-4 bg-[#f2ca50] hover:bg-[#d9b646] text-[#1e1e2e] font-black text-lg rounded-none shadow-[4px_4px_0px_0px_black] transform transition-transform active:translate-y-1 active:shadow-none border-4 border-black uppercase font-retro">
        Let's Ride!
      </button>
    </div>
  </div>
);

const NotificationOverlay = ({ event }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (event && (Date.now() - event.timestamp < 5000)) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [event]);
  if (!visible || !event) return null;
  
  if (event.type === 'claim-passenger') {
      return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-10 fade-in duration-500 w-full max-w-md px-4 pointer-events-none">
          <div className="bg-[#efe6d5] text-[#1e1e2e] px-6 py-6 rounded-none shadow-[8px_8px_0px_0px_#000] border-4 border-[#1e1e2e] flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-2 text-[#f2ca50] font-black uppercase tracking-widest text-xs animate-pulse font-retro bg-[#1e1e2e] px-2 py-1">
              <Star size={16} className="fill-current" /> Passenger Claimed! <Star size={16} className="fill-current" />
            </div>
            <div className="text-center w-full font-retro mt-2">
              <span className={`text-[${THEME[event.playerColor] || event.playerColor}] font-black text-2xl drop-shadow-sm block`} style={{ color: THEME[event.playerColor] }}>{event.playerName}</span>
              <span className="text-[#1e1e2e] font-bold text-sm mx-2 block mt-1 font-pixel uppercase tracking-widest">picked up</span>
            </div>
            <div className="text-xl font-black font-retro text-center leading-tight mt-1 text-[#782e53]">
              {event.passengerNames.join(" & ")}
            </div>
          </div>
        </div>
      );
  }

  if (event.type === 'most-connected') {
      return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-10 fade-in duration-500 w-full max-w-md px-4 pointer-events-none">
          <div className="bg-[#5d76f2] text-[#efe6d5] px-6 py-6 rounded-none shadow-[8px_8px_0px_0px_#000] border-4 border-[#efe6d5] flex flex-col items-center gap-2 w-full">
             <div className="flex items-center gap-2 text-[#1e1e2e] font-black uppercase tracking-widest text-xs animate-pulse font-retro bg-[#efe6d5] px-2 py-1">
               <LinkIcon size={16} /> Most Connected!
             </div>
             <div className="text-center w-full font-retro mt-2">
               <span className={`text-[${THEME[event.playerColor] || '#fff'}] font-black text-2xl drop-shadow-sm`} style={{ color: THEME[event.playerColor] || 'white' }}>{event.playerName}</span>
               <span className="text-[#efe6d5] font-bold text-sm mx-2 block mt-1 font-pixel uppercase tracking-widest">takes the lead!</span>
             </div>
             <div className="text-xl font-black font-retro text-center leading-tight mt-1 text-white">
               {event.count} Connections (+2 PTS)
             </div>
          </div>
        </div>
      );
  }

  return null;
};

const playSound = (type) => {
  const soundFileMap = {
    'place-track': 'place-track.m4a',
    'place-landmark': 'place-landmark.m4a',
    'claim-passenger': 'claim-passenger.m4a',
    'win-game': 'win-game.mp3',
    'select-track': 'select-track.m4a',
    'rotate-track': 'rotate-track.m4a',
    'success': 'claim-passenger.m4a'
  };
  
  const file = soundFileMap[type];
  if (file) {
    const audio = new Audio(`/${file}`);
    audio.volume = 1.0; 
    audio.play().catch(e => console.log("Audio play failed", e));
  }
};

const AudioPlayer = ({ view }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const ambientRef = useRef(null);

  useEffect(() => {
    if (view === 'host' && audioRef.current) {
      audioRef.current.volume = 0.1; // Reduced background music volume
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      
      // Ambient Sound Loop (Continuous)
      if (ambientRef.current) {
          ambientRef.current.volume = 0.3; // Start low
          ambientRef.current.play().catch(e => console.log("Ambient fail", e));
          
          // Random volume fluctuation
          const fluctuate = () => {
             if(ambientRef.current) {
                 ambientRef.current.volume = Math.random() * 0.4 + 0.1; 
                 setTimeout(fluctuate, Math.random() * 10000 + 5000);
             }
          };
          fluctuate();
      }
    }
  }, [view]);

  if (view !== 'host') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <audio ref={audioRef} loop src="/mind-the-gap-theme.mp3" />
      <audio ref={ambientRef} loop src="/city-ambience.mp3" />
      <button onClick={() => {
        if(playing) {
            audioRef.current.pause();
            ambientRef.current.pause();
        } else {
            audioRef.current.play();
            ambientRef.current.play();
        }
        setPlaying(!playing);
      }} className="p-2 bg-[#1e1e2e] text-[#efe6d5] rounded-none shadow-[4px_4px_0px_0px_#efe6d5] border-2 border-[#efe6d5] hover:bg-[#2a2a3e] transition-colors">
        {playing ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>
    </div>
  );
};

// --- MAIN COMPONENT ---
const Board = ({ interactive, isMobile, lastEvent, gameState, handlePlaceCard, view }) => {
  // Memoized surge path calculation
  const surgePath = useMemo(() => {
    if (!gameState?.lastEvent || gameState.lastEvent.type !== 'claim-passenger') return new Set();
    // Only show surge for 2.5s
    if (Date.now() - gameState.lastEvent.timestamp > 2500) return new Set();

    const { playerColor, claimedLandmarkIds } = gameState.lastEvent;
    
    // PATHFINDING FOR SURGE
    const nodes = new Set();
    if(!claimedLandmarkIds || claimedLandmarkIds.length === 0) return new Set();

    const queue = [{ x: CENTER, y: CENTER }];
    const visited = new Set([`${CENTER},${CENTER}`]);
    const cameFrom = {}; // key -> parentKey
    
    const targetsFound = new Set();
    
    while(queue.length > 0) {
       const curr = queue.shift();
       const currKey = `${curr.x},${curr.y}`;
       const cell = getCell(gameState.grid, curr.x, curr.y);
       
       if (cell && cell.type === 'landmark' && claimedLandmarkIds.includes(cell.id)) {
           targetsFound.add(cell.id);
           // Trace back
           let trace = currKey;
           while(trace) {
               nodes.add(trace);
               trace = cameFrom[trace];
           }
       }
       
       [0,1,2,3].forEach(dir => {
          const nc = getNeighborCoords(curr.x, curr.y, dir);
          const key = `${nc.x},${nc.y}`;
          if(!visited.has(key)) {
             const nextCell = getCell(gameState.grid, nc.x, nc.y);
             const currObj = isStart(curr.x, curr.y) ? {isStart:true, type:'start'} : cell;
             const nextObj = isStart(nc.x, nc.y) ? {isStart:true, type:'start'} : nextCell;

             // Valid node if Start, Own Track, or Connected Landmark
             if(nextObj && (nextObj.isStart || (nextObj.type === 'track' && nextObj.owner === playerColor) || (nextObj.type === 'landmark' && nextObj.connections?.[playerColor] > 0))) {
                 if(areConnected(currObj, nextObj, dir)) {
                     visited.add(key);
                     cameFrom[key] = currKey;
                     queue.push(nc);
                 }
             }
          }
       });
    }
    return nodes;
  }, [gameState?.lastEvent, gameState?.grid]);

  return (
    <div 
      className={`grid ${isMobile ? 'gap-[1px]' : 'gap-0'} ${isMobile ? 'bg-transparent border-0' : 'bg-[#efe6d5] border-4 border-black'} rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] overflow-hidden select-none mx-auto relative backdrop-blur-sm`}
      style={{ 
        backgroundImage: 'url(/city-map.jpg)', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        width: '100%',
        aspectRatio: '1/1',
        maxWidth: isMobile ? 'none' : '1000px', 
        minWidth: isMobile ? '1200px' : 'auto', 
        maxHeight: isMobile ? 'none' : '90vh',
      }}
    >
      {gameState?.grid.map((row, y) => (
        row.map((cell, x) => (
          <Cell 
            key={`${x}-${y}`} 
            x={x} y={y} 
            cellData={cell} 
            onClick={interactive ? handlePlaceCard : () => {}} 
            view={view}
            isBlocked={gameState.blockedCells?.includes(`${x},${y}`)}
            isSurge={surgePath.has(`${x},${y}`)}
            decorImage={gameState.decorations?.[`${x},${y}`]}
          />
        ))
      ))}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [entryCode, setEntryCode] = useState(""); 
  const [activeRoomId, setActiveRoomId] = useState(""); 
  const [playerName, setPlayerName] = useState("");
  const [playerColor, setPlayerColor] = useState("red"); 
  const [gameState, setGameState] = useState(null);
  const [view, setView] = useState('home');
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(null);
  
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [interactionMode, setInteractionMode] = useState(null); 
  const [selectedLandmarkForMove, setSelectedLandmarkForMove] = useState(null);
  const [selectedPlayerToSkip, setSelectedPlayerToSkip] = useState(null);
  const [zoom, setZoom] = useState(1);
  const lastPinchDist = useRef(null);
  const lastPlayedEventTime = useRef(Date.now());
  const [availableColors, setAvailableColors] = useState(COLORS);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.innerHTML = `
      .font-retro { font-family: 'Press Start 2P', cursive; }
      .font-pixel { font-family: 'VT323', monospace; }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const initAuth = async () => { 
        try { 
            await signInAnonymously(auth); 
        } catch (err) { 
            console.error("Auth error:", err);
            // Fail silently in UI
        } 
    };
    initAuth();
    const sub = onAuthStateChanged(auth, (u) => {
        if (u) {
            setUser(u);
        } else {
            setUser(null);
        }
    });
    return () => sub();
  }, []);

  useEffect(() => {
    const savedRoom = sessionStorage.getItem('mind_the_gap_room');
    if (savedRoom && !activeRoomId) setActiveRoomId(savedRoom);
  }, []);

  useEffect(() => {
      if (view === 'player' && !sessionStorage.getItem('rules_viewed')) {
          setShowRules(true);
      }
  }, [view]);

  const closeRules = () => {
      setShowRules(false);
      sessionStorage.setItem('rules_viewed', 'true');
  };
  
  useEffect(() => {
    if (entryCode.length === 5) {
       const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'games', entryCode.toUpperCase()), (docSnap) => {
         if(docSnap.exists()) {
             const data = docSnap.data();
             const taken = data.players.map(p => p.color);
             setAvailableColors(COLORS.filter(c => !taken.includes(c)));
         }
       });
       return () => unsub();
    }
  }, [entryCode]);

  useEffect(() => {
    if (!user || !activeRoomId) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'games', activeRoomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.grid === 'string') data.grid = JSON.parse(data.grid);
        setGameState(data);
        
        const isHost = data.hostId === user.uid;
        if (isHost) {
            if (data.status === 'playing') setView('host'); 
            else setView('lobby');
        }
        else {
            const isPlayer = data.players.find(p => p.id === user.uid);
            if (isPlayer) {
                if (data.status === 'playing') setView('player'); else setView('lobby');
                sessionStorage.setItem('mind_the_gap_room', activeRoomId);
            }
        }
      } else { setError("Room not found"); setGameState(null); sessionStorage.removeItem('mind_the_gap_room'); }
    }, (err) => console.error("Sync error", err));
    return () => unsub();
  }, [user, activeRoomId]);

  useEffect(() => {
    if (view === 'host' && gameState?.lastEvent) {
      const event = gameState.lastEvent;
      if (event.timestamp > lastPlayedEventTime.current) {
        playSound(event.type);
        lastPlayedEventTime.current = event.timestamp;
      }
    }
  }, [gameState?.lastEvent, view]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      lastPinchDist.current = dist;
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const delta = dist - lastPinchDist.current;
      setZoom(z => Math.min(Math.max(z + delta * 0.005, 0.5), 3.0));
      lastPinchDist.current = dist;
    }
  };
  const handleTouchEnd = () => { lastPinchDist.current = null; };

  const createGame = async () => {
    if (!user) return;
    const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const initialGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const landmarks = generateLandmarks();
    const passengers = generatePassengers(landmarks);
    const activePassengers = passengers.splice(0, 3);
    const metroDeck = generateMetroDeck();
    const initialData = {
      hostId: user.uid, status: 'lobby', players: [],
      grid: JSON.stringify(initialGrid), turnIndex: 0, totalTurns: 0, 
      decks: { tracks: generateTrackDeck(), landmarks, passengers, metro: metroDeck },
      activePassengers, blockedCells: [], winner: null, lastEvent: null,
      mostConnected: null, movesLeft: 1, skippedPlayers: [], decorations: {}, gameLog: []
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', newRoomId), initialData);
    setEntryCode(newRoomId); setActiveRoomId(newRoomId);
  };

  const joinGame = async () => {
    if (!entryCode || !playerName || !user) { setError("Please enter info."); return; }
    if (!playerColor) { setError("Pick a color!"); return; }
    const codeToJoin = entryCode.toUpperCase();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', codeToJoin);
    try {
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw "Room does not exist";
        const data = roomDoc.data();
        if (data.status !== 'lobby') throw "Game already started";
        if (data.players.length >= 4) throw "Room full";
        if (data.players.find(p => p.id === user.uid)) return;
        if (data.players.find(p => p.color === playerColor)) throw "Color taken";
        
        const newPlayer = {
          id: user.uid, name: playerName, color: playerColor,
          score: 0, hand: { tracks: [], landmarks: [], metro: [] }, completedPassengers: []
        };
        transaction.update(roomRef, { players: arrayUnion(newPlayer) });
      });
      setActiveRoomId(codeToJoin); setError("");
    } catch (e) { setError(e.toString()); }
  };

  const startGame = async () => {
    if (!gameState) return;
    const updatedPlayers = gameState.players.map(p => {
      const tracks = gameState.decks.tracks.splice(0, 3);
      const landmarks = gameState.decks.landmarks.splice(0, 2);
      return { ...p, hand: { tracks, landmarks, metro: [] } };
    });
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', activeRoomId), {
      status: 'playing', players: updatedPlayers, decks: gameState.decks 
    });
  };

  const endTurn = async (updates, winner, lastEvent) => {
    const nextTurn = (gameState.turnIndex + 1) % gameState.players.length;
    let actualNextTurn = nextTurn;
    let newSkipped = updates.skippedPlayers || gameState.skippedPlayers || [];
    
    const nextPlayerId = gameState.players[actualNextTurn].id;
    if (newSkipped.includes(nextPlayerId)) {
        actualNextTurn = (actualNextTurn + 1) % gameState.players.length;
        newSkipped = newSkipped.filter(id => id !== nextPlayerId);
    }

    let newPlayers = updates.players || gameState.players;
    const isRoundEnd = (gameState.totalTurns + 1) % gameState.players.length === 0;
    let newDecks = updates.decks || gameState.decks;
    
    if (isRoundEnd) {
      newPlayers = newPlayers.map(p => {
        const newP = { ...p, hand: { ...p.hand } };
        while (newP.hand.tracks.length < 3 && newDecks.tracks.length > 0) newP.hand.tracks.push(newDecks.tracks.pop());
        while (newP.hand.landmarks.length < 2 && newDecks.landmarks.length > 0) newP.hand.landmarks.push(newDecks.landmarks.pop());
        return newP;
      });
    }

    // UPDATE LOG
    let newLog = gameState.gameLog || [];
    if (lastEvent) {
       let msg = "";
       if (lastEvent.type === 'claim-passenger') msg = `${lastEvent.playerName} claimed ${lastEvent.passengerNames[0]}!`;
       else if (lastEvent.type === 'place-track') msg = `${lastEvent.playerColor.toUpperCase()} placed a track.`;
       else if (lastEvent.type === 'place-landmark') msg = `${lastEvent.playerColor.toUpperCase()} built a landmark.`;
       
       if (msg) newLog = [msg, ...newLog].slice(0, 8); // Keep last 8
    }

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', activeRoomId), {
      ...updates, players: newPlayers, decks: newDecks,
      turnIndex: actualNextTurn, winner: winner || null,
      lastEvent: lastEvent || gameState.lastEvent,
      totalTurns: (gameState.totalTurns || 0) + 1,
      movesLeft: 1, skippedPlayers: newSkipped,
      gameLog: newLog
    });
    setSelectedCardIdx(null); setSelectedCardType(null); setRotation(0);
    setInteractionMode(null); setSelectedLandmarkForMove(null); setSelectedPlayerToSkip(null);
  };

  const restartGame = async () => {
    const initialGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const landmarks = generateLandmarks();
    const passengers = generatePassengers(landmarks);
    const activePassengers = passengers.splice(0, 3);
    const metroDeck = generateMetroDeck();
    
    const resetPlayers = gameState.players.map(p => ({
        ...p, score: 0, hand: { tracks: [], landmarks: [], metro: [] }, completedPassengers: []
    }));
    
    const dealPlayers = resetPlayers.map(p => {
        const tracks = generateTrackDeck().splice(0,3);
        const lms = landmarks.splice(0,2);
        return { ...p, hand: { tracks, landmarks: lms, metro: [] }};
    });

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', activeRoomId), {
      grid: JSON.stringify(initialGrid),
      players: dealPlayers,
      decks: { tracks: generateTrackDeck(), landmarks, passengers, metro: metroDeck },
      activePassengers,
      totalTurns: 0,
      turnIndex: 0,
      winner: null,
      blockedCells: [], mostConnected: null, skippedPlayers: [], movesLeft: 1, decorations: {}, gameLog: []
    });
  };
  
  const leaveGame = () => { sessionStorage.removeItem('mind_the_gap_room'); setActiveRoomId(""); setGameState(null); setView('home'); setEntryCode(""); };

  const handleSignalFailureSelect = (victimId) => {
      const playerIdx = gameState.players.findIndex(p => p.id === user.uid);
      const newSkipped = [...(gameState.skippedPlayers || []), victimId];
      
      const newHand = { ...gameState.players[playerIdx].hand };
      newHand.metro.splice(selectedCardIdx, 1);
      const newPlayers = [...gameState.players];
      newPlayers[playerIdx] = { ...gameState.players[playerIdx], hand: newHand };
      
      endTurn({ skippedPlayers: newSkipped, players: newPlayers }, null, null);
  };

  const handleMetroCardAction = (idx) => {
      const playerIdx = gameState.players.findIndex(p => p.id === user.uid);
      if (playerIdx !== gameState.turnIndex) { alert("Not your turn!"); return; }
      
      const card = gameState.players[playerIdx].hand.metro[idx];
      setSelectedCardIdx(idx); setSelectedCardType('metro');

      const consumeCard = (updates = {}, skipEndTurn = false) => {
          const newHand = { ...gameState.players[playerIdx].hand };
          newHand.metro.splice(idx, 1);
          const newPlayers = [...gameState.players];
          newPlayers[playerIdx] = { ...gameState.players[playerIdx], hand: newHand };
          if(skipEndTurn) {
              updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', activeRoomId), { players: newPlayers, ...updates });
              setSelectedCardIdx(null); setSelectedCardType(null); 
          } else {
             endTurn({ players: newPlayers, ...updates }, null, null);
          }
      };

      if (card.id === 'rush_hour') { 
          const newDecks = { ...gameState.decks };
          let newActive = [];
          newDecks.passengers = [...newDecks.passengers, ...gameState.activePassengers];
          for(let i=0; i<3; i++) { if (newDecks.passengers.length > 0) { const p = newDecks.passengers.shift(); p.unlockTurn = (gameState.totalTurns || 0) + gameState.players.length; newActive.push(p); } }
          consumeCard({ decks: newDecks, activePassengers: newActive });
      } 
      else if (card.id === 'express_service') {
          consumeCard({ movesLeft: 2 }, true);
          alert("Express Service Active! You can place 2 cards this turn.");
      }
      else if (card.id === 'signal_failure') {
          setInteractionMode('signal_failure');
      }
      else if (card.id === 'track_maint') { setInteractionMode('track_maint'); alert("Select an empty grid square to block.");
      } else if (card.id === 'grand_opening') { setInteractionMode('grand_opening_select_source'); alert("Select a Landmark to replace.");
      } else if (card.id === 'rezoning') { 
          const newDecks = { ...gameState.decks }; const newHand = { ...gameState.players[playerIdx].hand };
          newDecks.landmarks.push(...newHand.landmarks); 
          newDecks.landmarks.sort(() => Math.random() - 0.5); 
          newHand.landmarks = [];
          if(newDecks.landmarks.length >= 2) { newHand.landmarks.push(newDecks.landmarks.pop()); newHand.landmarks.push(newDecks.landmarks.pop()); }
          newHand.metro.splice(idx, 1);
          const newPlayers = [...gameState.players]; newPlayers[playerIdx] = { ...gameState.players[playerIdx], hand: newHand };
          endTurn({ decks: newDecks, players: newPlayers }, null, null);
      } else if (card.id === 'carpool') {
          const opponents = gameState.players.filter(p => p.id !== user.uid);
          if (opponents.length === 0) return;
          const victim = opponents[Math.floor(Math.random() * opponents.length)];
          const victimIdx = gameState.players.findIndex(p => p.id === victim.id);
          const newVictimHand = { ...victim.hand };
          const newPlayerHand = { ...gameState.players[playerIdx].hand };
          const pool = [];
          newVictimHand.tracks.forEach((_, i) => pool.push({type: 'tracks', idx: i}));
          newVictimHand.landmarks.forEach((_, i) => pool.push({type: 'landmarks', idx: i}));
          if (pool.length > 0) {
              const stealTarget = pool[Math.floor(Math.random() * pool.length)];
              const stolenCard = newVictimHand[stealTarget.type].splice(stealTarget.idx, 1)[0];
              if (stealTarget.type === 'tracks') newPlayerHand.tracks.push(stolenCard); else newPlayerHand.landmarks.push(stolenCard);
          }
          newPlayerHand.metro.splice(idx, 1);
          const newPlayers = [...gameState.players];
          newPlayers[playerIdx] = { ...gameState.players[playerIdx], hand: newPlayerHand };
          newPlayers[victimIdx] = { ...gameState.players[victimIdx], hand: newVictimHand };
          alert(`You stole a card from ${victim.name}!`);
          endTurn({ players: newPlayers }, null, null);
      }
  };

  const handlePlaceCard = (x, y) => {
    if (view !== 'player') return;
    const playerIdx = gameState.players.findIndex(p => p.id === user.uid);
    if (playerIdx !== gameState.turnIndex) { alert("Not your turn!"); return; }
    
    if (interactionMode === 'track_maint') {
        const cell = getCell(gameState.grid, x, y);
        if (cell !== null || isStart(x, y) || gameState.blockedCells?.includes(`${x},${y}`)) { alert("Must select an empty square."); return; }
        const newBlocked = [...(gameState.blockedCells || []), `${x},${y}`];
        const newHand = { ...gameState.players[playerIdx].hand }; newHand.metro.splice(selectedCardIdx, 1);
        const newPlayers = [...gameState.players]; newPlayers[playerIdx] = { ...gameState.players[playerIdx], hand: newHand };
        endTurn({ blockedCells: newBlocked, players: newPlayers }, null, null); return;
    }
    if (interactionMode === 'grand_opening_select_source') {
        const cell = getCell(gameState.grid, x, y);
        if (!cell || cell.type !== 'landmark') { alert("Select a Landmark to replace."); return; }
        
        const newGrid = JSON.parse(JSON.stringify(gameState.grid)); // Deep copy
        const newLandmark = gameState.players[playerIdx].hand.landmarks[0];
        if (!newLandmark) { alert("You need a landmark in hand to replace!"); return; }
        
        newGrid[y][x] = { ...newLandmark, connections: cell.connections, type: 'landmark' };
        
        const newHand = { ...gameState.players[playerIdx].hand };
        newHand.landmarks.splice(0, 1); 
        newHand.metro.splice(selectedCardIdx, 1); 
        const newPlayers = [...gameState.players];
        newPlayers[playerIdx] = { ...gameState.players[playerIdx], hand: newHand };
        endTurn({ grid: JSON.stringify(newGrid), players: newPlayers }, null, null); return;
    }

    if (selectedCardIdx === null || selectedCardType === 'metro') return;
    const player = gameState.players[playerIdx];
    const card = selectedCardType === 'tracks' ? player.hand.tracks[selectedCardIdx] : player.hand.landmarks[selectedCardIdx];
    if (!card) return;

    const grid = gameState.grid;
    if (grid[y][x] !== null) { alert("Space occupied"); return; }
    if (gameState.blockedCells?.includes(`${x},${y}`)) { alert("This square is under construction!"); return; }

    const candidateCell = { ...card, owner: player.color, rotation: rotation, type: card.type, isStart: false };
    
    let validConnectionFound = false;
    const neighbors = [0,1,2,3].map(d => getNeighborCoords(x, y, d));
    for (let i = 0; i < neighbors.length; i++) {
      const n = neighbors[i]; const dir = i;
      const neighborCell = getCell(grid, n.x, n.y); const isNeighborStart = isStart(n.x, n.y);
      if (neighborCell && neighborCell.type === 'landmark') {
        if (areConnected(candidateCell, neighborCell, dir)) {
           const currentConns = neighborCell.connections?.[player.color] || 0;
           if (currentConns >= 2) { alert("Limit Reached: Max 2 connections."); return; }
        }
      }
      let canConnectToNeighbor = false;
      if (isNeighborStart) canConnectToNeighbor = true;
      else if (neighborCell) {
        if (neighborCell.type === 'track' && neighborCell.owner === player.color) canConnectToNeighbor = true;
        if (neighborCell.type === 'landmark' && neighborCell.connections && neighborCell.connections[player.color] > 0) canConnectToNeighbor = true;
      }
      if (canConnectToNeighbor) {
         const targetObj = isNeighborStart ? { isStart: true, type: 'start' } : neighborCell;
         if (areConnected(candidateCell, targetObj, dir)) validConnectionFound = true;
      }
    }
    if (!validConnectionFound) { alert("Must connect physically."); return; }
    if (card.type === 'landmark') {
      const isSafeDistance = check3TrackRule(grid, x, y, player.color);
      if (!isSafeDistance) { alert("Landmarks must be separated by 3 tracks."); return; }
      card.connections = {}; 
    }

    const newGrid = JSON.parse(JSON.stringify(grid)); // Deep copy grid to ensure re-render
    newGrid[y][x] = { ...card, owner: player.color, rotation, connectedColors: card.type === 'track' ? [player.color] : [] };
    playSound(card.type === 'track' ? 'place-track' : 'place-landmark');

    // DECORATIONS LOGIC
    let newDecorations = gameState.decorations || {};
    if (newDecorations[`${x},${y}`]) {
        const d = { ...newDecorations };
        delete d[`${x},${y}`];
        newDecorations = d;
    }
    if (Math.random() < 0.35) { // Adjusted to 35%
        let attempts = 0;
        while(attempts < 50) {
            const rx = Math.floor(Math.random() * GRID_SIZE);
            const ry = Math.floor(Math.random() * GRID_SIZE);
            if (!getCell(newGrid, rx, ry) && !isStart(rx, ry) && !newDecorations[`${rx},${ry}`]) {
                const randomImg = DECOR_IMAGES[Math.floor(Math.random() * DECOR_IMAGES.length)];
                newDecorations = { ...newDecorations, [`${rx},${ry}`]: randomImg };
                break;
            }
            attempts++;
        }
    }

    let pointsGained = 0;
    const completedPassengerIds = [];
    const playerConnectedLandmarks = new Set();
    const refreshConnections = () => {
      playerConnectedLandmarks.clear();
      newGrid.forEach(row => row.forEach(c => {
        if (c && c.type === 'landmark' && c.connections && c.connections[player.color] > 0) playerConnectedLandmarks.add(c.id);
      }));
    };
    if (card.type === 'landmark') newGrid[y][x].connections = { [player.color]: 1 };
    else {
      neighbors.forEach((n, dir) => {
        const cell = getCell(newGrid, n.x, n.y);
        if (cell && cell.type === 'landmark') {
           const currentConnections = cell.connections || {};
           const myConnCount = currentConnections[player.color] || 0;
           if (myConnCount < 2 && areConnected(newGrid[y][x], cell, dir)) {
                if (!cell.connections) cell.connections = {};
                cell.connections[player.color] = myConnCount + 1;
           }
        }
      });
    }
    refreshConnections(); // Ensure fresh state before checking

    let currentMostConnected = gameState.mostConnected; 
    let bonusEvent = null;
    const myCount = playerConnectedLandmarks.size;
    if (myCount >= 10) {
        if (!currentMostConnected || myCount > currentMostConnected.count) {
            currentMostConnected = { playerId: player.id, count: myCount };
            bonusEvent = { type: 'most-connected', playerColor: player.color, playerName: player.name, count: myCount, timestamp: Date.now() };
            playSound('success'); 
        } else if (currentMostConnected.playerId === player.id) {
            currentMostConnected.count = myCount;
        }
    }

    const claimedPassengerNames = [];
    // --- UPDATED CLAIM TRACKING FOR SURGE ---
    const claimedLandmarkIds = [];

    const checkPassenger = (p) => {
      // FORCE REFRESH connection for current user before checking
      // (This is redundant but ensures safety)
      if (p.unlockTurn && gameState.totalTurns < p.unlockTurn) return false;
      if (completedPassengerIds.includes(p.id)) return false;
      let match = false;
      const myLandmarks = []; newGrid.forEach(r => r.forEach(c => { if(c && c.type === 'landmark' && playerConnectedLandmarks.has(c.id)) myLandmarks.push(c); }));
      const currentClaimed = [];

      if (p.reqType === 'specific' && playerConnectedLandmarks.has(p.targetId)) { match = true; currentClaimed.push(p.targetId); }
      else if (p.reqType === 'category') { const matches = myLandmarks.filter(l => l.category === p.targetCategory); if (matches.length > 0) { match = true; matches.forEach(m => currentClaimed.push(m.id)); } }
      else if (p.reqType === 'list') { const matches = p.targets.filter(tid => playerConnectedLandmarks.has(tid)); if (matches.length > 0) { match = true; currentClaimed.push(...matches); } } 
      // LOGIC FIX: Combo AND check
      else if (p.reqType === 'combo') { 
         // Must match index 0 AND index 1
         if(playerConnectedLandmarks.has(p.targets[0]) && playerConnectedLandmarks.has(p.targets[1])) { 
             match = true; 
             currentClaimed.push(p.targets[0], p.targets[1]); 
         } 
      }
      else if (p.reqType === 'combo_cat') { 
          const hasT1 = playerConnectedLandmarks.has(p.targetId);
          const cat2Matches = myLandmarks.filter(l => l.category === p.cat2);
          // Must match specific target AND at least one category match
          if(hasT1 && cat2Matches.length > 0) { 
              match = true; 
              currentClaimed.push(p.targetId); 
              cat2Matches.forEach(m => currentClaimed.push(m.id)); 
          }
      }

      if (match) { pointsGained += p.points; completedPassengerIds.push(p.id); claimedPassengerNames.push(p.name); claimedLandmarkIds.push(...currentClaimed); return true; }
      return false;
    };
    gameState.activePassengers.forEach(checkPassenger);
    
    let lastEvent = bonusEvent; 
    if (pointsGained > 0) {
        lastEvent = { 
            type: 'claim-passenger', playerColor: player.color, playerName: player.name, 
            passengerNames: claimedPassengerNames, timestamp: Date.now(), coords: { x, y },
            claimedLandmarkIds: claimedLandmarkIds 
        };
        playSound('claim-passenger');
    } else if (!lastEvent) {
        lastEvent = { type: card.type === 'track' ? 'place-track' : 'place-landmark', playerColor: player.color, timestamp: Date.now() };
    }

    const newHand = { ...player.hand };
    if (selectedCardType === 'tracks') newHand.tracks.splice(selectedCardIdx, 1);
    else newHand.landmarks.splice(selectedCardIdx, 1);
    
    const newDecks = { ...gameState.decks };
    if (selectedCardType === 'tracks' && newHand.tracks.length < 3 && newDecks.tracks.length > 0) newHand.tracks.push(newDecks.tracks.pop());
    if (selectedCardType === 'landmarks' && newHand.landmarks.length < 2 && newDecks.landmarks.length > 0) newHand.landmarks.push(newDecks.landmarks.pop());
    
    if (pointsGained > 0 && newDecks.metro && newDecks.metro.length > 0) newHand.metro.push(newDecks.metro.pop());

    let newActivePassengers = [...gameState.activePassengers];
    if (completedPassengerIds.length > 0) {
      newActivePassengers = newActivePassengers.filter(p => !completedPassengerIds.includes(p.id));
      while (newActivePassengers.length < 3 && newDecks.passengers.length > 0) {
        const nextPass = newDecks.passengers.pop();
        nextPass.unlockTurn = (gameState.totalTurns || 0) + gameState.players.length; 
        newActivePassengers.push(nextPass);
      }
    }

    const newPlayers = [...gameState.players];
    let currentScore = player.score + pointsGained;
    newPlayers[playerIdx] = { ...player, hand: newHand, score: currentScore };

    let winner = null;
    const hasBonus = currentMostConnected?.playerId === player.id;
    const effectiveScore = currentScore + (hasBonus ? 2 : 0);
    if (effectiveScore >= WIN_SCORE) { 
        winner = newPlayers[playerIdx]; 
        lastEvent = { type: 'win-game', playerColor: player.color, playerName: player.name, timestamp: Date.now() }; 
        playSound('win-game');
    }

    const movesLeft = (gameState.movesLeft || 1) - 1;
    if (movesLeft > 0) {
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', activeRoomId), {
          grid: JSON.stringify(newGrid), players: newPlayers, decks: newDecks, 
          activePassengers: newActivePassengers, winner, lastEvent, mostConnected: currentMostConnected,
          movesLeft: movesLeft, decorations: newDecorations
        });
        setSelectedCardIdx(null); setSelectedCardType(null); setRotation(0);
    } else {
        endTurn({ 
            grid: JSON.stringify(newGrid), players: newPlayers, decks: newDecks, 
            activePassengers: newActivePassengers, mostConnected: currentMostConnected,
            decorations: newDecorations
        }, winner, lastEvent);
    }
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-[#1e1e2e] text-[#efe6d5] flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e66a4e] via-[#f2ca50] via-[#63a669] to-[#5d76f2] mb-8 tracking-tighter text-center z-10 drop-shadow-lg font-retro">
          MIND THE GAP
        </h1>
        <div className="flex flex-col gap-4 w-full max-w-md z-10 font-questrial">
          <div className="flex flex-col gap-2 w-full bg-[#1e1e2e] p-6 rounded-none shadow-[8px_8px_0px_0px_#000] border-4 border-[#efe6d5]">
            <h3 className="text-xl font-bold text-center mb-4 font-retro text-[#f2ca50]">Join Room</h3>
            <input 
              type="text" placeholder="Room Code" 
              className="px-4 py-2 rounded-none bg-[#1e1e2e] border-2 border-[#efe6d5] focus:border-[#5d76f2] outline-none text-center uppercase tracking-widest w-full font-bold font-retro text-[#efe6d5]"
              value={entryCode} onChange={e => setEntryCode(e.target.value.toUpperCase())}
            />
            {entryCode.length === 5 && (
                <div className="grid grid-cols-4 gap-2 my-2">
                    {COLORS.map(c => (
                        <button key={c} onClick={() => setPlayerColor(c)} disabled={!availableColors.includes(c)} className={`h-10 rounded-none border-2 border-black transition-all ${playerColor === c ? 'ring-4 ring-white scale-105' : ''} ${!availableColors.includes(c) ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-80'}`} style={{ backgroundColor: THEME[c] }}>
                            {playerColor === c && <Check size={20} className="mx-auto text-white drop-shadow-md" />}
                        </button>
                    ))}
                </div>
            )}
            <input 
              type="text" placeholder="Your Name" 
              className="px-4 py-2 rounded-none bg-[#1e1e2e] border-2 border-[#efe6d5] focus:border-[#5d76f2] outline-none text-center w-full text-[#efe6d5] font-pixel text-xl"
              value={playerName} onChange={e => setPlayerName(e.target.value)}
            />
            <button onClick={joinGame} className="px-8 py-3 bg-[#63a669] hover:bg-[#528a57] text-[#1e1e2e] font-black text-lg rounded-none shadow-[4px_4px_0px_0px_black] w-full mt-4 transition-transform active:translate-y-1 active:shadow-none border-2 border-black font-retro">Join Game</button>
          </div>
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t-2 border-[#efe6d5]/20"></div><span className="flex-shrink mx-4 text-[#efe6d5]/50 text-xs uppercase font-pixel">OR</span><div className="flex-grow border-t-2 border-[#efe6d5]/20"></div>
          </div>
          <button onClick={createGame} className="px-8 py-3 bg-[#5d76f2] hover:bg-[#4b63d6] text-[#efe6d5] font-black text-lg rounded-none shadow-[4px_4px_0px_0px_black] transition-transform active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 w-full border-2 border-black font-retro"><Crown size={20}/> Create New Room</button>
        </div>
      </div>
    );
  }

  if (gameState?.winner) return <WinnerModal winner={gameState.winner} onRestart={restartGame} onExit={leaveGame} />;

  if (view === 'lobby') {
    return (
      <div className="min-h-screen bg-[#1e1e2e] text-[#efe6d5] flex flex-col items-center justify-center p-4">
        <AudioPlayer view={view} />
        <h2 className="text-4xl font-bold mb-2 font-retro text-[#f2ca50]">Lobby: {activeRoomId}</h2>
        <p className="text-gray-400 mb-8 font-pixel text-2xl">Waiting for players...</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {gameState?.players.map((p, i) => (
            <div key={i} className={`p-6 rounded-none bg-[#1e1e2e] border-4 border-[${THEME[p.color]}] flex flex-col items-center shadow-[8px_8px_0px_0px_black]`}>
              <div className={`w-12 h-12 rounded-full bg-[${THEME[p.color]}] mb-2 border-2 border-black`}></div>
              <span className="font-bold text-lg font-retro text-[#efe6d5]">{p.name}</span>
            </div>
          ))}
          {[...Array(4 - (gameState?.players.length || 0))].map((_, i) => <div key={i} className="p-6 rounded-none bg-white/5 border-4 border-dashed border-[#efe6d5]/20 flex flex-col items-center justify-center text-[#efe6d5]/50 font-pixel text-xl">Waiting...</div>)}
        </div>
        {gameState?.hostId === user.uid ? (
          <button onClick={startGame} disabled={gameState?.players.length < 2} className="px-12 py-4 bg-[#f2ca50] hover:bg-[#d9b646] text-[#1e1e2e] font-black text-2xl rounded-none shadow-[8px_8px_0px_0px_black] transition-transform active:translate-y-1 active:shadow-none disabled:opacity-50 font-retro border-4 border-black">START GAME</button> 
        ) : (
          <p className="animate-pulse text-xl font-medium text-center font-pixel text-[#f2ca50]">Host will start the game soon...</p>
        )}
        <button onClick={leaveGame} className="absolute top-4 right-4 p-2 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white rounded-none border-2 border-red-500 z-50 transition-colors"><X size={20} /></button>
      </div>
    );
  }

  if (view === 'host') {
    return (
      <div className="h-screen bg-[#1e1e2e] text-[#efe6d5] flex flex-col p-4 gap-4 overflow-hidden relative font-questrial">
        <AudioPlayer view="host" />
        <NotificationOverlay event={gameState.lastEvent} />
        
        {/* HEADER */}
        <div className="flex justify-between items-center w-full z-10 bg-[#1e1e2e] pb-2 border-b-4 border-black h-16 shrink-0">
             <div className="flex items-center gap-4">
                 <h1 className="text-2xl font-retro font-black text-[#efe6d5]">MIND THE GAP: <span className="text-[#f2ca50]">{activeRoomId}</span></h1>
             </div>
             
             <div className="flex gap-4 items-center">
                 {/* HORIZONTAL STANDINGS */}
                 <div className="flex gap-2">
                    {gameState.players.sort((a,b) => b.score - a.score).map((p, i) => (
                        <div key={i} className={`flex items-center px-3 py-1 rounded-full border-2 border-black bg-[${THEME[p.color]}] text-[#1e1e2e]`}>
                          <span className="font-bold text-xs font-retro mr-2">{i+1}{i===0?'ST':i===1?'ND':i===2?'RD':'TH'}</span>
                          <span className="font-bold text-sm font-pixel uppercase">{p.name}</span>
                          <span className="ml-2 font-black font-retro bg-black text-[#efe6d5] px-1.5 py-0.5 text-[10px] rounded-full">{p.score + (gameState.mostConnected?.playerId === p.id ? 2 : 0)}</span>
                        </div>
                    ))}
                 </div>
                 <button onClick={leaveGame} className="px-4 py-2 bg-[#e66a4e] hover:bg-[#d55e45] text-[#efe6d5] font-retro text-xs border-2 border-black shadow-[4px_4px_0px_0px_black] transition-transform active:translate-y-1 active:shadow-none">EXIT</button>
             </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex-1 flex w-full h-full gap-6 overflow-hidden pt-2">
            
            {/* LEFT SIDEBAR - PASSENGERS */}
            <div className="w-1/3 min-w-[350px] flex flex-col gap-4 h-full z-10 overflow-hidden">
                <div className="bg-[#1e1e2e] border-2 border-[#efe6d5]/30 p-2 h-32 overflow-y-auto mb-2 text-[12px] font-pixel text-[#efe6d5]/70 shrink-0">
                    {gameState.gameLog?.map((log, i) => <div key={i} className="border-b border-[#efe6d5]/10 pb-1 mb-1">{log}</div>)}
                </div>
                <h3 className="text-sm font-bold text-[#efe6d5] flex items-center gap-2 uppercase tracking-wide font-retro shrink-0">CURRENT PASSENGERS:</h3>
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 pb-4">
                  {gameState.activePassengers.map(pass => (
                    <div key={pass.id} className={`bg-[#efe6d5] w-full rounded-lg border-4 border-black relative transform transition-all duration-300 flex flex-row h-32 shrink-0 ${gameState.totalTurns < pass.unlockTurn ? 'opacity-50 grayscale' : ''}`}>
                      {gameState.totalTurns < pass.unlockTurn && <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"><span className="bg-[#e66a4e] text-[#efe6d5] px-2 py-1 font-bold border-2 border-black font-retro text-[10px] shadow-[2px_2px_0px_0px_black]">Arriving Soon</span></div>}
                      
                      {/* Left: Character & Info */}
                      <div className="w-1/3 bg-[#8ecae6] flex flex-col items-center justify-between border-r-4 border-black p-1 relative">
                          <img src={`/${pass.img}`} className="w-16 h-16 object-contain z-10 rendering-pixelated mt-1" alt="char" />
                          <div className="w-full bg-white border-t-2 border-black p-1 text-center">
                             <span className="font-black text-[8px] font-retro text-black uppercase block leading-tight mb-0.5 truncate">{pass.name}</span>
                             <span className="font-black text-lg font-retro text-[#e66a4e]">{pass.points}</span>
                          </div>
                      </div>

                      {/* Right: Speech & Progress */}
                      <div className="flex-1 flex flex-col justify-between p-2 bg-[#efe6d5]">
                          {/* Bubble */}
                          <div className="bg-[#782e53] flex-1 rounded-sm border-2 border-black p-2 flex items-center justify-center relative mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                              <p className="text-xs font-bold font-pixel leading-tight text-center text-[#efe6d5] uppercase tracking-wide line-clamp-3">{pass.desc}</p>
                          </div>
                          
                          {/* Progress Dots */}
                          <div className="flex gap-1 justify-end h-3">
                              {gameState.players.map(pl => {
                                   const connectedLMs = new Set();
                                   gameState.grid.forEach(r => r.forEach(c => { if(c && c.type === 'landmark' && c.connections && c.connections[pl.color] > 0) connectedLMs.add(c.id); }));
                                   let opacity = 'opacity-20';
                                   let ring = '';
                                   if (pass.reqType === 'combo' || pass.reqType === 'combo_cat') {
                                       let count = 0;
                                       if(pass.reqType === 'combo') { if(connectedLMs.has(pass.targets[0])) count++; if(connectedLMs.has(pass.targets[1])) count++; } 
                                       else { if(connectedLMs.has(pass.targetId)) count++; const myLandmarks = []; gameState.grid.forEach(r => r.forEach(c => { if(c && c.type === 'landmark' && connectedLMs.has(c.id)) myLandmarks.push(c); })); if(myLandmarks.some(l => l.category === pass.cat2)) count++; }
                                       if (count === 1) opacity = 'opacity-50'; if (count === 2) { opacity = 'opacity-100'; ring = 'ring-2 ring-black'; }
                                   } else {
                                       let met = false;
                                       const myLandmarks = []; gameState.grid.forEach(r => r.forEach(c => { if(c && c.type === 'landmark' && connectedLMs.has(c.id)) myLandmarks.push(c); }));
                                       if(pass.reqType === 'specific' && connectedLMs.has(pass.targetId)) met = true;
                                       if(pass.reqType === 'category' && myLandmarks.some(l => l.category === pass.targetCategory)) met = true;
                                       if(pass.reqType === 'list' && pass.targets.some(t => connectedLMs.has(t))) met = true;
                                       if (met) { opacity = 'opacity-100'; ring = 'ring-2 ring-black'; }
                                   }
                                   return <div key={pl.id} className={`w-3 h-3 rounded-full bg-[${THEME[pl.color]}] border border-black ${opacity} ${ring}`}></div>
                              })}
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>

            {/* MAP AREA */}
            <div className="flex-1 flex items-center justify-center rounded-xl overflow-hidden relative border-4 border-[#efe6d5] bg-[#efe6d5]">
               <div className="absolute inset-4 flex items-center justify-center"><Board interactive={false} isMobile={false} lastEvent={gameState.lastEvent} gameState={gameState} handlePlaceCard={handlePlaceCard} view={view} /></div>
            </div>
        </div>
      </div>
    );
  }

  if (view === 'player') {
    if (!gameState || !gameState.players) return <div className="min-h-screen bg-[#1e1e2e] text-[#efe6d5] flex items-center justify-center animate-pulse font-retro">Loading...</div>;
    const player = gameState.players.find(p => p.id === user.uid);
    if (!player) return <div className="min-h-screen bg-[#1e1e2e] text-[#efe6d5] p-8 font-retro">Error: Player not found.</div>;
    const isMyTurn = gameState.players[gameState.turnIndex]?.id === user.uid;
    const connectedLandmarks = [];
    if (gameState && gameState.grid) gameState.grid.forEach(row => row.forEach(cell => { if (cell && cell.type === 'landmark' && cell.connections && cell.connections[player.color] > 0) connectedLandmarks.push(cell); }));
    
    const displayScore = player.score + (gameState.mostConnected?.playerId === player.id ? 2 : 0);

    return (
      <div className="h-[100dvh] bg-[#1e1e2e] text-[#efe6d5] flex flex-col overflow-hidden font-questrial">
        <AudioPlayer view="player" />
        <NotificationOverlay event={gameState.lastEvent} />
        {showRules && <RulesModal onClose={closeRules} />}
        {/* Signal Failure Modal */}
        {interactionMode === 'signal_failure' && (
             <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                 <h2 className="text-2xl font-bold mb-6 font-retro text-[#efe6d5]">SKIP WHO?</h2>
                 <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                     {gameState.players.filter(p => p.id !== user.uid).map(p => (
                         <button key={p.id} onClick={() => handleSignalFailureSelect(p.id)} className={`p-6 bg-[#1e1e2e] border-4 border-[${THEME[p.color]}] rounded-none shadow-[4px_4px_0px_0px_#fff] flex flex-col items-center gap-2 hover:bg-white/10 active:translate-y-1 active:shadow-none`}>
                             <div className={`w-12 h-12 rounded-full bg-[${THEME[p.color]}] border-2 border-white`}></div>
                             <span className="font-bold font-pixel text-xl uppercase">{p.name}</span>
                         </button>
                     ))}
                 </div>
                 <button onClick={() => setInteractionMode(null)} className="mt-8 text-gray-400 underline font-pixel uppercase tracking-widest text-lg">Cancel</button>
             </div>
        )}

        <div className={`border-b-4 border-black shrink-0 z-20 shadow-md transition-colors duration-500 ${isMyTurn ? 'bg-[#63a669] text-[#1e1e2e]' : 'bg-[#1e1e2e] text-[#efe6d5]'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="h-16 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-[${THEME[player.color]}] border-2 border-white shadow-sm`}></div>
                <span className="font-bold text-lg truncate max-w-[120px] font-retro">{player.name}</span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end leading-none">
                    <span className="text-[10px] tracking-wider font-pixel uppercase opacity-80">SCORE</span>
                    <span className="text-3xl font-black font-retro flex items-center gap-1">
                        {displayScore} 
                        {gameState.mostConnected?.playerId === player.id && <LinkIcon size={16} className={isMyTurn ? "text-[#1e1e2e]" : "text-[#5d76f2]"} />}
                    </span>
                 </div>
                 {isMyTurn && <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>}
                 <button onClick={() => setShowRules(true)} className="text-[#efe6d5] hover:text-white mx-1"><HelpCircle size={20}/></button>
                 <button onClick={leaveGame} className="opacity-50 hover:opacity-100"><LogOut size={20}/></button>
              </div>
            </div>
            {/* Connected Bar */}
            {connectedLandmarks.length > 0 && (
              <div className="px-4 py-2 bg-black/20 border-t-2 border-black/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1 font-pixel"><LinkIcon size={10}/> Connected:</span>
                {connectedLandmarks.map(l => (
                  <div key={l.id} className="flex items-center gap-1 bg-[#efe6d5] rounded-none px-2 py-0.5 shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                    <span style={{ color: CATEGORIES[l.category?.toUpperCase()]?.color }}>{CATEGORIES[l.category?.toUpperCase()]?.icon}</span>
                    <span className="text-[10px] font-bold truncate max-w-[80px] text-[#1e1e2e] font-pixel uppercase">{l.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-[#1e1e2e] relative" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
           <div style={{ width: `${100 * zoom}%`, minWidth: '100%', minHeight: '100%', transformOrigin: '0 0' }}> 
               <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
                 <div className="inline-block min-w-full min-h-full p-4"><Board interactive={isMyTurn} isMobile={true} lastEvent={gameState.lastEvent} gameState={gameState} handlePlaceCard={handlePlaceCard} view={view} /></div>
               </div>
           </div>
        </div>
        <div className="bg-[#1e1e2e] border-t-4 border-black shrink-0 flex flex-col safe-area-pb z-20">
          <div className="max-w-5xl mx-auto w-full">
            {interactionMode && interactionMode !== 'signal_failure' && (
                <div className="bg-[#f2ca50] text-[#1e1e2e] font-bold p-3 text-center animate-pulse font-retro text-xs border-b-4 border-black">
                    {interactionMode === 'track_maint' && "TAP EMPTY SQUARE TO BLOCK"}
                    {interactionMode === 'grand_opening_select_source' && "TAP LANDMARK TO REPLACE"}
                    <button onClick={() => setInteractionMode(null)} className="ml-4 underline">CANCEL</button>
                </div>
            )}
            
            {isMyTurn && selectedCardType === 'tracks' && (
              <div className="flex justify-center items-center gap-6 py-3 border-b-4 border-black bg-[#2a2a3e]">
                 <div className="w-16 h-16 border-4 border-[#efe6d5] bg-[#1e1e2e] flex items-center justify-center shadow-[4px_4px_0px_0px_black]"><TrackSvg shape={player.hand.tracks[selectedCardIdx]?.shape} rotation={rotation} color={player.color} /></div>
                <button onClick={() => { playSound('rotate-track'); setRotation((r) => (r + 90) % 360); }} className="flex items-center gap-2 px-6 py-4 bg-[#5d76f2] text-[#efe6d5] border-4 border-[#efe6d5] font-bold text-lg shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none font-retro"><RotateCw size={24} /> ROTATE</button>
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto p-4 pb-8 no-scrollbar bg-[#1e1e2e]">
              {player.hand.metro?.map((card, i) => <GameCard key={`m-${i}`} data={card} type="metro" selected={selectedCardType === 'metro' && selectedCardIdx === i} onClick={() => { if (!isMyTurn) return; handleMetroCardAction(i); }} />)}
              {player.hand.metro?.length > 0 && <div className="w-1 bg-[#efe6d5]/20 mx-1 shrink-0 self-stretch my-2"></div>}
              {player.hand.tracks.map((card, i) => <GameCard key={`t-${i}`} data={card} type="track" selected={selectedCardType === 'tracks' && selectedCardIdx === i} onClick={() => { if (!isMyTurn) return; playSound('select-track'); setSelectedCardIdx(i); setSelectedCardType('tracks'); setRotation(0); setInteractionMode(null); }} />)}
              <div className="w-1 bg-[#efe6d5]/20 mx-1 shrink-0 self-stretch my-2"></div>
              {player.hand.landmarks.map((card, i) => <GameCard key={`l-${i}`} data={card} type="landmark" selected={selectedCardType === 'landmarks' && selectedCardIdx === i} onClick={() => { if (!isMyTurn) return; playSound('select-track'); setSelectedCardIdx(i); setSelectedCardType('landmarks'); setRotation(0); setInteractionMode(null); }} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
