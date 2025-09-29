(function (global) {
    'use strict';

    const Game = (typeof module !== 'undefined' && module.exports)
        ? require('./game.js')
        : global.OthelloGame;

    const BLACK = Game && Game.BLACK ? Game.BLACK : 'black';
    const WHITE = Game && Game.WHITE ? Game.WHITE : 'white';
    const EMPTY = Game && Game.DISC && Object.prototype.hasOwnProperty.call(Game.DISC, 'EMPTY')
        ? Game.DISC.EMPTY
        : null;

    const PLAYER_LABELS = Object.freeze({
        [BLACK]: '黒',
        [WHITE]: '白'
    });

    const PLAYER_SYMBOLS = Object.freeze({
        [BLACK]: '●',
        [WHITE]: '○'
    });

    const CLASS_NAMES = Object.freeze({
        boardRow: 'board__row',
        boardCell: 'board__cell',
        highlightEnabled: 'is-highlight-enabled',
        cellHighlighted: 'is-highlighted',
        cellBlack: 'is-black',
        cellWhite: 'is-white'
    });

    function assertController(controller) {
        if (!controller || typeof controller.getState !== 'function' || typeof controller.playMove !== 'function') {
            throw new Error('A valid game controller must be provided to createUI.');
        }
    }

    function ensureDomAvailable() {
        if (typeof document === 'undefined') {
            throw new Error('createUI requires a DOM environment.');
        }
    }

    function toIndex(value) {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
    }

    function formatPlayer(player) {
        if (!player || typeof player !== 'string') {
            return '-';
        }
        const label = PLAYER_LABELS[player] || player;
        const symbol = PLAYER_SYMBOLS[player] || '';
        return symbol ? `${label} (${symbol})` : label;
    }

    function describeCell(row, col, disc) {
        const position = `行${row + 1} 列${col + 1}`;
        if (disc === BLACK) {
            return `${position} 黒の石`;
        }
        if (disc === WHITE) {
            return `${position} 白の石`;
        }
        return `${position} 空き`;
    }

    function createCellElement(row, col) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.classList.add(CLASS_NAMES.boardCell);
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.dataset.cell = 'true';
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `行${row + 1} 列${col + 1}`);
        return cell;
    }

    function createRowElement(rowIndex, boardSize, cellGrid) {
        const rowElement = document.createElement('div');
        rowElement.classList.add(CLASS_NAMES.boardRow);
        rowElement.setAttribute('role', 'row');

        for (let col = 0; col < boardSize; col += 1) {
            const cell = createCellElement(rowIndex, col);
            rowElement.appendChild(cell);
            cellGrid[rowIndex][col] = cell;
        }

        return rowElement;
    }

    function buildBoard(boardElement, boardSize) {
        const cellGrid = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));
        boardElement.innerHTML = '';

        for (let row = 0; row < boardSize; row += 1) {
            boardElement.appendChild(createRowElement(row, boardSize, cellGrid));
        }

        return cellGrid;
    }

    function getScoreValue(scores, player) {
        if (!scores) {
            return 0;
        }
        if (Object.prototype.hasOwnProperty.call(scores, player)) {
            return scores[player];
        }
        const lowerKey = typeof player === 'string' ? player.toLowerCase() : player;
        return Object.prototype.hasOwnProperty.call(scores, lowerKey) ? scores[lowerKey] : 0;
    }

    function createUI(controller, options) {
        assertController(controller);
        ensureDomAvailable();

        const config = options || {};
        const root = config.root || document;
        const mainElement = root.querySelector('main');
        if (!mainElement) {
            throw new Error('Main element not found.');
        }

        const boardElement = mainElement.querySelector('[data-board]');
        if (!boardElement) {
            throw new Error('Board element with data-board attribute not found.');
        }

        const initialState = controller.getState() || {};
        let boardSize = Array.isArray(initialState.board) ? initialState.board.length : 8;

        boardElement.setAttribute('role', 'grid');

        function updateBoardSizeMetadata(size) {
            const nextSize = Number.isInteger(size) && size > 0 ? size : boardSize;
            boardElement.setAttribute('aria-rowcount', String(nextSize));
            boardElement.setAttribute('aria-colcount', String(nextSize));
            boardElement.dataset.boardSize = String(nextSize);
            boardElement.style.setProperty('--board-size', String(nextSize));
        }

        updateBoardSizeMetadata(boardSize);

        let cellGrid = buildBoard(boardElement, boardSize);

        const liveRegions = {
            status: mainElement.querySelector('[data-live-region="status"]'),
            alert: mainElement.querySelector('[data-live-region="alert"]')
        };

        const liveRegionState = {
            status: '',
            alert: ''
        };

        function getCellElement(row, col) {
            if (!Number.isInteger(row) || !Number.isInteger(col)) {
                return null;
            }
            if (row < 0 || col < 0 || row >= cellGrid.length || col >= cellGrid[row].length) {
                return null;
            }
            return cellGrid[row][col];
        }

        function clearHighlights() {
            for (const row of cellGrid) {
                for (const cell of row) {
                    if (cell) {
                        cell.classList.remove(CLASS_NAMES.cellHighlighted);
                    }
                }
            }
        }

        function setCellHighlighted(row, col, highlighted) {
            const cell = getCellElement(row, col);
            if (!cell) {
                return;
            }
            cell.classList.toggle(CLASS_NAMES.cellHighlighted, Boolean(highlighted));
        }

        function highlightCells(positions) {
            clearHighlights();
            if (!Array.isArray(positions)) {
                return;
            }
            for (const position of positions) {
                if (!position) {
                    continue;
                }
                const rowIndex = toIndex(position.row);
                const colIndex = toIndex(position.col);
                if (rowIndex === null || colIndex === null) {
                    continue;
                }
                setCellHighlighted(rowIndex, colIndex, true);
            }
        }

        function setHighlightEnabled(enabled) {
            boardElement.classList.toggle(CLASS_NAMES.highlightEnabled, Boolean(enabled));
        }

        function focusCell(row, col) {
            const cell = getCellElement(row, col);
            if (!cell) {
                console.error('Failed to focus cell for keyboard navigation:', { row, col });
                return;
            }
            if (typeof cell.focus === 'function') {
                try {
                    cell.focus({ preventScroll: true });
                } catch (error) {
                    cell.focus();
                }
            }
        }

        function moveFocus(row, col, rowOffset, colOffset) {
            const nextRow = Math.min(Math.max(row + rowOffset, 0), boardSize - 1);
            const nextCol = Math.min(Math.max(col + colOffset, 0), boardSize - 1);
            if (nextRow === row && nextCol === col) {
                return;
            }
            focusCell(nextRow, nextCol);
        }

        function updateLiveRegion(element, message, key) {
            if (!element || typeof message !== 'string') {
                return;
            }
            const text = message.trim();
            if (!text) {
                return;
            }
            if (liveRegionState[key] === text) {
                element.textContent = '';
                try {
                    void element.offsetWidth;
                } catch (error) {
                    // Ignore reflow errors silently.
                }
            }
            liveRegionState[key] = text;
            element.textContent = text;
        }

        function announceStatus(message) {
            updateLiveRegion(liveRegions.status, message, 'status');
        }

        function announceAlert(message) {
            updateLiveRegion(liveRegions.alert, message, 'alert');
        }

        function setCellDisc(row, col, disc) {
            const cell = getCellElement(row, col);
            if (!cell) {
                return;
            }

            const value = disc === BLACK || disc === WHITE ? disc : EMPTY;

            cell.classList.remove(CLASS_NAMES.cellBlack, CLASS_NAMES.cellWhite);

            if (value === BLACK) {
                cell.classList.add(CLASS_NAMES.cellBlack);
                cell.dataset.disc = BLACK;
            } else if (value === WHITE) {
                cell.classList.add(CLASS_NAMES.cellWhite);
                cell.dataset.disc = WHITE;
            } else {
                delete cell.dataset.disc;
            }

            cell.setAttribute('aria-label', describeCell(row, col, value));
        }

        function renderBoard(board) {
            if (!Array.isArray(board)) {
                return;
            }
            for (let row = 0; row < cellGrid.length; row += 1) {
                const cells = cellGrid[row];
                const boardRow = Array.isArray(board[row]) ? board[row] : [];
                for (let col = 0; col < cells.length; col += 1) {
                    setCellDisc(row, col, boardRow[col]);
                }
            }
        }

        function handleBoardClick(event) {
            const target = event.target.closest('[data-cell]');
            if (!target || !boardElement.contains(target)) {
                return;
            }
            const row = toIndex(target.dataset.row);
            const col = toIndex(target.dataset.col);
            if (row === null || col === null) {
                return;
            }
            try {
                controller.playMove(row, col);
            } catch (error) {
                console.error('Failed to play move from pointer interaction:', error);
            }
        }

        boardElement.addEventListener('click', handleBoardClick);
        boardElement.addEventListener('keydown', handleBoardKeyDown);

        let latestState = initialState;
        let unsubscribe = null;

        const ui = {
            elements: {
                root: mainElement,
                board: boardElement,
                cells: cellGrid,
                turnLabel: mainElement.querySelector('[data-current-player]'),
                score: {
                    black: mainElement.querySelector('[data-score="black"]'),
                    white: mainElement.querySelector('[data-score="white"]')
                },
                controls: {
                    newGame: mainElement.querySelector('[data-action="new-game"]'),
                    switchFirstPlayer: mainElement.querySelector('[data-action="switch-first-player"]'),
                    toggleHighlight: mainElement.querySelector('[data-action="toggle-highlight"]'),
                    undo: mainElement.querySelector('[data-action="undo"]'),
                    boardSize: mainElement.querySelector('[data-action="change-board-size"]')
                },
                dialogs: {
                    pass: {
                        dialog: root.querySelector('[data-dialog="pass"]'),
                        message: root.querySelector('[data-pass-message]'),
                        closeButton: root.querySelector('[data-pass-close]')
                    },
                    result: {
                        dialog: root.querySelector('[data-dialog="result"]'),
                        summary: root.querySelector('[data-result-summary]'),
                        scores: {
                            black: root.querySelector('[data-result-score="black"]'),
                            white: root.querySelector('[data-result-score="white"]')
                        },
                        newGameButton: root.querySelector('[data-result-new-game]')
                    }
                },
                liveRegions
            },
            getCellElement,
            clearHighlights,
            setCellHighlighted,
            highlightCells,
            setHighlightEnabled,
            destroy: destroyUI
        };

        const controls = ui.elements.controls;
        const dialogs = ui.elements.dialogs;

        if (controls.boardSize && typeof controller.getSupportedBoardSizes === 'function') {
            const supportedSizes = controller.getSupportedBoardSizes();
            if (Array.isArray(supportedSizes) && supportedSizes.length > 0) {
                const normalizedSizes = Array.from(new Set(supportedSizes.filter((size) => Number.isInteger(size)))).sort((a, b) => a - b);
                const supportedValues = new Set(normalizedSizes.map((size) => String(size)));

                Array.from(controls.boardSize.options || []).forEach((option) => {
                    if (!supportedValues.has(option.value)) {
                        option.remove();
                    }
                });

                const existingValues = new Set(Array.from(controls.boardSize.options || []).map((option) => option.value));
                normalizedSizes.forEach((size) => {
                    const value = String(size);
                    if (!existingValues.has(value)) {
                        const option = document.createElement('option');
                        option.value = value;
                        option.textContent = `${size}×${size}`;
                        controls.boardSize.appendChild(option);
                    }
                });

                if (!supportedValues.has(controls.boardSize.value)) {
                    controls.boardSize.value = String(boardSize);
                }
            }
        }

        if (controls.boardSize && !controls.boardSize.value) {
            controls.boardSize.value = String(boardSize);
        }

        function updateScores(scores) {
            if (ui.elements.score.black) {
                ui.elements.score.black.textContent = String(getScoreValue(scores, BLACK));
            }
            if (ui.elements.score.white) {
                ui.elements.score.white.textContent = String(getScoreValue(scores, WHITE));
            }
        }

        function updateTurn(state) {
            if (!ui.elements.turnLabel) {
                return;
            }
            if (state.isGameOver) {
                ui.elements.turnLabel.textContent = 'ゲーム終了';
                announceStatus('ゲームが終了しました。');
                return;
            }
            ui.elements.turnLabel.textContent = `現在の手番: ${formatPlayer(state.currentPlayer)}`;
            announceStatus(`現在の手番は${formatPlayer(state.currentPlayer)}です。`);
        }

        function updateControls(state) {
            if (controls.toggleHighlight) {
                const enabled = Boolean(state.settings && state.settings.highlightLegalMoves);
                controls.toggleHighlight.textContent = enabled ? 'ハイライト: ON' : 'ハイライト: OFF';
                controls.toggleHighlight.setAttribute('aria-pressed', enabled ? 'true' : 'false');
            }
            if (controls.switchFirstPlayer) {
                const firstPlayer = state.settings ? state.settings.firstPlayer : null;
                controls.switchFirstPlayer.textContent = `先手: ${formatPlayer(firstPlayer)}`;
            }
            if (controls.boardSize) {
                const nextSize = state.settings && Number.isInteger(state.settings.boardSize)
                    ? state.settings.boardSize
                    : boardSize;
                const sizeValue = String(nextSize);
                if (controls.boardSize.value !== sizeValue) {
                    controls.boardSize.value = sizeValue;
                }
            }
        }

        function openDialog(dialog) {
            if (!dialog) {
                return;
            }
            if (typeof dialog.showModal === 'function') {
                if (!dialog.open) {
                    dialog.showModal();
                }
            } else {
                dialog.setAttribute('open', 'open');
            }
        }

        function closeDialog(dialog) {
            if (!dialog) {
                return;
            }
            if (typeof dialog.close === 'function') {
                if (dialog.open) {
                    dialog.close();
                }
            } else {
                dialog.removeAttribute('open');
            }
        }

        function showPassDialog(passedPlayer, nextPlayer) {
            const passDialog = dialogs.pass;
            if (!passDialog || !passDialog.dialog || !passDialog.message) {
                return;
            }
            const passedText = formatPlayer(passedPlayer);
            const nextText = formatPlayer(nextPlayer);
            const message = `${passedText} は合法手がないためパスしました。次は ${nextText} の手番です。`;
            passDialog.message.textContent = message;
            announceAlert(message);
            openDialog(passDialog.dialog);
        }

        function describeResult(state) {
            const scores = state.scores || {};
            const blackScore = getScoreValue(scores, BLACK);
            const whiteScore = getScoreValue(scores, WHITE);
            const moveCount = Array.isArray(state.history)
                ? state.history.filter((entry) => entry && !entry.isPass).length
                : 0;

            if (blackScore > whiteScore) {
                return {
                    message: `黒の勝ちです。手数: ${moveCount}手 (黒 ${blackScore} - 白 ${whiteScore})`,
                    blackScore,
                    whiteScore
                };
            }
            if (whiteScore > blackScore) {
                return {
                    message: `白の勝ちです。手数: ${moveCount}手 (黒 ${blackScore} - 白 ${whiteScore})`,
                    blackScore,
                    whiteScore
                };
            }
            return {
                message: `引き分けです。手数: ${moveCount}手 (黒 ${blackScore} - 白 ${whiteScore})`,
                blackScore,
                whiteScore
            };
        }

        function showResultDialog(state) {
            const resultDialog = dialogs.result;
            if (!resultDialog || !resultDialog.dialog) {
                return;
            }

            const { message, blackScore, whiteScore } = describeResult(state);

            if (resultDialog.summary) {
                resultDialog.summary.textContent = message;
            }
            if (resultDialog.scores) {
                if (resultDialog.scores.black) {
                    resultDialog.scores.black.textContent = String(blackScore);
                }
                if (resultDialog.scores.white) {
                    resultDialog.scores.white.textContent = String(whiteScore);
                }
            }

            closeDialog(dialogs.pass && dialogs.pass.dialog);
            openDialog(resultDialog.dialog);
            announceAlert(message);
        }

        function handleNewGameClick() {
            closeDialog(dialogs.pass && dialogs.pass.dialog);
            closeDialog(dialogs.result && dialogs.result.dialog);
            controller.reset();
        }

        function handleDialogNewGameClick() {
            handleNewGameClick();
        }

        function handleSwitchFirstPlayerClick() {
            const currentFirst = latestState && latestState.settings ? latestState.settings.firstPlayer : BLACK;
            const nextFirst = currentFirst === BLACK ? WHITE : BLACK;
            try {
                controller.setFirstPlayer(nextFirst);
            } catch (error) {
                console.error('Failed to switch first player:', error);
            }
        }

        function handleToggleHighlightClick() {
            controller.toggleHighlight();
        }

        function handleBoardSizeChange(event) {
            const target = event && event.target ? event.target : null;
            if (!target) {
                return;
            }

            const requestedSize = toIndex(target.value);
            const fallbackSize = latestState && latestState.settings && Number.isInteger(latestState.settings.boardSize)
                ? latestState.settings.boardSize
                : boardSize;

            if (requestedSize === null) {
                target.value = String(fallbackSize);
                return;
            }

            const applied = controller.setBoardSize(requestedSize);
            if (!applied) {
                target.value = String(fallbackSize);
            }
        }

        function handleUndoClick() {
            controller.undo();
        }

        function handlePassCloseClick() {
            closeDialog(dialogs.pass && dialogs.pass.dialog);
        }

        if (controls.newGame) {
            controls.newGame.addEventListener('click', handleNewGameClick);
        }
        if (controls.switchFirstPlayer) {
            controls.switchFirstPlayer.addEventListener('click', handleSwitchFirstPlayerClick);
        }
        if (controls.toggleHighlight) {
            controls.toggleHighlight.addEventListener('click', handleToggleHighlightClick);
        }
        if (controls.boardSize) {
            controls.boardSize.addEventListener('change', handleBoardSizeChange);
        }
        if (controls.undo) {
            controls.undo.addEventListener('click', handleUndoClick);
        }
        if (dialogs.result && dialogs.result.newGameButton) {
            dialogs.result.newGameButton.addEventListener('click', handleDialogNewGameClick);
        }
        if (dialogs.pass && dialogs.pass.closeButton) {
            dialogs.pass.closeButton.addEventListener('click', handlePassCloseClick);
        }

        function handleBoardKeyDown(event) {
            const { key } = event;
            if (!key) {
                return;
            }

            const target = event.target && event.target.closest('[data-cell]');
            if (!target || !boardElement.contains(target)) {
                return;
            }

            const row = toIndex(target.dataset.row);
            const col = toIndex(target.dataset.col);

            if (row === null || col === null) {
                console.error('Invalid cell coordinates for keyboard input:', target.dataset);
                return;
            }

            switch (key) {
                case 'ArrowUp':
                    event.preventDefault();
                    moveFocus(row, col, -1, 0);
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    moveFocus(row, col, 1, 0);
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    moveFocus(row, col, 0, -1);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    moveFocus(row, col, 0, 1);
                    break;
                case 'Enter':
                case ' ': // Space key
                case 'Spacebar':
                    event.preventDefault();
                    try {
                        controller.playMove(row, col);
                    } catch (error) {
                        console.error('Failed to apply keyboard move:', error);
                    }
                    break;
                default:
                    break;
            }
        }

        function handleStateChange(nextState) {
            const previousState = latestState;
            latestState = nextState;

            const nextBoardSize = Array.isArray(nextState.board) ? nextState.board.length : boardSize;
            if (Number.isInteger(nextBoardSize) && nextBoardSize > 0 && nextBoardSize !== boardSize) {
                boardSize = nextBoardSize;
                updateBoardSizeMetadata(boardSize);
                cellGrid = buildBoard(boardElement, boardSize);
                ui.elements.cells = cellGrid;
            }

            renderBoard(nextState.board);
            updateScores(nextState.scores);
            updateTurn(nextState);
            updateControls(nextState);

            const highlightEnabled = Boolean(nextState.settings && nextState.settings.highlightLegalMoves);
            setHighlightEnabled(highlightEnabled);
            if (highlightEnabled && !nextState.isGameOver) {
                highlightCells(nextState.legalMoves);
            } else {
                clearHighlights();
            }

            const prevHistoryLength = previousState && Array.isArray(previousState.history)
                ? previousState.history.length
                : 0;
            const currentHistory = Array.isArray(nextState.history) ? nextState.history : [];

            if (!nextState.isGameOver && currentHistory.length > prevHistoryLength) {
                const newEntries = currentHistory.slice(prevHistoryLength);
                for (let index = newEntries.length - 1; index >= 0; index -= 1) {
                    const entry = newEntries[index];
                    if (entry && entry.isPass) {
                        showPassDialog(entry.player, nextState.currentPlayer);
                        break;
                    }
                }
            }

            const wasGameOver = Boolean(previousState && previousState.isGameOver);
            const isGameOver = Boolean(nextState && nextState.isGameOver);

            if (!wasGameOver && isGameOver) {
                showResultDialog(nextState);
            } else if (wasGameOver && !isGameOver) {
                closeDialog(dialogs.result && dialogs.result.dialog);
                closeDialog(dialogs.pass && dialogs.pass.dialog);
            }
        }

        unsubscribe = controller.onStateChange(handleStateChange);

        function destroyUI() {
            boardElement.removeEventListener('click', handleBoardClick);
            boardElement.removeEventListener('keydown', handleBoardKeyDown);
            if (controls.newGame) {
                controls.newGame.removeEventListener('click', handleNewGameClick);
            }
            if (controls.switchFirstPlayer) {
                controls.switchFirstPlayer.removeEventListener('click', handleSwitchFirstPlayerClick);
            }
            if (controls.toggleHighlight) {
                controls.toggleHighlight.removeEventListener('click', handleToggleHighlightClick);
            }
            if (controls.boardSize) {
                controls.boardSize.removeEventListener('change', handleBoardSizeChange);
            }
            if (controls.undo) {
                controls.undo.removeEventListener('click', handleUndoClick);
            }
            if (dialogs.result && dialogs.result.newGameButton) {
                dialogs.result.newGameButton.removeEventListener('click', handleDialogNewGameClick);
            }
            if (dialogs.pass && dialogs.pass.closeButton) {
                dialogs.pass.closeButton.removeEventListener('click', handlePassCloseClick);
            }
            if (typeof unsubscribe === 'function') {
                unsubscribe();
                unsubscribe = null;
            }
        }

        return ui;
    }

    const api = Object.freeze({
        createUI
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.OthelloUI = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
