// Default structure for Guardiões 3.0 Attributes
const defaultAttributesData = [
    { id: 'forca', name: 'FORÇA', value: 10, modifier: 0, autoMod: true, skills: [{ name: 'Atletismo', prof: 0 }] },
    { id: 'destreza', name: 'DESTREZA', value: 10, modifier: 0, autoMod: true, skills: [{ name: 'Acrobacia', prof: 0 }, { name: 'Furtividade', prof: 0 }, { name: 'Crime', prof: 0 }, { name: 'Pilotagem', prof: 0 }] },
    { id: 'constituicao', name: 'CONSTITUIÇÃO', value: 10, modifier: 0, autoMod: true, skills: [{ name: 'Fortitude', prof: 0 }] },
    { id: 'inteligencia', name: 'INTELIGÊNCIA', value: 10, modifier: 0, autoMod: true, skills: [{ name: 'Investigação', prof: 0 }, { name: 'Sobrevivência', prof: 0 }, { name: 'História', prof: 0 }, { name: 'Misticismo', prof: 0 }, { name: 'Atualidades', prof: 0 }] },
    { id: 'sabedoria', name: 'SABEDORIA', value: 10, modifier: 0, autoMod: true, skills: [{ name: 'Intuição', prof: 0 }, { name: 'Medicina', prof: 0 }, { name: 'Percepção', prof: 0 }, { name: 'Vontade', prof: 0 }, { name: 'Religião', prof: 0 }, { name: 'Trato com animais', prof: 0 }] },
    { id: 'carisma', name: 'CARISMA', value: 10, modifier: 0, autoMod: true, skills: [{ name: 'Atuação', prof: 0 }, { name: 'Diplomacia', prof: 0 }, { name: 'Enganação', prof: 0 }, { name: 'Intimidação', prof: 0 }] }
];

let attributesData = [];
let isEditMode = false;
let isPlayMode = false;
let autoSaveInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    loadAttributesStructure();
    buildAttributesUI();
    setupEventListeners();
    setupSystemUI();
    
    // URL Hash loader
    if (window.location.hash && window.location.hash.startsWith('#data=')) {
        try {
            const compressed = window.location.hash.substring(6);
            const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
            if (jsonStr) {
                const state = JSON.parse(jsonStr);
                loadAttributesStructure(state);
                loadState(state);
                showToast('Ficha carregada a partir do link mágico!', 'success');
                window.location.hash = ''; 
            }
        } catch (e) {
            console.error('Failed to parse URL data:', e);
        }
    } else {
        loadState();
    }
    
    calculateAll();
    updateVisualBars();
});

function loadAttributesStructure(state = null) {
    if (state && state.guardioesAttributesData) {
        attributesData = JSON.parse(JSON.stringify(state.guardioesAttributesData));
    } else {
        const stored = localStorage.getItem('guardioesAttributesData');
        if (stored) {
            attributesData = JSON.parse(stored);
        } else {
            attributesData = JSON.parse(JSON.stringify(defaultAttributesData));
        }
    }
}

