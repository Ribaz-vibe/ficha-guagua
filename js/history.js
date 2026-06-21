import { sanitizeHTML } from './utils.js';

let sessionHistory = [];

export function logAction(actionText) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sessionHistory.push(`[${time}] ${actionText}`);
    renderHistory();
}

export function getHistory() {
    return sessionHistory;
}

export function loadHistory(historyArray) {
    sessionHistory = historyArray || [];
    renderHistory();
}

export function clearHistory() {
    sessionHistory = [];
    renderHistory();
}

export function renderHistory() {
    const container = document.getElementById('history-log-content');
    if (!container) return;
    
    container.innerHTML = sessionHistory.map(log => {
        return `<div class="history-entry">${sanitizeHTML(log)}</div>`;
    }).reverse().join('');
}
