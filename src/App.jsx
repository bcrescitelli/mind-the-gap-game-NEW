import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ShoppingBag, Zap, Crown, Play, User
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "mind-the-gap-v1"; 

// --- GAME CONSTANTS & GENERATORS ---

const GRID_SIZE = 19; // Increased size
const CENTER = Math.floor(GRID_SIZE / 2); 
const COLORS = ['red', 'blue', 'green', 'yellow'];

// Enriched Categories
const CATEGORIES = {
  GASTRONOMY: { id: 'gastronomy', label: 'Gastronomy', icon: <Coffee size={16} /> },
  HERITAGE: { id: 'heritage', label: 'Heritage', icon: <Landmark size={16} /> },
  NATURE: { id: 'nature', label: 'Nature', icon: <Trees size={16} /> },
  RETAIL: { id: 'retail', label: 'Retail', icon: <ShoppingBag size={16} /> },
  THRILL: { id: 'thrill', label: 'Thrill', icon: <Zap size={16} /> },
};

// Specific Landmark Names
const LANDMARK_NAMES = {
  gastronomy: ["The Gilded Fork", "Espresso Alley", "Chef Pierre's", "Midnight Diner", "Spice Bazaar", "The Bagel Shop", "Sushi Row", "The Tea Garden", "Burger Haven", "The Melting Pot", "Cocoa Corner", "Pasta Palace", "The Food Truck Park", "Bistro 42", "The Sweet Spot"],
  heritage: ["Old Cathedral", "City Museum", "Founders Statue", "The Grand Library", "Clock Tower", "War Memorial", "Historic Fort", "The Opera House", "Ancient Ruins", "Parliament House", "The Old Bank", "Royal Palace", "Art Gallery", "The Observatory", "Town Hall Annex"],
  nature: ["Central Park", "Botanical Gardens", "The Old Oak", "Swan Lake", "River Walk", "Sunset Hill", "The Zoo", "Butterfly House", "Pine Grove", "Crystal Cavern", "The Waterfall", "Wildflower Meadow", "Deer Park", "The Conservatory", "Bamboo Forest"],
  retail: ["Grand Mall", "Fashion Street", "The Arcade", "Market Square", "Tech Hub", "Antique Row", "Bookworm's Den", "Toy Emporium", "The Jeweler", "Sneaker City", "Music Box", "Candy Kingdom", "Designer Outlet", "The Flea Market", "Souvenir Shop"],
  thrill: ["Rollercoaster Park", "Haunted House", "Skyline Drop", "Go-Kart Track", "The Casino", "Neon Club", "Escape Room", "Laser Tag Arena", "VR World", "Rock Climbing Gym", "Skate Park", "The Stadium", "Comedy Club", "Horror Cinema", "Bungee Tower"]
};

// Quirky Passenger Names
const PASSENGER_PERSONAS = [
  "The Head Chef", "The Widow", "The Hipster", "The Lost Tourist", "The Mayor", 
  "The Food Critic", "The Ghost Hunter", "The Architect", "The Jogger", "The Shopaholic",
  "The Opera Singer", "The Skater Kid", "The Professor", "The Influencer", "The Cat Lady",
  "The Detective", "The Street Artist", "The Banker", "The Surfer", "The Magician",
  "The Librarian", "The Foodie", "The Historian", "The Birdwatcher", "The Gamer",
  "The Thrill Seeker", "The Fashionista", "The Musician", "The CEO", "The Mime"
];

// --- DATA GENERATION ---

const generateLandmarks = () => {
  const landmarks = [];
  const cats = Object.values(CATEGORIES);
  let idCounter = 1;
  
  cats.forEach(cat => {
    // Shuffle names for this category
    const names = [...LANDMARK_NAMES[cat.id]].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 15; i++) {
      landmarks.push({
        id: `L-${idCounter++}`,
        name: names[i] || `${cat.label} Spot ${i + 1}`,
        category: cat.id,
        type: 'landmark',
        connections: {} // { red: 0, blue: 0 } - Track connections per player
      });
    }
  });
  // Shuffle all
  return landmarks.sort(() => Math.random() - 0.5);
};