function saveAttributesStructure() {
    localStorage.setItem('guardioesAttributesData', JSON.stringify(attributesData));
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fadeOut');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- SYSTEM UI & MENUS ---
function setupSystemUI() {
    const menu = document.getElementById('system-menu');
    const btnToggle = document.getElementById('btn-toggle-menu');
    const btnClose = document.getElementById('btn-close-menu');
    
    btnToggle.addEventListener('click', () => menu.classList.add('open'));
    btnClose.addEventListener('click', () => menu.classList.remove('open'));
    
    // Scratchpad
    const scratchpad = document.getElementById('scratchpad');
    document.getElementById('btn-toggle-scratchpad').addEventListener('click', () => {
        scratchpad.classList.toggle('hidden');
    });
    document.getElementById('btn-close-scratchpad').addEventListener('click', () => {
        scratchpad.classList.add('hidden');
    });

    // Auto-Save
    const autoSaveSelect = document.getElementById('auto-save-select');
    const storedAutoSave = localStorage.getItem('guardioesAutoSave') || '0';
    autoSaveSelect.value = storedAutoSave;
    applyAutoSave(parseInt(storedAutoSave));
    
    autoSaveSelect.addEventListener('change', (e) => {
        const mins = parseInt(e.target.value);
        localStorage.setItem('guardioesAutoSave', mins);
        applyAutoSave(mins);
        showToast(mins > 0 ? `Auto-Save ativado (${mins} min).` : 'Auto-Save desativado.');
    });

    // Nova Ficha
    document.getElementById('btn-new-sheet').addEventListener('click', () => {
        if(confirm('⚠️ ALERTA ⚠️\nIsso vai apagar a ficha atual do seu navegador.\nDeseja fazer o download do backup antes de continuar?')) {
            exportJSON();
        }
        localStorage.clear();
        attributesData = JSON.parse(JSON.stringify(defaultAttributesData));
        document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => el.value = '');
        document.getElementById('main-title').value = 'FICHA GUARDIÕES 3.0';
        document.getElementById('perfil-nivel').value = '1';
        document.getElementById('perfil-proficiencia').value = '2';
        document.getElementById('char-portrait').src = '';
        buildAttributesUI();
        calculateAll();
        showToast('Nova Ficha criada!', 'success');
        menu.classList.remove('open');
    });

    // Profile Image Upload
    document.getElementById('portrait-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                document.getElementById('char-portrait').src = evt.target.result;
                saveStateSilent(); // Save base64 to localstorage
            };
            reader.readAsDataURL(file);
        }
    });

    // HUD Syncing (Bidirectional)
    const syncPairs = [
        ['stat-hp-curr', 'hud-hp-curr'], ['stat-hp-max', 'hud-hp-max'],
        ['stat-pp-curr', 'hud-pp-curr'], ['stat-pp-max', 'hud-pp-max'],
        ['stat-mp-curr', 'hud-mp-curr'], ['stat-mp-max', 'hud-mp-max']
    ];
    
    syncPairs.forEach(pair => {
        const mainEl = document.getElementById(pair[0]);
        const hudEl = document.getElementById(pair[1]);
        if(mainEl && hudEl) {
            mainEl.addEventListener('input', () => { hudEl.value = mainEl.value; updateVisualBars(); });
            hudEl.addEventListener('input', () => { mainEl.value = hudEl.value; updateVisualBars(); });
        }
    });
}

function applyAutoSave(minutes) {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    if (minutes > 0) {
        autoSaveInterval = setInterval(() => {
            saveStateSilent();
            showToast('Ficha salva automaticamente.', 'success');
        }, minutes * 60 * 1000);
    }
}

// --- VISUAL BARS ---
function updateVisualBars() {
    const bars = [
        { curr: 'stat-hp-curr', max: 'stat-hp-max', vbar: 'vbar-hp', hudMax: 'hud-hp-max' },
        { curr: 'stat-pp-curr', max: 'stat-pp-max', vbar: 'vbar-pp', hudMax: 'hud-pp-max' },
        { curr: 'stat-mp-curr', max: 'stat-mp-max', vbar: 'vbar-mp', hudMax: 'hud-mp-max' }
    ];
    bars.forEach(b => {
        const c = parseFloat(document.getElementById(b.curr).value) || 0;
        const m = parseFloat(document.getElementById(b.max).value) || 1;
        const bar = document.getElementById(b.vbar);
        const hudMax = document.getElementById(b.hudMax);
        if(hudMax) hudMax.textContent = m;
        if(bar) {
            let pct = Math.max(0, Math.min(100, (c / m) * 100));
            bar.style.width = `${pct}%`;
        }
    });
}

