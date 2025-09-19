(function (global) {
    'use strict';

    const BOARD_SIZE = 8;
    const EMPTY = null;
    const BLACK = 'black';
    const WHITE = 'white';

    const DIRECTIONS = Object.freeze([
        Object.freeze({ row: -1, col: -1 }),
        Object.freeze({ row: -1, col: 0 }),
        Object.freeze({ row: -1, col: 1 }),
        Object.freeze({ row: 0, col: -1 }),
        Object.freeze({ row: 0, col: 1 }),
        Object.freeze({ row: 1, col: -1 }),
        Object.freeze({ row: 1, col: 0 }),
        Object.freeze({ row: 1, col: 1 })
    ]);

    const DISC = Object.freeze({
        EMPTY,
        BLACK,
        WHITE
    });

    const PLAYERS = Object.freeze([BLACK, WHITE]);

    function isValidPlayer(player) {
        return PLAYERS.includes(player);
    }

    function isOnBoard(row, col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    function getOpponent(player) {
        if (player === BLACK) {
            return WHITE;
        }
        if (player === WHITE) {
            return BLACK;
        }
        throw new Error('Unknown player token: ' + player);
    }

    function cloneBoard(board) {
        return board.map((row) => row.slice());
    }

    function createInitialBoard() {
        const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
        const mid = BOARD_SIZE / 2;
        board[mid - 1][mid - 1] = WHITE;
        board[mid][mid] = WHITE;
        board[mid - 1][mid] = BLACK;
        board[mid][mid - 1] = BLACK;
        return board;
    }

    function collectFlippedDiscs(board, position, player) {
        if (!isValidPlayer(player)) {
            throw new Error('Invalid player supplied to collectFlippedDiscs: ' + player);
        }
        if (!position || typeof position.row !== 'number' || typeof position.col !== 'number') {
            throw new Error('Position must include row and col numbers.');
        }

        const { row, col } = position;
        if (!isOnBoard(row, col) || board[row][col] !== EMPTY) {
            return [];
        }

        const opponent = getOpponent(player);
        const flipped = [];

        for (const direction of DIRECTIONS) {
            let currentRow = row + direction.row;
            let currentCol = col + direction.col;
            const discsToFlip = [];

            while (isOnBoard(currentRow, currentCol) && board[currentRow][currentCol] === opponent) {
                discsToFlip.push({ row: currentRow, col: currentCol });
                currentRow += direction.row;
                currentCol += direction.col;
            }

            if (discsToFlip.length === 0) {
                continue;
            }

            if (isOnBoard(currentRow, currentCol) && board[currentRow][currentCol] === player) {
                flipped.push(...discsToFlip);
            }
        }

        return flipped;
    }

    function findLegalMoves(board, player) {
        if (!isValidPlayer(player)) {
            throw new Error('Invalid player supplied to findLegalMoves: ' + player);
        }

        const legalMoves = [];

        for (let row = 0; row < BOARD_SIZE; row += 1) {
            for (let col = 0; col < BOARD_SIZE; col += 1) {
                if (board[row][col] !== EMPTY) {
                    continue;
                }
                const flipped = collectFlippedDiscs(board, { row, col }, player);
                if (flipped.length > 0) {
                    legalMoves.push({ row, col, flipped });
                }
            }
        }

        return legalMoves;
    }

    function applyMove(board, position, player) {
        if (!position) {
            return cloneBoard(board);
        }

        const flipped = collectFlippedDiscs(board, position, player);
        if (flipped.length === 0) {
            return cloneBoard(board);
        }

        const nextBoard = cloneBoard(board);
        nextBoard[position.row][position.col] = player;
        for (const disc of flipped) {
            nextBoard[disc.row][disc.col] = player;
        }
        return nextBoard;
    }

    function countDiscs(board) {
        let blackCount = 0;
        let whiteCount = 0;
        let emptyCount = 0;

        for (const row of board) {
            for (const cell of row) {
                if (cell === BLACK) {
                    blackCount += 1;
                } else if (cell === WHITE) {
                    whiteCount += 1;
                } else {
                    emptyCount += 1;
                }
            }
        }

        return {
            [BLACK]: blackCount,
            [WHITE]: whiteCount,
            empty: emptyCount
        };
    }

    function isBoardFull(board) {
        return board.every((row) => row.every((cell) => cell !== EMPTY));
    }

    function isGameOver(board) {
        if (isBoardFull(board)) {
            return true;
        }
        const blackMoves = findLegalMoves(board, BLACK);
        const whiteMoves = findLegalMoves(board, WHITE);
        return blackMoves.length === 0 && whiteMoves.length === 0;
    }

    const api = Object.freeze({
        BOARD_SIZE,
        DIRECTIONS,
        DISC,
        BLACK,
        WHITE,
        createInitialBoard,
        findLegalMoves,
        applyMove,
        collectFlippedDiscs,
        countDiscs,
        isGameOver,
        getOpponent,
        cloneBoard
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.OthelloGame = api;
    }

    function runSelfCheck() {
        const initialBoard = createInitialBoard();
        console.assert(initialBoard[3][3] === WHITE && initialBoard[3][4] === BLACK, '初期配置が正しく生成されていること');
        console.assert(initialBoard[4][3] === BLACK && initialBoard[4][4] === WHITE, '初期配置が正しく生成されていること (対角)');

        const blackMoves = findLegalMoves(initialBoard, BLACK).map((move) => `${move.row},${move.col}`).sort().join('|');
        console.assert(blackMoves === '2,3|3,2|4,5|5,4', '初手の黒の合法手が4つであること');
        const whiteMoves = findLegalMoves(initialBoard, WHITE).map((move) => `${move.row},${move.col}`).sort().join('|');
        console.assert(whiteMoves === '2,4|3,5|4,2|5,3', '初手の白の合法手が4つであること');

        const boardAfterBlack = applyMove(initialBoard, { row: 2, col: 3 }, BLACK);
        console.assert(boardAfterBlack[2][3] === BLACK, '着手したマスに石が置かれていること');
        console.assert(boardAfterBlack[3][3] === BLACK, '反転対象の石が黒に変化していること');
        console.assert(initialBoard[3][3] === WHITE, '元の盤面が破壊されていないこと');

        const edgeBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(WHITE));
        edgeBoard[0][0] = EMPTY;
        edgeBoard[0][1] = WHITE;
        edgeBoard[0][2] = WHITE;
        edgeBoard[0][3] = BLACK;
        edgeBoard[1][0] = WHITE;
        edgeBoard[2][0] = WHITE;
        edgeBoard[3][0] = BLACK;
        const flips = collectFlippedDiscs(edgeBoard, { row: 0, col: 0 }, BLACK);
        console.assert(flips.length === 4, '角への着手で4枚の石が反転対象になること');
        const afterCorner = applyMove(edgeBoard, { row: 0, col: 0 }, BLACK);
        console.assert(afterCorner[0][1] === BLACK && afterCorner[1][0] === BLACK, '角への着手で端の石が反転すること');
        console.assert(edgeBoard[0][1] === WHITE && edgeBoard[1][0] === WHITE, '角テストでも元の盤面が変更されないこと');

        const passBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(WHITE));
        passBoard[7][7] = EMPTY;
        passBoard[7][6] = BLACK;
        passBoard[7][5] = WHITE;
        passBoard[6][7] = WHITE;
        passBoard[5][7] = WHITE;
        const blackLegal = findLegalMoves(passBoard, BLACK);
        const whiteLegal = findLegalMoves(passBoard, WHITE);
        console.assert(blackLegal.length === 0, '黒が打てずパスになる局面が検出できること');
        console.assert(whiteLegal.some((move) => move.row === 7 && move.col === 7), '同じ局面で白には合法手が存在すること');
        console.assert(isGameOver(passBoard) === false, '双方に合法手がない場合のみ終局と判定すること');

        const fullBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(BLACK));
        console.assert(isGameOver(fullBoard) === true, '盤が埋まれば終局判定になること');
        const counts = countDiscs(fullBoard);
        console.assert(counts[BLACK] === BOARD_SIZE * BOARD_SIZE && counts[WHITE] === 0 && counts.empty === 0, '石数カウントが正しいこと');
    }

    runSelfCheck();
})(typeof window !== 'undefined' ? window : globalThis);
