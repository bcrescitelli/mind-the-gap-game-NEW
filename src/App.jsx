C

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
  Plane, Banknote, Ghost, Heart, Smile, LogOut, X, Check, FastForward, Ban, Sparkles,
  Timer, TrendingUp, Award, Bell
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

// Categories
const CATEGORIES = {
  GASTRONOMY: { id: 'gastronomy', label: 'Gastronomy', icon: <Coffee size={16} />, color: 'text-amber-600', gradient: 'from-amber-600 to-orange-500' },
  HERITAGE: { id: 'heritage', label: 'Heritage', icon: <Landmark size={16} />, color: 'text-stone-600', gradient: 'from-stone-600 to-stone-500' },
  NATURE: { id: 'nature', label: 'Nature', icon: <Trees size={16} />, color: 'text-green-600', gradient: 'from-green-600 to-emerald-500' },
  SERVICES: { id: 'services', label: 'Services', icon: <Banknote size={16} />, color: 'text-blue-600', gradient: 'from-blue-600 to-cyan-500' },
  SPIRITUAL: { id: 'spiritual', label: 'Spiritual', icon: <Ghost size={16} />, color: 'text-purple-600', gradient: 'from-purple-600 to-violet-500' },
  THRILLING: { id: 'thrilling', label: 'Thrilling', icon: <Zap size={16} />, color: 'text-red-600', gradient: 'from-red-600 to-pink-500' },
};

// Landmarks Data
const LANDMARKS_DATA = [
  // Gastronomy
  { name: "Ice Cream Shop", cat: 'gastronomy' }, { name: "Candy Store", cat: 'gastronomy' }, { name: "Farmer's Market", cat: 'gastronomy' },
  { name: "Spice Village", cat: 'gastronomy' }, { name: "Food Truck", cat: 'gastronomy' }, { name: "The Melting Pot", cat: 'gastronomy' },
  { name: "Cafe", cat: 'gastronomy' }, { name: "Bakery", cat: 'gastronomy' }, { name: "Bodega", cat: 'gastronomy' }, { name: "Rooftop Bar", cat: 'gastronomy' },
  // Heritage
  { name: "Old Cathedral", cat: 'heritage' }, { name: "Museum", cat: 'heritage' }, { name: "Theatre", cat: 'heritage' },
  { name: "Opera House", cat: 'heritage' }, { name: "Observatory", cat: 'heritage' }, { name: "Clocktower", cat: 'heritage' },
  { name: "University", cat: 'heritage' }, { name: "Cinema", cat: 'heritage' },
  // Nature
  { name: "Botanic Gardens", cat: 'nature' }, { name: "Dog Park", cat: 'nature' }, { name: "Butterfly House", cat: 'nature' },
  { name: "Country Club", cat: 'nature' }, { name: "Flower Shop", cat: 'nature' }, { name: "Mountain Trail", cat: 'nature' },
  // Services
  { name: "Airport", cat: 'services' }, { name: "Bank", cat: 'services' }, { name: "Mall", cat: 'services' },
  { name: "Gym", cat: 'services' }, { name: "Fire Department", cat: 'services' }, { name: "Post Office", cat: 'services' },
  { name: "Library", cat: 'services' }, { name: "Tailors", cat: 'services' },
  // Spiritual
  { name: "Haunted House", cat: 'spiritual' }, { name: "Cemetery", cat: 'spiritual' }, 
  { name: "Fortune Teller", cat: 'spiritual' }, { name: "Antique Store", cat: 'spiritual' },
  // Thrilling
  { name: "Theme Park", cat: 'thrilling' }, { name: "Casino", cat: 'thrilling' }, { name: "Rock Climbing Gym", cat: 'thrilling' },
  { name: "Comedy Club", cat: 'thrilling' }, { name: "Skate Park", cat: 'thrilling' }, { name: "Zoo", cat: 'thrilling' },
  { name: "Tattoo Parlor", cat: 'thrilling' }, { name: "The Stadium", cat: 'thrilling' }
];

// Personas
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

