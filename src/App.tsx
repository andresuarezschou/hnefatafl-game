// src/App.tsx
import { useState } from 'react';

type PieceType = 'A'| 'D' | 'K' | null;

export default function App() {

const initializeBoard = (): PieceType[] => { 
  // 0 = empty, 1 = attacker, 2 = defender, 3 = king
  const grid = Array(121).fill(null);

  grid[60] = 'K';

  const defenderIndices = [49,59,61,71,38,48,50,58,62,70,72,82];
  defenderIndices.forEach(idx => grid[idx] = 'D');

  const attackerIndices = [
  	3, 4, 5, 6, 7, 16,
	33, 44, 55, 66, 77, 56,
	43, 54, 65, 76, 87, 64,
	104, 113, 114, 115, 116, 117
	];
  attackerIndices.forEach(idx => grid[idx] = 'A');

  return grid;
};

  const [board, setBoard] = useState<PieceType[]>(initializeBoard);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [turn, setTurn] = useState<'A' | 'D'>('A');

  const isCorner = (i: number) => [0, 10, 110, 120].includes(i);
  const isThrone = (i: number) => i === 60; 

  const getValidMoves = (startIdx: number) : number[] => {
  	const piece = board[startIdx];
	if (!piece) return [];

	const moves: number[] = [];
        const row = Math.floor(startIdx / 11);
	const col = startIdx % 11;
    	const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

	directions.forEach(([dr,dc]) => {
		let r = row + dr;
		let c = col +dc;
		
		while (r >= 0 && r < 11 && c >= 0 && c < 11) {
        const i = r * 11 + c;
        if (board[i] !== null) break; // Path blocked

        // Special Square Restriction: Only King can land on Corners or Throne
        if ((isCorner(i) || isThrone(i)) && piece !== 'K') {
          // Pieces can pass THROUGH the empty throne, but not land on it
          if (isThrone(i)) {
            r += dr;
            c += dc;
            continue; 
          }
          break; // Corners block everything else
        }

        moves.push(i);
        r += dr;
        c += dc;
      }
    });
    return moves;
  };

  const handleSquareClick = (i: number) => {
    const piece = board[i];

    // 1. SELECTING A PIECE
    if (piece !== null) {
      const isAttackerPiece = piece === 'A';
      const isDefenderPiece = piece === 'D' || piece === 'K';

      if ((turn === 'A' && isAttackerPiece) || (turn === 'D' && isDefenderPiece)) {
        setSelectedIdx(i);
      } else {
        setSelectedIdx(null); // Clicked enemy piece
      }
      return;
    }

    // 2. MOVING TO AN EMPTY SQUARE
    if (selectedIdx !== null) {
      const validMoves = getValidMoves(selectedIdx);

      if (validMoves.includes(i)) {
        let newBoard = [...board];
	const movingPiece = board[selectedIdx];

        newBoard[i] = movingPiece;
        newBoard[selectedIdx] = null;
        
	const row = Math.floor(i / 11);
        const col = i % 11;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        const isFriendly = (p: PieceType) => {
          if (movingPiece === 'A') return p === 'A';
          return p === 'D' || p === 'K';
        };

        directions.forEach(([dr, dc]) => {
          const victimR = row + dr;
          const victimC = col + dc;
          const flankR = row + dr * 2;
          const flankC = col + dc * 2;

          // Stay within board bounds
          if (flankR >= 0 && flankR < 11 && flankC >= 0 && flankC < 11) {
            const vIdx = victimR * 11 + victimC;
            const fIdx = flankR * 11 + flankC;
            const victim = newBoard[vIdx];
            const flank = newBoard[fIdx];

            // If neighbor is an enemy...
            if (victim && !isFriendly(victim) && victim !== 'K') {
              // ...and the square behind it is friendly or a hostile square (Corner/Throne)
              if (isFriendly(flank) || isCorner(fIdx) || isThrone(fIdx)) {
                newBoard[vIdx] = null; // Capture!
              }
            }
          }
        });

        setBoard(newBoard);
        setSelectedIdx(null);
        setTurn(turn === 'A' ? 'D' : 'A'); // Switch Turn
      } else {
        setSelectedIdx(null);
      }
    }
  };
  
  const renderPiece = (piece: PieceType) => {
    if (!piece) return null;

   const pieceAssets: Record<NonNullable<PieceType>, string> = {
    K: '/King_african_aoe2DE.webp',       
    D: '/Scn_03_hastings_normal.webp',   
    A: '/Scn_11_york_normal.webp'    
  };


  return (
    <img 
      src={pieceAssets[piece]} 
      alt={piece === 'K' ? 'King' : piece === 'D' ? 'Defender' : 'Attacker'} 
      className="w-4/5 h-4/5 object-contain transition-transform duration-200 pointer-events-none"
    />
  );
}; 

  const validMoves = selectedIdx !== null ? getValidMoves(selectedIdx) : [];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-900 p-4 text-stone-100">
      <h1 className="mb-6 text-3xl font-serif font-bold tracking-widest text-amber-200">
        Hnefatafl
      </h1>

      <img className="mb-6 w-2/3 sm:w-auto max-h-[12vh] sm:max-h-none object-contain" 
      	   src="longboat.webp" 
	   alt="Viking longboat" 
      />
      

      {/* The Responsive Board */}
      <div className="grid grid-cols-11 grid-rows-11 w-[95vw] sm:w-[528px] aspect-square border-4 border-stone-700 bg-stone-800 shadow-2xl overflow-hidden">
        {board.map((piece, i) => {
          const isSelected = selectedIdx === i;
          const isValidTarget = validMoves.includes(i);

          return (
            <div
              key={i}
              onClick={() => handleSquareClick(i)}
              className={`
                relative flex items-center justify-center border-[0.5px] border-stone-700/50 transition-all cursor-pointer
                ${isCorner(i) || isThrone(i) ? 'bg-stone-950/60' : ''}
                ${isSelected ? 'bg-amber-500/20' : ''}
                ${isValidTarget ? 'hover:bg-emerald-500/20' : 'hover:bg-stone-700/30'}
              `}
            >
              {/* Piece with responsive text scaling */}
              <div className={`z-10 select-none text-[6vw] sm:text-3xl leading-none ${isSelected ? 'scale-125' : ''}`}>
                {renderPiece(piece)}
              </div>

              {/* Selection Ring */}
              {isSelected && <div className="absolute inset-1 border-2 border-amber-400/50 rounded-sm animate-pulse" />}
              
              {/* Move Hint Dot */}
              {isValidTarget && <div className="absolute h-2 w-2 rounded-full bg-emerald-500/40" />}
              
              {/* Corner/Throne markers */}
              {!piece && isCorner(i) && <span className="text-stone-600 font-bold text-[3vw] sm:text-sm">✕</span>}
              {!piece && isThrone(i) && <span className="text-stone-600/40 text-[4vw] sm:text-xl">🛡</span>}
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => { setBoard(initializeBoard()); setSelectedIdx(null); setTurn('A'); }}
        className="mt-8 rounded bg-amber-800 px-8 py-2 font-bold tracking-widest text-amber-50 hover:bg-amber-700 active:scale-95 transition-all"
      >
        Reset Game
      </button>
    </div>
  );
}