const generatePassengers = (allLandmarks) => {
  const passengers = [];
  const personas = [...PASSENGER_PERSONAS].sort(() => Math.random() - 0.5);
  let idCounter = 1;

  // 1. Specific Needs (Hard - 3pts)
  for(let i=0; i<8; i++) {
    const target = allLandmarks[Math.floor(Math.random() * allLandmarks.length)];
    passengers.push({
      id: `P-${idCounter++}`,
      name: personas.pop() || `Passenger ${idCounter}`,
      reqType: 'specific',
      targetId: target.id,
      targetName: target.name,
      points: 3,
      desc: `Must visit ${target.name}`
    });
  }

  // 2. Dual Category (Medium - 2pts) - "I want Pizza OR a Rollercoaster"
  const cats = Object.values(CATEGORIES);
  for(let i=0; i<10; i++) {
    const cat1 = cats[Math.floor(Math.random() * cats.length)];
    let cat2 = cats[Math.floor(Math.random() * cats.length)];
    while(cat2.id === cat1.id) cat2 = cats[Math.floor(Math.random() * cats.length)];
    
    passengers.push({
      id: `P-${idCounter++}`,
      name: personas.pop() || `Passenger ${idCounter}`,
      reqType: 'dual_category',
      cat1: cat1.id,
      cat2: cat2.id,
      points: 2,
      desc: `${cat1.label} OR ${cat2.label}`
    });
  }

  // 3. Category Needs (Easy - 1pt)
  for(let i=0; i<12; i++) {
    const targetCat = cats[Math.floor(Math.random() * cats.length)];
    passengers.push({
      id: `P-${idCounter++}`,
      name: personas.pop() || `Passenger ${idCounter}`,
      reqType: 'category',
      targetCategory: targetCat.id,
      points: 1,
      desc: `Any ${targetCat.label} spot`
    });
  }

  return passengers.sort(() => Math.random() - 0.5);
};

const generateTrackDeck = () => {
  const deck = [];
  // 50 Straight, 30 Curved, 20 T-Shape
  for(let i=0; i<50; i++) deck.push({ id: `T-S-${i}`, type: 'track', shape: 'straight' });
  for(let i=0; i<30; i++) deck.push({ id: `T-C-${i}`, type: 'track', shape: 'curved' });
  for(let i=0; i<20; i++) deck.push({ id: `T-T-${i}`, type: 'track', shape: 't-shape' });
  return deck.sort(() => Math.random() - 0.5);
};

// --- HELPER FUNCTIONS ---

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
  return baseExits.map(e => (e + rotation / 90) % 4);
};

const getNeighborCoords = (x, y, dir) => {
  if (dir === 0) return { x, y: y - 1 };
  if (dir === 1) return { x: x + 1, y };
  if (dir === 2) return { x, y: y + 1 };
  if (dir === 3) return { x: x - 1, y };
  return { x, y };
};

const check3TrackRule = (grid, startX, startY, playerColor) => {
  const neighbors = [];
  [0,1,2,3].forEach(dir => {
    const nc = getNeighborCoords(startX, startY, dir);
    const cell = getCell(grid, nc.x, nc.y);
    if (isStart(nc.x, nc.y) || (cell && cell.type === 'track' && cell.owner === playerColor)) {
      neighbors.push(nc);
    }
  });

  if (neighbors.length === 0) return false; 

  const searchQueue = neighbors.map(n => ({ ...n, dist: 1 }));
  const searchVisited = new Set(neighbors.map(n => `${n.x},${n.y}`));
  searchVisited.add(`${startX},${startY}`);

  while (searchQueue.length > 0) {
    const current = searchQueue.shift();
    const cell = getCell(grid, current.x, current.y);

    if (isStart(current.x, current.y) || (cell && cell.type === 'landmark')) {
      if (current.dist < 4) return false;
    }

    // Be careful here: isStart doesn't have a "cell" object usually unless we specifically check coords
    // If it's a track, we continue
    
    [0,1,2,3].forEach(dir => {
      const nc = getNeighborCoords(current.x, current.y, dir);
      const key = `${nc.x},${nc.y}`;
      if (!searchVisited.has(key)) {
        const nextCell = getCell(grid, nc.x, nc.y);
        
        // Valid next step: City Hall OR Landmark OR Own Track
        const isCityHall = isStart(nc.x, nc.y);
        const isOwnTrack = nextCell && nextCell.type === 'track' && nextCell.owner === playerColor;
        const isLandmark = nextCell && nextCell.type === 'landmark';

        if (isCityHall || isOwnTrack || isLandmark) {
             searchVisited.add(key);
             searchQueue.push({ x: nc.x, y: nc.y, dist: current.dist + 1 });
        }
      }
    });
  }
  
  return true;
};

