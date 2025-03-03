import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { TicTacToe } from "./game.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

var playersX = [];
var playersO = [];
var playersR = [];

const games = new Map();

io.on("connection", (socket) => {
    // Handle player joining with their choice (X, O, or R)
    socket.on("joinGame", (choice) => {
        // Remove player from any existing lists first
        removePlayer(socket.id);

        const player = { id: socket.id, choice };

        switch (choice) {
            case "X":
                playersX.push(player);
                break;
            case "O":
                playersO.push(player);
                break;
            case "R":
                playersR.push(player);
                break;
        }

        // Try to find a match
        findMatch(socket);
    });

    socket.on("makeMove", ({ room, position }) => {
        if (!games.has(room)) {
            return;
        }

        const game = games.get(room);
        const success = game.makeMove(Number(position));

        if (success) {
            // Broadcast the updated game state to all players in the room
            io.to(room).emit("gameUpdate", {
                board: game.getBoard(),
                Turn: game.getCurrentPlayer(),
                winner: game.getWinner(),
            });
        }
    });

    socket.on("disconnect", () => {
        // Remove player from arrays
        playersX = playersX.filter((p) => p.id !== socket.id);
        playersO = playersO.filter((p) => p.id !== socket.id);
        playersR = playersR.filter((p) => p.id !== socket.id);

        // Clean up any games this player was in
        for (const [room, game] of games.entries()) {
            if (room.includes(socket.id)) {
                io.to(room).emit("playerDisconnected");
                games.delete(room);
            }
        }
    });
});

function findMatch(socket) {
    const player = findPlayer(socket.id);
    if (!player) return;

    let opponent = null;
    let playerSymbol = "";
    let opponentSymbol = "";

    // If player chose X, look for O or R
    if (player.choice === "X") {
        opponent = playersO[0] || playersR[0];
        playerSymbol = "X";
        opponentSymbol = "O";
    }
    // If player chose O, look for X or R
    else if (player.choice === "O") {
        opponent = playersX[0] || playersR[0];
        playerSymbol = "O";
        opponentSymbol = "X";
    }
    // If player chose R, look for any available player
    else if (player.choice === "R") {
        opponent =
            playersX[0] ||
            playersO[0] ||
            (playersR.length > 1 ? playersR[0] : null);
        if (opponent) {
            if (opponent.choice === "X") {
                playerSymbol = "O";
                opponentSymbol = "X";
            } else if (opponent.choice === "O") {
                playerSymbol = "X";
                opponentSymbol = "O";
            } else {
                // Both are R
                playerSymbol = "X";
                opponentSymbol = "O";
            }
        }
    }

    if (opponent) {
        const room = `game-${socket.id}-${opponent.id}`;

        // Initialize new game
        games.set(room, new TicTacToe());

        // Remove both players from waiting arrays
        removePlayer(player.id);
        removePlayer(opponent.id);

        // Join both players to the same room
        socket.join(room);
        io.sockets.sockets.get(opponent.id)?.join(room);

        // Send initial game state with player symbols
        const gameState = {
            room,
            board: games.get(room).getBoard(),
            Turn: games.get(room).getCurrentPlayer(),
            symbol: playerSymbol,
        };

        const opponentGameState = {
            room,
            board: games.get(room).getBoard(),
            Turn: games.get(room).getCurrentPlayer(),
            symbol: opponentSymbol,
        };

        io.to(opponent.id).emit("matchFound", opponentGameState);
        socket.emit("matchFound", gameState);
    }
}

function findPlayer(socketId) {
    return (
        playersX.find((p) => p.id === socketId) ||
        playersO.find((p) => p.id === socketId) ||
        playersR.find((p) => p.id === socketId)
    );
}

function removePlayer(socketId) {
    playersX = playersX.filter((p) => p.id !== socketId);
    playersO = playersO.filter((p) => p.id !== socketId);
    playersR = playersR.filter((p) => p.id !== socketId);
}

// Configure CORS to allow requests from all origins
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    })
);

server.listen(3000, () => {
    // console.log("Server is running on port 3000");
});
