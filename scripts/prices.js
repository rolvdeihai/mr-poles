import * as api from './api.js';

// Pagination variables
let currentPricePage = 1;
const pricesPerPage = 10;
let filteredPrices = [];
let allPrices = {};

// Function to format price according to Indonesian locale
function formatPrice(price) {
    const num = parseInt(price) || 0;
    return num.toLocaleString('id-ID');
}

// Function to add event listeners to price inputs for formatting
function addPriceInputListeners(input) {
    input.addEventListener('blur', function(e) {
        const rawValue = this.value.replace(/\D/g, '');
        const num = parseInt(rawValue) || 0;
        this.dataset.rawValue = num;
        this.value = formatPrice(num);
    });
    
    input.addEventListener('input', function(e) {
        const rawValue = this.value.replace(/\D/g, '');
        this.dataset.rawValue = rawValue;
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    await loadPrices();
    setupEventListeners();
});

async function loadPrices() {
    try {
        console.log('Loading prices from Supabase...');
        const prices = await api.getPrices();
        console.log('Prices loaded:', Object.keys(prices).length, 'items');
        allPrices = prices;
        renderPricesTable(prices);
    } catch (error) {
        console.error('Failed to load prices:', error);
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
    
    // Update button states
    document.getElementById('pricePrevBtn').disabled = currentPricePage <= 1;
    document.getElementById('priceNextBtn').disabled = currentPricePage >= Math.ceil(priceEntries.length / pricesPerPage);
    
    // Render current page with formatted prices
    currentPagePrices.forEach(([panelId, priceData]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${panelId}</td>
            <td><input type="text" class="price-name" value="${priceData.name}" data-panel="${panelId}"></td>
            <td><input type="text" class="price-input normal-price" data-raw-value="${priceData.normal}" value="${formatPrice(priceData.normal)}" data-panel="${panelId}"></td>
            <td><input type="text" class="price-input medium-price" data-raw-value="${priceData.medium}" value="${formatPrice(priceData.medium)}" data-panel="${panelId}"></td>
            <td><input type="text" class="price-input premium-price" data-raw-value="${priceData.premium}" value="${formatPrice(priceData.premium)}" data-panel="${panelId}"></td>
            <td>
                <button class="btn-delete" data-panel="${panelId}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Attach listeners to price inputs
    document.querySelectorAll('.price-input').forEach(input => {
        addPriceInputListeners(input);
    });
}

function setupEventListeners() {
    // Save all prices (for bulk updates)
    document.getElementById('savePricesBtn').addEventListener('click', saveAllPrices);
    
    // Add new price button
    document.getElementById('addNewPriceBtn').addEventListener('click', () => {
        document.getElementById('addPriceModal').style.display = 'block';
        // Reset form
        document.getElementById('newItemName').value = '';
        document.getElementById('newNormalPrice').value = '0';
        document.getElementById('newMediumPrice').value = '0';
        document.getElementById('newPremiumPrice').value = '0';
    });
    
    // Confirm add new price
    document.getElementById('confirmAddPrice').addEventListener('click', addNewPrice);
    
    // Close modal
    document.querySelector('.close-btn').addEventListener('click', () => {
        document.getElementById('addPriceModal').style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('addPriceModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-delete')) {
            const panelId = e.target.dataset.panel;
            deletePrice(panelId, e.target);
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
                (data.name && data.name.toLowerCase().includes(term))
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
    
    // Allow Enter key to add price in modal
    document.getElementById('newItemName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewPrice();
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
    const totalPages = Math.max(1, Math.ceil(filteredPrices.length / pricesPerPage));
    document.getElementById('pricePageInfo').textContent = 
        `Page ${currentPricePage} of ${totalPages}`;
    
    // Update button states
    document.getElementById('pricePrevBtn').disabled = currentPricePage <= 1;
    document.getElementById('priceNextBtn').disabled = currentPricePage >= totalPages;
    
    // Render current page with formatted prices
    currentPagePrices.forEach(([panelId, priceData]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${panelId}</td>
            <td><input type="text" class="price-name" value="${priceData.name || ''}" data-panel="${panelId}"></td>
            <td><input type="text" class="price-input normal-price" data-raw-value="${priceData.normal || 0}" value="${formatPrice(priceData.normal || 0)}" data-panel="${panelId}"></td>
            <td><input type="text" class="price-input medium-price" data-raw-value="${priceData.medium || 0}" value="${formatPrice(priceData.medium || 0)}" data-panel="${panelId}"></td>
            <td><input type="text" class="price-input premium-price" data-raw-value="${priceData.premium || 0}" value="${formatPrice(priceData.premium || 0)}" data-panel="${panelId}"></td>
            <td>
                <button class="btn-delete" data-panel="${panelId}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Attach listeners to price inputs
    document.querySelectorAll('.price-input').forEach(input => {
        addPriceInputListeners(input);
    });
}

// This function is for bulk saving ALL prices (use when editing multiple prices at once)
async function saveAllPrices() {
    const saveBtn = document.getElementById('savePricesBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const prices = {};
        const rows = document.querySelectorAll('#pricesTableBody tr');

        for (const row of rows) {
            const panelId = row.querySelector('td:first-child').textContent;
            const name = row.querySelector('.price-name').value;
            const normalInput = row.querySelector('.normal-price');
            const mediumInput = row.querySelector('.medium-price');
            const premiumInput = row.querySelector('.premium-price');
            
            const normal = parseInt(normalInput.dataset.rawValue) || 0;
            const medium = parseInt(mediumInput.dataset.rawValue) || 0;
            const premium = parseInt(premiumInput.dataset.rawValue) || 0;

            prices[panelId] = {
                name,
                normal,
                medium,
                premium
            };
        }

        console.log('Saving all prices to Supabase:', Object.keys(prices).length, 'items');
        await api.savePrices(prices);
        allPrices = prices; // Update our local copy
        alert('All prices saved successfully!');
    } catch (error) {
        console.error('Error saving all prices:', error);
        alert('Failed to save prices. Please try again. Error: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// This function is for adding a SINGLE new price
async function addNewPrice() {
    const name = document.getElementById('newItemName').value.trim();
    const normal = parseInt(document.getElementById('newNormalPrice').value) || 0;
    const medium = parseInt(document.getElementById('newMediumPrice').value) || 0;
    const premium = parseInt(document.getElementById('newPremiumPrice').value) || 0;

    if (!name) {
        alert('Please enter an Item Name');
        return;
    }

    const addBtn = document.getElementById('confirmAddPrice');
    addBtn.disabled = true;
    addBtn.textContent = 'Adding...';

    try {
        // Generate a sequential numeric ID
        let maxId = 0;
        Object.keys(allPrices).forEach(id => {
            const num = parseInt(id);
            if (!isNaN(num) && num > maxId) maxId = num;
        });
        const newId = (maxId + 1).toString();

        // Create new price object
        const newPrice = {
            panelId: newId,
            name: name,
            normal: normal,
            medium: medium,
            premium: premium
        };

        console.log('Adding new price:', newPrice);
        
        // USE addPrice NOT savePrices!
        const result = await api.addPrice(newPrice);
        
        if (result.success) {
            // Update local copy
            allPrices[newId] = { name, normal, medium, premium };

            // Clear form and close modal
            document.getElementById('newItemName').value = '';
            document.getElementById('addPriceModal').style.display = 'none';

            // Reset pagination and filtering
            filteredPrices = Object.entries(allPrices);
            currentPricePage = Math.ceil(filteredPrices.length / pricesPerPage);
            updatePriceTable();
            
            alert('New item added successfully!');
        } else {
            throw new Error(result.error || 'Failed to add price');
        }
    } catch (error) {
        console.error('Error adding new price:', error);
        alert('Failed to add new price item. Please try again. Error: ' + error.message);
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'Add Item';
    }
}

// This function is for deleting a SINGLE price
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
        console.log('Deleting price:', panelId);
        
        // USE deletePrice NOT savePrices!
        const result = await api.deletePrice(panelId);
        
        if (result.success) {
            // Update local copy
            delete allPrices[panelId];
            
            // Reset pagination and filtering
            filteredPrices = Object.entries(allPrices);
            currentPricePage = 1;
            updatePriceTable();
            
            alert('Item deleted successfully!');
        } else {
            throw new Error(result.error || 'Failed to delete price');
        }
    } catch (error) {
        console.error('Error deleting price:', error);
        alert('Failed to delete item. Please try again. Error: ' + error.message);
    } finally {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Delete';
    }
}