import { logAction } from './history.js';

export function rollDice(reason, modifier) {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + modifier;
    
    // Animate Modal
    const modal = document.getElementById('dice-modal');
    const resultEl = document.getElementById('dice-result');
    const reasonEl = document.getElementById('dice-reason');
    const formulaEl = document.getElementById('dice-formula');
    
    if(!modal) return;
    
    reasonEl.textContent = `Rolando: ${reason}`;
    formulaEl.textContent = `1d20 (${d20}) + ${modifier}`;
    resultEl.textContent = '...';
    resultEl.classList.add('rolling');
    modal.classList.add('visible');
    
    setTimeout(() => {
        resultEl.classList.remove('rolling');
        resultEl.textContent = total;
        
        let critText = '';
        if (d20 === 20) {
            resultEl.classList.add('crit-success');
            critText = ' (CRÍTICO!)';
        } else if (d20 === 1) {
            resultEl.classList.add('crit-fail');
            critText = ' (FALHA CRÍTICA!)';
        } else {
            resultEl.classList.remove('crit-success', 'crit-fail');
        }
        
        logAction(`Rolou ${reason}: 1d20(${d20}) + ${modifier} = ${total}${critText}`);
    }, 1000);
}

export function closeDiceModal() {
    const modal = document.getElementById('dice-modal');
    if (modal) modal.classList.remove('visible');
}
