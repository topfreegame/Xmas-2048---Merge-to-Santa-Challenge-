const SIZE = 4;
let grid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
let score = 0;
let best = localStorage.getItem('xmas2048Best') || 0;
let startTime = Date.now();
const CHALLENGE_TIME = 24 * 60 * 1000; // 24 minutes
let gameOver = false;

const gridEl = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const msgEl = document.getElementById('message');
const timerEl = document.getElementById('timer');
const music = document.getElementById('bgMusic');

music.volume = 0.3;
music.play().catch(() => {});

// Init 16 tiles
for (let i = 0; i < SIZE * SIZE; i++) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  gridEl.appendChild(tile);
}

bestEl.textContent = best;

// 🎮 New Game
function newGame() {
  grid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
  score = 0;
  startTime = Date.now();
  gameOver = false;
  scoreEl.textContent = 0;
  msgEl.textContent = '';

  addRandom();
  addRandom();
  update();
  requestAnimationFrame(gameLoop);
}

// 🎁 Add random tile
function addRandom() {
  const empty = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empty.push({ r, c });

  if (empty.length) {
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

// 🎨 Emoji display
function getTileEmoji(v) {
  if (v === 2) return '🎁';
  if (v === 4) return '🍭';
  if (v === 8) return '🌲';
  if (v === 16) return '🎅';
  return v ? v : '';
}

// Refresh UI
function update() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach((t, i) => {
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    const v = grid[r][c];
    t.dataset.value = v;
    t.textContent = getTileEmoji(v);
  });
}

// ✔ Correct slide function (2048 standard)
function slide(line) {
  // Step 1: compress
  line = line.filter(v => v !== 0);

  // Step 2: merge
  for (let i = 0; i < line.length - 1; i++) {
    if (line[i] === line[i + 1]) {
      line[i] *= 2;
      score += line[i];
      line[i + 1] = 0;

      // Santa Boost
      if (Math.random() < 0.05 && line[i] >= 16) {
        const emptyIdx = line.findIndex(v => v === 0);
        if (emptyIdx !== -1) line[emptyIdx] = line[i];
      }
      i++;
    }
  }

  // Step 3: compress again
  line = line.filter(v => v !== 0);

  // Step 4: fill zero
  while (line.length < SIZE) line.push(0);

  return line;
}

// ✔ Correct rotate (90° clockwise)
function rotate(matrix) {
  const N = matrix.length;
  const result = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      result[c][N - 1 - r] = matrix[r][c];
  return result;
}

// Movement
function move(dir) {
  if (gameOver) return;

  let temp = grid.map(r => [...r]);
  let times = { left: 0, up: 3, right: 2, down: 1 }[dir];

  // Rotate to convert all to "left slide"
  for (let i = 0; i < times; i++) temp = rotate(temp);

  // Slide all lines left
  for (let r = 0; r < SIZE; r++) temp[r] = slide(temp[r]);

  // Rotate back
  for (let i = 0; i < (4 - times) % 4; i++) temp = rotate(temp);

  // Only update if changed
  if (JSON.stringify(temp) !== JSON.stringify(grid)) {
    grid = temp;
    addRandom();
    update();
    updateScore();
  }

  checkGameOver();
}

// Score update
function updateScore() {
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    localStorage.setItem('xmas2048Best', best);
    bestEl.textContent = best;
  }
}

// Game Over?
function checkGameOver() {
  const timeLeft = CHALLENGE_TIME - (Date.now() - startTime);

  if (timeLeft <= 0) {
    gameOver = true;
    msgEl.innerHTML = `Challenge Over! Score: ${score} 🎄`;
    music.pause();
    return;
  }

  timerEl.textContent = new Date(timeLeft).toISOString().substr(14, 5);

  // Any possible moves?
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return;
    }

  gameOver = true;
  msgEl.innerHTML = `Game Over! Score: ${score} 🎅`;
  music.pause();
}

// Loop + timer update
function gameLoop() {
  if (!gameOver) requestAnimationFrame(gameLoop);
  checkGameOver();
}

// Keyboard control
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') move('left');
  if (e.key === 'ArrowRight') move('right');
  if (e.key === 'ArrowUp') move('up');
  if (e.key === 'ArrowDown') move('down');
});

// Touch control
let sx, sy;
gridEl.addEventListener('touchstart', e => {
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
});

gridEl.addEventListener('touchend', e => {
  if (!sx) return;
  const dx = e.changedTouches[0].clientX - sx;
  const dy = e.changedTouches[0].clientY - sy;

  if (Math.abs(dx) > Math.abs(dy))
    move(dx > 0 ? 'right' : 'left');
  else
    move(dy > 0 ? 'down' : 'up');

  sx = sy = null;
});

newGame();
