/**
 * Contains all the rules for winning/ending a game
 */
const rules = (() => {
    const winCombos = [
        [0, 1, 2], // row
        [3, 4, 5], // row
        [6, 7, 8], // row
        [0, 3, 6], // column
        [1, 4, 7], // column
        [2, 5, 8], // column
        [0, 4, 8], // diagonal
        [2, 4, 6], // diagonal
    ];

    /**
     * Return winner combo
     * @returns Array
     */
    function getWinCombo(boardState) {
        for (let i = 0; i < winCombos.length; i++) {
            if (boardState[winCombos[i][0]] !== '' &&
                boardState[winCombos[i][0]] === boardState[winCombos[i][1]] &&
                boardState[winCombos[i][1]] === boardState[winCombos[i][2]]) {
                return winCombos[i];
            }
        }
        return null;
    }

    /**
     * Checks if the board is filled, no one can put a play anymore
     * which means it's a tie
     * @returns boolean
     */
    function isFilled(boardState) {
        return boardState.indexOf('') < 0;
    }

    return {
        getWinCombo,
        isFilled
    }
})();

/**
 * Contains all standalone logic related to the board which includes
 *  - initializing the board
 *  - Placing X's and O's
 */
const board = (() => {
    let boardArray;
    
    const cells = Array.from(document.getElementsByClassName('cell'));

    /**
     * instantiates the boardArray and the display cells
     */
    function start () {
        boardArray = new Array(9).fill('');
        boardArray.forEach((cell, idx) => {
            cells[idx].textContent = boardArray[idx];
            cells[idx].classList.remove('cell--win');
        })
    }

    /**
     * Updates the boardArray as well as the display with the ticker
     * @returns boolean: if placing ticker is a valid move
     */
    function placeTicker(index, ticker) {
        if (boardArray[index] === '' ) {
            boardArray[index] = ticker;
            cells[index].textContent = ticker;
            return true;
        }
        return false;
    }
    
    function hasWinner() {
        const winCombo = rules.getWinCombo(boardArray);
        displayWinner(winCombo);
        return !!winCombo;
    }

    function isFilled() {
        return rules.isFilled(boardArray);
    }
    
    /**
     * highlights win combo
     */
    function displayWinner(winCombo) {
        if (winCombo) {
            winCombo.forEach((winIndex) => {
                cells[winIndex].classList.add('cell--win');
            });
        }
    }

    return {
        start,
        placeTicker,
        hasWinner,
        isFilled
    }
})();

/**
 * Computer brain
 */
const aiPlayer = (() => {
    /**
     * Get the board current state
     * @return Array
     */
    function getBoardState() {
        const cells = Array.from(document.getElementsByClassName('cell'));
        return cells.map((cell) => cell.textContent);
    }

    async function play(xTurn) {
        return new Promise(resolve => {
            // Adding timeout so user notices it is player's turn.
            setTimeout(() => {
                let indexToPlay;
                // randomize computer if first move for variety
                if (getBoardState().indexOf('X') < 0) {
                    indexToPlay = randomNumberGenerator(9);
                } else {
                    indexToPlay = getBestMove(getBoardState(), xTurn, 0);
                }
                resolve(indexToPlay)
            }, 1500);
        })
    }
    
    function getEmptyIndices(boardState) {
        return boardState
            .map((cellValue, index) => cellValue === '' ? index : -1)
            .filter((index) => index !== -1);
    }

    /**
     * calculates the best move for computer to win/not lose
     * function is complicated and ideal for refactoring
     * there are 2 types of return: return the max possible score for a move or return the index to play
     * 
     * explanation:
     * when a move is made there are only 3 scenarios: a win (caused by the last move), a tie, or further possible moves
     * a win is ideal thus has a +1 score, tie is 0
     */
    function getBestMove(boardState, xTurn, depth) {
        const playScore = [];
        const emptyIndices = getEmptyIndices(boardState);
        for (let i = 0; i < emptyIndices.length; i++) {
            const playIndex = emptyIndices[i];
            const childBoardState = [...boardState];
            childBoardState[playIndex] = xTurn ? 'X' : 'O'; 
            
            if(rules.getWinCombo(childBoardState)) {
                // the last move is always the winning move
                playScore[playIndex] = 1;
                break;
            } else if (rules.isFilled(childBoardState)) {
                playScore[playIndex] = 0;
                break;
            } else {
                playScore[playIndex] = -1 * getBestMove(childBoardState, !xTurn, depth + 1);
            }
        }

        const maxPlayScore = Math.max.apply(null, playScore.filter(() => true));
        if (depth > 0) {
            return maxPlayScore;
        } else {
            const playIndices = playScore.map((sc, ind) => sc === maxPlayScore ? ind : -1).filter((i) => i !== -1);
            return playIndices[randomNumberGenerator(playIndices.length)];
        }
    }
    
    return {
        play
    }
})();

