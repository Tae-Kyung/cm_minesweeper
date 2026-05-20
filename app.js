/**
 * PREMIUM MINESWEEPER GAME ENGINE
 * Features:
 * - Sound Synthesis via Web Audio API
 * - Canvas Particles Engine (Win Confetti, Explosion debris, Click sparks)
 * - Safe First-Click placement (generates 3x3 safe zone)
 * - Intelligent Chording (fast clears)
 * - Responsive Auto-Scaling Grid
 * - Stats Tracking & LocalStorage Persistence
 * - Neon Dark, Retro, Synthwave, Cyberpunk, and Minimal Light themes
 */

// ==========================================
// 1. SOUND MANAGER (Web Audio Synthesis)
// ==========================================
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('minesweeper_muted') === 'true';
    this.updateMuteButtonVisual();
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser security autoplay policies)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('minesweeper_muted', this.muted);
    this.updateMuteButtonVisual();
    return this.muted;
  }

  updateMuteButtonVisual() {
    const btn = document.getElementById('btn-mute');
    if (btn) {
      btn.textContent = this.muted ? '🔇' : '🔊';
      btn.style.opacity = this.muted ? '0.6' : '1';
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
    
    osc.type = 'sine';
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
    
    osc.type = 'triangle';
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
    
    osc.type = 'sawtooth';
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
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.01);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    // Upbeat retro sound melody sequence
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
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
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
        color: color || '#818cf8',
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
        color: ['#ef4444', '#f97316', '#fbbf24', '#4b5563'][Math.floor(Math.random() * 4)],
        alpha: 1,
        decay: 0.015 + Math.random() * 0.025,
        gravity: 0.16
      });
    }
    this.startLoop();
  }

  addWinConfetti() {
    const count = 140;
    const colors = ['#f472b6', '#38bdf8', '#fbbf24', '#34d399', '#c084fc', '#f87171'];
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
        // Confetti Behavior
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
        // Explode / Spark Behavior
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
// 3. MINESWEEPER CORE LOGIC ENGINE
// ==========================================
class MinesweeperCore {
  constructor(rows, cols, mineCount) {
    this.rows = rows;
    this.cols = cols;
    this.mineCount = mineCount;
    this.state = 'idle'; // 'idle', 'playing', 'won', 'lost'
    this.grid = [];
    this.elapsedTime = 0; // in tenths of a second
    this.minesRemaining = mineCount;

    this.buildGrid();
  }

  buildGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const rowArr = [];
      for (let c = 0; c < this.cols; c++) {
        rowArr.push({
          row: r,
          col: c,
          isMine: false,
          isOpened: false,
          isFlagged: false,
          isQuestion: false,
          neighborMines: 0
        });
      }
      this.grid.push(rowArr);
    }
  }

  // First click triggers mine generation to guarantee starting safely
  generateMines(clickRow, clickCol) {
    // Generate safety zone around clicked cell (ideally 3x3)
    const safetyCells = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = clickRow + dr;
        const nc = clickCol + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          safetyCells.add(`${nr},${nc}`);
        }
      }
    }

    // List all potential spots, ignoring the safety area
    const availableCells = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const coord = `${r},${c}`;
        if (!safetyCells.has(coord)) {
          availableCells.push({ r, c });
        }
      }
    }

    // In extreme Custom configurations (e.g. extremely packed with mines),
    // if available spots are too few, shrink the safety zone to just the clicked cell
    if (availableCells.length < this.mineCount) {
      availableCells.length = 0; // Reset
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (r !== clickRow || c !== clickCol) {
            availableCells.push({ r, c });
          }
        }
      }
    }

    // Distribute mines randomly
    let minesPlaced = 0;
    while (minesPlaced < this.mineCount && availableCells.length > 0) {
      const randIdx = Math.floor(Math.random() * availableCells.length);
      const cellCoords = availableCells.splice(randIdx, 1)[0];
      this.grid[cellCoords.r][cellCoords.c].isMine = true;
      minesPlaced++;
    }

    // Calculate neighboring mine numbers
    this.calculateNeighbors();
  }

  calculateNeighbors() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.isMine) continue;

        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              if (this.grid[nr][nc].isMine) {
                count++;
              }
            }
          }
        }
        cell.neighborMines = count;
      }
    }
  }

  revealCell(r, c) {
    if (this.state === 'won' || this.state === 'lost') return [];
    
    // First Click Safety activation
    if (this.state === 'idle') {
      this.state = 'playing';
      this.generateMines(r, c);
    }

    const cell = this.grid[r][c];
    if (cell.isOpened || cell.isFlagged) return [];

    cell.isOpened = true;
    const revealed = [cell];

    // Stepped on a mine
    if (cell.isMine) {
      this.state = 'lost';
      return revealed;
    }

    // Recursive flood fill if neighbors are 0
    if (cell.neighborMines === 0) {
      const queue = [{ r, c }];
      while (queue.length > 0) {
        const curr = queue.shift();
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = curr.r + dr;
            const nc = curr.c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              const nCell = this.grid[nr][nc];
              if (!nCell.isOpened && !nCell.isMine && !nCell.isFlagged) {
                nCell.isOpened = true;
                revealed.push(nCell);
                if (nCell.neighborMines === 0) {
                  queue.push({ r: nr, c: nc });
                }
              }
            }
          }
        }
      }
    }

    this.checkWinCondition();
    return revealed;
  }

  toggleFlag(r, c) {
    if (this.state === 'won' || this.state === 'lost') return null;
    
    const cell = this.grid[r][c];
    if (cell.isOpened) return null;

    if (!cell.isFlagged && !cell.isQuestion) {
      // Unflagged -> Flagged
      cell.isFlagged = true;
      this.minesRemaining--;
      return 'flag';
    } else if (cell.isFlagged) {
      // Flagged -> Question
      cell.isFlagged = false;
      cell.isQuestion = true;
      this.minesRemaining++;
      return 'question';
    } else {
      // Question -> Closed
      cell.isQuestion = false;
      return 'closed';
    }
  }

  // Chording action
  chordCell(r, c) {
    if (this.state !== 'playing') return [];
    
    const cell = this.grid[r][c];
    if (!cell.isOpened || cell.neighborMines === 0) return [];

    // Count flags around cell
    let flagsCount = 0;
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          const nCell = this.grid[nr][nc];
          if (nCell.isFlagged) {
            flagsCount++;
          } else if (!nCell.isOpened) {
            neighbors.push({ r: nr, c: nc });
          }
        }
      }
    }

    // If flag count matches tile's number, open all other neighbors
    const newlyRevealed = [];
    if (flagsCount === cell.neighborMines) {
      for (const n of neighbors) {
        const rev = this.revealCell(n.r, n.c);
        newlyRevealed.push(...rev);
        if (this.state === 'lost') {
          break; // Hit a mine, stop further chord reveals
        }
      }
    }
    return newlyRevealed;
  }

  checkWinCondition() {
    let unrevealedSafeCells = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (!cell.isMine && !cell.isOpened) {
          unrevealedSafeCells++;
        }
      }
    }

    if (unrevealedSafeCells === 0) {
      this.state = 'won';
      // Automatically flag all remaining mines on victory
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cell = this.grid[r][c];
          if (cell.isMine && !cell.isFlagged) {
            cell.isFlagged = true;
          }
        }
      }
      this.minesRemaining = 0;
    }
  }

  // Returns all coordinates of incorrectly flagged cells and mines for reveal on Game Over
  revealAllMines() {
    const mines = [];
    const wrongFlags = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.isMine && !cell.isFlagged) {
          mines.push(cell);
        } else if (!cell.isMine && cell.isFlagged) {
          wrongFlags.push(cell);
        }
      }
    }
    return { mines, wrongFlags };
  }
}

