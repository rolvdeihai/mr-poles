// prices.js - Complete rewrite with custom items
import * as api from './api.js';

// Pagination variables
let currentPricePage = 1;
const pricesPerPage = 10;
let filteredPrices = [];
let allPrices = {};

document.addEventListener('DOMContentLoaded', async function() {
    await loadPrices();
    setupEventListeners();
});

async function loadPrices() {
    try {
        const prices = await api.getPrices();
        allPrices = prices;
        renderPricesTable(prices);
    } catch (error) {
        alert('Failed to load prices. Please try again later.');
    }
}

function renderPricesTable(prices) {
    const tableBody = document.getElementById('pricesTableBody');
    tableBody.innerHTML = '';
    
    // Convert prices to array for filtering/pagination
    const priceEntries = Object.entries(prices);
    filteredPrices = priceEntries;
    
    // Calculate pagination
    const startIndex = (currentPricePage - 1) * pricesPerPage;
    const endIndex = startIndex + pricesPerPage;
    const currentPagePrices = priceEntries.slice(startIndex, endIndex);
    
    // Update page info
    document.getElementById('pricePageInfo').textContent = 
        `Page ${currentPricePage} of ${Math.ceil(priceEntries.length / pricesPerPage)}`;
    
    // Render current page
    currentPagePrices.forEach(([panelId, priceData]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${panelId}</td>
            <td><input type="text" class="price-name" value="${priceData.name}" data-panel="${panelId}"></td>
            <td><input type="number" class="price-input normal-price" value="${priceData.normal}" min="0" data-panel="${panelId}"></td>
            <td><input type="number" class="price-input medium-price" value="${priceData.medium}" min="0" data-panel="${panelId}"></td>
            <td><input type="number" class="price-input premium-price" value="${priceData.premium}" min="0" data-panel="${panelId}"></td>
            <td>
                <button class="btn-delete" data-panel="${panelId}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function setupEventListeners() {
    // Save all prices
    document.getElementById('savePricesBtn').addEventListener('click', saveAllPrices);
    
    // Add new price button
    document.getElementById('addNewPriceBtn').addEventListener('click', () => {
        document.getElementById('addPriceModal').style.display = 'block';
    });
    
    // Confirm add new price
    document.getElementById('confirmAddPrice').addEventListener('click', addNewPrice);
    
    // Close modal
    document.querySelector('.close-btn').addEventListener('click', () => {
        document.getElementById('addPriceModal').style.display = 'none';
    });
    
    // Delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-delete')) {
            const panelId = e.target.dataset.panel;
            deletePrice(panelId, e.target); // Pass button reference
        }
    });
    
    // Price search functionality
    document.getElementById('priceSearchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        
        if (!term) {
            filteredPrices = Object.entries(allPrices);
        } else {
            filteredPrices = Object.entries(allPrices).filter(([id, data]) => 
                id.toLowerCase().includes(term) || 
                data.name.toLowerCase().includes(term)
            );
        }
        
        currentPricePage = 1;
        updatePriceTable();
    });
    
    // Price pagination
    document.getElementById('pricePrevBtn').addEventListener('click', () => {
        if (currentPricePage > 1) {
            currentPricePage--;
            updatePriceTable();
        }
    });
    
    document.getElementById('priceNextBtn').addEventListener('click', () => {
        const maxPage = Math.ceil(filteredPrices.length / pricesPerPage);
        if (currentPricePage < maxPage) {
            currentPricePage++;
            updatePriceTable();
        }
    });
}

function updatePriceTable() {
    const tableBody = document.getElementById('pricesTableBody');
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPricePage - 1) * pricesPerPage;
    const endIndex = startIndex + pricesPerPage;
    const currentPagePrices = filteredPrices.slice(startIndex, endIndex);
    
    // Update page info
    document.getElementById('pricePageInfo').textContent = 
        `Page ${currentPricePage} of ${Math.ceil(filteredPrices.length / pricesPerPage)}`;
    
    // Render current page
    currentPagePrices.forEach(([panelId, priceData]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${panelId}</td>
            <td><input type="text" class="price-name" value="${priceData.name}" data-panel="${panelId}"></td>
            <td><input type="number" class="price-input normal-price" value="${priceData.normal}" min="0" data-panel="${panelId}"></td>
            <td><input type="number" class="price-input medium-price" value="${priceData.medium}" min="0" data-panel="${panelId}"></td>
            <td><input type="number" class="price-input premium-price" value="${priceData.premium}" min="0" data-panel="${panelId}"></td>
            <td>
                <button class="btn-delete" data-panel="${panelId}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function saveAllPrices() {
    const saveBtn = document.getElementById('savePricesBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const prices = {};
        const rows = document.querySelectorAll('#pricesTableBody tr');

        for (const row of rows) {
            const panelId = row.querySelector('td:first-child').textContent;
            const name = row.querySelector('.price-name').value;
            const normal = parseFloat(row.querySelector('.normal-price').value) || 0;
            const medium = parseFloat(row.querySelector('.medium-price').value) || 0;
            const premium = parseFloat(row.querySelector('.premium-price').value) || 0;

            prices[panelId] = {
                name,
                normal,
                medium,
                premium
            };
        }

        await api.savePrices(prices);
        allPrices = prices; // Update our local copy
        alert('Prices saved successfully!');
    } catch (error) {
        alert('Failed to save prices. Please try again.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save All Prices';
    }
}

async function addNewPrice() {
    const name = document.getElementById('newItemName').value.trim();
    const normal = parseFloat(document.getElementById('newNormalPrice').value) || 0;
    const medium = parseFloat(document.getElementById('newMediumPrice').value) || 0;
    const premium = parseFloat(document.getElementById('newPremiumPrice').value) || 0;

    if (!name) {
        alert('Please enter an Item Name');
        return;
    }

    const addBtn = document.getElementById('confirmAddPrice');
    addBtn.disabled = true;
    addBtn.textContent = 'Adding...';

    try {
        const currentPrices = {...allPrices}; // Clone current prices
        
        // Generate a unique ID (using timestamp)
        const newId = (Object.keys(currentPrices).length + 1).toString();
        currentPrices[newId] = { name, normal, medium, premium };

        await api.savePrices(currentPrices);
        allPrices = currentPrices; // Update our local copy
        
        document.getElementById('newItemName').value = '';
        document.getElementById('addPriceModal').style.display = 'none';
        
        // Reset pagination and filtering
        filteredPrices = Object.entries(allPrices);
        currentPricePage = Math.ceil(filteredPrices.length / pricesPerPage);
        updatePriceTable();
    } catch (error) {
        alert('Failed to add new price item. Please try again.');
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'Add Item';
    }
}

async function deletePrice(panelId, buttonElement) {
    const numericId = parseInt(panelId);
    if (!isNaN(numericId) && numericId >= 1 && numericId <= 17) {
        alert(`Cannot delete panel ID "${panelId}" - This is a protected default panel.`);
        return;
    }

    if (!confirm(`Are you sure you want to delete panel ID "${panelId}"?`)) return;

    buttonElement.disabled = true;
    buttonElement.textContent = 'Deleting...';

    try {
        const prices = {...allPrices}; // Clone current prices
        delete prices[panelId];
        await api.savePrices(prices);
        allPrices = prices; // Update our local copy
        
        // Reset pagination and filtering
        filteredPrices = Object.entries(allPrices);
        currentPricePage = 1;
        updatePriceTable();
        
        alert('Item deleted successfully!');
    } catch (error) {
        alert('Failed to delete item. Please try again.');
    } finally {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Delete';
    }
}