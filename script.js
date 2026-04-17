const cells = document.querySelectorAll(".cell");
const resetBtn = document.getElementById("resetBtn");

let currentPlayer = "X";
let board = Array(9).fill("");

const winningPatterns = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => handleClick(cell, index));
});

function handleClick(cell, index) {
  if (board[index] !== "") return;

  board[index] = currentPlayer;
  cell.innerText = currentPlayer;

  if (checkWinner()) {
    setTimeout(() => alert(`🎉 Player ${currentPlayer} Wins!`), 100);
    disableBoard();
    return;
  }

  if (board.every(cell => cell !== "")) {
    setTimeout(() => alert("😐 It's a Draw!"), 100);
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
}

function checkWinner() {
  return winningPatterns.some(pattern => {
    const [a, b, c] = pattern;
    return board[a] &&
           board[a] === board[b] &&
           board[a] === board[c];
  });
}

function disableBoard() {
  cells.forEach(cell => cell.disabled = true);
}

resetBtn.addEventListener("click", () => {
  board.fill("");
  currentPlayer = "X";
  cells.forEach(cell => {
    cell.innerText = "";
    cell.disabled = false;
  });
});