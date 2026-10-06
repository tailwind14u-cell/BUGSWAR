import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { GameEngine, PlayerInput, ARENA_WIDTH, ARENA_HEIGHT } from './game/GameEngine';
import { CanvasRenderer } from './game/CanvasRenderer';
import { BugPlayer, Faction, GameSnapshot, FACTION_DETAILS } from './types/game';
import { TopBar } from './components/TopBar';
import { LobbyScreen } from './components/LobbyScreen';
import { GameHUD } from './components/GameHUD';
import { Leaderboard } from './components/Leaderboard';
import { Minimap } from './components/Minimap';
import { KillFeed } from './components/KillFeed';
import { DeathModal } from './components/DeathModal';
import { EvolutionCodexModal } from './components/EvolutionCodexModal';
import { CombatTriangleModal, ControlsModal } from './components/InfoModals';
import { sound } from './services/sound';

type GameState = 'LOBBY' | 'PLAYING';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [selfId, setSelfId] = useState<string>('');
  const [selfPlayer, setSelfPlayer] = useState<BugPlayer | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoBite, setAutoBite] = useState<boolean>(true);

  // Modals
  const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
  const [isCombatTriangleOpen, setIsCombatTriangleOpen] = useState<boolean>(false);
  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);
  const [isDeathModalOpen, setIsDeathModalOpen] = useState<boolean>(false);
  const [killerName, setKillerName] = useState<string>('');

  // Real-time snapshot data
  const [snapshot, setSnapshot] = useState<GameSnapshot>({
    timestamp: Date.now(),
    players: [],
    minions: [],
    sugarDrops: [],
    giantCrystals: [],
    webs: [],
    toxicClouds: [],
    projectiles: [],
    leaderboard: [],
    killFeed: []
  });

  // Canvas & Engine refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const localEngineRef = useRef<GameEngine | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isWsConnectedRef = useRef<boolean>(false);
  const wsObstaclesRef = useRef<any[]>([]);
  const wsFloatingTextsRef = useRef<any[]>([]);

  // Current inputs
  const currentInputRef = useRef<PlayerInput>({
    targetAngle: 0,
    isBiting: false,
    autoBite: true,
    useAbility: false,
    useUltimate: false,
    boost: false
  });

  // Initialize Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    rendererRef.current = new CanvasRenderer(canvas);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Initialize Local Simulation Engine (Authoritative Fallback & Single-Player Mode)
  useEffect(() => {
    const engine = new GameEngine();
    localEngineRef.current = engine;

    engine.onEvent = (event) => {
      handleGameEvent(event);
    };
  }, []);

  const handleGameEvent = useCallback((event: { type: string; payload?: unknown }) => {
    if (event.type === 'sugar_eaten') {
      const p = event.payload as { type?: 'standard' | 'cluster' | 'crystal' | 'severed_segment' };
      sound.playSugarEat(p?.type || 'standard');
    } else if (event.type === 'bite_hit') {
      sound.playBite();
      rendererRef.current?.triggerScreenShake(4);
    } else if (event.type === 'segment_severed') {
      sound.playSegmentSever();
      rendererRef.current?.triggerScreenShake(10);
      const payload = event.payload as { segmentsCut: number; isAttackerSelf: boolean; isVictimSelf: boolean };
      if (payload.isAttackerSelf || payload.isVictimSelf) {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#ef4444', '#f97316', '#fbbf24']
        });
      }
    } else if (event.type === 'evolved') {
      const payload = event.payload as { isSelf: boolean; stage: number; speciesName: string };
      if (payload.isSelf) {
        sound.playEvolve();
        confetti({
          particleCount: 80,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#fbbf24', '#38bdf8']
        });
      }
    } else if (event.type === 'body_crash') {
      sound.playCrash();
      rendererRef.current?.triggerScreenShake(8);
    } else if (event.type === 'shell_deflect') {
      sound.playCrash();
      rendererRef.current?.triggerScreenShake(5);
    } else if (event.type === 'wisp_eaten') {
      sound.playSugarRush();
      rendererRef.current?.triggerScreenShake(5);
      const payload = event.payload as { isSelf: boolean };
      if (payload?.isSelf) {
        confetti({
          particleCount: 35,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#fef08a', '#fbbf24']
        });
      }
    } else if (event.type === 'sugar_rush') {
      sound.playSugarRush();
      rendererRef.current?.triggerScreenShake(6);
    } else if (event.type === 'ability_used') {
      const payload = event.payload as { faction: Faction; stage: number };
      if (payload.faction === 'spider') sound.playWebShoot();
      else sound.playPounce();
    } else if (event.type === 'player_eliminated') {
      const payload = event.payload as { isSelfVictim: boolean; isSelfKiller: boolean; killerName: string };
      if (payload.isSelfVictim) {
        sound.playDeath();
        setIsDeathModalOpen(true);
        setKillerName(payload.killerName);
      }
      if (payload.isSelfKiller) {
        sound.playKillStreak();
        confetti({
          particleCount: 50,
          spread: 85,
          origin: { y: 0.7 },
          colors: ['#10b981', '#fbbf24', '#f59e0b', '#ef4444']
        });
      }
    }
  }, []);

  // Connect to Authoritative WebSocket Server if available
  const connectWebSocket = useCallback((name: string, faction: Faction) => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        isWsConnectedRef.current = true;
        ws.send(JSON.stringify({ type: 'join', name, faction }));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'joined') {
            setSelfId(msg.playerId);
            setSelfPlayer(msg.player);
            if (msg.obstacles) wsObstaclesRef.current = msg.obstacles;
          } else if (msg.type === 'snapshot') {
            const snap: GameSnapshot = msg.snapshot;
            setSnapshot(snap);
            if (msg.obstacles) wsObstaclesRef.current = msg.obstacles;
            if (msg.floatingTexts) wsFloatingTextsRef.current = msg.floatingTexts;
            const self = snap.players.find(p => p.id === selfId);
            if (self) {
              setSelfPlayer(self);
              if (self.hp <= 0 && !isDeathModalOpen) {
                setIsDeathModalOpen(true);
                setKillerName(self.lastDamagedByName || 'Yard Predator');
              }
            }
          } else if (msg.type === 'game_event') {
            handleGameEvent(msg.event);
          } else if (msg.type === 'respawned') {
            setSelfPlayer(msg.player);
            setIsDeathModalOpen(false);
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onerror = () => {
        // Fallback to local authoritative simulation
        isWsConnectedRef.current = false;
        setupLocalPlayer(name, faction);
      };

      ws.onclose = () => {
        isWsConnectedRef.current = false;
      };
    } catch {
      // In sandbox/preview without direct WS proxy, run local authoritative simulation
      isWsConnectedRef.current = false;
      setupLocalPlayer(name, faction);
    }
  }, [handleGameEvent, isDeathModalOpen, selfId]);

  const setupLocalPlayer = (name: string, faction: Faction) => {
    if (!localEngineRef.current) return;
    const engine = localEngineRef.current;
    const playerId = `local_p_${Date.now()}`;
    setSelfId(playerId);
    const p = engine.createPlayer(playerId, name, faction, false);
    setSelfPlayer(p);
  };

  const handleJoinGame = (name: string, faction: Faction) => {
    setGameState('PLAYING');
    setIsDeathModalOpen(false);
    connectWebSocket(name, faction);
  };

  const handleRespawn = () => {
    if (isWsConnectedRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'respawn' }));
    } else if (localEngineRef.current && selfId) {
      const respawned = localEngineRef.current.respawnPlayer(selfId);
      if (respawned) {
        setSelfPlayer(respawned);
        setIsDeathModalOpen(false);
      }
    }
  };

  // Main 60 FPS Game Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // If running local authoritative engine (no WS or offline)
      if (!isWsConnectedRef.current && localEngineRef.current) {
        const engine = localEngineRef.current;
        if (selfId) {
          engine.applyInput(selfId, currentInputRef.current);
        }
        engine.update(dt);
        const snap = engine.getSnapshot(selfId);
        setSnapshot(snap);

        if (selfId) {
          const self = engine.players.get(selfId);
          if (self) {
            setSelfPlayer({ ...self });
            if (self.hp <= 0 && !isDeathModalOpen) {
              setIsDeathModalOpen(true);
              setKillerName(self.lastDamagedByName || 'Yard Predator');
            }
          }
        }
      }

      // If running on WebSocket, send inputs at 30Hz
      if (isWsConnectedRef.current && wsRef.current?.readyState === WebSocket.OPEN && selfId) {
        wsRef.current.send(JSON.stringify({
          type: 'input',
          input: currentInputRef.current
        }));
      }

      // Reset single-frame action flags
      currentInputRef.current.useAbility = false;
      currentInputRef.current.useUltimate = false;

      // Render Frame
      if (rendererRef.current && canvasRef.current) {
        const engine = localEngineRef.current;
        const obstacles = isWsConnectedRef.current && wsObstaclesRef.current.length > 0
          ? wsObstaclesRef.current
          : (engine ? engine.obstacles : []);
        const floatingTexts = isWsConnectedRef.current && wsFloatingTextsRef.current.length > 0
          ? wsFloatingTextsRef.current
          : (engine ? engine.floatingTexts : []);

        rendererRef.current.render(snapshot, selfId, obstacles, dt, floatingTexts);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [selfId, snapshot, isDeathModalOpen]);

  // Mouse Input Listeners
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      currentInputRef.current.targetAngle = angle;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left Click: Slither Speed Boost & Bite
        currentInputRef.current.boost = true;
        currentInputRef.current.isBiting = true;
      } else if (e.button === 2) {
        // Right Click: Ability
        e.preventDefault();
        currentInputRef.current.useAbility = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        currentInputRef.current.boost = false;
        currentInputRef.current.isBiting = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        currentInputRef.current.boost = true;
        currentInputRef.current.isBiting = true;
      } else if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        currentInputRef.current.useAbility = true;
      } else if (e.code === 'KeyQ' || e.code === 'KeyR') {
        currentInputRef.current.useUltimate = true;
      } else if (e.code === 'KeyB') {
        setAutoBite(prev => {
          const next = !prev;
          currentInputRef.current.autoBite = next;
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        currentInputRef.current.boost = false;
        currentInputRef.current.isBiting = false;
      }
    };

    // Touch Listeners for Mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        currentInputRef.current.targetAngle = Math.atan2(touch.clientY - cy, touch.clientX - cx);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameState, selfPlayer]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070d08]">
      {/* Top Bar Header */}
      <TopBar
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onOpenCodex={() => setIsCodexOpen(true)}
        onOpenControls={() => setIsControlsOpen(true)}
        onOpenCombatTriangle={() => setIsCombatTriangleOpen(true)}
        gameState={gameState}
        onReturnToLobby={() => setGameState('LOBBY')}
      />

      {/* Main 2D Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
      />

      {/* Lobby State */}
      {gameState === 'LOBBY' && (
        <LobbyScreen
          onJoinGame={handleJoinGame}
          onOpenCodex={() => setIsCodexOpen(true)}
          onOpenCombatTriangle={() => setIsCombatTriangleOpen(true)}
          onOpenControls={() => setIsControlsOpen(true)}
        />
      )}

      {/* Playing Overlays */}
      {gameState === 'PLAYING' && selfPlayer && (
        <>
          <GameHUD
            player={selfPlayer}
            autoBite={autoBite}
            onToggleAutoBite={() => {
              setAutoBite(prev => {
                const next = !prev;
                currentInputRef.current.autoBite = next;
                return next;
              });
            }}
            onTriggerBite={() => {
              currentInputRef.current.isBiting = true;
              setTimeout(() => {
                currentInputRef.current.isBiting = false;
              }, 120);
            }}
            onStartBoost={() => {
              currentInputRef.current.boost = true;
              currentInputRef.current.isBiting = true;
            }}
            onEndBoost={() => {
              currentInputRef.current.boost = false;
              currentInputRef.current.isBiting = false;
            }}
            onTriggerAbility={() => {
              currentInputRef.current.useAbility = true;
            }}
            onTriggerUltimate={() => {
              currentInputRef.current.useUltimate = true;
            }}
          />

          <Leaderboard
            entries={snapshot.leaderboard}
            selfId={selfId}
          />

          <Minimap
            selfPlayer={selfPlayer}
            players={snapshot.players}
            crystals={snapshot.giantCrystals}
          />

          <KillFeed items={snapshot.killFeed} />

          {/* Death Modal */}
          {isDeathModalOpen && (
            <DeathModal
              player={selfPlayer}
              killerName={killerName}
              onRespawn={handleRespawn}
              onChangeFaction={() => {
                setIsDeathModalOpen(false);
                setGameState('LOBBY');
              }}
            />
          )}
        </>
      )}

      {/* Info & Codex Modals */}
      <EvolutionCodexModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        initialFaction={selfPlayer?.faction || 'centipede'}
      />

      <CombatTriangleModal
        isOpen={isCombatTriangleOpen}
        onClose={() => setIsCombatTriangleOpen(false)}
      />

      <ControlsModal
        isOpen={isControlsOpen}
        onClose={() => setIsControlsOpen(false)}
      />
    </div>
  );
}