// --- REACT COMPONENTS ---

// 1. Card Component
const GameCard = ({ data, selected, onClick, type }) => {
  if (!data) return <div className="w-16 h-24 bg-gray-800 rounded opacity-50"></div>;
  
  return (
    <div 
      onClick={onClick}
      className={`relative w-16 h-24 md:w-24 md:h-32 rounded-lg border-2 flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-md shrink-0
        ${selected ? 'border-yellow-400 -translate-y-2 shadow-yellow-500/50' : 'border-gray-600 bg-gray-800 hover:border-gray-400'}
        ${type === 'track' ? 'bg-slate-800' : 'bg-indigo-900'}
      `}
    >
      {type === 'track' && (
        <>
          <div className="text-[10px] md:text-xs text-gray-400 mb-1 md:mb-2 uppercase font-bold text-center truncate w-full">{data.shape}</div>
          <div className="w-8 h-8 md:w-12 md:h-12 border border-gray-600 rounded flex items-center justify-center bg-gray-900">
             {/* Visual representation of track shape */}
             {data.shape === 'straight' && <div className="w-1.5 md:w-2 h-full bg-gray-400"></div>}
             {data.shape === 'curved' && <div className="w-4 h-4 md:w-6 md:h-6 border-r-4 border-b-4 border-gray-400 rounded-br-full -translate-x-0.5 -translate-y-0.5"></div>}
             {data.shape === 't-shape' && <div className="w-full h-full flex items-center justify-center relative">
               <div className="absolute top-0 bottom-0 w-1.5 md:w-2 bg-gray-400"></div>
               <div className="absolute right-0 top-1/2 w-1/2 h-1.5 md:h-2 bg-gray-400 -translate-y-1/2"></div>
             </div>}
          </div>
        </>
      )}

      {type === 'landmark' && (
        <>
          <div className="absolute top-1 right-1 text-gray-500 scale-75 md:scale-100">
             {CATEGORIES[data.category?.toUpperCase()]?.icon}
          </div>
          <div className="text-[8px] md:text-[10px] text-center font-bold text-white leading-tight mt-2 line-clamp-2">{data.name}</div>
          <div className="text-[8px] md:text-[9px] text-gray-400 mt-1">{CATEGORIES[data.category?.toUpperCase()]?.label}</div>
        </>
      )}
    </div>
  );
};

