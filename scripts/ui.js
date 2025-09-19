(function (global) {
    'use strict';

    const CLASS_NAMES = Object.freeze({
        boardRow: 'board__row',
        boardCell: 'board__cell',
        highlightEnabled: 'is-highlight-enabled',
        cellHighlighted: 'is-highlighted'
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

        const initialState = controller.getState();
        const boardSize = Array.isArray(initialState.board) ? initialState.board.length : 8;

        boardElement.setAttribute('role', 'grid');
        boardElement.setAttribute('aria-rowcount', String(boardSize));
        boardElement.setAttribute('aria-colcount', String(boardSize));
        boardElement.dataset.boardSize = String(boardSize);

        const cellGrid = buildBoard(boardElement, boardSize);

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
            controller.playMove(row, col);
        }

        boardElement.addEventListener('click', handleBoardClick);

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
                    undo: mainElement.querySelector('[data-action="undo"]')
                },
                dialogs: {
                    pass: root.querySelector('[data-dialog="pass"]'),
                    result: root.querySelector('[data-dialog="result"]')
                }
            },
            getCellElement,
            clearHighlights,
            setCellHighlighted,
            highlightCells,
            setHighlightEnabled,
            destroy() {
                boardElement.removeEventListener('click', handleBoardClick);
            }
        };

        setHighlightEnabled(Boolean(initialState.settings && initialState.settings.highlightLegalMoves));

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
