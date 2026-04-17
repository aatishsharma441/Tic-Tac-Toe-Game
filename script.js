(function () {
  "use strict";

  // ---------- STATE ----------
  let board = Array(9).fill(null);
  let currentPlayer = 'X';        // X always starts
  let gameActive = true;
  let winner = null;             // 'X', 'O', 'draw', null
  let winningCombo = [];

  // Scores
  let scoreX = 0, scoreO = 0, draws = 0;

  // Settings
  let isDark = false;
  let multiplayer = false;       // false = vs AI
  let difficulty = 'easy';       // 'easy','medium','hard'

  // DOM elements
  const boardEl = document.getElementById('board');
  const notifMsg = document.getElementById('notifMessage');
  const scoreXEl = document.getElementById('scoreX');
  const scoreOEl = document.getElementById('scoreO');
  const drawScoreEl = document.getElementById('drawScore');
  const themeToggle = document.getElementById('themeToggle');
  const multiToggle = document.getElementById('multiplayerToggle');
  const modeLabel = document.getElementById('modeLabel');
  const resetBtn = document.getElementById('resetBtn');
  const clearScoresBtn = document.getElementById('clearScoresBtn');
  const predictionText = document.getElementById('predictionText');
  const diffBtns = document.querySelectorAll('.diff-btn');

  // Helper: Update UI scores
  function updateScoreUI() {
    scoreXEl.textContent = scoreX;
    scoreOEl.textContent = scoreO;
    drawScoreEl.textContent = draws;
  }

  // Notification
  function setNotification(text, isAlert = false) {
    notifMsg.textContent = text;
    const notifArea = document.getElementById('notification');
    if (isAlert) {
      notifArea.style.background = 'rgba(239,68,68,0.2)';
      setTimeout(() => notifArea.style.background = '', 300);
    } else {
      notifArea.style.background = '';
    }
  }

  // Check winner / draw
  function checkGameStatus() {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        winner = board[a];
        winningCombo = line;
        gameActive = false;
        return;
      }
    }
    if (board.every(cell => cell !== null)) {
      winner = 'draw';
      gameActive = false;
      winningCombo = [];
    } else {
      winner = null;
      gameActive = true;
      winningCombo = [];
    }
  }

  // Update board rendering + win animations
  function renderBoard() {
    // clear
    boardEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (board[i] === 'X') cell.classList.add('x-move');
      if (board[i] === 'O') cell.classList.add('o-move');
      cell.textContent = board[i] || '';

      if (winningCombo.includes(i)) {
        cell.classList.add('winning-cell');
      }

      cell.addEventListener('click', () => handleCellClick(i));
      boardEl.appendChild(cell);
    }

    // notification based on state
    if (!gameActive) {
      if (winner === 'X') setNotification(`✨ Player X wins! ✨`, false);
      else if (winner === 'O') setNotification(`💫 Player O wins! 💫`, false);
      else if (winner === 'draw') setNotification(`🤝 It's a draw.`, false);
      else setNotification(`Game paused.`);
    } else {
      const playerTurn = currentPlayer;
      if (!multiplayer && playerTurn === 'O' && gameActive) {
        setNotification(`🤖 AI (O) is thinking...`, false);
      } else {
        setNotification(`${multiplayer ? 'Multiplayer' : 'Your turn'} · ${playerTurn}`, false);
      }
    }
  }

  // AI prediction (simple heuristic: if AI can win next move, say "win possible"; else random)
  function updateAIPrediction() {
    if (multiplayer || !gameActive || currentPlayer !== 'O') {
      predictionText.textContent = 'AI idle';
      return;
    }
    // very basic prediction: check if AI (O) has any winning move next
    let winMove = -1;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        if (checkWinFor('O', board)) winMove = i;
        board[i] = null;
        if (winMove !== -1) break;
      }
    }
    if (winMove !== -1) {
      predictionText.textContent = `⚠️ AI can win!`;
    } else {
      // check if X can win next (block)
      let blockMove = -1;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = 'X';
          if (checkWinFor('X', board)) blockMove = i;
          board[i] = null;
          if (blockMove !== -1) break;
        }
      }
      if (blockMove !== -1) predictionText.textContent = `🛡️ Block needed`;
      else predictionText.textContent = `⚡ Strategic move`;
    }
  }

  function checkWinFor(player, brd) {
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    return lines.some(l => l.every(idx => brd[idx] === player));
  }

  // Handle move
  function handleMove(index) {
    if (!gameActive || board[index] !== null) return false;

    board[index] = currentPlayer;

    checkGameStatus();

    // Score increment
    if (!gameActive) {
      if (winner === 'X') { scoreX++; }
      else if (winner === 'O') { scoreO++; }
      else if (winner === 'draw') { draws++; }
      updateScoreUI();
    }

    renderBoard();

    // Switch player if game still active
    if (gameActive) {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      renderBoard(); // update turn message
      updateAIPrediction();

      // AI move trigger
      if (!multiplayer && currentPlayer === 'O' && gameActive) {
        setTimeout(() => aiMakeMove(), 280);
      }
    } else {
      updateAIPrediction();
    }
    return true;
  }

  function handleCellClick(i) {
    if (!gameActive) return;
    if (multiplayer) {
      handleMove(i);
    } else {
      // vs AI: only X (human) can click
      if (currentPlayer === 'X') {
        handleMove(i);
      } else {
        setNotification('🤖 AI is thinking...', true);
      }
    }
  }

  // AI move with difficulty
  function aiMakeMove() {
    if (!gameActive || currentPlayer !== 'O' || multiplayer) return;

    const empty = board.reduce((acc, cell, idx) => cell === null ? [...acc, idx] : acc, []);
    if (empty.length === 0) return;

    let move = empty[0];

    if (difficulty === 'easy') {
      move = empty[Math.floor(Math.random() * empty.length)];
    } else if (difficulty === 'medium') {
      // 50% random / 50% minimax light
      if (Math.random() > 0.5) {
        move = getBestMove();
      } else {
        move = empty[Math.floor(Math.random() * empty.length)];
      }
    } else { // hard
      move = getBestMove();
    }

    handleMove(move);
  }

  // Minimax for AI (O)
  function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = 0;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        let score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }

  function minimax(brd, depth, isMax) {
    if (checkWinFor('O', brd)) return 10 - depth;
    if (checkWinFor('X', brd)) return depth - 10;
    if (brd.every(c => c !== null)) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!brd[i]) {
          brd[i] = 'O';
          best = Math.max(best, minimax(brd, depth + 1, false));
          brd[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!brd[i]) {
          brd[i] = 'X';
          best = Math.min(best, minimax(brd, depth + 1, true));
          brd[i] = null;
        }
      }
      return best;
    }
  }

  // Reset game (keep scores)
  function resetGame() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    winner = null;
    winningCombo = [];
    renderBoard();
    updateAIPrediction();
    setNotification(`New game · ${multiplayer ? 'Multiplayer' : 'vs AI'} · X starts`);
  }

  // Clear scores
  function resetScores() {
    scoreX = scoreO = draws = 0;
    updateScoreUI();
    setNotification('Scoreboard cleared', false);
  }

  // Theme toggle
  function toggleTheme() {
    isDark = !isDark;
    document.body.classList.toggle('dark', isDark);
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i><span> Light</span>' : '<i class="fas fa-moon"></i><span> Dark</span>';
  }

  // Multiplayer toggle
  function toggleMultiplayer() {
    multiplayer = !multiplayer;
    modeLabel.textContent = multiplayer ? '2P' : 'vs AI';
    resetGame();
    if (!multiplayer) updateAIPrediction();
    else predictionText.textContent = 'Multiplayer mode';
  }

  // Difficulty change
  function setDifficulty(level) {
    difficulty = level;
    diffBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === level);
    });
    updateAIPrediction();
  }

  // Initialization
  function init() {
    // create board
    renderBoard();
    updateScoreUI();

    // event listeners
    themeToggle.addEventListener('click', toggleTheme);
    multiToggle.addEventListener('click', toggleMultiplayer);
    resetBtn.addEventListener('click', resetGame);
    clearScoresBtn.addEventListener('click', resetScores);

    diffBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        setDifficulty(e.target.dataset.diff);
        if (!multiplayer) updateAIPrediction();
      });
    });

    setNotification('✨ Futuristic Tic-Tac-Toe · Your turn X');
    updateAIPrediction();
  }

  init();
})();