// 2. Cell Component
const Cell = ({ x, y, cellData, onClick, isValidTarget, ghost }) => {
  const isCenter = x === CENTER && y === CENTER;
  
  // Render logic
  let content = null;
  let bgClass = "bg-gray-900";
  let borderClass = "border-gray-800";

  // Mappings for specific border colors to ensure curves render correctly
  const borderColorMap = { 
    red: 'border-red-500', 
    blue: 'border-blue-500', 
    green: 'border-green-500', 
    yellow: 'border-yellow-400' 
  };
  const colorMap = { 
    red: 'bg-red-500', 
    blue: 'bg-blue-500', 
    green: 'bg-green-500', 
    yellow: 'bg-yellow-400' 
  };

  if (isCenter) {
    content = <div className="flex flex-col items-center justify-center h-full w-full bg-white text-black font-bold text-[6px] md:text-[10px] z-10 text-center leading-none">CITY HALL</div>;
    bgClass = "bg-white";
  } else if (cellData?.type === 'track') {
    const cClass = colorMap[cellData.owner] || 'bg-gray-500';
    const bClass = borderColorMap[cellData.owner] || 'border-gray-500';
    
    // Draw track path using SVG based on shape and rotation
    content = (
      <div className="relative w-full h-full" style={{ transform: `rotate(${cellData.rotation}deg)` }}>
        {cellData.shape === 'straight' && (
          <div className={`absolute left-1/2 top-0 bottom-0 w-1/3 -translate-x-1/2 ${cClass} shadow-sm`}></div>
        )}
        {cellData.shape === 'curved' && (
           <div className={`absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2`}>
             <div className={`absolute top-1/2 left-1/2 w-[60%] h-[60%] border-r-[8px] md:border-r-[12px] border-b-[8px] md:border-b-[12px] rounded-br-full ${bClass} -translate-y-full -translate-x-full shadow-sm`}></div>
           </div>
        )}
        {cellData.shape === 't-shape' && (
          <>
             <div className={`absolute left-1/2 top-0 bottom-0 w-1/3 -translate-x-1/2 ${cClass} shadow-sm`}></div>
             <div className={`absolute right-0 top-1/2 w-1/2 h-1/3 -translate-y-1/2 ${cClass} shadow-sm`}></div>
          </>
        )}
      </div>
    );
  } else if (cellData?.type === 'landmark') {
    content = (
      <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center p-0.5 border-2 border-white shadow-inner relative">
         <div className="text-black scale-75 md:scale-100">{CATEGORIES[cellData.category?.toUpperCase()]?.icon}</div>
         <div className="text-[5px] md:text-[8px] text-black font-bold text-center leading-none mt-0.5 break-words w-full overflow-hidden">{cellData.name}</div>
         {/* Show connection dots */}
         {cellData.connections && Object.keys(cellData.connections).map((c, i) => (
           <div key={c} className={`absolute w-1.5 h-1.5 rounded-full ${colorMap[c]} bottom-0.5 right-${i * 2 + 1}`}></div>
         ))}
      </div>
    );
  } else if (ghost) {
    // Ghost preview for hover/selection
    content = <div className={`w-full h-full bg-white opacity-20 animate-pulse rounded-sm`}></div>
  }

  return (
    <div 
      onClick={() => onClick(x, y)}
      className={`w-full h-full aspect-square border ${borderClass} ${bgClass} relative flex items-center justify-center overflow-hidden cursor-pointer hover:bg-opacity-90 transition-colors touch-manipulation`}
    >
      {content}
    </div>
  );
};

