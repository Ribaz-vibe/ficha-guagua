let attributesData = [
    { id: 'forca', name: 'Força', autoCalc: true, skills: [{name:'Atletismo', prof:0}, {name:'Agarrar', prof:0}, {name:'Impacto', prof:0}] },
    { id: 'destreza', name: 'Destreza', autoCalc: true, skills: [{name:'Acrobacia', prof:0}, {name:'Esquiva', prof:0}, {name:'Furtividade', prof:0}, {name:'Iniciativa', prof:0}, {name:'Roubo', prof:0}] },
    { id: 'vigor', name: 'Vigor', autoCalc: true, skills: [{name:'Fôlego', prof:0}] },
    { id: 'inteligencia', name: 'Inteligência', autoCalc: true, skills: [{name:'Arcanismo', prof:0}, {name:'Tecnologia', prof:0}, {name:'História', prof:0}, {name:'Idioma', prof:0}, {name:'Intuição', prof:0}, {name:'Investigação', prof:0}, {name:'Manutenção', prof:0}, {name:'Medicina', prof:0}, {name:'Pilotagem', prof:0}, {name:'Procurar', prof:0}, {name:'Sobrevivência', prof:0}] },
    { id: 'sabedoria', name: 'Sabedoria', autoCalc: true, skills: [{name:'Adestrar animais', prof:0}, {name:'Astronomia', prof:0}, {name:'Diplomacia', prof:0}, {name:'Montaria', prof:0}, {name:'Percepção', prof:0}] },
    { id: 'carisma', name: 'Carisma', autoCalc: true, skills: [{name:'Barganha', prof:0}, {name:'Encanto', prof:0}, {name:'Enganação', prof:0}, {name:'Intimidação', prof:0}, {name:'Lábia', prof:0}, {name:'Performance', prof:0}, {name:'Persuasão', prof:0}] },
    { id: 'poder', name: 'Poder', autoCalc: true, skills: [{name:'Exorcismo', prof:0}, {name:'Forçar conjuração', prof:0}, {name:'Rituais', prof:0}] },
    { id: 'alma', name: 'Alma', autoCalc: true, skills: [{name:'Comunhão Espiritual', prof:0}, {name:'Contra possessão', prof:0}, {name:'Leitura da Essência', prof:0}] },
    { id: 'sorte', name: 'Sorte', autoCalc: true, skills: [{name:'Evitar Maldição', prof:0}, {name:'Objetivo impossível', prof:0}, {name:'Recompensa', prof:0}, {name:'Sorte no Caos', prof:0}] }
];

let editMode = false;

document.addEventListener('DOMContentLoaded', () => {
    loadAttributesStructure();
    buildAttributesUI();
    setupEventListeners();
    
    // Check for compressed data in URL
    if (window.location.hash && window.location.hash.startsWith('#data=')) {
        try {
            const compressed = window.location.hash.substring(6);
            const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
            if (jsonStr) {
                const state = JSON.parse(jsonStr);
                loadAttributesStructure(state);
                loadState(state);
                alert('Ficha carregada a partir do link!');
                window.location.hash = ''; // Clear hash so refresh doesn't reload it
            }
        } catch (e) {
            console.error('Failed to parse URL data:', e);
        }
    } else {
        loadState();
    }
    
    calculateAll();
});

function loadAttributesStructure(savedState = null) {
    let state = savedState;
    if (!state) {
        const saved = localStorage.getItem('guardioesFicha');
        if (saved) state = JSON.parse(saved);
    }
    if (state && state['guardioesAttributesData']) {
        attributesData = state['guardioesAttributesData'];
    }
}

function syncAttributesFromDOM() {
    attributesData.forEach(attr => {
        const nameInput = document.getElementById(`label-attr-${attr.id}`);
        if (nameInput) attr.name = nameInput.value;
        
        const autoCb = document.getElementById(`auto-attr-${attr.id}`);
        if (autoCb) attr.autoCalc = autoCb.checked;

        const skillItems = document.querySelectorAll(`.skill-item[data-attr="${attr.id}"]`);
        attr.skills = [];
        skillItems.forEach((item, index) => {
            const skillId = `${attr.id}-${index}`;
            const labelInput = document.getElementById(`label-skill-${skillId}`);
            const profInput = document.getElementById(`prof-${skillId}`);
            if (labelInput && profInput) {
                attr.skills.push({
                    name: labelInput.value,
                    prof: parseInt(profInput.value) || 0
                });
            }
        });
    });
}

