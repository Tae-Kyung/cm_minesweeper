"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

// ==========================================
// 1. SOUND MANAGER (Web Audio Synthesis)
// ==========================================
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playClick() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playFlag() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(450, now + 0.05);
    
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(10, now + 0.75);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    
    osc.start(now);
    osc.stop(now + 0.75);
  }

  playWin() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const playNote = (freq, start, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.01);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(523.25, now, 0.12);        // C5
    playNote(659.25, now + 0.12, 0.12);  // E5
    playNote(783.99, now + 0.24, 0.12);  // G5
    playNote(1046.50, now + 0.36, 0.35); // C6
  }
}

// ==========================================
// 2. CANVAS PARTICLE MANAGER
// ==========================================
class ParticleManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.animationId = null;
    this.resize();
  }

  resize() {
    if (typeof window !== "undefined") {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  addClickSparks(x, y, color) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2.5,
        color: color || "#818cf8",
        alpha: 1,
        decay: 0.03 + Math.random() * 0.04,
        gravity: 0.12
      });
    }
    this.startLoop();
  }

  addExplosion(x, y) {
    const count = 45;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 6.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: 3 + Math.random() * 4.5,
        color: ["#ef4444", "#f97316", "#fbbf24", "#4b5563"][Math.floor(Math.random() * 4)],
        alpha: 1,
        decay: 0.015 + Math.random() * 0.025,
        gravity: 0.16
      });
    }
    this.startLoop();
  }

  addWinConfetti() {
    const count = 140;
    const colors = ["#f472b6", "#38bdf8", "#fbbf24", "#34d399", "#c084fc", "#f87171"];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -20 - Math.random() * 40,
        vx: -2.5 + Math.random() * 5,
        vy: 1.5 + Math.random() * 3.5,
        radius: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.04 + Math.random() * 0.04,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.04
      });
    }
    this.startLoop();
  }

  startLoop() {
    if (!this.animationId) {
      this.loop();
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.particles.length === 0) {
      this.animationId = null;
      return;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.wobble !== undefined) {
        p.wobble += p.wobbleSpeed;
        p.x += Math.sin(p.wobble) * 0.7;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.wobble);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.radius, -p.radius / 2, p.radius * 2, p.radius);
        this.ctx.restore();

        if (p.y > this.canvas.height + 20) {
          this.particles.splice(i, 1);
        }
      } else {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    this.animationId = requestAnimationFrame(() => this.loop());
  }
}

