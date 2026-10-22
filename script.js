const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const cells = document.querySelectorAll(".cell");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const resetScoresBtn = document.getElementById("reset-scores");
const aiToggle = document.getElementById("ai-toggle");
const scoreEls = {
  X: document.getElementById("score-x"),
  O: document.getElementById("score-o"),
  draw: document.getElementById("score-draw"),
};

let board = Array(9).fill(null);
let currentPlayer = "X";
let gameOver = false;
let aiTimer = null;
const scores = { X: 0, O: 0, draw: 0 };

const STORAGE_KEY = "tictactoe-state";

// Storage can be unavailable (private mode, blocked site data), so fail quietly.
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    for (const key of ["X", "O", "draw"]) {
      if (Number.isInteger(saved.scores?.[key])) scores[key] = saved.scores[key];
    }
    aiToggle.checked = Boolean(saved.vsComputer);
  } catch {}
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ scores, vsComputer: aiToggle.checked })
    );
  } catch {}
}

function getWinner(b) {
  for (const line of WIN_LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return { player: b[a], line };
    }
  }
  return null;
}

function isFull(b) {
  return b.every(Boolean);
}

function render() {
  cells.forEach((cell, i) => {
    cell.textContent = board[i] || "";
    cell.classList.toggle("x", board[i] === "X");
    cell.classList.toggle("o", board[i] === "O");
    cell.disabled = gameOver || Boolean(board[i]);
  });
  scoreEls.X.textContent = scores.X;
  scoreEls.O.textContent = scores.O;
  scoreEls.draw.textContent = scores.draw;
}

function makeMove(index) {
  if (gameOver || board[index]) return;

  board[index] = currentPlayer;
  const result = getWinner(board);

  if (result) {
    gameOver = true;
    scores[result.player]++;
    saveState();
    statusEl.textContent = `Player ${result.player} wins!`;
    render();
    result.line.forEach((i) => cells[i].classList.add("win"));
    return;
  }

  if (isFull(board)) {
    gameOver = true;
    scores.draw++;
    saveState();
    statusEl.textContent = "It's a draw!";
    render();
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusEl.textContent = `Player ${currentPlayer}'s turn`;
  render();

  if (aiToggle.checked && currentPlayer === "O") {
    aiTimer = setTimeout(() => makeMove(bestMove()), 300);
  }
}

// Minimax: the computer (O) never loses.
function minimax(b, player, depth) {
  const result = getWinner(b);
  if (result) return result.player === "O" ? 10 - depth : depth - 10;
  if (isFull(b)) return 0;

  let best = player === "O" ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = player;
    const score = minimax(b, player === "O" ? "X" : "O", depth + 1);
    b[i] = null;
    best = player === "O" ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

function bestMove() {
  let bestScore = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = "O";
    const score = minimax(board, "X", 1);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      move = i;
    }
  }
  return move;
}

function newRound() {
  clearTimeout(aiTimer);
  board = Array(9).fill(null);
  currentPlayer = "X";
  gameOver = false;
  statusEl.textContent = "Player X's turn";
  cells.forEach((cell) => cell.classList.remove("win"));
  render();
}

cells.forEach((cell) => {
  cell.addEventListener("click", () => {
    // Ignore clicks while the computer is thinking.
    if (aiToggle.checked && currentPlayer === "O") return;
    makeMove(Number(cell.dataset.index));
  });
});

restartBtn.addEventListener("click", newRound);

resetScoresBtn.addEventListener("click", () => {
  scores.X = scores.O = scores.draw = 0;
  saveState();
  newRound();
});

aiToggle.addEventListener("change", () => {
  saveState();
  newRound();
});

loadState();
render();