// --- DOM SYNC ---
function syncAttributesFromDOM() {
    attributesData.forEach(attr => {
        const modInput = document.getElementById(`mod-attr-${attr.id}`);
        const autoCheck = document.getElementById(`auto-attr-${attr.id}`);
        const valInput = document.getElementById(`val-attr-${attr.id}`);
        const labelInput = document.getElementById(`label-attr-${attr.id}`);
        
        if(autoCheck) attr.autoMod = autoCheck.checked;
        if(valInput) attr.value = parseInt(valInput.value) || 0;
        if(modInput) attr.modifier = parseInt(modInput.value) || 0;
        if(labelInput) attr.name = labelInput.value;

        attr.skills.forEach((skill, idx) => {
            const skillNameInput = document.getElementById(`label-skill-${attr.id}-${idx}`);
            const profInput = document.getElementById(`prof-${attr.id}-${idx}`);
            if(skillNameInput) skill.name = skillNameInput.value;
            if(profInput) skill.prof = parseInt(profInput.value) || 0;
        });
    });
}

// --- BUILD ATTRIBUTES UI ---
function buildAttributesUI() {
    const container = document.getElementById('attributes-container');
    container.innerHTML = '';

    attributesData.forEach((attr) => {
        const block = document.createElement('div');
        block.className = 'attr-block';

        let html = `
            <div class="attr-header">
                <input type="text" class="editable-label" id="label-attr-${attr.id}" value="${attr.name}" readonly>
                <div class="attr-score">
                    <input type="number" class="value-input attr-val calc-trigger" id="val-attr-${attr.id}" value="${attr.value}">
                    <div class="mod-wrapper">
                        <label class="auto-calc-lbl">
                            <input type="checkbox" class="calc-trigger auto-check" id="auto-attr-${attr.id}" ${attr.autoMod ? 'checked' : ''}> Auto
                        </label>
                        <input type="text" class="attr-mod calc-trigger" id="mod-attr-${attr.id}" value="${attr.modifier >= 0 ? '+'+attr.modifier : attr.modifier}" ${attr.autoMod ? 'readonly' : ''}>
                    </div>
                </div>
            </div>
            <div class="skill-list" id="skills-${attr.id}">
        `;

        attr.skills.forEach((skill, idx) => {
            html += `
                <div class="skill-item" id="skill-row-${attr.id}-${idx}">
                    <input type="number" class="skill-prof calc-trigger" id="prof-${attr.id}-${idx}" value="${skill.prof}">
                    <input type="text" class="editable-label skill-name" id="label-skill-${attr.id}-${idx}" value="${skill.name}" readonly>
                    <span class="skill-total" id="total-${attr.id}-${idx}">+0</span>
                    <button class="del-skill-btn" onclick="removeSkill('${attr.id}', ${idx})">❌</button>
                </div>
            `;
        });

        html += `
            <button class="add-skill-btn" onclick="addSkill('${attr.id}')">➕ Adicionar Perícia</button>
            </div>
        `;
        
        block.innerHTML = html;
        container.appendChild(block);
    });

    document.querySelectorAll('.calc-trigger').forEach(el => {
        el.addEventListener('input', calculateAll);
    });
    
    document.querySelectorAll('.auto-check').forEach(el => {
        el.addEventListener('change', (e) => {
            const attrId = e.target.id.replace('auto-attr-', '');
            const modInput = document.getElementById(`mod-attr-${attrId}`);
            if (e.target.checked) {
                modInput.setAttribute('readonly', 'readonly');
            } else {
                modInput.removeAttribute('readonly');
            }
            calculateAll();
        });
    });

    updateEditModeUI();
}

function addSkill(attrId) {
    syncAttributesFromDOM();
    const attr = attributesData.find(a => a.id === attrId);
    if (attr) {
        attr.skills.push({ name: 'Nova Perícia', prof: 0 });
        buildAttributesUI();
        calculateAll();
    }
}

function removeSkill(attrId, skillIdx) {
    if(confirm('Tem certeza que deseja remover esta perícia?')) {
        syncAttributesFromDOM();
        const attr = attributesData.find(a => a.id === attrId);
        if (attr) {
            attr.skills.splice(skillIdx, 1);
            buildAttributesUI();
            calculateAll();
        }
    }
}