window.addSkill = function(attrId) {
    syncAttributesFromDOM();
    const attr = attributesData.find(a => a.id === attrId);
    if (attr) {
        attr.skills.push({ name: 'Nova Perícia', prof: 0 });
        buildAttributesUI();
        calculateAll();
    }
};

window.removeSkill = function(attrId, index) {
    syncAttributesFromDOM();
    const attr = attributesData.find(a => a.id === attrId);
    if (attr && attr.skills.length > index) {
        attr.skills.splice(index, 1);
        buildAttributesUI();
        calculateAll();
    }
};

function buildAttributesUI() {
    const container = document.getElementById('attributes-container');
    container.innerHTML = '';

    attributesData.forEach(attr => {
        const block = document.createElement('div');
        block.className = 'attr-block';
        
        let skillsHtml = attr.skills.map((skill, index) => {
            const skillId = `${attr.id}-${index}`;
            return `
                <div class="skill-item" data-attr="${attr.id}">
                    <input type="number" class="value-input skill-prof calc-trigger" id="prof-${skillId}" value="${skill.prof}" title="Bônus da Perícia">
                    <input type="text" class="${editMode ? 'editable-label' : 'skill-name'} skill-name" id="label-skill-${skillId}" value="${skill.name}" ${editMode ? '' : 'readonly'}>
                    <span class="skill-total" id="tot-${skillId}">+0</span>
                    <button class="del-skill-btn no-print" onclick="removeSkill('${attr.id}', ${index})" title="Remover Perícia">❌</button>
                </div>
            `;
        }).join('');

        block.innerHTML = `
            <div class="attr-header">
                <input type="text" class="editable-label" id="label-attr-${attr.id}" value="${attr.name}" ${editMode ? '' : 'readonly'}>
                <div class="attr-score">
                    <input type="number" class="value-input attr-val calc-trigger" id="val-attr-${attr.id}" value="10" title="Valor do Atributo">
                    <div class="mod-wrapper">
                        <label class="auto-calc-lbl no-print"><input type="checkbox" class="auto-calc-cb calc-trigger" id="auto-attr-${attr.id}" ${attr.autoCalc !== false ? 'checked' : ''}> Auto</label>
                        <input type="number" class="value-input attr-mod calc-trigger" id="mod-attr-${attr.id}" value="0" title="Modificador">
                    </div>
                </div>
            </div>
            <div class="skill-list">
                ${skillsHtml}
                <button class="add-skill-btn no-print" onclick="addSkill('${attr.id}')">➕ Adicionar Perícia</button>
            </div>
        `;
        container.appendChild(block);
    });
}

function setupEventListeners() {
    // Tabs Logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            e.currentTarget.classList.add('active');
            const targetId = e.currentTarget.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Edit Mode Toggle
    const btnEdit = document.getElementById('btn-edit-mode');
    btnEdit.addEventListener('click', () => {
        editMode = !editMode;
        document.body.classList.toggle('edit-mode', editMode);
        btnEdit.innerText = editMode ? '🛡️ Modo Edição: ON' : '🛡️ Modo Edição: OFF';
        btnEdit.style.backgroundColor = editMode ? 'var(--primary-color)' : '';
        btnEdit.style.color = editMode ? '#fff' : '';
        
        syncAttributesFromDOM();
        buildAttributesUI();
        calculateAll();
        
        // Handle all other editable labels outside of dynamic attributes
        document.querySelectorAll('.panel-header .editable-label, .field .editable-label, .stat-label, .sheet-header .editable-label, .wallet-item .editable-label, .slot-field .editable-label, .inventory-box .editable-label').forEach(input => {
            if (editMode) {
                input.removeAttribute('readonly');
            } else {
                input.setAttribute('readonly', 'true');
            }
        });
    });

    // Calculations Triggers
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('calc-trigger')) {
            calculateAll();
        }
    });

    // Color Picker
    const colorPicker = document.getElementById('primary-color');
    colorPicker.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--primary-color', e.target.value);
    });

    // Save and Export
    document.getElementById('btn-save').addEventListener('click', saveState);
    document.getElementById('btn-export-pdf').addEventListener('click', () => window.print());
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);
    
    // New Sharing / Clipboard features
    const btnShare = document.getElementById('btn-share-link');
    if (btnShare) btnShare.addEventListener('click', generateShareLink);
    
    const btnCopy = document.getElementById('btn-copy-clipboard');
    if (btnCopy) btnCopy.addEventListener('click', copyClipboard);
    
    const btnPaste = document.getElementById('btn-paste-clipboard');
    if (btnPaste) btnPaste.addEventListener('click', pasteClipboard);
    
    // Load JSON
    document.getElementById('file-upload').addEventListener('change', importJSON);
}

