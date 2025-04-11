const grid = document.getElementById("tetris-grid");
const nextGrid = document.getElementById("next-grid");
const scoreDisplay = document.getElementById("score");
const gameOverText = document.getElementById("game-over");
const restartButton = document.getElementById("restart");
const movesDisplay = document.getElementById("moves");
const goalDisplay = document.getElementById("goal");
const pauseButton = document.getElementById("pause");
const overlay = document.getElementById("overlay");

const cols = 10;
const rows = 20;
const cells = [];
const nextCells = [];
let currentPosition = 4;
let currentRotation = 0;
let currentTetromino;
let nextTetromino;
let timerId;
let score = 0;
let moves = 0;
let linesCleared = 0;
const goalLines = 20;
let isPaused = false;
let isGameOver = false;

// Spielfeld
for (let i = 0; i < cols * rows; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  grid.appendChild(cell);
  cells.push(cell);
}

// Vorschau-Grid
for (let i = 0; i < 16; i++) {
  const cell = document.createElement("div");
  cell.classList.add("next-cell");
  nextGrid.appendChild(cell);
  nextCells.push(cell);
}

const tetrominos = [
  {
    name: 'I',
    rotations: [
      [1, cols + 1, cols * 2 + 1, cols * 3 + 1],
      [cols, cols + 1, cols + 2, cols + 3],
    ],
    color: 'I'
  },
  {
    name: 'L',
    rotations: [
      [1, cols + 1, cols * 2 + 1, cols * 2 + 2],
      [cols, cols + 1, cols + 2, cols * 2],
      [0, 1, cols + 1, cols * 2 + 1],
      [cols, cols * 2, cols * 2 + 1, cols * 2 + 2],
    ],
    color: 'L'
  },
  {
    name: 'T',
    rotations: [
      [1, cols, cols + 1, cols + 2],
      [1, cols + 1, cols + 2, cols * 2 + 1],
      [cols, cols + 1, cols + 2, cols * 2 + 1],
      [1, cols, cols + 1, cols * 2 + 1],
    ],
    color: 'T'
  },
  {
    name: 'O',
    rotations: [
      [0, 1, cols, cols + 1]
    ],
    color: 'O'
  },
  {
    name: 'Z',
    rotations: [
      [0, 1, cols + 1, cols + 2],
      [2, cols + 1, cols + 2, cols * 2 + 1],
    ],
    color: 'Z'
  }
];

// Spielstart
nextTetromino = getRandomTetromino();
spawnNewTetromino();
timerId = setInterval(moveDown, 500);

function draw() {
  if (isGameOver) return;
  currentTetromino.rotations[currentRotation].forEach(index => {
    cells[currentPosition + index].classList.add("filled", currentTetromino.color);
  });
}


function moveDown() {
  if (isPaused || isGameOver) return;
  undraw();
  currentPosition += cols;
  draw();
  freeze();
}

function freeze() {
  if (currentTetromino.rotations[currentRotation].some(index =>
    currentPosition + index + cols >= cols * rows ||
    cells[currentPosition + index + cols].classList.contains("taken")
  )) {
    currentTetromino.rotations[currentRotation].forEach(index => {
      cells[currentPosition + index].classList.add("taken");
    });
    clearLines();
    spawnNewTetromino();
  }
}

function moveLeft() {
  if (isPaused || isGameOver) return;
  undraw();
  if (currentTetromino.rotations[currentRotation].every(index =>
    (currentPosition + index) % cols !== 0 &&
    !cells[currentPosition + index - 1].classList.contains("taken")
  )) {
    currentPosition -= 1;
  }
  draw();
}

function moveRight() {
  if (isPaused || isGameOver) return;
  undraw();
  if (currentTetromino.rotations[currentRotation].every(index =>
    (currentPosition + index) % cols !== cols - 1 &&
    !cells[currentPosition + index + 1].classList.contains("taken")
  )) {
    currentPosition += 1;
  }
  draw();
}

function rotate() {
  if (isPaused || isGameOver) return;
  undraw();
  const nextRotation = (currentRotation + 1) % currentTetromino.rotations.length;
  if (currentTetromino.rotations[nextRotation].every(index => {
    const pos = currentPosition + index;
    return pos >= 0 && pos < cols * rows &&
      !cells[pos].classList.contains("taken") &&
      (pos % cols >= 0 && pos % cols < cols);
  })) {
    currentRotation = nextRotation;
  }
  draw();
}

function getRandomTetromino() {
  const t = tetrominos[Math.floor(Math.random() * tetrominos.length)];
  return {
    name: t.name,
    color: t.color,
    rotations: t.rotations
  };
}

function spawnNewTetromino() {
  if (isGameOver) return;

  moves++;
  movesDisplay.textContent = moves;

  currentTetromino = nextTetromino;
  currentPosition = 4;
  currentRotation = 0;

  nextTetromino = getRandomTetromino();
  drawNextTetromino();
  draw();

  if (currentTetromino.rotations[currentRotation].some(index =>
    cells[currentPosition + index].classList.contains("taken")
  )) {
    endGame(false);
  }
}

function drawNextTetromino() {
  nextCells.forEach(cell => {
    cell.className = "next-cell";
  });

  const shape = nextTetromino.rotations[0];
  shape.forEach(index => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const i = row * 4 + col;
    if (i >= 0 && i < 16) {
      nextCells[i].classList.add(nextTetromino.color);
    }
  });
}

function clearLines() {
  for (let r = 0; r < rows; r++) {
    const rowStart = r * cols;
    const row = cells.slice(rowStart, rowStart + cols);
    if (row.every(cell => cell.classList.contains("taken"))) {
      row.forEach(cell => cell.className = "cell");

      const removed = cells.splice(rowStart, cols);
      removed.forEach(cell => {
        grid.removeChild(cell);
        const newCell = document.createElement("div");
        newCell.classList.add("cell");
        grid.insertBefore(newCell, grid.firstChild);
        cells.unshift(newCell);
      });

      score += 10 * 2;
      linesCleared++;
      scoreDisplay.textContent = score;

      if (linesCleared >= goalLines) {
        endGame(true);
      }
    }
  }
}

function endGame(goalReached = false) {
  clearInterval(timerId);
  isGameOver = true;
  overlay.style.display = "flex";
  gameOverText.textContent = goalReached ? "🎉 Ziel erreicht!" : "💀 GAME OVER";
  nextCells.forEach(cell => cell.className = "next-cell");
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === "ArrowDown") moveDown();
  if (e.key === "ArrowUp") rotate();
});

restartButton.addEventListener("click", () => {
  cells.forEach(cell => cell.className = "cell");
  nextCells.forEach(cell => cell.className = "next-cell");
  overlay.style.display = "none";
  score = 0;
  moves = 0;
  linesCleared = 0;
  isPaused = false;
  isGameOver = false;
  scoreDisplay.textContent = 0;
  movesDisplay.textContent = 0;
  gameOverText.textContent = "GAME OVER";
  currentPosition = 4;
  currentRotation = 0;
  nextTetromino = getRandomTetromino();
  spawnNewTetromino();
  timerId = setInterval(moveDown, 500);
});

pauseButton.addEventListener("click", () => {
  if (isGameOver) return;
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? "▶️" : "⏸";
});
