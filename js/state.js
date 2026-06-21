import { showToast } from './utils.js';
import { getStateObject, applyStateObject } from './app.js';

let currentCharId = 'default';
let savesRegistry = [{ id: 'default', name: 'Personagem 1' }];

let undoStack = [];
let redoStack = [];
let isApplyingState = false;

export function initSaves() {
    try {
        const reg = localStorage.getItem('guardioesSavesRegistry');
        if (reg) {
            savesRegistry = JSON.parse(reg);
        }
        const last = localStorage.getItem('guardioesLastChar');
        if (last && savesRegistry.find(s => s.id === last)) {
            currentCharId = last;
        } else {
            currentCharId = savesRegistry[0].id;
        }
    } catch(e) {}
}

export function getSavesRegistry() {
    return savesRegistry;
}

export function getCurrentCharId() {
    return currentCharId;
}

export function saveRegistry() {
    localStorage.setItem('guardioesSavesRegistry', JSON.stringify(savesRegistry));
    localStorage.setItem('guardioesLastChar', currentCharId);
}

export function switchCharacter(id) {
    if (id === currentCharId) return;
    currentCharId = id;
    saveRegistry();
    undoStack = [];
    redoStack = [];
    
    const stateStr = localStorage.getItem(`guardioesRPGState_${currentCharId}`);
    if (stateStr) {
        applyStateObject(JSON.parse(stateStr));
    } else {
        // Se não existir, carrega default
        applyStateObject(null);
    }
    showToast('Personagem carregado!', 'success');
}

export function createNewCharacter() {
    const id = 'char_' + Date.now();
    const name = `Novo Personagem`;
    savesRegistry.push({ id, name });
    saveRegistry();
    switchCharacter(id);
}

export function renameCurrentCharacter(newName) {
    const char = savesRegistry.find(c => c.id === currentCharId);
    if (char) {
        char.name = newName || 'Sem Nome';
        saveRegistry();
    }
}

export function deleteCurrentCharacter() {
    if (savesRegistry.length <= 1) {
        showToast('Você não pode deletar o único personagem!', 'error');
        return;
    }
    const idx = savesRegistry.findIndex(c => c.id === currentCharId);
    savesRegistry.splice(idx, 1);
    localStorage.removeItem(`guardioesRPGState_${currentCharId}`);
    
    currentCharId = savesRegistry[0].id;
    saveRegistry();
    switchCharacter(currentCharId);
}

export function pushUndo(explicitStateStr = null) {
    if (isApplyingState) return; 
    const stateStr = explicitStateStr || JSON.stringify(getStateObject());
    
    // Evitar push duplicado
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === stateStr) return;
    
    undoStack.push(stateStr);
    if (undoStack.length > 20) {
        undoStack.shift();
    }
    redoStack = []; 
}

export function undo() {
    if (undoStack.length === 0) return;
    
    // Salva estado atual pro redo
    const currentState = getStateObject();
    redoStack.push(JSON.stringify(currentState));
    
    const previousStateStr = undoStack.pop();
    isApplyingState = true;
    applyStateObject(JSON.parse(previousStateStr));
    isApplyingState = false;
    saveStateSilent();
    showToast('Desfazer aplicado');
}

export function redo() {
    if (redoStack.length === 0) return;
    
    // Salva estado atual pro undo
    const currentState = getStateObject();
    undoStack.push(JSON.stringify(currentState));
    
    const nextStateStr = redoStack.pop();
    isApplyingState = true;
    applyStateObject(JSON.parse(nextStateStr));
    isApplyingState = false;
    saveStateSilent();
    showToast('Refazer aplicado');
}

export function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            showToast('⚠️ Armazenamento cheio! Exporte backups.', 'error');
        }
        console.error('localStorage error:', e);
        return false;
    }
}

export function saveStateSilent() {
    if (isApplyingState) return;
    const state = getStateObject();
    safeSetItem(`guardioesRPGState_${currentCharId}`, JSON.stringify(state));
}