// ==========================================
// 3. MAIN REACT APP COMPONENT
// ==========================================
export default function MinesweeperApp() {
  const canvasRef = useRef(null);
  const soundManagerRef = useRef(null);
  const particleManagerRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Game Settings Presets
  const difficultyPresets = {
    beginner: { rows: 9, cols: 9, mines: 10, name: "초급" },
    intermediate: { rows: 16, cols: 16, mines: 40, name: "중급" },
    expert: { rows: 16, cols: 30, mines: 99, name: "고급" },
  };

  // State Management
  const [difficulty, setDifficulty] = useState("beginner");
  const [customWidth, setCustomWidth] = useState(10);
  const [customHeight, setCustomHeight] = useState(10);
  const [customMines, setCustomMines] = useState(15);
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(9);
  const [mineCount, setMineCount] = useState(10);

  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState("idle"); // 'idle', 'playing', 'won', 'lost'
  const [elapsedTime, setElapsedTime] = useState(0); // in tenths of a second
  const [minesRemaining, setMinesRemaining] = useState(10);
  const [theme, setTheme] = useState("nebula");
  const [isMuted, setIsMuted] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState(null); // 'difficulty', 'theme', 'stats', 'help', 'end', or null

  // Stats Modal states
  const [statsTab, setStatsTab] = useState("personal"); // 'personal' or 'global'
  const [leaderboardDiff, setLeaderboardDiff] = useState("beginner");
  const [globalScores, setGlobalScores] = useState([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);

  // Score Submit states
  const [playerName, setPlayerName] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Emoji Smiley state
  const [emoji, setEmoji] = useState("🙂");

  // Grid Zoom/Scale
  const [gridScale, setGridScale] = useState(1);
  const [gridWidthPx, setGridWidthPx] = useState("auto");

  // Initialize Sound and Particle Refs once
  useEffect(() => {
    soundManagerRef.current = new SoundManager();
    if (canvasRef.current) {
      particleManagerRef.current = new ParticleManager(canvasRef.current);
    }

    // Load Local configs if existing
    const savedTheme = localStorage.getItem("minesweeper_theme") || "nebula";
    setTheme(savedTheme);
    document.body.removeAttribute("data-theme");
    if (savedTheme !== "nebula") {
      document.body.setAttribute("data-theme", savedTheme);
    }

    const savedMute = localStorage.getItem("minesweeper_muted") === "true";
    setIsMuted(savedMute);
    if (soundManagerRef.current) {
      soundManagerRef.current.muted = savedMute;
    }

    const savedDiff = localStorage.getItem("minesweeper_diff") || "beginner";
    setDifficulty(savedDiff);

    if (savedDiff === "custom") {
      const cw = parseInt(localStorage.getItem("ms_custom_w")) || 10;
      const ch = parseInt(localStorage.getItem("ms_custom_h")) || 10;
      const cm = parseInt(localStorage.getItem("ms_custom_m")) || 15;
      setCustomWidth(cw);
      setCustomHeight(ch);
      setCustomMines(cm);
      setRows(ch);
      setCols(cw);
      setMineCount(cm);
      setMinesRemaining(cm);
    } else {
      const preset = difficultyPresets[savedDiff];
      setRows(preset.rows);
      setCols(preset.cols);
      setMineCount(preset.mines);
      setMinesRemaining(preset.mines);
    }

    const handleResize = () => {
      if (particleManagerRef.current) {
        particleManagerRef.current.resize();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      stopTimer();
    };
  }, []);

  // Set grid structures on rows/cols modification
  useEffect(() => {
    resetGameEngine();
  }, [rows, cols, mineCount]);

  // Recalculate grid scaling when dimensions change
  useEffect(() => {
    scaleBoard();
  }, [cols, activeOverlay, grid]);

  // ==========================================
  // CORE GAME FUNCTIONS
  // ==========================================
  const resetGameEngine = () => {
    stopTimer();
    setElapsedTime(0);
    setGameState("idle");
    setEmoji("🙂");
    setMinesRemaining(mineCount);
    setScoreSubmitted(false);
    setPlayerName("");

    // Build empty structural cell grid
    const emptyGrid = [];
    for (let r = 0; r < rows; r++) {
      const rowArr = [];
      for (let c = 0; c < cols; c++) {
        rowArr.push({
          row: r,
          col: c,
          isMine: false,
          isOpened: false,
          isFlagged: false,
          isQuestion: false,
          neighborMines: 0,
        });
      }
      emptyGrid.push(rowArr);
    }
    setGrid(emptyGrid);
  };

  const startTimer = () => {
    stopTimer();
    const startTimestamp = performance.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsedMs = performance.now() - startTimestamp;
      setElapsedTime(Math.floor(elapsedMs / 100)); // converting to tenths of seconds
    }, 100);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const scaleBoard = () => {
    const boardContainer = document.querySelector(".board-container");
    if (!boardContainer) return;

    const cellWidth = 32;
    const gap = 3;
    const padding = 24;

    const actualWidth = cols * cellWidth + (cols - 1) * gap + padding;
    const containerWidth = boardContainer.clientWidth;

    if (actualWidth > containerWidth) {
      const scale = containerWidth / actualWidth;
      setGridScale(scale * 0.98);
      setGridWidthPx(`${actualWidth - padding}px`);
    } else {
      setGridScale(1);
      setGridWidthPx("auto");
    }
  };

  // Generate mines with safe starting zones
  const generateMines = (clickedRow, clickedCol, currentGrid) => {
    const safetyCells = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = clickedRow + dr;
        const nc = clickedCol + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          safetyCells.add(`${nr},${nc}`);
        }
      }
    }

    const availableCells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const coord = `${r},${c}`;
        if (!safetyCells.has(coord)) {
          availableCells.push({ r, c });
        }
      }
    }

    // Shrink safety if space exceeds mine density
    if (availableCells.length < mineCount) {
      availableCells.length = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r !== clickedRow || c !== clickedCol) {
            availableCells.push({ r, c });
          }
        }
      }
    }

    // Place mines
    const nextGrid = JSON.parse(JSON.stringify(currentGrid));
    let minesPlaced = 0;
    while (minesPlaced < mineCount && availableCells.length > 0) {
      const randIdx = Math.floor(Math.random() * availableCells.length);
      const coords = availableCells.splice(randIdx, 1)[0];
      nextGrid[coords.r][coords.c].isMine = true;
      minesPlaced++;
    }

    // Calculate neighbors numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = nextGrid[r][c];
        if (cell.isMine) continue;

        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (nextGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
        }
        cell.neighborMines = count;
      }
    }

    return nextGrid;
  };

  // Left click Action
  const handleLeftClick = (e, clickRow, clickCol) => {
    if (gameState === "won" || gameState === "lost") return;

    const cell = grid[clickRow][clickCol];
    if (cell.isOpened) {
      handleChording(clickRow, clickCol);
      return;
    }

    if (cell.isFlagged || cell.isQuestion) return;

    soundManagerRef.current?.playClick();

    // Trigger Sparks particles
    if (e && particleManagerRef.current) {
      particleManagerRef.current.addClickSparks(e.clientX, e.clientY);
    }

    let currentGrid = grid;
    let nextState = "playing";

    if (gameState === "idle") {
      currentGrid = generateMines(clickRow, clickCol, grid);
      startTimer();
      setGameState("playing");
    }

    const workingGrid = JSON.parse(JSON.stringify(currentGrid));
    const newlyOpened = [];

    // Stepped on a mine
    if (workingGrid[clickRow][clickCol].isMine) {
      triggerLoss(clickRow, clickCol, workingGrid, e);
      return;
    }

    // Open target cell and propagate recursively if blank
    const revealList = [{ r: clickRow, c: clickCol }];
    workingGrid[clickRow][clickCol].isOpened = true;

    while (revealList.length > 0) {
      const curr = revealList.shift();
      const currCell = workingGrid[curr.r][curr.c];

      if (currCell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = curr.r + dr;
            const nc = curr.c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const neighbor = workingGrid[nr][nc];
              if (!neighbor.isOpened && !neighbor.isMine && !neighbor.isFlagged) {
                neighbor.isOpened = true;
                if (neighbor.neighborMines === 0) {
                  revealList.push({ r: nr, c: nc });
                }
              }
            }
          }
        }
      }
    }

    // Assess Win Condition
    let unrevealedSafe = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!workingGrid[r][c].isMine && !workingGrid[r][c].isOpened) {
          unrevealedSafe++;
        }
      }
    }

    if (unrevealedSafe === 0) {
      triggerWin(workingGrid);
    } else {
      setGrid(workingGrid);
    }
  };

  // Right Click Action (Flagging)
  const handleRightClick = (e, clickRow, clickCol) => {
    if (e) e.preventDefault();
    if (gameState === "won" || gameState === "lost") return;

    soundManagerRef.current?.playFlag();

    const nextGrid = JSON.parse(JSON.stringify(grid));
    const cell = nextGrid[clickRow][clickCol];
    if (cell.isOpened) return;

    let nextRemaining = minesRemaining;

    if (!cell.isFlagged && !cell.isQuestion) {
      cell.isFlagged = true;
      nextRemaining--;
      if (e && particleManagerRef.current) {
        particleManagerRef.current.addClickSparks(e.clientX, e.clientY, "#ff3366");
      }
    } else if (cell.isFlagged) {
      cell.isFlagged = false;
      cell.isQuestion = true;
      nextRemaining++;
    } else {
      cell.isQuestion = false;
    }

    setMinesRemaining(nextRemaining);
    setGrid(nextGrid);
  };

  // Dual Click Chording
  const handleChording = (clickRow, clickCol) => {
    const cell = grid[clickRow][clickCol];
    if (cell.neighborMines === 0) return;

    let flagCount = 0;
    const closedNeighbors = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = clickRow + dr;
        const nc = clickCol + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const neighbor = grid[nr][nc];
          if (neighbor.isFlagged) {
            flagCount++;
          } else if (!neighbor.isOpened) {
            closedNeighbors.push({ r: nr, c: nc });
          }
        }
      }
    }

    // Chord triggers if flag matching satisfies tile requirement
    if (flagCount === cell.neighborMines && closedNeighbors.length > 0) {
      soundManagerRef.current?.playClick();
      const workingGrid = JSON.parse(JSON.stringify(grid));
      let hitMine = false;
      let mineCoords = null;

      const revealList = [];

      for (const coords of closedNeighbors) {
        const target = workingGrid[coords.r][coords.c];
        if (target.isFlagged || target.isOpened) continue;

        target.isOpened = true;
        if (target.isMine) {
          hitMine = true;
          mineCoords = coords;
          break; // Hit a mine, break out
        }

        if (target.neighborMines === 0) {
          revealList.push(coords);
        }
      }

      if (hitMine) {
        triggerLoss(mineCoords.r, mineCoords.c, workingGrid);
        return;
      }

      // Propagate reveals
      while (revealList.length > 0) {
        const curr = revealList.shift();
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = curr.r + dr;
            const nc = curr.c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const neighbor = workingGrid[nr][nc];
              if (!neighbor.isOpened && !neighbor.isMine && !neighbor.isFlagged) {
                neighbor.isOpened = true;
                if (neighbor.neighborMines === 0) {
                  revealList.push({ r: nr, c: nc });
                }
              }
            }
          }
        }
      }

      // Check Win
      let unrevealedSafe = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!workingGrid[r][c].isMine && !workingGrid[r][c].isOpened) {
            unrevealedSafe++;
          }
        }
      }

      if (unrevealedSafe === 0) {
        triggerWin(workingGrid);
      } else {
        setGrid(workingGrid);
      }
    }
  };

  // Game Lose
  const triggerLoss = (clickedRow, clickedCol, workingGrid, event) => {
    stopTimer();
    setGameState("lost");
    setEmoji("😵");
    soundManagerRef.current?.playExplosion();

    // Trigger explosive particles on clicked mine
    if (particleManagerRef.current) {
      if (event) {
        particleManagerRef.current.addExplosion(event.clientX, event.clientY);
      } else {
        // approximate center coordinates of that cell in grid
        const element = document.querySelector(`[data-row="${clickedRow}"][data-col="${clickedCol}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          particleManagerRef.current.addExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }
    }

    // Shake grid visually
    const container = document.getElementById("game-container");
    if (container) {
      container.classList.add("shake-screen");
      setTimeout(() => container.classList.remove("shake-screen"), 400);
    }

    // Reveal other mines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = workingGrid[r][c];
        if (cell.isMine && !cell.isFlagged) {
          cell.isOpened = true;
        } else if (!cell.isMine && cell.isFlagged) {
          // wrong flag visual
          cell.isQuestion = true; // temporarily using question styling variables or just custom classes
        }
      }
    }
    // Set specific clicked mine highlight
    workingGrid[clickedRow][clickedCol].isMine = true;
    setGrid(workingGrid);

    // Save statistics (Loss)
    recordMatchStats(false);

    // Delay modal view slightly
    setTimeout(() => {
      setActiveOverlay("end");
    }, 1200);
  };

  // Game Win
  const triggerWin = (workingGrid) => {
    stopTimer();
    setGameState("won");
    setEmoji("😎");
    soundManagerRef.current?.playWin();
    setMinesRemaining(0);

    // Auto flag remaining mines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = workingGrid[r][c];
        if (cell.isMine) {
          cell.isFlagged = true;
        }
      }
    }
    setGrid(workingGrid);

    // Dynamic Confetti Rain
    if (particleManagerRef.current) {
      particleManagerRef.current.addWinConfetti();
      setTimeout(() => particleManagerRef.current?.addWinConfetti(), 400);
    }

    // Save statistics (Win)
    recordMatchStats(true);

    // Delay modal view slightly
    setTimeout(() => {
      setActiveOverlay("end");
    }, 1000);
  };

  // ==========================================
  // THEMES & PRESETS
  // ==========================================
  const selectTheme = (themeName) => {
    setTheme(themeName);
    document.body.removeAttribute("data-theme");
    if (themeName !== "nebula") {
      document.body.setAttribute("data-theme", themeName);
    }
    localStorage.setItem("minesweeper_theme", themeName);
    soundManagerRef.current?.playClick();
  };

  const applyDifficulty = (mode) => {
    setDifficulty(mode);
    localStorage.setItem("minesweeper_diff", mode);

    if (mode === "custom") {
      const cw = Math.max(8, Math.min(50, customWidth));
      const ch = Math.max(8, Math.min(30, customHeight));
      const limit = Math.floor(cw * ch * 0.7);
      const cm = Math.max(1, Math.min(limit, customMines));

      setCustomWidth(cw);
      setCustomHeight(ch);
      setCustomMines(cm);
      setRows(ch);
      setCols(cw);
      setMineCount(cm);

      localStorage.setItem("ms_custom_w", cw);
      localStorage.setItem("ms_custom_h", ch);
      localStorage.setItem("ms_custom_m", cm);
    } else {
      const preset = difficultyPresets[mode];
      setRows(preset.rows);
      setCols(preset.cols);
      setMineCount(preset.mines);
    }

    setActiveOverlay(null);
    soundManagerRef.current?.playClick();
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem("minesweeper_muted", String(nextMuted));
    if (soundManagerRef.current) {
      soundManagerRef.current.muted = nextMuted;
    }
    soundManagerRef.current?.playClick();
  };

  // ==========================================
  // STATISTICS & LEADERBOARD ACTIONS
  // ==========================================
  const getPersonalStats = () => {
    const emptyStats = {
      played: 0,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
      bestTimes: {
        beginner: null,
        intermediate: null,
        expert: null,
      },
    };

    if (typeof window === "undefined") return emptyStats;
    const data = localStorage.getItem("minesweeper_statistics");
    if (!data) return emptyStats;

    try {
      return JSON.parse(data);
    } catch {
      return emptyStats;
    }
  };

  const recordMatchStats = (isWin) => {
    const stats = getPersonalStats();
    stats.played++;

    if (isWin) {
      stats.won++;
      stats.currentStreak++;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

      // Save records for preset levels
      if (difficulty === "beginner" || difficulty === "intermediate" || difficulty === "expert") {
        const currRecord = stats.bestTimes[difficulty];
        if (currRecord === null || elapsedTime < currRecord) {
          stats.bestTimes[difficulty] = elapsedTime;
        }
      }
    } else {
      stats.currentStreak = 0;
    }

    localStorage.setItem("minesweeper_statistics", JSON.stringify(stats));
  };

  const resetPersonalStats = () => {
    if (confirm("정말로 모든 개인 통계를 초기화하시겠습니까?")) {
      localStorage.removeItem("minesweeper_statistics");
      soundManagerRef.current?.playExplosion();
      // force reload component stats values
      setStatsTab("personal");
    }
  };

  // Fetch High Scores leaderboard from Supabase
  const fetchGlobalScores = async (diffKey) => {
    if (!isSupabaseConfigured) {
      setGlobalScores([]);
      setIsLoadingScores(false);
      return;
    }
    setIsLoadingScores(true);
    try {
      const { data, error } = await supabase
        .from("minesweeper_scores")
        .select("player_name, time_seconds, created_at")
        .eq("difficulty", diffKey)
        .order("time_seconds", { ascending: true })
        .limit(10);

      if (error) throw error;
      setGlobalScores(data || []);
    } catch (err) {
      console.error("Error loading scores from Supabase:", err.message);
      setGlobalScores([]);
    } finally {
      setIsLoadingScores(false);
    }
  };

  // Submit high score to Supabase DB on victory
  const submitHighScore = async () => {
    if (!isSupabaseConfigured) {
      alert("Supabase URL 및 Anon Key 설정(.env.local)이 완료되지 않았습니다.");
      return;
    }
    if (!playerName.trim()) {
      alert("이름을 입력해주세요!");
      return;
    }
    
    setIsSubmittingScore(true);
    const secs = parseFloat((elapsedTime / 10).toFixed(1));

    try {
      const { error } = await supabase.from("minesweeper_scores").insert([
        {
          player_name: playerName.trim(),
          difficulty: difficulty,
          time_seconds: secs,
        },
      ]);

      if (error) throw error;

      setScoreSubmitted(true);
      soundManagerRef.current?.playWin();
      
      // Auto trigger fetching global scores after insert
      setLeaderboardDiff(difficulty);
      setStatsTab("global");
      fetchGlobalScores(difficulty);
      setActiveOverlay("stats");
    } catch (err) {
      alert(`데이터베이스 전송에 실패했습니다: ${err.message}`);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // Triggers stats dialog display
  const openStatsModal = () => {
    setActiveOverlay("stats");
    setStatsTab("personal");
    setLeaderboardDiff(difficulty === "custom" ? "beginner" : difficulty);
    fetchGlobalScores(difficulty === "custom" ? "beginner" : difficulty);
  };

  const personal = getPersonalStats();
  const winRate = personal.played > 0 ? Math.round((personal.won / personal.played) * 100) : 0;

  // Format 3-digit score
  const formatTimerVal = (val) => {
    const seconds = Math.floor(val / 10);
    const clamped = Math.max(-99, Math.min(999, seconds));
    if (clamped < 0) {
      return "-" + String(Math.abs(clamped)).padStart(2, "0");
    }
    return String(clamped).padStart(3, "0");
  };

  return (
    <>
      <div className="bg-animations"></div>
      <canvas id="particles-canvas" ref={canvasRef}></canvas>

      <div className="game-container" id="game-container">
        
        {/* TOP NAVBAR HEADER */}
        <header className="game-header">
          <h1 className="game-title" id="game-title">
            <span>💣</span> 지뢰찾기
          </h1>
          <div className="controls-row">
            <button className="btn" onClick={() => setActiveOverlay("difficulty")} title="난이도 조절">
              ⚙️ 난이도
            </button>
            <button className="btn" onClick={() => setActiveOverlay("theme")} title="테마 설정">
              🎨 테마
            </button>
            <button className="btn" onClick={openStatsModal} title="내 전적 및 순위">
              📊 순위표
            </button>
            <button className="btn" onClick={() => setActiveOverlay("help")} title="게임 방법">
              ❓ 도움말
            </button>
          </div>
        </header>

        {/* STATUS BAR (MINES REMAINING, RESTART SMILEY, TIMER) */}
        <div className="status-bar">
          <div className="status-item">
            <span className="status-label">Mines</span>
            <span className="status-value">{formatTimerVal(minesRemaining * 10)}</span>
          </div>
          
          <button className="emoji-btn" onClick={resetGameEngine} title="게임 재시작">
            {emoji}
          </button>
          
          <div className="status-item">
            <span className="status-label">Time</span>
            <span className="status-value">{formatTimerVal(elapsedTime)}</span>
          </div>
        </div>

        {/* INTERACTIVE CELL BOARD GRID */}
        <div className="board-container">
          <div
            className="mines-grid"
            id="mines-grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              transform: gridScale !== 1 ? `scale(${gridScale})` : "none",
              width: gridWidthPx,
            }}
          >
            {grid.map((rowArr, r) =>
              rowArr.map((cell, c) => {
                let cellClass = "tile";
                let text = "";

                if (cell.isOpened) {
                  cellClass += " open";
                  if (cell.isMine) {
                    cellClass += " mine";
                  } else if (cell.neighborMines > 0) {
                    cellClass += ` val-${cell.neighborMines}`;
                    text = cell.neighborMines;
                  }
                } else if (cell.isFlagged) {
                  cellClass += " flagged";
                } else if (cell.isQuestion) {
                  cellClass += " question";
                }

                // If wrong flag visual (bomb step game over state)
                if (gameState === "lost" && !cell.isMine && cell.isFlagged) {
                  cellClass += " wrong-flag";
                }
                if (gameState === "lost" && cell.isMine && cell.isOpened && !cell.isFlagged) {
                  cellClass += " mine-revealed";
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className={cellClass}
                    data-row={r}
                    data-col={c}
                    onClick={(e) => handleLeftClick(e, r, c)}
                    onContextMenu={(e) => handleRightClick(e, r, c)}
                  >
                    {text}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* OVERLAY: DIFFICULTY SETTINGS */}
      <div className={`overlay ${activeOverlay === "difficulty" ? "active" : ""}`}>
        <div className="modal">
          <button className="modal-close" onClick={() => setActiveOverlay(null)}>&times;</button>
          <h2 className="modal-title">게임 설정</h2>
          <div className="difficulty-options">
            {Object.keys(difficultyPresets).map((key) => {
              const preset = difficultyPresets[key];
              const record = personal.bestTimes[key];
              return (
                <div
                  key={key}
                  className={`diff-card ${difficulty === key ? "active" : ""}`}
                  onClick={() => setDifficulty(key)}
                >
                  <div className="diff-card-details">
                    <span className="diff-name">{preset.name}</span>
                    <span className="diff-desc">{preset.rows} &times; {preset.cols} 그리드, 지뢰 {preset.mines}개</span>
                  </div>
                  <span className="best-time-badge">
                    {record ? `${(record / 10).toFixed(1)}초` : "-"}
                  </span>
                </div>
              );
            })}
            <div
              className={`diff-card ${difficulty === "custom" ? "active" : ""}`}
              onClick={() => setDifficulty("custom")}
            >
              <div className="diff-card-details">
                <span className="diff-name">사용자 정의 (Custom)</span>
                <span className="diff-desc">크기 및 지뢰 수를 자유롭게 조절</span>
              </div>
            </div>
          </div>

          {/* Custom Settings Form */}
          {difficulty === "custom" && (
            <div className="custom-inputs-grid">
              <label>
                가로 칸수 (Width)
                <input
                  type="number"
                  min="8"
                  max="50"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 10)}
                />
              </label>
              <label>
                세로 칸수 (Height)
                <input
                  type="number"
                  min="8"
                  max="30"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 10)}
                />
              </label>
              <label>
                지뢰 개수 (Mines)
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={customMines}
                  onChange={(e) => setCustomMines(parseInt(e.target.value) || 15)}
                />
              </label>
            </div>
          )}

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn" onClick={() => applyDifficulty(difficulty)} style={{ background: "var(--accent-color)", color: "#fff" }}>
              설정 적용
            </button>
          </div>
        </div>
      </div>

      {/* OVERLAY: THEME PICKER */}
      <div className={`overlay ${activeOverlay === "theme" ? "active" : ""}`}>
        <div className="modal">
          <button className="modal-close" onClick={() => setActiveOverlay(null)}>&times;</button>
          <h2 className="modal-title">테마 선택</h2>
          <div className="theme-picker-row">
            <button className={`theme-option theme-opt-nebula ${theme === "nebula" ? "active" : ""}`} onClick={() => selectTheme("nebula")} title="다크 네뷸라">🌌</button>
            <button className={`theme-option theme-opt-retro ${theme === "retro" ? "active" : ""}`} onClick={() => selectTheme("retro")} title="레트로 95">📟</button>
            <button className={`theme-option theme-opt-synth ${theme === "synthwave" ? "active" : ""}`} onClick={() => selectTheme("synthwave")} title="신스웨이브">🌴</button>
            <button className={`theme-option theme-opt-cyber ${theme === "cyberpunk" ? "active" : ""}`} onClick={() => selectTheme("cyberpunk")} title="사이버펑크">⚡</button>
            <button className={`theme-option theme-opt-light ${theme === "light" ? "active" : ""}`} onClick={() => selectTheme("light")} title="미니멀 라이트">❄️</button>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
            원하는 테마 아이콘을 누르면 즉시 전체 색상이 전환됩니다.
          </p>
        </div>
      </div>

      {/* OVERLAY: STATISTICS & GLOBAL LEADERBOARD */}
      <div className={`overlay ${activeOverlay === "stats" ? "active" : ""}`}>
        <div className="modal" style={{ maxWidth: "520px" }}>
          <button className="modal-close" onClick={() => setActiveOverlay(null)}>&times;</button>
          <h2 className="modal-title">순위표 & 전적</h2>

          {/* Modal internal tabs */}
          <div className="leaderboard-tabs">
            <button
              className={`leaderboard-tab ${statsTab === "personal" ? "active" : ""}`}
              onClick={() => setStatsTab("personal")}
            >
              📊 개인 통계
            </button>
            <button
              className={`leaderboard-tab ${statsTab === "global" ? "active" : ""}`}
              onClick={() => {
                setStatsTab("global");
                fetchGlobalScores(leaderboardDiff);
              }}
            >
              🌐 글로벌 랭킹
            </button>
          </div>

          {/* TAB 1: PERSONAL LOCAL STATS */}
          {statsTab === "personal" && (
            <>
              <div className="stats-grid">
                <div className="stats-card">
                  <div className="stats-num">{personal.played}</div>
                  <div className="stats-lbl">플레이 횟수</div>
                </div>
                <div className="stats-card">
                  <div className="stats-num">{personal.won}</div>
                  <div className="stats-lbl">승리 횟수</div>
                </div>
                <div className="stats-card">
                  <div className="stats-num">{winRate}%</div>
                  <div className="stats-lbl">승률</div>
                </div>
                <div className="stats-card">
                  <div className="stats-num">{personal.maxStreak}</div>
                  <div className="stats-lbl">최대 연승</div>
                </div>
              </div>

              {/* Progress visual scales */}
              {Object.keys(difficultyPresets).map((key) => {
                const record = personal.bestTimes[key];
                const sec = record ? record / 10 : 0;
                const percent = record ? Math.max(5, Math.min(100, 100 - (sec / 150) * 100)) : 0;
                return (
                  <div className="stats-bar-group" key={key}>
                    <div className="stats-bar-label">
                      <span>{difficultyPresets[key].name} 최고 기록</span>
                      <span>{record ? `${sec.toFixed(1)}초` : "-"}</span>
                    </div>
                    <div className="stats-bar-bg">
                      <div className="stats-bar-fill" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between" }}>
                <button
                  className="btn"
                  onClick={resetPersonalStats}
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    color: "#f87171",
                  }}
                >
                  기록 초기화
                </button>
                <button className="btn" onClick={() => setActiveOverlay(null)}>
                  닫기
                </button>
              </div>
            </>
          )}

          {/* TAB 2: GLOBAL LEADERBOARD (SUPABASE) */}
          {statsTab === "global" && (
            <>
              {/* Difficulty filter in global rankings */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px", justifyContent: "center" }}>
                {Object.keys(difficultyPresets).map((key) => (
                  <button
                    key={key}
                    className={`btn`}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.8rem",
                      background: leaderboardDiff === key ? "var(--accent-color)" : "rgba(255, 255, 255, 0.05)",
                      color: leaderboardDiff === key ? "#fff" : "var(--text-main)",
                    }}
                    onClick={() => {
                      setLeaderboardDiff(key);
                      fetchGlobalScores(key);
                    }}
                  >
                    {difficultyPresets[key].name}
                  </button>
                ))}
              </div>

              {isLoadingScores ? (
                <div className="leaderboard-empty" style={{ minHeight: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span>⏳ 서버 데이터를 불러오는 중...</span>
                </div>
              ) : globalScores.length > 0 ? (
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: "15%" }}>순위</th>
                      <th style={{ width: "45%" }}>플레이어</th>
                      <th style={{ width: "20%" }}>시간</th>
                      <th style={{ width: "20%" }}>날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalScores.map((score, index) => (
                      <tr key={index}>
                        <td className="leaderboard-rank">#{index + 1}</td>
                        <td style={{ fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {score.player_name}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: "bold" }}>
                          {score.time_seconds.toFixed(1)}초
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                          {new Date(score.created_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="leaderboard-empty">
                  <span>🏆 아직 등록된 기록이 없습니다. 첫 랭커가 되어보세요!</span>
                </div>
              )}

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => setActiveOverlay(null)}>
                  확인
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* OVERLAY: PLAY GUIDE HELP */}
      <div className={`overlay ${activeOverlay === "help" ? "active" : ""}`}>
        <div className="modal" style={{ maxWidth: "520px" }}>
          <button className="modal-close" onClick={() => setActiveOverlay(null)}>&times;</button>
          <h2 className="modal-title">지뢰찾기 플레이 가이드</h2>
          
          <div className="tut-step">
            <div className="tut-icon">🖱️</div>
            <div className="tut-text">
              <h4>좌클릭: 칸 열기</h4>
              <p>지뢰가 없을 것 같은 칸을 안전하게 개방합니다. 첫 번째로 클릭하는 칸은 항상 안전하며, 인근의 넓은 영역을 한 번에 열어줍니다.</p>
            </div>
          </div>

          <div className="tut-step">
            <div className="tut-icon">🚩</div>
            <div className="tut-text">
              <h4>우클릭: 깃발 꽂기 / 물음표</h4>
              <p>지뢰가 있다고 의심되는 칸에 깃발을 꽂아 실수로 누르는 일을 방지합니다. 한 번 더 누르면 물음표(?) 표시를 할 수 있습니다.</p>
            </div>
          </div>

          <div className="tut-step">
            <div className="tut-icon">🔢</div>
            <div className="tut-text">
              <h4>숫자 힌트의 의미</h4>
              <p>숫자는 해당 칸을 둘러싼 8개의 인접 칸에 들어있는 <strong>지뢰의 총 개수</strong>를 가리킵니다. 예를 들어 '3'이 적힌 칸 근처에는 정확히 3개의 지뢰가 숨어 있습니다.</p>
            </div>
          </div>

          <div className="tut-step">
            <div className="tut-icon">⚡</div>
            <div className="tut-text">
              <h4>스마트 클릭 (Chording)</h4>
              <p>숫자가 적힌 열려있는 칸 주위에 올바른 수의 깃발을 꽂았다면, <strong>그 숫자 칸을 직접 왼쪽 클릭</strong>하여 깃발이 없는 나머지 인접 칸들을 한 번에 안전하게 열 수 있습니다!</p>
            </div>
          </div>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn" onClick={() => setActiveOverlay(null)}>알겠습니다!</button>
          </div>
        </div>
      </div>

      {/* OVERLAY: GAME RESULTS modal (CONGRATS / RESET) */}
      <div className={`overlay ${activeOverlay === "end" ? "active" : ""}`}>
        <div className="modal game-status-modal">
          <span className="status-icon">
            {gameState === "won" ? "🏆" : "💥"}
          </span>
          <h2 className="modal-title">
            {gameState === "won" ? "지뢰 해제 완수!" : "지뢰 폭발!"}
          </h2>
          <p className="status-message">
            {gameState === "won"
              ? "완벽한 전술로 기지국 주변의 지뢰를 전부 무력화시켰습니다!"
              : "이런, 숨겨진 지뢰를 밟았습니다. 다시 도전해보세요!"}
          </p>
          
          <div
            style={{
              background: "rgba(0, 0, 0, 0.2)",
              borderRadius: "8px",
              padding: "15px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>소요 시간</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", fontFamily: "var(--font-mono)" }}>
                {(elapsedTime / 10).toFixed(1)}초
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>선택 난이도</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {difficulty === "custom" ? "사용자 정의" : difficultyPresets[difficulty]?.name}
              </div>
            </div>
          </div>

          {/* ONLINE HIGHSCORE SUBMIT PANEL */}
          {gameState === "won" && difficulty !== "custom" && (
            <div className="score-submit-container">
              <div className="score-submit-title">🌐 글로벌 순위표 등록</div>
              {scoreSubmitted ? (
                <div style={{ color: "var(--num-2)", fontSize: "0.85rem", fontWeight: "600", textAlign: "center", padding: "8px 0" }}>
                  ✓ 기록이 성공적으로 서버에 등록되었습니다!
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    글로벌 명예의 전당에 닉네임을 남겨보세요.
                  </div>
                  <div className="score-submit-row">
                    <input
                      type="text"
                      className="score-submit-input"
                      placeholder="이름 입력 (최대 12자)"
                      maxLength={12}
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      disabled={isSubmittingScore}
                    />
                    <button
                      className="btn"
                      style={{ background: "var(--accent-color)", color: "#fff", padding: "0 16px" }}
                      onClick={submitHighScore}
                      disabled={isSubmittingScore || !playerName.trim()}
                    >
                      {isSubmittingScore ? "등록 중..." : "기록 등록"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="btn"
              onClick={() => {
                setActiveOverlay(null);
                openStatsModal();
              }}
              style={{ background: "rgba(255, 255, 255, 0.08)" }}
            >
              순위 보기
            </button>
            <button
              className="btn"
              onClick={() => {
                setActiveOverlay(null);
                resetGameEngine();
              }}
              style={{ background: "var(--accent-color)", color: "#fff" }}
            >
              다시 도전
            </button>
          </div>
        </div>
      </div>

      {/* Floating Audio Controller bottom right */}
      <div style={{ position: "absolute", bottom: "20px", right: "20px", zIndex: 10 }}>
        <button
          className="btn"
          onClick={toggleMute}
          style={{ borderRadius: "50%", width: "44px", height: "44px", justifyContent: "center", padding: 0 }}
          title="음소거 토글"
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>
    </>
  );
}
