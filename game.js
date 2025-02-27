class TicTacToe {
    constructor() {
        this.board = Array(9).fill(null);
        this.Turn = "X";
        this.winner = null;
    }

    makeMove(position) {
        // Ensure position is a number and within bounds
        position = parseInt(position);
        if (isNaN(position) || position < 0 || position > 8) {
            return false;
        }

        // Check if the move is valid
        if (this.board[position] || this.winner) {
            return false;
        }

        // Make the move using array index
        this.board[position] = this.Turn;

        // Check for winner
        if (this.checkWinner()) {
            this.winner = this.Turn;
            return true;
        }

        // Check for draw
        if (this.board.every((cell) => cell !== null)) {
            this.winner = this.winner ? this.winner : "draw";
            return true;
        }

        // Switch players
        this.Turn = this.Turn === "X" ? "O" : "X";
        return true;
    }

    checkWinner() {
        const winningCombinations = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8], // Rows
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8], // Columns
            [0, 4, 8],
            [2, 4, 6], // Diagonals
        ];

        return winningCombinations.some(([a, b, c]) => {
            return (
                this.board[a] &&
                this.board[a] === this.board[b] &&
                this.board[a] === this.board[c]
            );
        });
    }

    getBoard() {
        return this.board;
    }

    getCurrentPlayer() {
        return this.Turn;
    }

    getWinner() {
        return this.winner;
    }
}

// Export the class
export { TicTacToe };