/**
 * Data about the tic tac toe game which includes
 *  - Playing against who
 *  - Turn information
 *  - Display notes to inform user
 * As well as the layout controls of the game
 *  - Button labels
 *  - Able or disable the board
 *  - Listeners for the cells
 */
const game = (() => {
    // DOM elements
    const noteDOM = document.getElementById('note');
    const boardDOM = document.getElementById('board');
    
    let player1IsAComp;
    let player2IsAComp;
    let isPlayer1Turn;
    let hasComputer = true;
    let isActive = false;
    
    /**
     * resets game information and ables the board
     */
    function start(isComputerOn) {
        // Turns
        isPlayer1Turn = true;
        hasComputer = isComputerOn;
        if (hasComputer) {
            player1IsAComp = randomNumberGenerator(2) === 0;
            player2IsAComp = !player1IsAComp;
        } else {
            player1IsAComp = false;
            player2IsAComp = false;
        }
    
        // Note
        let turnName = currentPlayerName();
        drawNote(`${turnName} has turn.`);
        
        // Board
        board.start();
        boardDOM.classList.remove('board--disabled');
        isActive = true;
        
        //handles if computer goes first
        if (isComputerTurn()) {
            handleComputerTurn();
        }
    }
    
    /**
     * disables the board
     */
    function end() {
        isActive = false;
        boardDOM.classList.add('board--disabled');
    }
    
    /**
     * Switch turns between players or computer
     */
    function toggleTurn() {
        isPlayer1Turn = !isPlayer1Turn;
        // Update note to notify turn change
        let turnName = currentPlayerName();
        drawNote(`${turnName} has turn.`);
    }
    
    /**
     * Updates the note on the page
     */
    function drawNote(text) {
        noteDOM.innerHTML = text;
    }
    
    /**
     * Return current player's name player 1 or 2 or computer
     */
    function currentPlayerName() {
        if (isComputerTurn()) {
            return 'Computer';
        } else if (hasComputer) { // if against computer, player is just player
            return 'Player';
        } else if (isPlayer1Turn) {
            return 'Player 1';
        } else {
            return 'Player 2';
        }
    }
    
    /**
     * Checks if current turn is computer's
     */
    function isComputerTurn() {
        if (!hasComputer) {
            return false;
        }
        if (isPlayer1Turn && player1IsAComp ||
            !isPlayer1Turn && player2IsAComp
        ) {
            return true;
        }
    }
    
    /**
     * calls to the computer logic when its turn starts
     */
    function handleComputerTurn() {
        aiPlayer.play(isPlayer1Turn).then((index) => {
            handleTurn(index);
        });
    }
    
    function handleTurn(cellIndex) {
        let ticker = isPlayer1Turn ? 'X' : 'O';
        if (board.placeTicker(cellIndex, ticker)) {
            if (board.hasWinner()) {
                let winnerName = currentPlayerName();
                drawNote(`${winnerName} wins!`);
                end();
            } else if (board.isFilled()) {
                drawNote('It\'s a tie game.');
                end();
            } else {
                toggleTurn();
                if (isComputerTurn()) {
                    handleComputerTurn();
                }
            }
        }
    }
    
    // Event Listeners
    boardDOM.addEventListener('click', (event) => {
        if (isActive && !isComputerTurn()) {
            let cellIndex = parseInt(event.target.getAttribute('cell-index'));
            handleTurn(cellIndex);
        }
    });
    
    return {
        start
    }
})();

/**
 * Helper function to generate equal chance a number below the input
 * @return number
 */
function randomNumberGenerator(x) {
    return Math.floor(Math.random() * x);
}

const actionBtnCompDOM = document.getElementById('action-btn-comp');
const actionBtnPlayerDOM = document.getElementById('action-btn-player');
// Play against computer
actionBtnCompDOM.addEventListener('click', () => {
    game.start(true);
});

//Play against another player
actionBtnPlayerDOM.addEventListener('click', () => {
    game.start(false);
});
