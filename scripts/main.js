(function (global) {
    'use strict';

    const isCommonJs = typeof module !== 'undefined' && module.exports;
    const StateModule = global.OthelloState || (isCommonJs ? require('./state.js') : null);
    const UiModule = global.OthelloUI || (isCommonJs ? require('./ui.js') : null);

    function bootstrap() {
        if (!StateModule || !UiModule) {
            console.error('Othello modules are not available.');
            return null;
        }
        if (typeof document === 'undefined') {
            return null;
        }

        const controller = StateModule.createGameController();
        const ui = UiModule.createUI(controller);

        const app = { controller, ui };
        global.OthelloApp = app;
        return app;
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
        } else {
            bootstrap();
        }
    }

    if (isCommonJs) {
        module.exports = { bootstrap };
    }
})(typeof window !== 'undefined' ? window : globalThis);