// ==========================================
// 4. UI COORDINATOR MANAGER
// ==========================================
class UIManager {
  constructor() {
    this.sound = new SoundManager();
    this.particles = new ParticleManager('particles-canvas');
    this.game = null;
    this.timerInterval = null;

    // Difficulty presets
    this.difficultyPresets = {
      beginner: { rows: 9, cols: 9, mines: 10, name: '초급' },
      intermediate: { rows: 16, cols: 16, mines: 40, name: '중급' },
      expert: { rows: 16, cols: 30, mines: 99, name: '고급' },
      custom: { name: '사용자 정의' }
    };
    this.currentDifficulty = localStorage.getItem('minesweeper_diff') || 'beginner';

    this.initDOM();
    this.bindEvents();
    this.loadTheme();
    this.restartGame();
  }

  initDOM() {
    // Buttons & Header Controls
    this.btnDifficulty = document.getElementById('btn-difficulty');
    this.btnTheme = document.getElementById('btn-theme');
    this.btnStats = document.getElementById('btn-stats');
    this.btnHelp = document.getElementById('btn-help');
    this.emojiBtn = document.getElementById('emoji-btn');
    this.btnMute = document.getElementById('btn-mute');

    // Display numbers
    this.mineCounter = document.getElementById('mine-counter');
    this.timerDisplay = document.getElementById('timer');
    this.gridElement = document.getElementById('mines-grid');
    this.boardContainer = document.querySelector('.board-container');

    // Overlays
    this.overlays = {
      difficulty: document.getElementById('overlay-difficulty'),
      theme: document.getElementById('overlay-theme'),
      stats: document.getElementById('overlay-stats'),
      help: document.getElementById('overlay-help'),
      end: document.getElementById('overlay-game-end')
    };

    // Modal interior buttons
    this.btnApplySettings = document.getElementById('btn-apply-settings');
    this.btnResetStats = document.getElementById('btn-reset-stats');
    this.btnEndRestart = document.getElementById('btn-end-restart');
    this.btnEndStats = document.getElementById('btn-end-stats');

    // Custom Form elements
    this.customForm = document.getElementById('custom-settings-form');
    this.inputCustomWidth = document.getElementById('custom-width');
    this.inputCustomHeight = document.getElementById('custom-height');
    this.inputCustomMines = document.getElementById('custom-mines');
  }