// --- CALCULATIONS ---
function calculateAll() {
    const profBase = parseInt(document.getElementById('perfil-proficiencia').value) || 0;
    
    attributesData.forEach(attr => {
        const valInput = document.getElementById(`val-attr-${attr.id}`);
        const modInput = document.getElementById(`mod-attr-${attr.id}`);
        const autoCheck = document.getElementById(`auto-attr-${attr.id}`);
        
        const val = parseInt(valInput.value) || 0;
        let mod = 0;

        if (autoCheck && autoCheck.checked) {
            mod = Math.floor((val - 10) / 2);
            modInput.value = mod >= 0 ? `+${mod}` : mod;
        } else {
            mod = parseInt(modInput.value) || 0;
            if(!modInput.value.startsWith('+') && !modInput.value.startsWith('-') && mod > 0) {
                modInput.value = `+${mod}`;
            }
        }
        attr.value = val;
        attr.modifier = mod;

        attr.skills.forEach((skill, idx) => {
            const profInput = document.getElementById(`prof-${attr.id}-${idx}`);
            const totalSpan = document.getElementById(`total-${attr.id}-${idx}`);
            
            if (profInput && totalSpan) {
                const profMult = parseInt(profInput.value) || 0;
                const total = mod + (profMult * profBase);
                totalSpan.textContent = total >= 0 ? `+${total}` : total;
            }
        });
    });

    const force = attributesData.find(a => a.id === 'forca')?.value || 10;
    const vigor = attributesData.find(a => a.id === 'constituicao')?.value || 10;
    const calcCarga = Math.floor(5 + force + vigor);
    document.getElementById('calc-carga-max').textContent = calcCarga;
    
    updateVisualBars();
}

function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Theme Color
    const colorPicker = document.getElementById('primary-color');
    colorPicker.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--primary-color', e.target.value);
        document.documentElement.style.setProperty('--primary-glow', e.target.value + '99');
    });

    // Edit Mode
    const btnEdit = document.getElementById('btn-edit-mode');
    btnEdit.addEventListener('click', () => {
        isEditMode = !isEditMode;
        btnEdit.textContent = isEditMode ? '🛡️ Modo Edição: ON' : '🛡️ Modo Edição: OFF';
        btnEdit.classList.toggle('btn-primary', !isEditMode);
        btnEdit.classList.toggle('btn-danger', isEditMode);
        updateEditModeUI();
    });

    // Play Mode
    const btnPlay = document.getElementById('btn-play-mode');
    const hud = document.getElementById('play-hud');
    btnPlay.addEventListener('click', () => {
        isPlayMode = !isPlayMode;
        btnPlay.textContent = isPlayMode ? '⚔️ Modo Jogo: ON' : '⚔️ Modo Jogo: OFF';
        document.body.classList.toggle('play-mode-active', isPlayMode);
        hud.classList.toggle('hidden', !isPlayMode);
        
        // Disable edit mode if play mode is ON
        if(isPlayMode && isEditMode) {
            btnEdit.click(); 
        }
        updateVisualBars();
    });

    document.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('change', saveStateSilent);
    });

    // Main Actions
    document.getElementById('btn-save').addEventListener('click', saveState);
    document.getElementById('btn-export-pdf').addEventListener('click', () => window.print());
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);
    document.getElementById('btn-share-link').addEventListener('click', generateShareLink);
    document.getElementById('btn-copy-clipboard').addEventListener('click', copyClipboard);
    document.getElementById('btn-paste-clipboard').addEventListener('click', pasteClipboard);
    document.getElementById('file-upload').addEventListener('change', importJSON);
}

function updateEditModeUI() {
    if (isEditMode) {
        document.body.classList.add('edit-mode');
        document.querySelectorAll('.editable-label').forEach(el => el.removeAttribute('readonly'));
    } else {
        document.body.classList.remove('edit-mode');
        document.querySelectorAll('.editable-label').forEach(el => el.setAttribute('readonly', 'readonly'));
        syncAttributesFromDOM();
    }
}

