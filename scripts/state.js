(function (global) {
    'use strict';

    const Game = (typeof module !== 'undefined' && module.exports)
        ? require('./game.js')
        : global.OthelloGame;

    const DEFAULT_SETTINGS = Object.freeze({
        firstPlayer: Game.BLACK,
        highlightLegalMoves: true
    });

    function cloneMove(move) {
        return {
            row: move.row,
            col: move.col,
            flipped: (move.flipped || []).map((disc) => ({ row: disc.row, col: disc.col }))
        };
    }

    function cloneHistoryEntry(entry) {
        return {
            player: entry.player,
            position: entry.position ? { row: entry.position.row, col: entry.position.col } : null,
            flipped: (entry.flipped || []).map((disc) => ({ row: disc.row, col: disc.col })),
            isPass: Boolean(entry.isPass),
            scoresAfter: { ...entry.scoresAfter }
        };
    }

    function cloneSettings(settings) {
        return {
            firstPlayer: settings.firstPlayer,
            highlightLegalMoves: settings.highlightLegalMoves
        };
    }

    function cloneInternalState(source) {
        return {
            board: Game.cloneBoard(source.board),
            currentPlayer: source.currentPlayer,
            legalMoves: source.legalMoves.map(cloneMove),
            scores: { ...source.scores },
            history: source.history.map(cloneHistoryEntry),
            settings: cloneSettings(source.settings),
            consecutivePasses: source.consecutivePasses,
            isGameOver: Boolean(source.isGameOver)
        };
    }

    function normalizeSettings(customSettings) {
        const base = DEFAULT_SETTINGS;
        const settings = {
            firstPlayer: (customSettings && customSettings.firstPlayer) || base.firstPlayer,
            highlightLegalMoves: (customSettings && typeof customSettings.highlightLegalMoves === 'boolean')
                ? customSettings.highlightLegalMoves
                : base.highlightLegalMoves
        };

        if (settings.firstPlayer !== Game.BLACK && settings.firstPlayer !== Game.WHITE) {
            settings.firstPlayer = base.firstPlayer;
        }

        return settings;
    }

    function createNewGame(customSettings) {
        const settings = normalizeSettings(customSettings);
        const board = Game.createInitialBoard();
        const currentPlayer = settings.firstPlayer;
        const legalMoves = Game.findLegalMoves(board, currentPlayer);
        const scores = Game.countDiscs(board);

        return {
            board,
            currentPlayer,
            legalMoves,
            scores,
            history: [],
            settings,
            consecutivePasses: 0,
            isGameOver: false
        };
    }

    function createGameController(initialSettings) {
        let state = createNewGame(initialSettings);
        let undoSnapshot = null;
        const listeners = new Set();

        function emitState() {
            const snapshot = cloneInternalState(state);
            listeners.forEach((listener) => {
                try {
                    listener(snapshot);
                } catch (error) {
                    console.error('State listener error:', error);
                }
            });
        }

        function createHistoryRecord(player, position, flipped, isPass) {
            return {
                player,
                position: position ? { row: position.row, col: position.col } : null,
                flipped: (flipped || []).map((disc) => ({ row: disc.row, col: disc.col })),
                isPass: Boolean(isPass),
                scoresAfter: { ...state.scores }
            };
        }

        function recordPass(player) {
            state.history.push(createHistoryRecord(player, null, [], true));
        }

        function advanceTurn(previousPlayer) {
            if (state.isGameOver) {
                state.legalMoves = [];
                return;
            }

            if (state.scores && state.scores.empty === 0) {
                state.currentPlayer = Game.getOpponent(previousPlayer);
                state.legalMoves = [];
                state.isGameOver = true;
                return;
            }

            let playerToCheck = Game.getOpponent(previousPlayer);

            for (let attempt = 0; attempt < 2; attempt += 1) {
                const legalMoves = Game.findLegalMoves(state.board, playerToCheck);
                if (legalMoves.length > 0) {
                    state.currentPlayer = playerToCheck;
                    state.legalMoves = legalMoves;
                    state.isGameOver = false;
                    return;
                }

                state.consecutivePasses += 1;
                recordPass(playerToCheck);
                playerToCheck = Game.getOpponent(playerToCheck);
            }

            state.currentPlayer = playerToCheck;
            state.legalMoves = [];
            state.isGameOver = true;
        }

        function getState() {
            return cloneInternalState(state);
        }

        function playMove(row, col) {
            if (state.isGameOver) {
                return false;
            }

            if (!Number.isInteger(row) || !Number.isInteger(col)) {
                return false;
            }

            const move = state.legalMoves.find((candidate) => candidate.row === row && candidate.col === col);
            if (!move) {
                return false;
            }

            undoSnapshot = cloneInternalState(state);

            const player = state.currentPlayer;
            state.board = Game.applyMove(state.board, { row, col }, player);
            state.scores = Game.countDiscs(state.board);
            state.history.push(createHistoryRecord(player, { row, col }, move.flipped, false));
            state.consecutivePasses = 0;

            advanceTurn(player);

            emitState();
            return true;
        }

        function undoLastMove() {
            if (!undoSnapshot) {
                return false;
            }

            state = cloneInternalState(undoSnapshot);
            undoSnapshot = null;
            emitState();
            return true;
        }

        function toggleHighlight() {
            state.settings = {
                ...state.settings,
                highlightLegalMoves: !state.settings.highlightLegalMoves
            };

            if (undoSnapshot) {
                undoSnapshot.settings = {
                    ...undoSnapshot.settings,
                    highlightLegalMoves: state.settings.highlightLegalMoves
                };
            }

            emitState();
            return state.settings.highlightLegalMoves;
        }

        function reset(newSettings) {
            const mergedSettings = {
                ...state.settings,
                ...(newSettings || {})
            };
            state = createNewGame(mergedSettings);
            undoSnapshot = null;
            emitState();
        }

        function setFirstPlayer(color) {
            if (color !== Game.BLACK && color !== Game.WHITE) {
                throw new Error('First player must be "black" or "white".');
            }

            if (state.settings.firstPlayer === color) {
                return false;
            }

            reset({ firstPlayer: color });
            return true;
        }

        function onStateChange(listener) {
            if (typeof listener !== 'function') {
                throw new Error('Listener must be a function.');
            }

            listeners.add(listener);
            listener(getState());
            return function unsubscribe() {
                listeners.delete(listener);
            };
        }

        return Object.freeze({
            getState,
            playMove,
            undo: undoLastMove,
            toggleHighlight,
            setFirstPlayer,
            reset,
            onStateChange
        });
    }

    const api = Object.freeze({
        createGameController,
        createNewGame
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.OthelloState = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
