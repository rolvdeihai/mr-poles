import * as api from './api.js';
// index.js
let selectedPanels = [];
const panelNames = {
    'bonnet': 'BONNET (1)',
    'roof': 'ROOF (2)', 
    'back-door': 'BACK DOOR (3)',
    'lf-fender': 'LF FENDER (4)',
    'lf-door': 'LF DOOR (5)',
    'lr-door': 'LR DOOR (6)',
    'lr-fender': 'LR FENDER (7)',
    'rf-fender': 'RF FENDER (8)',
    'rf-door': 'RF DOOR (9)',
    'rr-door': 'RR DOOR (10)',
    'rr-fender': 'RR FENDER (11)',
    'front-bumper': 'FRONT BUMPER (12)',
    'rear-bumper': 'REAR BUMPER (13)',
    'l-trisplang': '(L) TRISPLANG (14)',
    'r-trisplang': '(R) TRISPLANG (15)',
    'l-panel-roof': '(L) PANEL ROOF (16)',
    'r-panel-roof': '(R) PANEL ROOF (17)'
};

// Expose functions to global scope
window.selectPanel = function(panelId) {
    const panelBtn = document.querySelector(`[data-panel="${panelId}"]`);
    if (!panelBtn) return;
    const index = selectedPanels.indexOf(panelId);
    if (index === -1) {
        selectedPanels.push(panelId);
        panelBtn.classList.add('selected');
    } else {
        selectedPanels.splice(index, 1);
        panelBtn.classList.remove('selected');
    }
    updateSelectedPanelsList();
    sessionStorage.setItem('selectedPanels', JSON.stringify(selectedPanels));
};

window.createEstimate = function() {
    if (selectedPanels.length === 0) {
        alert('Pilih panel terlebih dahulu!');
        return;
    }
    sessionStorage.setItem('pendingEstimatePanels', JSON.stringify(selectedPanels));
    window.location.href = 'estimate.html';
};

window.createInvoice = function() {
    if (selectedPanels.length === 0) {
        alert('Pilih panel terlebih dahulu!');
        return;
    }
    sessionStorage.setItem('pendingInvoicePanels', JSON.stringify(selectedPanels));
    window.location.href = 'invoice.html';
};

window.resetSelectedPanels = function() {
    selectedPanels = [];
    sessionStorage.removeItem('selectedPanels');
    updateSelectedPanelsList();
    document.querySelectorAll('.panel-btn.selected').forEach(btn => btn.classList.remove('selected'));
};

function updateSelectedPanelsList() {
    const listElement = document.getElementById('selectedPanelsList');
    const actionButtons = document.getElementById('actionButtons');
    if (!listElement) return;
    if (selectedPanels.length === 0) {
        listElement.innerHTML = '<p>Belum ada panel yang dipilih</p>';
        if (actionButtons) actionButtons.style.display = 'none';
    } else {
        const panelList = selectedPanels.map(panelId => 
            `<span class="selected-panel">${panelNames[panelId]}</span>`
        ).join(', ');
        listElement.innerHTML = panelList;
        if (actionButtons) actionButtons.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    selectedPanels = JSON.parse(sessionStorage.getItem('selectedPanels')) || [];
    const pendingEstimate = sessionStorage.getItem('pendingEstimatePanels');
    if (pendingEstimate) {
        selectedPanels = JSON.parse(pendingEstimate);
        sessionStorage.removeItem('pendingEstimatePanels');
    }
    updateSelectedPanelsList();
    selectedPanels.forEach(panelId => {
        const panelBtn = document.querySelector(`[data-panel="${panelId}"]`);
        if (panelBtn) panelBtn.classList.add('selected');
    });
});