// BFS
const getDistanceToStart = (grid, targetX, targetY, playerColor) => {
  const queue = [{ x: targetX, y: targetY, dist: 0 }];
  const visited = new Set([`${targetX},${targetY}`]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (isStart(current.x, current.y)) return current.dist;
    [0,1,2,3].forEach(dir => {
      const nc = getNeighborCoords(current.x, current.y, dir);
      const key = `${nc.x},${nc.y}`;
      if (!visited.has(key)) {
        const nextCell = getCell(grid, nc.x, nc.y);
        const currCell = getCell(grid, current.x, current.y);
        const currObj = isStart(current.x, current.y) ? { isStart: true, type: 'start' } : currCell;
        const nextObj = isStart(nc.x, nc.y) ? { isStart: true, type: 'start' } : nextCell;
        if (nextObj) {
          const validNode = nextObj.isStart || (nextObj.type === 'track' && nextObj.owner === playerColor) || (nextObj.type === 'landmark' && nextObj.connections?.[playerColor] > 0);
          if (validNode && areConnected(currObj, nextObj, dir)) {
             visited.add(key);
             queue.push({ x: nc.x, y: nc.y, dist: current.dist + 1 });
          }
        }
      }
    });
  }
  return Infinity;
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
        const currObj = isCityHall ? { isStart: true } : cell;
        const nextObj = isStart(nc.x, nc.y) ? { isStart: true } : nextCell;
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

  // TIER 1
  const tier1 = [
    { name: "The Foodie", req: 'category', target: 'gastronomy', pts: 1, desc: "Any Gastronomy" },
    { name: "The Tourist", req: 'category', target: 'heritage', pts: 1, desc: "Any Heritage" },
    { name: "The Outdoorsman", req: 'category', target: 'nature', pts: 1, desc: "Any Nature" },
    { name: "The Local", req: 'category', target: 'services', pts: 1, desc: "Any Services" },
    { name: "The Adrenaline Junkie", req: 'category', target: 'thrilling', pts: 1, desc: "Any Thrilling" },
    { name: "The Medium", req: 'category', target: 'spiritual', pts: 2, desc: "Any Spiritual" } 
  ];
  // TIER 2
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
  // TIER 3
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
  // TIER 4
  const tier4 = [
      { name: "The Date Night", targets: ["Cafe", "Cinema"], pts: 5 },
      { name: "The Ghost Tour", type: 'ghost', target1: "Haunted House", cat2: "heritage", pts: 4, desc: "Haunted House AND Any Heritage" },
      { name: "The Vacationer", targets: ["Airport", "Theme Park"], pts: 5 },
      { name: "The Graduate", targets: ["University", "Rooftop Bar"], pts: 5 },
      { name: "The Health Nut", targets: ["Gym", "Farmer's Market"], pts: 5 },
      { name: "The Botanist", type: 'botanist', target1: "Botanic Gardens", cat2: "nature", pts: 4, desc: "Botanic Gardens AND Any Nature" },
      { name: "The Investigator", targets: ["Fortune Teller", "Antique Store"], pts: 5 },
      { name: "The Critic", targets: ["The Melting Pot", "Theatre"], pts: 5 }
  ];

  tier1.forEach(p => passengers.push({ id: `P-${idCounter++}`, name: p.name, reqType: 'category', targetCategory: p.target, points: p.pts, desc: p.desc, tier: 1 }));
  tier2.forEach(p => {
      const ts = p.targets.map(n => findL(n)?.id).filter(Boolean);
      if(ts.length > 0) passengers.push({ id: `P-${idCounter++}`, name: p.name, reqType: 'list', targets: ts, points: p.pts, desc: p.targets.join(" OR "), tier: 2 });
  });
  tier3.forEach(p => {
      const t = findL(p.target);
      if(t) passengers.push({ id: `P-${idCounter++}`, name: p.name, reqType: 'specific', targetId: t.id, targetName: t.name, points: p.pts, desc: `Must visit ${t.name}`, tier: 3 });
  });
  tier4.forEach(p => {
      if (p.targets) {
          const t1 = findL(p.targets[0]);
          const t2 = findL(p.targets[1]);
          if(t1 && t2) passengers.push({ id: `P-${idCounter++}`, name: p.name, reqType: 'combo', targets: [t1.id, t2.id], points: p.pts, desc: `${t1.name} AND ${t2.name}`, tier: 4 });
      } else if (p.type === 'ghost') {
          const t1 = findL(p.target1);
          if(t1) passengers.push({ id: `P-${idCounter++}`, name: p.name, reqType: 'combo_cat', targetId: t1.id, cat2: p.cat2, points: p.pts, desc: p.desc, tier: 4 });
      } else if (p.type === 'botanist') {
          const t1 = findL(p.target1);
          if(t1) passengers.push({ id: `P-${idCounter++}`, name: p.name, reqType: 'combo_cat', targetId: t1.id, cat2: p.cat2, points: p.pts, desc: p.desc, tier: 4 });
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
  const strokeColor = colorMap[color] || '#9ca3af';
  
  const pathId = `track-${shape}-${Math.random().toString(36).substr(2, 5)}`;
  let d = "";
  if (shape === 'straight') d = "M 50 0 L 50 100";
  if (shape === 'curved') d = "M 50 100 Q 50 50 100 50";
  if (shape === 't-shape') d = "M 0 50 L 100 50 M 50 50 L 50 100"; 

  return (
    <div className="w-full h-full" style={{ transform: `rotate(${rotation}deg)` }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" shapeRendering="geometricPrecision">
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

const Cell = ({ x, y, cellData, onClick, view, isBlocked, isSurge }) => {
  const isCenter = x === CENTER && y === CENTER;
  const isHost = view === 'host';
  
  let content = null;
  let bgClass = isHost ? "bg-transparent" : "bg-black/40 backdrop-blur-[2px]";
  let borderClass = isHost ? "border-0" : "border border-gray-700";
  const colorDotMap = { red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-400' };

  if (isBlocked) {
    content = <div className="w-full h-full flex items-center justify-center bg-yellow-900/50"><Cone size={24} className="text-yellow-500 animate-pulse" /></div>;
  } else if (isCenter) {
    content = <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-yellow-400 to-orange-500 text-black font-bold text-[6px] md:text-[10px] z-10 text-center leading-none border-2 border-yellow-600 font-questrial shadow-lg">
      <Landmark size={12} className="mb-0.5" />
      CITY HALL
    </div>;
    bgClass = "bg-gradient-to-br from-yellow-400 to-orange-500";
  } else if (cellData?.type === 'track') {
    if (!isHost) bgClass = "bg-gray-900/80"; 
    content = <TrackSvg shape={cellData.shape} rotation={cellData.rotation} color={cellData.owner} animate={isSurge} />;
  } else if (cellData?.type === 'landmark') {
    const gradient = CATEGORIES[cellData.category?.toUpperCase()]?.gradient || 'from-gray-600 to-gray-500';
    content = (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-0.5 border-2 border-white/20 shadow-xl relative overflow-hidden`}>
         <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
         <div className={`relative z-10 text-white scale-75 md:scale-100 drop-shadow-md`}>{CATEGORIES[cellData.category?.toUpperCase()]?.icon}</div>
         <div className="relative z-10 text-[5px] md:text-[8px] text-white font-bold text-center leading-none mt-0.5 break-words w-full overflow-hidden font-questrial drop-shadow-md px-0.5">{cellData.name}</div>
         {cellData.connections && Object.keys(cellData.connections).length > 0 && (
           <div className="absolute bottom-0 right-0 flex gap-0.5 p-0.5">
             {Object.keys(cellData.connections).map((c) => (
               <div key={c} className={`w-1.5 h-1.5 rounded-full ${colorDotMap[c]} border border-white/50 shadow-sm`}></div>
             ))}
           </div>
         )}
      </div>
    );
    if (isHost) bgClass = "bg-transparent"; 
  }

  return (
    <div 
      onClick={() => onClick(x, y)}
      className={`w-full h-full aspect-square ${borderClass} ${bgClass} relative flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/10 transition-all touch-manipulation active:scale-95`}
    >
      {content}
    </div>
  );
};

const GameCard = ({ data, selected, onClick, type }) => {
  if (!data) return <div className="w-16 h-24 bg-gray-800 rounded opacity-50"></div>;
  
  if (type === 'metro') {
    const info = METRO_CARDS_DATA[data.id] || {};
    return (
      <div 
        onClick={onClick}
        className={`relative w-20 h-28 md:w-24 md:h-32 rounded-xl border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition-all shadow-xl shrink-0 bg-gradient-to-br from-yellow-600 to-orange-600 overflow-hidden ${selected ? 'border-yellow-300 -translate-y-3 shadow-yellow-500/50 scale-105' : 'border-yellow-800 hover:border-yellow-600 hover:-translate-y-1'}`}
      >
        {/* Vintage ticket perforations */}
        <div className="absolute top-0 left-0 right-0 h-2 flex justify-around">
          {[...Array(8)].map((_, i) => <div key={i} className="w-1 h-1 bg-black/20 rounded-full"></div>)}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-2 flex justify-around">
          {[...Array(8)].map((_, i) => <div key={i} className="w-1 h-1 bg-black/20 rounded-full"></div>)}
        </div>
        
        <div className="text-yellow-100 mb-2 drop-shadow-md">{info.icon}</div>
        <div className="text-[9px] md:text-[10px] text-center font-black text-white leading-tight font-cal-sans drop-shadow-md uppercase tracking-wide">{info.name}</div>
        <div className="text-[7px] text-center text-yellow-100 mt-1 leading-tight font-questrial px-1">{info.desc}</div>
        
        {selected && (
          <div className="absolute inset-0 border-4 border-yellow-300 rounded-xl pointer-events-none animate-pulse"></div>
        )}
      </div>
    );
  }

  if (type === 'landmark') {
    const gradient = CATEGORIES[data.category?.toUpperCase()]?.gradient || 'from-gray-600 to-gray-500';
    return (
      <div 
        onClick={onClick}
        className={`relative w-20 h-28 md:w-24 md:h-32 rounded-xl border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition-all shadow-xl shrink-0 bg-gradient-to-br ${gradient} overflow-hidden
          ${selected ? 'border-white -translate-y-3 shadow-white/50 scale-105' : 'border-white/30 hover:border-white/60 hover:-translate-y-1'}
        `}
      >
        {/* Card shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50"></div>
        
        <div className="absolute top-2 right-2 text-white/80 scale-90 drop-shadow-md">
          {CATEGORIES[data.category?.toUpperCase()]?.icon}
        </div>
        
        <div className="relative z-10 text-[9px] md:text-[11px] text-center font-black text-white leading-tight mt-4 px-1 font-cal-sans drop-shadow-md">{data.name}</div>
        <div className="relative z-10 text-[7px] md:text-[8px] text-white/80 mt-2 font-questrial uppercase tracking-wider">{CATEGORIES[data.category?.toUpperCase()]?.label}</div>
        
        {/* Pixel-style corner decoration */}
        <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-white/40"></div>
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-white/40"></div>
        
        {selected && (
          <div className="absolute inset-0 border-4 border-white rounded-xl pointer-events-none animate-pulse"></div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`relative w-20 h-28 md:w-24 md:h-32 rounded-xl border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition-all shadow-xl shrink-0 bg-gradient-to-br from-slate-700 to-slate-900
        ${selected ? 'border-blue-400 -translate-y-3 shadow-blue-500/50 scale-105' : 'border-slate-600 hover:border-slate-400 hover:-translate-y-1'}
      `}
    >
      {type === 'track' && (
        <>
          <div className="text-[9px] md:text-[10px] text-slate-300 mb-2 uppercase font-black text-center truncate w-full font-cal-sans">{data.shape}</div>
          <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-slate-500 rounded-lg flex items-center justify-center bg-slate-800/50 shadow-inner">
             <TrackSvg shape={data.shape} rotation={0} color="gray" />
          </div>
          
          {/* Pixel corners */}
          <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-slate-400/40"></div>
          <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-slate-400/40"></div>
        </>
      )}
      
      {selected && (
        <div className="absolute inset-0 border-4 border-blue-400 rounded-xl pointer-events-none animate-pulse"></div>
      )}
    </div>
  );
};

const AnimatedScore = ({ score, color }) => {
  const [displayScore, setDisplayScore] = useState(score);
  
  useEffect(() => {
    if (score !== displayScore) {
      const increment = score > displayScore ? 1 : -1;
      const timer = setInterval(() => {
        setDisplayScore(prev => {
          if (prev === score) {
            clearInterval(timer);
            return prev;
          }
          return prev + increment;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [score, displayScore]);
  
  return (
    <span className={`text-2xl md:text-3xl font-black text-${color}-400 font-cal-sans transition-all duration-300 ${score > displayScore ? 'scale-125' : 'scale-100'}`}>
      {displayScore}
    </span>
  );
};

const WinnerModal = ({ winner, onRestart, onExit }) => {
  const [confetti, setConfetti] = useState([]);
  
  useEffect(() => {
    if (winner) {
      // Generate confetti particles
      const particles = [...Array(100)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        color: ['#fbbf24', '#ef4444', '#3b82f6', '#22c55e'][Math.floor(Math.random() * 4)],
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2
      }));
      setConfetti(particles);
    }
  }, [winner]);
  
  if (!winner) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map(particle => (
          <div
            key={particle.id}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              transform: `rotate(${particle.rotation}deg)`,
              animation: `fall ${particle.duration}s linear ${particle.delay}s infinite`
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(120vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12 rounded-3xl border-4 border-yellow-500 shadow-[0_0_100px_rgba(234,179,8,0.5)] text-center max-w-md w-full mx-4 transform scale-110 animate-in zoom-in duration-500">
        {/* Pixel art corners */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-4 border-t-4 border-yellow-400"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-r-4 border-t-4 border-yellow-400"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-4 border-b-4 border-yellow-400"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-4 border-b-4 border-yellow-400"></div>
        
        <Crown size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]" />
        <h2 className="text-5xl font-black text-yellow-400 mb-3 uppercase tracking-widest font-nabla drop-shadow-lg">Victory!</h2>
        <div className={`text-6xl font-black mb-6 bg-gradient-to-r from-${winner.color}-400 to-${winner.color}-600 bg-clip-text text-transparent drop-shadow-2xl font-nabla`}>{winner.name}</div>
        <div className="bg-black/50 rounded-xl p-4 mb-8 border-2 border-yellow-500/30">
          <p className="text-gray-400 text-lg font-cal-sans">Final Score</p>
          <p className="text-white font-black text-4xl font-cal-sans">{winner.score}</p>
        </div>
        <button 
          onClick={onRestart} 
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-full font-black text-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full font-cal-sans border-2 border-green-400"
        >
          <RefreshCw size={24}/> Play Again
        </button>
        <button 
          onClick={onExit} 
          className="mt-4 text-gray-500 hover:text-white underline text-sm font-questrial transition-colors"
        >
          Exit to Menu
        </button>
      </div>
    </div>
  );
};

const NotificationOverlay = ({ event }) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (event && (Date.now() - event.timestamp < 5000)) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [event]);
  
  if (!visible || !event || event.type !== 'claim-passenger') return null;

  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-10 fade-in duration-500 w-full max-w-2xl px-4 pointer-events-none">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-6 rounded-2xl shadow-[0_0_60px_rgba(251,191,36,0.8)] border-4 border-yellow-300 flex flex-col items-center gap-3 w-full relative overflow-hidden">
        {/* Animated sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <Sparkles 
              key={i} 
              size={16} 
              className="absolute text-white/60 animate-pulse" 
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 flex items-center gap-2 text-gray-900 font-black uppercase tracking-widest text-sm animate-pulse font-cal-sans">
          <Star size={24} className="fill-current drop-shadow-md" /> 
          Passenger Claimed! 
          <Star size={24} className="fill-current drop-shadow-md" />
        </div>
        
        <div className="relative z-10 text-center w-full font-cal-sans">
          <span className="text-gray-900 font-black text-4xl drop-shadow-sm">{event.playerName}</span>
          <span className="text-gray-800 font-bold text-xl mx-2 block md:inline">picked up</span>
        </div>
        
        <div className="relative z-10 text-3xl font-black font-cal-sans text-center leading-tight text-gray-900 drop-shadow-sm">
          {event.passengerNames.join(" & ")}
        </div>
      </div>
    </div>
  );
};

const playSound = (type) => {
  const soundFileMap = {
    'place-track': 'place-track.m4a',
    'place-landmark': 'place-landmark.m4a',
    'claim-passenger': 'claim-passenger.m4a',
    'win-game': 'win-game.mp3',
    'select-track': 'select-track.m4a',
    'rotate-track': 'rotate-track.m4a'
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
      audioRef.current.volume = 0.1;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      
      if (ambientRef.current) {
          ambientRef.current.volume = 0.3;
          ambientRef.current.play().catch(e => console.log("Ambient fail", e));
          
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
      <button 
        onClick={() => {
          if(playing) {
              audioRef.current.pause();
              ambientRef.current.pause();
          } else {
              audioRef.current.play();
              ambientRef.current.play();
          }
          setPlaying(!playing);
        }} 
        className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-full shadow-xl border-2 border-gray-600 hover:border-gray-400 transition-all hover:scale-110 active:scale-95"
      >
        {playing ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>
    </div>
  );
};

// --- MAIN COMPONENT ---
const Board = ({ interactive, isMobile, lastEvent, gameState, handlePlaceCard, view }) => {
  const surgePath = useMemo(() => {
    if (!gameState?.lastEvent || gameState.lastEvent.type !== 'claim-passenger') return new Set();
    if (Date.now() - gameState.lastEvent.timestamp > 2500) return new Set();

    const { playerColor, claimedLandmarkIds } = gameState.lastEvent;
    
    const nodes = new Set();
    if(!claimedLandmarkIds || claimedLandmarkIds.length === 0) return new Set();

    const queue = [{ x: CENTER, y: CENTER }];
    const visited = new Set([`${CENTER},${CENTER}`]);
    const cameFrom = {};
    
    const targetsFound = new Set();
    
    while(queue.length > 0) {
       const curr = queue.shift();
       const currKey = `${curr.x},${curr.y}`;
       const cell = getCell(gameState.grid, curr.x, curr.y);
       
       if (cell && cell.type === 'landmark' && claimedLandmarkIds.includes(cell.id)) {
           targetsFound.add(cell.id);
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
      className={`grid ${isMobile ? 'gap-[1px]' : 'gap-0'} ${isMobile ? 'bg-gradient-to-br from-gray-900 to-black border-2 border-gray-700' : 'bg-transparent border-0'} rounded-xl shadow-2xl overflow-hidden select-none mx-auto relative`}
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

  useEffect(() => {
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Nabla&family=Questrial&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.innerHTML = `
      .font-nabla { font-family: 'Nabla', system-ui; }
      .font-questrial { font-family: 'Questrial', sans-serif; }
      .font-cal-sans { font-family: 'Outfit', sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const initAuth = async () => { 
        try { 
            await signInAnonymously(auth); 
        } catch (err) { 
            console.error("Auth error:", err);
            setAuthError(err);
        } 
    };
    initAuth();
    const sub = onAuthStateChanged(auth, (u) => {
        if (u) {
            setUser(u);
            setAuthError(null); 
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
      mostConnected: null, movesLeft: 1, skippedPlayers: []
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

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', activeRoomId), {
      ...updates, players: newPlayers, decks: newDecks,
      turnIndex: actualNextTurn, winner: winner || null,
      lastEvent: lastEvent || gameState.lastEvent,
      totalTurns: (gameState.totalTurns || 0) + 1,
      movesLeft: 1, skippedPlayers: newSkipped
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
      blockedCells: [], mostConnected: null, skippedPlayers: [], movesLeft: 1
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
        
        const newGrid = [...gameState.grid];
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

    const newGrid = [...grid];
    newGrid[y][x] = { ...card, owner: player.color, rotation, connectedColors: card.type === 'track' ? [player.color] : [] };
    playSound(card.type === 'track' ? 'place-track' : 'place-landmark');

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
    refreshConnections();

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
    const claimedLandmarkIds = [];

    const checkPassenger = (p) => {
      if (p.unlockTurn && gameState.totalTurns < p.unlockTurn) return false;
      if (completedPassengerIds.includes(p.id)) return false;
      let match = false;
      const myLandmarks = []; newGrid.forEach(r => r.forEach(c => { if(c && c.type === 'landmark' && playerConnectedLandmarks.has(c.id)) myLandmarks.push(c); }));

      const currentClaimed = [];

      if (p.reqType === 'specific') {
         if (playerConnectedLandmarks.has(p.targetId)) {
             match = true;
             currentClaimed.push(p.targetId);
         }
      } 
      else if (p.reqType === 'category') {
         const matches = myLandmarks.filter(l => l.category === p.targetCategory);
         if (matches.length > 0) {
             match = true;
             matches.forEach(m => currentClaimed.push(m.id));
         }
      } 
      else if (p.reqType === 'list') { 
         const matches = p.targets.filter(tid => playerConnectedLandmarks.has(tid));
         if (matches.length > 0) {
             match = true;
             currentClaimed.push(...matches);
         }
      } 
      else if (p.reqType === 'combo') { 
         if(playerConnectedLandmarks.has(p.targets[0]) && playerConnectedLandmarks.has(p.targets[1])) {
             match = true;
             currentClaimed.push(p.targets[0], p.targets[1]);
         }
      } 
      else if (p.reqType === 'combo_cat') { 
         const hasT1 = playerConnectedLandmarks.has(p.targetId);
         const cat2Matches = myLandmarks.filter(l => l.category === p.cat2);
         if(hasT1 && cat2Matches.length > 0) {
             match = true;
             currentClaimed.push(p.targetId);
             cat2Matches.forEach(m => currentClaimed.push(m.id));
         }
      }

      if (match) { 
          pointsGained += p.points; 
          completedPassengerIds.push(p.id); 
          claimedPassengerNames.push(p.name); 
          claimedLandmarkIds.push(...currentClaimed);
          return true; 
      }
      return false;
    };
    gameState.activePassengers.forEach(checkPassenger);
    
    let lastEvent = bonusEvent; 
    if (pointsGained > 0) {
        lastEvent = { 
            type: 'claim-passenger', 
            playerColor: player.color, 
            playerName: player.name, 
            passengerNames: claimedPassengerNames, 
            timestamp: Date.now(), 
            coords: { x, y },
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
          movesLeft: movesLeft
        });
        setSelectedCardIdx(null); setSelectedCardType(null); setRotation(0);
    } else {
        endTurn({ 
            grid: JSON.stringify(newGrid), players: newPlayers, decks: newDecks, 
            activePassengers: newActivePassengers, mostConnected: currentMostConnected
        }, winner, lastEvent);
    }
  };

  if (authError) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8 text-center font-questrial">
            <div className="bg-red-900/20 border-2 border-red-500 p-8 rounded-2xl max-w-3xl shadow-2xl">
                <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
                <h2 className="text-4xl font-cal-sans mb-4 text-red-400">Security Access Blocked</h2>
                <p className="text-xl mb-6">
                    Google is blocking this website from accessing your game database because of the API Key restrictions you set up.
                </p>
                <div className="bg-black/50 p-4 rounded-lg text-left font-mono text-xs text-red-300 mb-6 overflow-x-auto whitespace-pre-wrap">
                    {authError.message}
                </div>
                <div className="text-left bg-gray-800/50 p-6 rounded-xl space-y-4">
                    <h3 className="font-bold text-white text-lg">How to fix this immediately:</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                        <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-400 underline">Google Cloud Console Credentials</a>.</li>
                        <li>Click the name of your API Key (e.g. <strong>Browser key</strong>).</li>
                        <li>Under <strong>Website restrictions</strong>, click <strong>ADD ITEM</strong>.</li>
                        <li>Copy and paste this current URL into the box:</li>
                    </ol>
                    <div className="flex items-center gap-2 mt-2">
                        <code className="bg-black px-3 py-2 rounded text-green-400 flex-1">{window.location.origin}/*</code>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Make sure to include the <strong>/*</strong> at the end!</p>
                </div>
                <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 mx-auto">
                    <RefreshCw size={20}/> I Fixed It, Reload
                </button>
            </div>
        </div>
    );
  }

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2 tracking-tighter drop-shadow-[0_0_30px_rgba(251,191,36,0.5)] font-nabla animate-in zoom-in duration-700">
            MIND THE GAP
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-questrial">Build routes • Claim passengers • Win the race</p>
        </div>
        
        <div className="flex flex-col gap-4 w-full max-w-md z-10 font-questrial">
          <div className="flex flex-col gap-3 w-full bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-2xl border-2 border-gray-700 backdrop-blur-sm animate-in slide-in-from-bottom duration-500">
            <h3 className="text-xl font-black text-center mb-2 font-cal-sans text-yellow-400">Join Room</h3>
            <input 
              type="text" 
              placeholder="ROOM CODE" 
              className="px-4 py-3 rounded-xl bg-black/50 border-2 border-gray-700 focus:border-blue-500 outline-none text-center uppercase tracking-[0.3em] w-full font-black text-xl transition-all placeholder:text-gray-600"
              value={entryCode} 
              onChange={e => setEntryCode(e.target.value.toUpperCase())}
              maxLength={5}
            />
            {entryCode.length === 5 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 text-center font-cal-sans">Choose your color:</p>
                  <div className="grid grid-cols-4 gap-2">
                      {COLORS.map(c => {
                        const bgColor = c === 'yellow' ? 'bg-yellow-500' : c === 'red' ? 'bg-red-500' : c === 'blue' ? 'bg-blue-500' : 'bg-green-500';
                        return (
                          <button 
                            key={c} 
                            onClick={() => setPlayerColor(c)} 
                            disabled={!availableColors.includes(c)} 
                            className={`h-12 rounded-xl transition-all ${bgColor} ${playerColor === c ? 'ring-4 ring-white scale-105 shadow-lg' : ''} ${!availableColors.includes(c) ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:opacity-80 hover:scale-105 active:scale-95'} flex items-center justify-center`}
                          >
                              {playerColor === c && <Check size={24} className="text-white drop-shadow-md" />}
                              {!availableColors.includes(c) && <X size={20} className="text-white/50" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
            )}
            <input 
              type="text" 
              placeholder="Your Name" 
              className="px-4 py-3 rounded-xl bg-black/50 border-2 border-gray-700 focus:border-blue-500 outline-none text-center w-full transition-all placeholder:text-gray-600"
              value={playerName} 
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
            />
            {error && <p className="text-red-400 text-sm text-center font-bold">{error}</p>}
            <button 
              onClick={joinGame} 
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-black text-lg shadow-xl w-full transition-all hover:scale-105 active:scale-95 border-2 border-green-400"
            >
              Join Game
            </button>
          </div>
          
          <div className="relative flex py-3 items-center animate-in fade-in duration-700 delay-300">
            <div className="flex-grow border-t-2 border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-wider font-bold">OR</span>
            <div className="flex-grow border-t-2 border-gray-700"></div>
          </div>
          
          <button 
            onClick={createGame} 
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-black text-xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full border-2 border-blue-400 animate-in slide-in-from-bottom duration-500 delay-150"
          >
            <Crown size={28}/> Create New Room
          </button>
        </div>
      </div>
    );
  }

  if (gameState?.winner) return <WinnerModal winner={gameState.winner} onRestart={restartGame} onExit={leaveGame} />;

  if (view === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <AudioPlayer view={view} />
        
        {/* Pixel background decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-4 h-4 border-2 border-yellow-500"></div>
          <div className="absolute top-10 right-10 w-4 h-4 border-2 border-blue-500"></div>
          <div className="absolute bottom-10 left-10 w-4 h-4 border-2 border-green-500"></div>
          <div className="absolute bottom-10 right-10 w-4 h-4 border-2 border-red-500"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl w-full">
          <h2 className="text-5xl font-black mb-3 font-nabla text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 text-center animate-pulse">
            {activeRoomId}
          </h2>
          <p className="text-gray-400 mb-8 font-questrial text-center text-lg">Waiting for players to join...</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {gameState?.players.map((p, i) => {
              const bgGradient = p.color === 'red' ? 'from-red-600 to-red-500' : 
                                 p.color === 'blue' ? 'from-blue-600 to-blue-500' :
                                 p.color === 'green' ? 'from-green-600 to-green-500' : 'from-yellow-600 to-yellow-500';
              return (
                <div key={i} className={`p-6 rounded-2xl bg-gradient-to-br ${bgGradient} border-2 border-white/20 flex flex-col items-center shadow-xl transform transition-all hover:scale-105 animate-in zoom-in duration-500`} style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-3 flex items-center justify-center border-2 border-white/40 shadow-inner`}>
                    <User size={32} className="text-white" />
                  </div>
                  <span className="font-black text-lg font-cal-sans text-white drop-shadow-md">{p.name}</span>
                  <span className="text-xs text-white/70 mt-1 uppercase tracking-wider font-questrial">Ready</span>
                </div>
              );
            })}
            {[...Array(4 - (gameState?.players.length || 0))].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gray-800/30 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 font-questrial backdrop-blur-sm animate-pulse">
                <Users size={32} className="mb-2 opacity-30" />
                <span className="text-sm">Waiting...</span>
              </div>
            ))}
          </div>
          
          {gameState?.hostId === user.uid ? (
            <button 
              onClick={startGame} 
              disabled={gameState?.players.length < 2} 
              className={`px-12 py-5 rounded-full font-black text-2xl shadow-2xl font-cal-sans w-full md:w-auto mx-auto block transition-all ${
                gameState?.players.length < 2 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black border-4 border-yellow-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(251,191,36,0.6)]'
              }`}
            >
              {gameState?.players.length < 2 ? 'NEED 2+ PLAYERS' : 'START GAME'}
            </button>
          ) : (
            <p className="animate-pulse text-xl font-medium text-center font-questrial text-gray-300">
              <Bell size={20} className="inline mr-2 animate-bounce" />
              Host will start the game soon...
            </p>
          )}
        </div>
        
        <button 
          onClick={leaveGame} 
          className="absolute top-4 right-4 p-3 bg-red-600/20 hover:bg-red-600 text-red-200 rounded-full z-50 transition-all hover:scale-110 active:scale-95 border-2 border-red-500/30"
        >
          <X size={24} />
        </button>
      </div>
    );
  }

  if (view === 'host') {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex p-4 gap-4 overflow-hidden relative font-questrial">
        <AudioPlayer view="host" />
        <NotificationOverlay event={gameState.lastEvent} />
        
        <button 
          onClick={leaveGame} 
          className="absolute top-4 right-4 p-3 bg-red-600/20 hover:bg-red-600 text-red-200 rounded-full z-50 transition-all hover:scale-110 active:scale-95 border-2 border-red-500/30"
        >
          <X size={24} />
        </button>
        
        <div className="w-1/4 max-w-sm flex flex-col gap-4 h-full z-10">
          {/* Room Code */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl text-center shadow-xl border-2 border-gray-700">
             <div className="text-xs text-gray-400 uppercase tracking-widest font-cal-sans mb-1">Room Code</div>
             <div className="text-5xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-nabla">{activeRoomId}</div>
          </div>
          
          {/* Standings */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl shadow-xl border-2 border-gray-800 flex-shrink-0">
            <h3 className="text-lg font-black text-yellow-400 mb-3 flex items-center gap-2 uppercase tracking-wide font-cal-sans">
              <Trophy size={20} className="drop-shadow-md"/> Standings
            </h3>
            <div className="space-y-3">
              {gameState.players.map((p, i) => {
                const isActive = gameState.turnIndex === i;
                const score = p.score + (gameState.mostConnected?.playerId === p.id ? 2 : 0);
                const bgGradient = p.color === 'red' ? 'from-red-600/20 to-red-900/20' : 
                                   p.color === 'blue' ? 'from-blue-600/20 to-blue-900/20' :
                                   p.color === 'green' ? 'from-green-600/20 to-green-900/20' : 'from-yellow-600/20 to-yellow-900/20';
                const borderColor = p.color === 'red' ? 'border-red-500' :
                                   p.color === 'blue' ? 'border-blue-500' :
                                   p.color === 'green' ? 'border-green-500' : 'border-yellow-500';
                
                return (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between p-3 rounded-xl border-2 bg-gradient-to-r transition-all ${
                      isActive 
                        ? `${bgGradient} ${borderColor} ring-2 ring-white/20 shadow-lg scale-105` 
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full bg-${p.color}-500 shadow-md ${isActive ? 'animate-pulse' : ''}`}></div>
                      <span className="font-bold text-lg truncate max-w-[100px] font-cal-sans">{p.name}</span>
                      {gameState.mostConnected?.playerId === p.id && (
                        <LinkIcon size={14} className="text-blue-400" />
                      )}
                    </div>
                    <AnimatedScore score={score} color={p.color} />
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Passengers */}
          <div className="flex-1 flex flex-col gap-2 overflow-auto no-scrollbar">
            <h3 className="text-lg font-black text-yellow-400 flex items-center gap-2 uppercase tracking-wide font-cal-sans">
              <Ticket size={20} className="drop-shadow-md"/> Passengers
            </h3>
            <div className="space-y-3">
              {gameState.activePassengers.map(pass => {
                const isLocked = gameState.totalTurns < pass.unlockTurn;
                const tierColors = {
                  1: 'from-green-600 to-emerald-700',
                  2: 'from-blue-600 to-cyan-700',
                  3: 'from-purple-600 to-violet-700',
                  4: 'from-orange-600 to-red-700'
                };
                const gradient = tierColors[pass.tier] || 'from-gray-600 to-gray-700';
                
                return (
                  <div 
                    key={pass.id} 
                    className={`bg-gradient-to-br ${gradient} text-white p-4 rounded-xl shadow-xl flex flex-col gap-1 border-2 border-white/20 relative overflow-hidden transform transition-all duration-300 ${
                      isLocked ? 'opacity-50 scale-95 grayscale' : 'hover:scale-102'
                    }`}
                  >
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
                        <div className="bg-red-600 text-white px-3 py-1 font-black rounded-lg uppercase text-xs font-cal-sans border-2 border-red-400 shadow-lg">
                          <Timer size={14} className="inline mr-1" />
                          Arriving Soon
                        </div>
                      </div>
                    )}
                    
                    {/* Perforations */}
                    <div className="absolute top-0 left-0 right-0 h-2 flex justify-around">
                      {[...Array(10)].map((_, i) => <div key={i} className="w-1 h-1 bg-black/20 rounded-full"></div>)}
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-3xl text-white font-cal-sans drop-shadow-md">{pass.points}</span>
                        <span className="text-xs text-white/60 uppercase tracking-wider">pts</span>
                      </div>
                      <div className="flex gap-1">
                          {gameState.players.map(pl => {
                               const connectedLMs = new Set();
                               gameState.grid.forEach(r => r.forEach(c => { 
                                 if(c && c.type === 'landmark' && c.connections && c.connections[pl.color] > 0) 
                                   connectedLMs.add(c.id); 
                               }));
                               let met = false;
                               if(pass.reqType === 'specific' && connectedLMs.has(pass.targetId)) met = true;
                               
                               const dotBg = pl.color === 'red' ? 'bg-red-500' :
                                           pl.color === 'blue' ? 'bg-blue-500' :
                                           pl.color === 'green' ? 'bg-green-500' : 'bg-yellow-500';
                               
                               return (
                                 <div 
                                   key={pl.id} 
                                   className={`w-2.5 h-2.5 rounded-full ${dotBg} ${met ? 'opacity-100 ring-1 ring-white shadow-md' : 'opacity-20'} transition-all`}
                                 ></div>
                               );
                          })}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-lg font-black leading-tight font-cal-sans drop-shadow-md">{pass.name}</p>
                    </div>
                    <p className="text-xs text-white/80 italic mt-1 leading-snug font-questrial">{pass.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Board */}
        <div className="flex-1 flex items-center justify-center rounded-xl overflow-hidden relative shadow-2xl">
           <div className="absolute inset-4 flex items-center justify-center">
             <Board interactive={false} isMobile={false} lastEvent={gameState.lastEvent} gameState={gameState} handlePlaceCard={handlePlaceCard} view={view} />
           </div>
        </div>
      </div>
    );
  }

  if (view === 'player') {
    if (!gameState || !gameState.players) return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-pulse text-xl font-questrial">Loading game...</div>
      </div>
    );
    
    const player = gameState.players.find(p => p.id === user.uid);
    if (!player) return <div className="min-h-screen bg-gray-900 text-white p-8">Error: Player not found.</div>;
    
    const isMyTurn = gameState.players[gameState.turnIndex]?.id === user.uid;
    const connectedLandmarks = [];
    if (gameState && gameState.grid) {
      gameState.grid.forEach(row => row.forEach(cell => { 
        if (cell && cell.type === 'landmark' && cell.connections && cell.connections[player.color] > 0) 
          connectedLandmarks.push(cell); 
      }));
    }
    
    const displayScore = player.score + (gameState.mostConnected?.playerId === player.id ? 2 : 0);
    const progressPercent = (displayScore / WIN_SCORE) * 100;

    return (
      <div className="h-[100dvh] bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col overflow-hidden font-questrial">
        <AudioPlayer view="player" />
        <NotificationOverlay event={gameState.lastEvent} />
        
        {/* Signal Failure Modal */}
        {interactionMode === 'signal_failure' && (
             <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
                 <h2 className="text-3xl font-black mb-6 font-cal-sans text-yellow-400">Choose Player to Skip</h2>
                 <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                     {gameState.players.filter(p => p.id !== user.uid).map(p => {
                       const bgGradient = p.color === 'red' ? 'from-red-600 to-red-700' :
                                         p.color === 'blue' ? 'from-blue-600 to-blue-700' :
                                         p.color === 'green' ? 'from-green-600 to-green-700' : 'from-yellow-600 to-yellow-700';
                       const borderColor = p.color === 'red' ? 'border-red-400' :
                                          p.color === 'blue' ? 'border-blue-400' :
                                          p.color === 'green' ? 'border-green-400' : 'border-yellow-400';
                       
                       return (
                         <button 
                           key={p.id} 
                           onClick={() => handleSignalFailureSelect(p.id)} 
                           className={`p-6 bg-gradient-to-br ${bgGradient} border-2 ${borderColor} rounded-2xl flex flex-col items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl`}
                         >
                             <div className={`w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center`}>
                               <User size={32} className="text-white" />
                             </div>
                             <span className="font-black text-lg text-white font-cal-sans">{p.name}</span>
                         </button>
                       );
                     })}
                 </div>
                 <button 
                   onClick={() => setInteractionMode(null)} 
                   className="mt-8 text-gray-400 hover:text-white underline font-questrial transition-colors"
                 >
                   Cancel
                 </button>
             </div>
        )}

        {/* Header */}
        <div className={`border-b-2 shrink-0 z-20 shadow-lg transition-all duration-500 ${
          isMyTurn 
            ? 'bg-gradient-to-r from-green-900 to-emerald-900 border-green-500 shadow-green-500/30' 
            : 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700'
        }`}>
          <div className="max-w-5xl mx-auto">
            <div className="h-16 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full bg-${player.color}-500 shadow-lg ${isMyTurn ? 'animate-pulse ring-4 ring-white/30' : ''}`}></div>
                <span className="font-black text-xl truncate max-w-[120px] font-cal-sans text-white drop-shadow-md">{player.name}</span>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end leading-none">
                    <span className="text-[10px] text-gray-400 tracking-wider font-cal-sans uppercase">Score</span>
                    <div className="flex items-center gap-2">
                      <AnimatedScore score={displayScore} color={player.color} />
                      <span className="text-gray-500 text-sm font-questrial">/ {WIN_SCORE}</span>
                      {gameState.mostConnected?.playerId === player.id && (
                        <LinkIcon size={16} className="text-blue-400 animate-pulse" />
                      )}
                    </div>
                 </div>
                 {isMyTurn && (
                   <div className="w-5 h-5 bg-green-500 rounded-full shadow-lg shadow-green-500/50 animate-pulse"></div>
                 )}
                 <button 
                   onClick={leaveGame} 
                   className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg active:scale-90"
                 >
                   <LogOut size={20}/>
                 </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="px-4 pb-3">
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700">
                <div 
                  className={`h-full bg-gradient-to-r from-${player.color}-500 to-${player.color}-400 transition-all duration-500 shadow-lg`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Connected Landmarks */}
            {connectedLandmarks.length > 0 && (
              <div className="px-4 pb-3 bg-gradient-to-r from-gray-800/50 to-transparent border-t border-gray-700/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1 font-cal-sans">
                  <LinkIcon size={12}/> Connected ({connectedLandmarks.length}):
                </span>
                {connectedLandmarks.slice(0, 8).map(l => {
                  const gradient = CATEGORIES[l.category?.toUpperCase()]?.gradient || 'from-gray-600 to-gray-500';
                  return (
                    <div 
                      key={l.id} 
                      className={`flex items-center gap-1 bg-gradient-to-r ${gradient} rounded-full px-2 py-1 shrink-0 border border-white/20 shadow-md`}
                    >
                      <span className="text-white scale-75">{CATEGORIES[l.category?.toUpperCase()]?.icon}</span>
                      <span className="text-[9px] font-bold truncate max-w-[80px] text-white font-cal-sans drop-shadow-sm">{l.name}</span>
                    </div>
                  );
                })}
                {connectedLandmarks.length > 8 && (
                  <span className="text-xs text-gray-400 font-questrial">+{connectedLandmarks.length - 8} more</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Board */}
        <div 
          className="flex-1 overflow-auto bg-black/40 relative" 
          onTouchStart={handleTouchStart} 
          onTouchMove={handleTouchMove} 
          onTouchEnd={handleTouchEnd}
        >
           <div style={{ width: `${100 * zoom}%`, minWidth: '100%', minHeight: '100%', transformOrigin: '0 0' }}> 
               <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
                 <div className="inline-block min-w-full min-h-full p-4">
                   <Board 
                     interactive={isMyTurn} 
                     isMobile={true} 
                     lastEvent={gameState.lastEvent} 
                     gameState={gameState} 
                     handlePlaceCard={handlePlaceCard} 
                     view={view} 
                   />
                 </div>
               </div>
           </div>
        </div>
        
        {/* Hand */}
        <div className="bg-gradient-to-t from-gray-900 via-gray-900 to-gray-800/95 border-t-2 border-gray-700 shrink-0 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-20 backdrop-blur-md">
          <div className="max-w-5xl mx-auto w-full">
            {interactionMode && interactionMode !== 'signal_failure' && (
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-black p-3 text-center font-cal-sans border-b-2 border-yellow-500">
                    <Bell size={18} className="inline mr-2 animate-bounce" />
                    {interactionMode === 'track_maint' && "Select a square to block"}
                    {interactionMode === 'grand_opening_select_source' && "Select a Landmark to replace"}
                    <button 
                      onClick={() => setInteractionMode(null)} 
                      className="ml-4 underline text-sm hover:text-black transition-colors"
                    >
                      Cancel
                    </button>
                </div>
            )}
            
            {/* Rotation Control */}
            {isMyTurn && selectedCardType === 'tracks' && (
              <div className="flex justify-center items-center gap-6 py-4 border-b-2 border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
                 <div className="w-16 h-16 border-4 border-blue-500 bg-gray-900 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                   <TrackSvg 
                     shape={player.hand.tracks[selectedCardIdx]?.shape} 
                     rotation={rotation} 
                     color={player.color} 
                   />
                 </div>
                <button 
                  onClick={() => { 
                    playSound('rotate-track'); 
                    setRotation((r) => (r + 90) % 360); 
                  }} 
                  className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-full font-black text-lg shadow-xl font-cal-sans border-2 border-blue-400 transition-all hover:scale-105 active:scale-95"
                >
                  <RotateCw size={22} /> Rotate
                </button>
              </div>
            )}
            
            {/* Cards */}
            <div className="flex gap-3 overflow-x-auto p-4 pb-6 no-scrollbar">
              {/* Metro Cards */}
              {player.hand.metro?.map((card, i) => (
                <GameCard 
                  key={`m-${card.uid}`} 
                  data={card} 
                  type="metro" 
                  selected={selectedCardType === 'metro' && selectedCardIdx === i} 
                  onClick={() => { 
                    if (!isMyTurn) return; 
                    handleMetroCardAction(i); 
                  }} 
                />
              ))}
              
              {player.hand.metro?.length > 0 && (
                <div className="w-1 bg-gradient-to-b from-yellow-700 via-yellow-600 to-yellow-700 mx-1 shrink-0 self-stretch my-2 rounded-full shadow-md"></div>
              )}
              
              {/* Track Cards */}
              {player.hand.tracks.map((card, i) => (
                <GameCard 
                  key={`t-${card.id}`} 
                  data={card} 
                  type="track" 
                  selected={selectedCardType === 'tracks' && selectedCardIdx === i} 
                  onClick={() => { 
                    if (!isMyTurn) return; 
                    playSound('select-track'); 
                    setSelectedCardIdx(i); 
                    setSelectedCardType('tracks'); 
                    setRotation(0); 
                    setInteractionMode(null); 
                  }} 
                />
              ))}
              
              <div className="w-1 bg-gradient-to-b from-gray-700 via-gray-600 to-gray-700 mx-1 shrink-0 self-stretch my-2 rounded-full shadow-md"></div>
              
              {/* Landmark Cards */}
              {player.hand.landmarks.map((card, i) => (
                <GameCard 
                  key={`l-${card.id}`} 
                  data={card} 
                  type="landmark" 
                  selected={selectedCardType === 'landmarks' && selectedCardIdx === i} 
                  onClick={() => { 
                    if (!isMyTurn) return; 
                    playSound('select-track'); 
                    setSelectedCardIdx(i); 
                    setSelectedCardType('landmarks'); 
                    setRotation(0); 
                    setInteractionMode(null); 
                  }} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