// --- STATE MANAGEMENT ---
function getStateObject() {
    syncAttributesFromDOM();
    const state = {};
    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => {
        if (el.id && !el.id.startsWith('label-skill-') && !el.id.startsWith('prof-') && !el.id.startsWith('auto-attr-') && !el.id.startsWith('mod-attr-') && !el.id.startsWith('val-attr-') && !el.id.startsWith('label-attr-') && !el.id.startsWith('hud-')) {
            state[el.id] = el.value;
        }
    });
    
    state['primaryColor'] = document.getElementById('primary-color').value;
    state['guardioesAttributesData'] = attributesData;
    
    const portrait = document.getElementById('char-portrait');
    if(portrait && portrait.src) state['charPortrait'] = portrait.src;
    
    const scratchpad = document.getElementById('scratchpad-text');
    if(scratchpad) state['scratchpad'] = scratchpad.value;
    
    return state;
}

function saveStateSilent() {
    const state = getStateObject();
    localStorage.setItem('guardioesRPGState', JSON.stringify(state));
}

function saveState() {
    saveStateSilent();
    showToast('Ficha salva localmente no navegador!', 'success');
}

function loadState(providedState = null) {
    let state = providedState;
    if (!state) {
        const saved = localStorage.getItem('guardioesRPGState');
        if (saved) state = JSON.parse(saved);
    }
    
    if (state) {
        for (const key in state) {
            if (key !== 'guardioesAttributesData' && key !== 'primaryColor' && key !== 'charPortrait' && key !== 'scratchpad') {
                const el = document.getElementById(key);
                if (el) el.value = state[key];
            }
        }
        if (state.primaryColor) {
            const cp = document.getElementById('primary-color');
            if(cp) {
                cp.value = state.primaryColor;
                cp.dispatchEvent(new Event('input'));
            }
        }
        if (state.charPortrait) {
            const p = document.getElementById('char-portrait');
            if(p) p.src = state.charPortrait;
        }
        if (state.scratchpad) {
            const sp = document.getElementById('scratchpad-text');
            if(sp) sp.value = state.scratchpad;
        }
        // Update HUD to match loaded stats
        ['hp', 'pp', 'mp'].forEach(stat => {
            const hudCurr = document.getElementById(`hud-${stat}-curr`);
            const statCurr = document.getElementById(`stat-${stat}-curr`);
            if(hudCurr && statCurr) hudCurr.value = statCurr.value;
        });
    }
}

// --- EXPORT/IMPORT ---
function exportJSON() {
    const state = getStateObject();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    const charName = document.getElementById('perfil-nome').value || "personagem";
    dlAnchorElem.setAttribute("download", `ficha_${charName}.json`);
    dlAnchorElem.click();
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const state = JSON.parse(e.target.result);
            loadAttributesStructure(state);
            buildAttributesUI();
            loadState(state);
            calculateAll();
            showToast('Ficha carregada do arquivo!', 'success');
        } catch (err) {
            alert('Erro ao ler o arquivo JSON.');
        }
    };
    reader.readAsText(file);
}

// --- SHARING LINKS ---
function generateShareLink() {
    const state = getStateObject();
    const jsonStr = JSON.stringify(state);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    const shareUrl = window.location.origin + window.location.pathname + '#data=' + compressed;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Link Mágico copiado! Cole no Discord ou WhatsApp.', 'success');
    }).catch(err => {
        console.error(err);
        alert('Erro ao copiar. Seu navegador pode ter bloqueado.');
    });
}

function copyClipboard() {
    const state = getStateObject();
    const jsonStr = JSON.stringify(state);
    navigator.clipboard.writeText(jsonStr).then(() => {
        showToast('Dados da ficha copiados!', 'success');
    }).catch(err => {
        console.error(err);
        alert('Erro ao copiar dados.');
    });
}

async function pasteClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        if (!text) return;
        const state = JSON.parse(text);
        loadAttributesStructure(state);
        buildAttributesUI();
        loadState(state);
        calculateAll();
        showToast('Ficha colada com sucesso!', 'success');
    } catch (err) {
        console.error(err);
        alert('O texto copiado não é uma ficha válida.');
    }
}