function calculateAll() {
    // 1. Calculate Attributes and Skills
    attributesData.forEach(attr => {
        const attrValInput = document.getElementById(`val-attr-${attr.id}`);
        const attrVal = parseInt(attrValInput?.value) || 0;
        
        const autoCb = document.getElementById(`auto-attr-${attr.id}`);
        const modInput = document.getElementById(`mod-attr-${attr.id}`);
        
        let modifier = 0;
        if (autoCb && autoCb.checked) {
            modifier = Math.floor((attrVal - 10) / 2);
            if (modInput) {
                modInput.value = modifier;
                modInput.readOnly = true;
            }
        } else {
            if (modInput) {
                modInput.readOnly = false;
                modifier = parseInt(modInput.value) || 0;
            }
        }

        // Only iterate on the DOM elements to calculate totals visually
        const skillItems = document.querySelectorAll(`.skill-item[data-attr="${attr.id}"]`);
        skillItems.forEach((item, index) => {
            const skillId = `${attr.id}-${index}`;
            const profInput = document.getElementById(`prof-${skillId}`);
            const profVal = parseInt(profInput?.value) || 0;
            
            const total = modifier + profVal;
            const totalSpan = document.getElementById(`tot-${skillId}`);
            if (totalSpan) {
                totalSpan.innerText = total >= 0 ? `+${total}` : total;
            }
        });
    });

    // 2. Calculate Encumbrance
    const forcaVal = parseInt(document.getElementById('val-attr-forca')?.value) || 0;
    const vigorVal = parseInt(document.getElementById('val-attr-vigor')?.value) || 0;
    const maxCarga = 5 + forcaVal + vigorVal;
    
    const maxCargaSpan = document.getElementById('calc-carga-max');
    if (maxCargaSpan) {
        maxCargaSpan.innerText = maxCarga;
    }
}

function saveState() {
    syncAttributesFromDOM();
    const state = {};
    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => {
        // Skip dynamically created attribute fields from flat state to avoid conflicts
        if (el.id && !el.id.startsWith('label-skill-') && !el.id.startsWith('prof-') && !el.id.startsWith('auto-attr-') && !el.id.startsWith('mod-attr-') && !el.id.startsWith('val-attr-') && !el.id.startsWith('label-attr-')) {
            state[el.id] = el.value;
        }
    });
    
    // Save attribute values along with structure
    attributesData.forEach(attr => {
        const valInput = document.getElementById(`val-attr-${attr.id}`);
        if (valInput) attr.value = parseInt(valInput.value) || 0;
        
        const modInput = document.getElementById(`mod-attr-${attr.id}`);
        if (modInput) attr.modifier = parseInt(modInput.value) || 0;
    });

    state['primaryColor'] = document.getElementById('primary-color').value;
    state['guardioesAttributesData'] = attributesData;

    localStorage.setItem('guardioesFicha', JSON.stringify(state));
    alert('Ficha salva localmente no navegador!');
}

