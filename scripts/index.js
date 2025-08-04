import * as api from './api.js';
// index.js
let selectedPanels = [];
const panelNames = {
    'bonnet': 'BONNET (HOOD)',
    'roof': 'ROOF', 
    'back-door': 'BACK DOOR',
    'lf-fender': 'LF FENDER',
    'lf-door': 'LF DOOR',
    'lr-door': 'LR DOOR',
    'lr-fender': 'LR FENDER',
    'rf-fender': 'RF FENDER',
    'rf-door': 'RF DOOR',
    'rr-door': 'RR DOOR',
    'rr-fender': 'RR FENDER',
    'front-bumper': 'FRONT BUMPER',
    'rear-bumper': 'REAR BUMPER',
    'l-trisplang': 'L TRISPLANG',
    'r-trisplang': 'R TRISPLANG',
    'l-panel-roof': 'L PANEL ROOF',
    'r-panel-roof': 'R PANEL ROOF'
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
    sessionStorage.setItem('pendingEstimatePanels', JSON.stringify(selectedPanels));
    window.location.href = 'estimate.html';
};

window.createInvoice = function() {
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
        if (actionButtons) actionButtons.style.display = 'block';
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