  bindEvents() {
    // Menu buttons
    this.btnDifficulty.addEventListener('click', () => this.showOverlay('difficulty'));
    this.btnTheme.addEventListener('click', () => this.showOverlay('theme'));
    this.btnStats.addEventListener('click', () => this.showStats());
    this.btnHelp.addEventListener('click', () => this.showOverlay('help'));
    this.emojiBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.restartGame();
    });
    this.btnMute.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.particles.addClickSparks(
        window.innerWidth - 42,
        window.innerHeight - 42,
        isMuted ? '#f87171' : '#34d399'
      );
    });

    // Close overlays
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this.hideOverlay(btn.getAttribute('data-close')));
    });

    // Theme switching options
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const themeName = opt.getAttribute('data-theme-name');
        this.setTheme(themeName);
        this.sound.playClick();
      });
    });

    // Difficulty Cards selection
    document.querySelectorAll('.diff-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.diff-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const diff = card.getAttribute('data-difficulty');
        
        if (diff === 'custom') {
          this.customForm.style.display = 'grid';
        } else {
          this.customForm.style.display = 'none';
        }
        this.sound.playClick();
      });
    });

    // Apply difficulty settings
    this.btnApplySettings.addEventListener('click', () => {
      const activeCard = document.querySelector('.diff-card.active');
      const diff = activeCard.getAttribute('data-difficulty');
      
      this.currentDifficulty = diff;
      localStorage.setItem('minesweeper_diff', diff);

      if (diff === 'custom') {
        const w = Math.max(8, Math.min(50, parseInt(this.inputCustomWidth.value) || 10));
        const h = Math.max(8, Math.min(30, parseInt(this.inputCustomHeight.value) || 10));
        const limitMines = Math.floor((w * h) * 0.7); // limit to 70% of board
        const m = Math.max(1, Math.min(limitMines, parseInt(this.inputCustomMines.value) || 15));
        
        // Update input visuals just in case bounded
        this.inputCustomWidth.value = w;
        this.inputCustomHeight.value = h;
        this.inputCustomMines.value = m;

        this.difficultyPresets.custom.rows = h;
        this.difficultyPresets.custom.cols = w;
        this.difficultyPresets.custom.mines = m;

        // Persist custom values
        localStorage.setItem('ms_custom_w', w);
        localStorage.setItem('ms_custom_h', h);
        localStorage.setItem('ms_custom_m', m);
      }

      this.hideOverlay('difficulty');
      this.sound.playClick();
      this.restartGame();
    });

    // Statistics Buttons
    this.btnResetStats.addEventListener('click', () => {
      if (confirm('정말로 모든 통계를 초기화하시겠습니까? 기록이 영구히 소멸됩니다.')) {
        this.resetStats();
        this.sound.playExplosion();
      }
    });

    this.btnEndRestart.addEventListener('click', () => {
      this.hideOverlay('end');
      this.sound.playClick();
      this.restartGame();
    });
    
    this.btnEndStats.addEventListener('click', () => {
      this.hideOverlay('end');
      setTimeout(() => this.showStats(), 150);
    });

    // Scaling grid on window resizing
    window.addEventListener('resize', () => this.scaleGrid());
  }

  showOverlay(name) {
    if (name === 'difficulty') {
      // Sync form values
      const diff = this.currentDifficulty;
      document.querySelectorAll('.diff-card').forEach(c => {
        c.classList.remove('active');
        if (c.getAttribute('data-difficulty') === diff) {
          c.classList.add('active');
        }
      });

      if (diff === 'custom') {
        this.customForm.style.display = 'grid';
        this.inputCustomWidth.value = localStorage.getItem('ms_custom_w') || 10;
        this.inputCustomHeight.value = localStorage.getItem('ms_custom_h') || 10;
        this.inputCustomMines.value = localStorage.getItem('ms_custom_m') || 15;
      } else {
        this.customForm.style.display = 'none';
      }

      // Update personal bests inside cards
      const stats = this.getStats();
      document.getElementById('best-beginner').textContent = stats.bestTimes.beginner ? `${(stats.bestTimes.beginner / 10).toFixed(1)}초` : '-';
      document.getElementById('best-intermediate').textContent = stats.bestTimes.intermediate ? `${(stats.bestTimes.intermediate / 10).toFixed(1)}초` : '-';
      document.getElementById('best-expert').textContent = stats.bestTimes.expert ? `${(stats.bestTimes.expert / 10).toFixed(1)}초` : '-';
    }
    
    this.overlays[name].classList.add('active');
  }

  hideOverlay(name) {
    this.overlays[name].classList.remove('active');
  }

  // ==========================================
  // GAME FLOW & RENDERING
  // ==========================================
  restartGame() {
    this.stopTimer();

    // Fetch config
    let config = this.difficultyPresets[this.currentDifficulty];
    if (this.currentDifficulty === 'custom') {
      const w = parseInt(localStorage.getItem('ms_custom_w')) || 10;
      const h = parseInt(localStorage.getItem('ms_custom_h')) || 10;
      const m = parseInt(localStorage.getItem('ms_custom_m')) || 15;
      config.rows = h;
      config.cols = w;
      config.mines = m;
    }

    this.game = new MinesweeperCore(config.rows, config.cols, config.mines);
    this.emojiBtn.textContent = '🙂';
    this.updateStatusDisplays();
    this.renderBoard();
  }

  updateStatusDisplays() {
    // Standard 3-digit padded number display
    const formatNum = (num) => {
      const bounded = Math.max(-99, Math.min(999, num));
      if (bounded < 0) {
        return '-' + String(Math.abs(bounded)).padStart(2, '0');
      }
      return String(bounded).padStart(3, '0');
    };
    
    this.mineCounter.textContent = formatNum(this.game.minesRemaining);
    this.timerDisplay.textContent = formatNum(Math.floor(this.game.elapsedTime / 10));
  }

  renderBoard() {
    this.gridElement.innerHTML = '';
    
    // Set grid columns structure dynamically
    this.gridElement.style.gridTemplateColumns = `repeat(${this.game.cols}, 1fr)`;

    // Inject individual cells
    for (let r = 0; r < this.game.rows; r++) {
      for (let c = 0; c < this.game.cols; c++) {
        const cell = this.game.grid[r][c];
        const tileDiv = document.createElement('div');
        tileDiv.className = 'tile';
        tileDiv.dataset.row = r;
        tileDiv.dataset.col = c;
        
        // Add dual-click chord trigger on mouse downs
        tileDiv.addEventListener('mousedown', (e) => this.handleTileMouseDown(e, cell, tileDiv));
        tileDiv.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable standard context menu

        // Mobile touch support
        let touchStart = 0;
        let isLongPress = false;
        let pressTimer = null;

        tileDiv.addEventListener('touchstart', (e) => {
          touchStart = Date.now();
          isLongPress = false;
          pressTimer = setTimeout(() => {
            isLongPress = true;
            this.handleTileRightClick(cell, tileDiv);
            navigator.vibrate?.(40); // small vibration
          }, 300); // 300ms long press to flag
        });

        tileDiv.addEventListener('touchend', (e) => {
          clearTimeout(pressTimer);
          if (!isLongPress && (Date.now() - touchStart < 300)) {
            e.preventDefault(); // stop double tap zoom
            this.handleTileLeftClick(cell, tileDiv);
          }
        });

        this.gridElement.appendChild(tileDiv);
      }
    }

    this.scaleGrid();
  }

  // Adjust Grid Zoom/Size to fit within standard viewing screen
  scaleGrid() {
    // Reset transforms to read actual size
    this.gridElement.style.transform = 'none';
    this.gridElement.style.width = 'auto';
    
    const cellWidth = 32; // matched from css
    const gap = 3;
    const padding = 24;
    
    const boardWidth = this.game.cols * cellWidth + (this.game.cols - 1) * gap + padding;
    const containerWidth = this.boardContainer.clientWidth;

    if (boardWidth > containerWidth) {
      const scale = containerWidth / boardWidth;
      this.gridElement.style.transform = `scale(${scale * 0.98})`;
      this.gridElement.style.width = `${boardWidth - padding}px`;
    }
  }

  // ==========================================
  // CLICK ACTIONS & MECHANICS
  // ==========================================
  handleTileMouseDown(e, cell, element) {
    if (e.button === 0) {
      // Left Click
      this.handleTileLeftClick(cell, element);
    } else if (e.button === 2) {
      // Right Click
      this.handleTileRightClick(cell, element);
    }
  }

  handleTileLeftClick(cell, element) {
    if (this.game.state === 'won' || this.game.state === 'lost') return;

    if (cell.isOpened) {
      // Smart Chording (Reveal neighbors if satisfying surrounding flags)
      const chorded = this.game.chordCell(cell.row, cell.col);
      if (chorded.length > 0) {
        this.sound.playClick();
        this.updateBoardVisuals(chorded);
        
        if (this.game.state === 'lost') {
          this.triggerGameOver();
        } else if (this.game.state === 'won') {
          this.triggerVictory();
        }
      }
      return;
    }

    if (cell.isFlagged || cell.isQuestion) return;

    // Start precision clock if just beginning
    if (this.game.state === 'idle') {
      this.startTimer();
    }

    const revealed = this.game.revealCell(cell.row, cell.col);
    this.updateBoardVisuals(revealed);

    if (this.game.state === 'lost') {
      this.triggerGameOver(cell.row, cell.col);
    } else {
      this.sound.playClick();
      // Animate click sparks
      const rect = element.getBoundingClientRect();
      this.particles.addClickSparks(rect.left + rect.width/2, rect.top + rect.height/2);

      if (this.game.state === 'won') {
        this.triggerVictory();
      }
    }
  }

  handleTileRightClick(cell, element) {
    if (this.game.state === 'won' || this.game.state === 'lost') return;

    const action = this.game.toggleFlag(cell.row, cell.col);
    if (!action) return;

    this.sound.playFlag();
    element.className = 'tile'; // clear states
    
    if (action === 'flag') {
      element.classList.add('flagged');
      // Spark flag particles
      const rect = element.getBoundingClientRect();
      this.particles.addClickSparks(rect.left + rect.width/2, rect.top + rect.height/2, '#ff3366');
    } else if (action === 'question') {
      element.classList.add('question');
    }

    this.updateStatusDisplays();
  }

  updateBoardVisuals(cellsList) {
    for (const cell of cellsList) {
      const element = this.gridElement.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
      if (!element) continue;

      element.className = 'tile'; // reset
      
      if (cell.isOpened) {
        element.classList.add('open');
        if (cell.isMine) {
          element.classList.add('mine');
        } else if (cell.neighborMines > 0) {
          element.classList.add(`val-${cell.neighborMines}`);
          element.textContent = cell.neighborMines;
        }
      } else if (cell.isFlagged) {
        element.classList.add('flagged');
      } else if (cell.isQuestion) {
        element.classList.add('question');
      }
    }
  }

  // ==========================================
  // GAME END TRIGGERS
  // ==========================================
  triggerGameOver(clickedRow, clickedCol) {
    this.stopTimer();
    this.sound.playExplosion();
    this.emojiBtn.textContent = '😵';

    // Highlight the clicked mine in styling
    if (clickedRow !== undefined && clickedCol !== undefined) {
      const hitTile = this.gridElement.querySelector(`[data-row="${clickedRow}"][data-col="${clickedCol}"]`);
      if (hitTile) {
        hitTile.classList.add('mine');
        const rect = hitTile.getBoundingClientRect();
        this.particles.addExplosion(rect.left + rect.width/2, rect.top + rect.height/2);
      }
    }

    // Shake the main board container
    const container = document.getElementById('game-container');
    container.classList.add('shake-screen');
    setTimeout(() => container.classList.remove('shake-screen'), 400);

    // Reveal rest of board
    const { mines, wrongFlags } = this.game.revealAllMines();
    
    // Delay reveal of other mines slightly for theatrical speed explosion ripples
    mines.forEach((mineCell, index) => {
      setTimeout(() => {
        const el = this.gridElement.querySelector(`[data-row="${mineCell.row}"][data-col="${mineCell.col}"]`);
        if (el && !(mineCell.row === clickedRow && mineCell.col === clickedCol)) {
          el.classList.add('open', 'mine-revealed');
        }
      }, 50 + index * 15);
    });

    wrongFlags.forEach(cell => {
      const el = this.gridElement.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
      if (el) {
        el.classList.add('wrong-flag');
      }
    });

    // Record Stats (Loss)
    this.recordMatch(false);

    // Prompt end modal delayed
    setTimeout(() => {
      document.getElementById('end-status-icon').textContent = '💥';
      document.getElementById('end-status-title').textContent = '지뢰 폭발!';
      document.getElementById('end-status-message').textContent = '이런, 숨겨진 지뢰를 밟았습니다. 다시 도전해보세요!';
      document.getElementById('end-status-time').textContent = `${(this.game.elapsedTime / 10).toFixed(1)}초`;
      document.getElementById('end-status-diff').textContent = this.difficultyPresets[this.currentDifficulty].name;
      this.showOverlay('end');
    }, 1200);
  }

  triggerVictory() {
    this.stopTimer();
    this.sound.playWin();
    this.emojiBtn.textContent = '😎';

    // Win Confetti!
    this.particles.addWinConfetti();
    setTimeout(() => this.particles.addWinConfetti(), 400);

    // Visual Flags placed on remaining mines
    for (let r = 0; r < this.game.rows; r++) {
      for (let c = 0; c < this.game.cols; c++) {
        const cell = this.game.grid[r][c];
        if (cell.isMine) {
          const el = this.gridElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
          if (el) {
            el.className = 'tile flagged';
          }
        }
      }
    }
    
    this.updateStatusDisplays();

    // Record Stats (Win)
    this.recordMatch(true);

    // Prompt end modal delayed
    setTimeout(() => {
      document.getElementById('end-status-icon').textContent = '🏆';
      document.getElementById('end-status-title').textContent = '지뢰 해제 완수!';
      document.getElementById('end-status-message').textContent = '완벽한 전술로 기지국 주변의 지뢰를 전부 무력화시켰습니다!';
      document.getElementById('end-status-time').textContent = `${(this.game.elapsedTime / 10).toFixed(1)}초`;
      document.getElementById('end-status-diff').textContent = this.difficultyPresets[this.currentDifficulty].name;
      this.showOverlay('end');
    }, 1000);
  }

  // ==========================================
  // HIGH PRECISION TIMER (Tenths of a second)
  // ==========================================
  startTimer() {
    this.stopTimer();
    let startTimestamp = performance.now() - (this.game.elapsedTime * 100);

    this.timerInterval = setInterval(() => {
      const elapsedMs = performance.now() - startTimestamp;
      this.game.elapsedTime = Math.floor(elapsedMs / 100); // converting to tenths of a second
      
      this.updateStatusDisplays();
    }, 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ==========================================
  // CUSTOM THEMING
  // ==========================================
  loadTheme() {
    const savedTheme = localStorage.getItem('minesweeper_theme') || 'nebula';
    this.setTheme(savedTheme);
  }

  setTheme(name) {
    document.body.removeAttribute('data-theme');
    if (name !== 'nebula') {
      document.body.setAttribute('data-theme', name);
    }
    
    // Update theme visuals active state
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.remove('active');
      if (opt.getAttribute('data-theme-name') === name) {
        opt.classList.add('active');
      }
    });

    localStorage.setItem('minesweeper_theme', name);
  }

  // ==========================================
  // STATISTICS & STORAGE UTILITIES
  // ==========================================
  getStats() {
    const emptyStats = {
      played: 0,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
      bestTimes: {
        beginner: null,
        intermediate: null,
        expert: null
      }
    };

    const data = localStorage.getItem('minesweeper_statistics');
    if (!data) return emptyStats;

    try {
      return JSON.parse(data);
    } catch {
      return emptyStats;
    }
  }

  recordMatch(isWin) {
    const stats = this.getStats();
    stats.played++;

    if (isWin) {
      stats.won++;
      stats.currentStreak++;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

      // Record best times for standard presets (time in tenths of a second)
      const diff = this.currentDifficulty;
      if (diff === 'beginner' || diff === 'intermediate' || diff === 'expert') {
        const currRecord = stats.bestTimes[diff];
        if (currRecord === null || this.game.elapsedTime < currRecord) {
          stats.bestTimes[diff] = this.game.elapsedTime;
        }
      }
    } else {
      stats.currentStreak = 0;
    }

    localStorage.setItem('minesweeper_statistics', JSON.stringify(stats));
  }

  showStats() {
    const stats = this.getStats();
    const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

    document.getElementById('stats-played').textContent = stats.played;
    document.getElementById('stats-won').textContent = stats.won;
    document.getElementById('stats-winrate').textContent = `${winRate}%`;
    document.getElementById('stats-streak').textContent = stats.maxStreak;

    // Helper function to update record displays & visual bar fills
    const updateRecordUI = (diffName, valId, barId) => {
      const val = stats.bestTimes[diffName];
      const lbl = document.getElementById(valId);
      const bar = document.getElementById(barId);

      if (val !== null) {
        const sec = val / 10;
        lbl.textContent = `${sec.toFixed(1)}초`;
        
        // Progress bar percentage (lower is better, e.g. scale against 200s limits)
        const percent = Math.max(5, Math.min(100, 100 - (sec / 150) * 100));
        bar.style.width = `${percent}%`;
      } else {
        lbl.textContent = '-';
        bar.style.width = '0%';
      }
    };

    updateRecordUI('beginner', 'label-best-beginner', 'bar-best-beginner');
    updateRecordUI('intermediate', 'label-best-intermediate', 'bar-best-intermediate');
    updateRecordUI('expert', 'label-best-expert', 'bar-best-expert');

    this.showOverlay('stats');
  }

  resetStats() {
    localStorage.removeItem('minesweeper_statistics');
    this.showStats(); // Re-populate UI with fresh reset data
  }
}

// Instantiate game on full window loading
window.addEventListener('DOMContentLoaded', () => {
  window.minesweeperUIManager = new UIManager();
});