function loadState(stateObj = null) {
    let state = stateObj;
    if (!state) {
        const saved = localStorage.getItem('guardioesFicha');
        if (saved) state = JSON.parse(saved);
    }

    if (state) {
        Object.keys(state).forEach(key => {
            if (key === 'primaryColor') {
                const color = state[key];
                document.getElementById('primary-color').value = color;
                document.documentElement.style.setProperty('--primary-color', color);
            } else if (key !== 'guardioesAttributesData') {
                const el = document.getElementById(key);
                if (el) el.value = state[key];
            }
        });
        
        if (state['guardioesAttributesData']) {
            attributesData = state['guardioesAttributesData'];
            buildAttributesUI();
            
            // Populate attribute numeric values since they are not in the flat loop
            attributesData.forEach(attr => {
                const valInput = document.getElementById(`val-attr-${attr.id}`);
                if (valInput && attr.value !== undefined) valInput.value = attr.value;
                
                const modInput = document.getElementById(`mod-attr-${attr.id}`);
                if (modInput && attr.modifier !== undefined) modInput.value = attr.modifier;
            });
        }
        
        calculateAll();
    }
}

function exportJSON() {
    syncAttributesFromDOM();
    const state = {};
    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => {
        if (el.id && !el.id.startsWith('label-skill-') && !el.id.startsWith('prof-') && !el.id.startsWith('auto-attr-') && !el.id.startsWith('mod-attr-') && !el.id.startsWith('val-attr-') && !el.id.startsWith('label-attr-')) {
            state[el.id] = el.value;
        }
    });
    
    attributesData.forEach(attr => {
        const valInput = document.getElementById(`val-attr-${attr.id}`);
        if (valInput) attr.value = parseInt(valInput.value) || 0;
        const modInput = document.getElementById(`mod-attr-${attr.id}`);
        if (modInput) attr.modifier = parseInt(modInput.value) || 0;
    });

    state['primaryColor'] = document.getElementById('primary-color').value;
    state['guardioesAttributesData'] = attributesData;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    
    const charName = document.getElementById('perfil-nome').value || 'Personagem';
    downloadAnchorNode.setAttribute("download", `Ficha_${charName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const state = JSON.parse(e.target.result);
            loadAttributesStructure(state);
            loadState(state);
            alert('Ficha carregada com sucesso!');
        } catch (err) {
            alert('Erro ao ler o arquivo JSON.');
        }
    };
    reader.readAsText(file);
}

// --- NEW SHARING FUNCTIONS ---

function getStateObject() {
    syncAttributesFromDOM();
    const state = {};
    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => {
        if (el.id && !el.id.startsWith('label-skill-') && !el.id.startsWith('prof-') && !el.id.startsWith('auto-attr-') && !el.id.startsWith('mod-attr-') && !el.id.startsWith('val-attr-') && !el.id.startsWith('label-attr-')) {
            state[el.id] = el.value;
        }
    });
    
    attributesData.forEach(attr => {
        const valInput = document.getElementById(`val-attr-${attr.id}`);
        if (valInput) attr.value = parseInt(valInput.value) || 0;
        const modInput = document.getElementById(`mod-attr-${attr.id}`);
        if (modInput) attr.modifier = parseInt(modInput.value) || 0;
    });

    state['primaryColor'] = document.getElementById('primary-color').value;
    state['guardioesAttributesData'] = attributesData;
    return state;
}

function generateShareLink() {
    const state = getStateObject();
    const jsonStr = JSON.stringify(state);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    const shareUrl = window.location.origin + window.location.pathname + '#data=' + compressed;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link Mágico copiado para a área de transferência!\n\nCole no Discord ou WhatsApp para compartilhar sua ficha atualizada.');
    }).catch(err => {
        console.error('Erro ao copiar link:', err);
        alert('Não foi possível copiar o link automaticamente. Veja o console.');
    });
}

function copyClipboard() {
    const state = getStateObject();
    const jsonStr = JSON.stringify(state);
    
    navigator.clipboard.writeText(jsonStr).then(() => {
        alert('Dados da Ficha copiados! (Texto JSON)\n\nAgora seu mestre pode usar o botão "Colar Dados" com isso.');
    }).catch(err => {
        console.error('Erro ao copiar dados:', err);
        alert('Erro ao copiar dados.');
    });
}

async function pasteClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        if (!text) {
            alert('A área de transferência está vazia.');
            return;
        }
        
        const state = JSON.parse(text);
        loadAttributesStructure(state);
        loadState(state);
        alert('Ficha importada com sucesso da área de transferência!');
    } catch (err) {
        console.error('Erro ao colar:', err);
        alert('O texto na área de transferência não é um formato de ficha válido.');
    }
}