// --- TRACK PREVIEW COMPONENT ---
// Shows the currently selected track with the correct rotation and color
const TrackPreview = ({ shape, rotation, color }) => {
  const colorMap = { red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-400' };
  const borderColorMap = { red: 'border-red-500', blue: 'border-blue-500', green: 'border-green-500', yellow: 'border-yellow-400' };
  const cClass = colorMap[color] || 'bg-gray-400';
  const bClass = borderColorMap[color] || 'border-gray-400';
  
  return (
    <div className="w-8 h-8 md:w-10 md:h-10 border border-gray-600 bg-gray-900 rounded flex items-center justify-center relative overflow-hidden">
      <div className="w-full h-full relative" style={{ transform: `rotate(${rotation}deg)` }}>
        {shape === 'straight' && <div className={`absolute left-1/2 top-0 bottom-0 w-1/3 -translate-x-1/2 ${cClass}`}></div>}
        {shape === 'curved' && (
           <div className={`absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2`}>
             <div className={`absolute top-1/2 left-1/2 w-[60%] h-[60%] border-r-[4px] border-b-[4px] rounded-br-full ${bClass} -translate-y-full -translate-x-full`}></div>
           </div>
        )}
        {shape === 't-shape' && (
          <>
             <div className={`absolute left-1/2 top-0 bottom-0 w-1/3 -translate-x-1/2 ${cClass}`}></div>
             <div className={`absolute right-0 top-1/2 w-1/2 h-1/3 -translate-y-1/2 ${cClass}`}></div>
          </>
        )}
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---

export default function App() {
  const [user, setUser] = useState(null);
  const [entryCode, setEntryCode] = useState(""); 
  const [activeRoomId, setActiveRoomId] = useState(""); 
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState(null);
  const [view, setView] = useState('home');
  const [error, setError] = useState("");
  
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    const sub = onAuthStateChanged(auth, setUser);
    return () => sub();
  }, []);

  useEffect(() => {
    if (!user || !activeRoomId) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'games', activeRoomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.grid === 'string') data.grid = JSON.parse(data.grid);
        setGameState(data);
        const isHost = data.hostId === user.uid;
        if (data.status === 'playing') setView(isHost ? 'host' : 'player');
        else setView('lobby');
      } else {
        setError("Room not found");
        setGameState(null);
      }
    }, (err) => console.error("Sync error", err));
    return () => unsub();
  }, [user, activeRoomId]);

  const createGame = async () => {
    if (!user) return;
    const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const initialGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const landmarks = generateLandmarks();
    const passengers = generatePassengers(landmarks);
    const activePassengers = passengers.splice(0, 3);

    const initialData = {
      hostId: user.uid,
      status: 'lobby',
      players: [],
      grid: JSON.stringify(initialGrid),
      turnIndex: 0,
      decks: {
        tracks: generateTrackDeck(),
        landmarks: landmarks,
        passengers: passengers
      },
      activePassengers: activePassengers,
      winner: null
    };

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', newRoomId), initialData);
    setEntryCode(newRoomId);
    setActiveRoomId(newRoomId);
  };

  const joinGame = async () => {
    if (!entryCode || !playerName || !user) {
      setError("Please enter a room code and your name.");
      return;
    }
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

        const newPlayer = {
          id: user.uid,
          name: playerName,
          color: COLORS[data.players.length],
          score: 0,
          hand: { tracks: [], landmarks: [] },
          completedPassengers: []
        };

        transaction.update(roomRef, { players: arrayUnion(newPlayer) });
      });
      setActiveRoomId(codeToJoin);
      setError("");
    } catch (e) {
      if (e === "Room does not exist") setError("Invalid Room Code");
      else if (e === "Room full") setError("Room is full!");
      else setActiveRoomId(codeToJoin);
    }
  };

  const startGame = async () => {
    if (!gameState) return;
    const updatedPlayers = gameState.players.map(p => {
      const tracks = gameState.decks.tracks.splice(0, 3);
      const landmarks = gameState.decks.landmarks.splice(0, 2);
      return { ...p, hand: { tracks, landmarks } };
    });
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', activeRoomId), {
      status: 'playing', players: updatedPlayers, decks: gameState.decks 
    });
  };

  const endTurn = async (newGrid, newPlayers, newDecks, newActivePassengers) => {
    const nextTurn = (gameState.turnIndex + 1) % gameState.players.length;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', activeRoomId), {
      grid: JSON.stringify(newGrid), players: newPlayers, decks: newDecks,
      activePassengers: newActivePassengers, turnIndex: nextTurn
    });
    setSelectedCardIdx(null);
    setSelectedCardType(null);
    setRotation(0);
  };

  const handlePlaceCard = (x, y) => {
    if (view !== 'player') return;
    const playerIdx = gameState.players.findIndex(p => p.id === user.uid);
    if (playerIdx !== gameState.turnIndex) { alert("Not your turn!"); return; }
    
    if (selectedCardIdx === null) return;
    const player = gameState.players[playerIdx];
    const card = selectedCardType === 'tracks' 
      ? player.hand.tracks[selectedCardIdx] 
      : player.hand.landmarks[selectedCardIdx];
    if (!card) return;

    const grid = gameState.grid;
    if (grid[y][x] !== null) { alert("Space occupied"); return; }

    // --- CONNECTIVITY CHECK ---
    let connected = false;
    let landmarkConnection = null; // To track if we are connecting to a landmark

    const neighbors = [0,1,2,3].map(d => getNeighborCoords(x, y, d));
    
    neighbors.forEach((n, dir) => {
      const cell = getCell(grid, n.x, n.y);
      // 1. Is this neighbor City Hall?
      if (isStart(n.x, n.y)) {
        connected = true;
      }
      
      if (cell) {
        // 2. Is this neighbor a track I own?
        if (cell.type === 'track' && cell.owner === player.color) {
          connected = true;
        }
        // 3. Is this neighbor a Landmark I am ALREADY connected to?
        // This allows us to "pass through" a landmark to build out the other side.
        if (cell.type === 'landmark' && cell.connections && cell.connections[player.color] > 0) {
          connected = true;
        }
      }
    });

    if (!connected) {
      alert("Must connect to your existing tracks, a Landmark you've entered, or City Hall.");
      return;
    }

    // --- LANDMARK PLACEMENT RULES ---
    if (card.type === 'landmark') {
      const validDistance = check3TrackRule(grid, x, y, player.color);
      if (!validDistance) {
        alert("Landmarks must be separated by at least 3 track segments of your color from City Hall or other Landmarks.");
        return;
      }
      // Initialize connections
      card.connections = {}; 
    }

    const newGrid = [...grid];
    // Copy the card to the grid
    newGrid[y][x] = {
      ...card,
      owner: player.color,
      rotation: rotation,
      // For tracks, we might update later if they connect to adjacent landmarks
      connectedColors: card.type === 'track' ? [player.color] : [] 
    };

    // --- SCORING & PASSENGERS & LANDMARK CONNECTIONS ---
    let pointsGained = 0;
    const completedPassengerIds = [];
    
    const checkPassengers = (landmarkCell) => {
      gameState.activePassengers.forEach(p => {
        if (completedPassengerIds.includes(p.id)) return;
        let match = false;
        
        if (p.reqType === 'specific' && p.targetId === landmarkCell.id) match = true;
        
        if (p.reqType === 'category' && p.targetCategory === landmarkCell.category) match = true;
        
        if (p.reqType === 'dual_category' && (p.cat1 === landmarkCell.category || p.cat2 === landmarkCell.category)) match = true;

        if (match) {
           pointsGained += p.points;
           completedPassengerIds.push(p.id);
        }
      });
    };

    if (card.type === 'landmark') {
      // Placing a landmark satisfies passengers immediately? 
      // Usually you have to connect to it. The placer is implicitly connected?
      // Rule says: "Players can only place landmarks in-between 3 tracks".
      // Let's assume placement implies connection for the owner.
      newGrid[y][x].connections = { [player.color]: 1 }; // First connection
      checkPassengers(newGrid[y][x]);
    } else {
      // Check if this new track connects to any adjacent landmarks
      neighbors.forEach(n => {
        const cell = getCell(newGrid, n.x, n.y);
        if (cell && cell.type === 'landmark') {
           // Connection Logic
           const currentConnections = cell.connections || {};
           const myConnCount = currentConnections[player.color] || 0;
           const distinctPlayers = Object.keys(currentConnections).length;
           
           // Can I connect?
           // 1. If I have < 2 connections personally
           // 2. AND (I am already one of the players OR there are less than 2 players total)
           
           if (myConnCount < 2) {
             if (myConnCount > 0 || distinctPlayers < 2) {
                // Valid connection!
                if (!cell.connections) cell.connections = {};
                cell.connections[player.color] = myConnCount + 1;
                
                // If this is my first connection (entering), I score passengers
                // Or maybe I score every time? Usually just on arrival?
                // Let's score whenever I connect.
                checkPassengers(cell);
             }
           }
        }
      });
    }

    const newHand = { ...player.hand };
    if (selectedCardType === 'tracks') newHand.tracks.splice(selectedCardIdx, 1);
    else newHand.landmarks.splice(selectedCardIdx, 1);
    
    const newDecks = { ...gameState.decks };
    if (selectedCardType === 'tracks') {
       if (newDecks.tracks.length > 0) newHand.tracks.push(newDecks.tracks.pop());
    } else {
       if (newDecks.landmarks.length > 0) newHand.landmarks.push(newDecks.landmarks.pop());
    }

    let newActivePassengers = [...gameState.activePassengers];
    if (completedPassengerIds.length > 0) {
      newActivePassengers = newActivePassengers.filter(p => !completedPassengerIds.includes(p.id));
      while (newActivePassengers.length < 3 && newDecks.passengers.length > 0) {
        newActivePassengers.push(newDecks.passengers.pop());
      }
    }

    const newPlayers = [...gameState.players];
    newPlayers[playerIdx] = {
      ...player,
      hand: newHand,
      score: player.score + pointsGained
    };

    if (newPlayers[playerIdx].score >= 7) {
       alert(`${player.name} WINS!`);
    }

    endTurn(newGrid, newPlayers, newDecks, newActivePassengers);
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center font-sans p-4">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-green-500 to-blue-500 mb-8 tracking-tighter text-center">
          MIND THE GAP
        </h1>
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
          <button onClick={createGame} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 w-full md:w-auto">
            <Crown size={24}/> Host
          </button>
          
          <div className="flex flex-col gap-2 w-full">
            <input 
              type="text" 
              placeholder="Room Code" 
              className="px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-center uppercase tracking-widest w-full"
              value={entryCode}
              onChange={e => setEntryCode(e.target.value.toUpperCase())}
            />
            <input 
              type="text" 
              placeholder="Your Name" 
              className="px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-center w-full"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
            />
            <button onClick={joinGame} className="px-8 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 w-full">
              Join Game
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 mt-4 font-bold bg-red-900/20 px-4 py-2 rounded">{error}</p>}
      </div>
    );
  }

  if (view === 'lobby') {
    const isHost = gameState?.hostId === user.uid;
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-4xl font-bold mb-2">Lobby: {activeRoomId}</h2>
        <p className="text-gray-400 mb-8">Waiting for players...</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {gameState?.players.map((p, i) => (
            <div key={i} className={`p-6 rounded-xl bg-gray-800 border-2 border-${p.color}-500 flex flex-col items-center`}>
              <div className={`w-12 h-12 rounded-full bg-${p.color}-500 mb-2`}></div>
              <span className="font-bold text-lg">{p.name}</span>
            </div>
          ))}
          {[...Array(4 - (gameState?.players.length || 0))].map((_, i) => (
             <div key={i} className="p-6 rounded-xl bg-gray-800/50 border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-600">
               Waiting...
             </div>
          ))}
        </div>

        {isHost ? (
          <button 
            onClick={startGame}
            disabled={gameState?.players.length < 2}
            className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-full font-black text-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            START GAME
          </button>
        ) : (
          <p className="animate-pulse text-xl font-medium text-center">Host will start the game soon...</p>
        )}
      </div>
    );
  }

  const Board = ({ interactive }) => (
    <div 
      className="grid gap-[1px] bg-gray-800 p-1 rounded-lg shadow-2xl overflow-hidden select-none mx-auto"
      style={{ 
        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        width: '100%',
        aspectRatio: '1/1',
        maxWidth: '800px',
        maxHeight: '75vh' 
      }}
    >
      {gameState.grid.map((row, y) => (
        row.map((cell, x) => (
          <Cell 
            key={`${x}-${y}`} 
            x={x} 
            y={y} 
            cellData={cell} 
            onClick={interactive ? handlePlaceCard : () => {}}
            interactive={interactive}
          />
        ))
      ))}
    </div>
  );

  if (view === 'host') {
    return (
      <div className="h-screen bg-gray-950 text-white flex p-2 gap-2 overflow-hidden">
        <div className="w-1/4 max-w-sm flex flex-col gap-2 h-full">
          <div className="bg-gray-800 p-2 rounded text-center">
             <div className="text-xs text-gray-400 uppercase">Room Code</div>
             <div className="text-2xl font-black tracking-widest">{activeRoomId}</div>
          </div>

          <div className="bg-gray-900 p-3 rounded-xl shadow-lg border border-gray-800 flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-400 mb-2 flex items-center gap-2"><Trophy size={16}/> Scores</h3>
            <div className="space-y-2">
              {gameState.players.map((p, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${gameState.turnIndex === i ? 'bg-gray-800 ring-1 ring-white' : 'bg-gray-800/50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-${p.color}-500`}></div>
                    <span className="font-bold text-sm truncate max-w-[80px]">{p.name}</span>
                  </div>
                  <span className="text-lg font-black">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 p-3 rounded-xl shadow-lg border border-gray-800 flex-1 overflow-auto">
            <h3 className="text-lg font-bold text-gray-400 mb-2 flex items-center gap-2"><Users size={16}/> Passengers</h3>
            <div className="space-y-2">
              {gameState.activePassengers.map(pass => (
                <div key={pass.id} className="bg-gray-800 p-2 rounded-lg flex flex-col gap-1 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-yellow-400 text-sm">{pass.points} PTS</span>
                    {pass.reqType === 'category' && <span className="scale-75">{CATEGORIES[pass.targetCategory?.toUpperCase()]?.icon}</span>}
                    {pass.reqType === 'dual_category' && <span className="text-[10px] text-yellow-500">Dual</span>}
                  </div>
                  <div className="flex justify-between items-end">
                     <p className="text-xs text-gray-300 leading-tight font-medium">{pass.name}</p>
                     <p className="text-[10px] text-gray-500">{pass.reqType === 'specific' ? 'Specific' : 'Type'}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 italic mt-1">{pass.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-xl overflow-hidden relative">
           <div className="absolute inset-2 flex items-center justify-center">
              <Board interactive={false} />
           </div>
        </div>
      </div>
    );
  }

  if (view === 'player') {
    const player = gameState.players.find(p => p.id === user.uid);
    const isMyTurn = gameState.players[gameState.turnIndex].id === user.uid;

    return (
      <div className="h-[100dvh] bg-gray-950 text-white flex flex-col overflow-hidden">
        <div className="h-12 bg-gray-900 flex items-center justify-between px-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full bg-${player.color}-500 shadow-[0_0_8px_currentColor]`}></div>
            <span className="font-bold truncate max-w-[100px]">{player.name}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end leading-none">
                <span className="text-[10px] text-gray-400">SCORE</span>
                <span className="text-lg font-black text-white">{player.score}</span>
             </div>
             {isMyTurn && <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-black/20">
           <Board interactive={isMyTurn} />
        </div>

        <div className="bg-gray-900 border-t border-gray-800 shrink-0 flex flex-col safe-area-pb">
          {isMyTurn && selectedCardType === 'tracks' && (
            <div className="flex justify-center items-center gap-4 py-2 border-b border-gray-800 bg-gray-800/50">
               {/* PREVIEW COMPONENT */}
               <TrackPreview 
                 shape={player.hand.tracks[selectedCardIdx]?.shape} 
                 rotation={rotation} 
                 color={player.color} 
               />
              <button 
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
              >
                <RotateCw size={18} /> Rotate <span className="text-blue-200">({rotation}°)</span>
              </button>
            </div>
          )}

          <div className="flex gap-1 overflow-x-auto p-2 pb-4 no-scrollbar">
            {player.hand.tracks.map((card, i) => (
              <GameCard 
                key={`t-${i}`} 
                data={card} 
                type="track"
                selected={selectedCardType === 'tracks' && selectedCardIdx === i}
                onClick={() => {
                  if (!isMyTurn) return;
                  setSelectedCardIdx(i);
                  setSelectedCardType('tracks');
                  setRotation(0);
                }}
              />
            ))}
            <div className="w-px bg-gray-700 mx-1 shrink-0 self-stretch my-2"></div>
            {player.hand.landmarks.map((card, i) => (
              <GameCard 
                key={`l-${i}`} 
                data={card} 
                type="landmark"
                selected={selectedCardType === 'landmarks' && selectedCardIdx === i}
                onClick={() => {
                  if (!isMyTurn) return;
                  setSelectedCardIdx(i);
                  setSelectedCardType('landmarks');
                  setRotation(0);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}