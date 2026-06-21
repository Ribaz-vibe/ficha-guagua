const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

// Remove IIFE
code = code.replace(/^\(function\(\)\s*\{\s*/, '');
code = code.replace(/\n\}\)\(\);\s*$/, '\n');

// Remove functions that were moved to utils.js
const utilsFuncs = ['sanitizeHTML', 'safeSetItem', 'getStoredJSON', 'clearAppData', 'isValidImageDataURI', 'compressImage', 'showToast'];
utilsFuncs.forEach(func => {
    // A simple regex to remove function definitions (assumes standard formatting)
    const regex = new RegExp(`function\\s+${func}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'g');
    code = code.replace(regex, '');
});

// We need clearAppData logic for something else, let's just let it be deleted and we'll handle it.
// Actually, let's keep the imports at the top
const imports = `import { sanitizeHTML, isValidImageDataURI, compressImage, showToast, getStoredJSON } from './utils.js';
import { logAction, getHistory, loadHistory, clearHistory } from './history.js';
import { rollDice, closeDiceModal } from './roller.js';
import { initSaves, getSavesRegistry, getCurrentCharId, saveRegistry, switchCharacter, createNewCharacter, renameCurrentCharacter, deleteCurrentCharacter, pushUndo, undo, redo, saveStateSilent as saveStateSilentSlot, safeSetItem } from './state.js';

`;

code = imports + code;

// Now we need to export getStateObject and applyStateObject so state.js can use them
code = code.replace('function getStateObject()', 'export function getStateObject()');
// applyStateObject is basically loadState(state). Let's rename loadState to applyStateObject
code = code.replace('function loadState(providedState = null)', 'export function applyStateObject(state)');
code = code.replace(/loadState\(/g, 'applyStateObject(');

// Add window exports for debugging if needed, but we don't strictly need them
// Modify autoSaveLoop to use saveStateSilentSlot
code = code.replace(/saveStateSilent\(\)/g, 'saveStateSilentSlot()');

// Write back
fs.writeFileSync('js/app.js', code, 'utf8');
console.log('app.js refactored partially');
