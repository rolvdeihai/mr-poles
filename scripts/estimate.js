// Import API functions
import * as api from './api.js';

// estimate.js - Logic for estimate.html
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

const panelIdMap = {
    'bonnet': '1',
    'roof': '2',
    'back-door': '3',
    'lf-fender': '4',
    'lf-door': '5',
    'lr-door': '6',
    'lr-fender': '7',
    'rf-fender': '8',
    'rf-door': '9',
    'rr-door': '10',
    'rr-fender': '11',
    'front-bumper': '12',
    'rear-bumper': '13',
    'l-trisplang': '14',
    'r-trisplang': '15',
    'l-panel-roof': '16',
    'r-panel-roof': '17'
};

let allPriceItems = [];

document.addEventListener('DOMContentLoaded', async function () {
    const savedEstimate = JSON.parse(sessionStorage.getItem('currentEstimate'));
    
    // Setup event listeners
    document.getElementById('addExtraItemBtn')?.addEventListener('click', addExtraItem);
    document.getElementById('addItemBtn')?.addEventListener('click', showItemSelector);
    document.getElementById('searchItemInput')?.addEventListener('input', filterItems);
    document.getElementById('confirmAddItem')?.addEventListener('click', addSelectedItem);
    document.getElementById('addCustomItemBtn')?.addEventListener('click', showCustomItemModal);
    
    // Custom Item Modal listeners
    document.getElementById('customItemName')?.addEventListener('input', validateCustomItemForm);
    document.getElementById('customItemPrice')?.addEventListener('input', validateCustomItemForm);
    document.getElementById('customItemPrice')?.addEventListener('blur', formatCustomItemPrice);
    document.getElementById('confirmCustomItem')?.addEventListener('click', confirmCustomItem);
    document.getElementById('cancelCustomItem')?.addEventListener('click', closeCustomItemModal);
    
    // Close modal when clicking outside
    document.getElementById('customItemModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeCustomItemModal();
    });

    if (savedEstimate) {
        loadSavedEstimate(savedEstimate);
        sessionStorage.removeItem('currentEstimate');
    } else {
        // Load from selected panels
        const pendingEstimatePanels = JSON.parse(sessionStorage.getItem('pendingEstimatePanels')) || [];
        const selectedPanels = JSON.parse(sessionStorage.getItem('selectedPanels')) || [];
        const panelsToDisplay = [...new Set([...pendingEstimatePanels, ...selectedPanels])];
        
        sessionStorage.removeItem('pendingEstimatePanels');
        await updateEstimateItemsList(panelsToDisplay);
    }

    document.getElementById('estimateItemsList')?.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-quantity')) {
            updateEstimateTotal();
        }
    });

    document.querySelectorAll('.panel-price-input').forEach(input => {
        const priceInput = input;
        const quantityInput = priceInput.closest('.estimate-item').querySelector('.item-quantity');
        addInputListeners(quantityInput, priceInput);
    });

    await loadPriceItems();
});

function formatPrice(price) {
    const num = parseInt(price) || 0;
    return num.toLocaleString('id-ID');
}

// Function to parse price input with thousand separators
function parsePriceInput(inputValue) {
    // Remove all non-digit characters except dots
    let rawValue = inputValue.replace(/[^\d.,]/g, '');
    
    // Handle multiple dots (thousand separators)
    if (rawValue.includes('.')) {
        // If there's a dot, remove all dots and parse as integer
        rawValue = rawValue.replace(/\./g, '');
    }
    
    // Remove any remaining commas
    rawValue = rawValue.replace(/,/g, '');
    
    return parseInt(rawValue) || 0;
}

// Function to format price with thousand separators as user types
function formatPriceInput(inputElement) {
    const rawValue = parsePriceInput(inputElement.value);
    inputElement.dataset.rawValue = rawValue;
    inputElement.value = formatPrice(rawValue);
}

function addInputListeners(quantityInput, priceInput) {
    // Quantity input: only digits (if present)
    if (quantityInput) {
        quantityInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '');
        });
    }

    // Price input: format on blur
    priceInput.addEventListener('blur', function(e) {
        formatPriceInput(this);
    });
    
    // Save raw value during input
    priceInput.addEventListener('input', function(e) {
        // Allow numbers and dots for thousand separators
        this.value = this.value.replace(/[^\d.,]/g, '');
        
        // Parse and store raw value
        const rawValue = parsePriceInput(this.value);
        this.dataset.rawValue = rawValue;
    });
}

// Custom Item Modal functions
function showCustomItemModal() {
    const modal = document.getElementById('customItemModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('customItemName').value = '';
        document.getElementById('customItemPrice').value = '';
        document.getElementById('customItemName').focus();
        
        // Reset validation
        document.getElementById('customItemName').classList.remove('error');
        document.getElementById('customItemPrice').classList.remove('error');
        document.getElementById('confirmCustomItem').disabled = true;
    }
}

function closeCustomItemModal() {
    const modal = document.getElementById('customItemModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function formatCustomItemPrice() {
    const priceInput = document.getElementById('customItemPrice');
    if (priceInput) {
        formatPriceInput(priceInput);
    }
}

function validateCustomItemForm() {
    const nameInput = document.getElementById('customItemName');
    const priceInput = document.getElementById('customItemPrice');
    const confirmBtn = document.getElementById('confirmCustomItem');
    
    if (!nameInput || !priceInput || !confirmBtn) return;
    
    const name = nameInput.value.trim();
    const price = parsePriceInput(priceInput.value);
    
    // Basic validation
    const isNameValid = name.length > 0;
    const isPriceValid = price > 0;
    
    // Update UI based on validation
    nameInput.classList.toggle('error', !isNameValid);
    priceInput.classList.toggle('error', !isPriceValid);
    
    // Enable/disable confirm button
    confirmBtn.disabled = !(isNameValid && isPriceValid);
    
    return isNameValid && isPriceValid;
}

function confirmCustomItem() {
    if (!validateCustomItemForm()) {
        alert('Please fill in all fields correctly!');
        return;
    }
    
    const name = document.getElementById('customItemName').value.trim();
    const priceInput = document.getElementById('customItemPrice');
    const price = parsePriceInput(priceInput.value);
    
    if (!name || price <= 0) {
        alert('Invalid input! Please check the values.');
        return;
    }
    
    const listElement = document.getElementById('estimateItemsList');
    if (!listElement) return;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'estimate-item';

    itemDiv.innerHTML = `
        <span>${name}</span>
        <input type="number" class="item-quantity" value="1" min="1">
        <input type="text" class="panel-price-input" 
               data-raw-value="${price}" 
               value="${formatPrice(price)}">
        <button class="btn-delete" onclick="this.parentElement.remove(); updateEstimateTotal();">Remove</button>
    `;

    listElement.appendChild(itemDiv);
    
    // Add event listeners to the new inputs
    const priceInputElement = itemDiv.querySelector('.panel-price-input');
    const quantityInput = itemDiv.querySelector('.item-quantity');
    addInputListeners(quantityInput, priceInputElement);
    
    updateEstimateTotal();
    closeCustomItemModal();
}

// Remove the old addCustomItem function since we're replacing it
// and update the function that will be exposed to global scope
window.addCustomItem = showCustomItemModal;

async function updateEstimateItemsList(panelIds) {
    const listElement = document.getElementById('estimateItemsList');
    const spinner = document.getElementById('loadingSpinner');

    // Show loading spinner
    listElement.innerHTML = '';
    spinner.style.display = 'block';

    if (!listElement) return;
    if (panelIds.length === 0) {
        spinner.style.display = 'none';
        listElement.innerHTML = '<p>Please select panels from the Home page first.</p>';
        return;
    }

    try {
        const prices = await api.getPrices();
        let total = 0;
        const itemsHTML = panelIds.map(panelId => {
            const panelName = panelNames[panelId] || panelId;
            const numericId = panelIdMap[panelId];
            const priceNormal = prices[numericId]?.normal || 0;
            const priceMedium = prices[numericId]?.medium || 0;
            const pricePremium = prices[numericId]?.premium || 0;
            total += priceNormal;
            return `
                <div class="estimate-item">
                    <span>${panelName}</span>
                    <select onchange="onEstimateSizeChange(this)" data-panel="${panelId}">
                        <option value="normal" selected>Normal - Rp ${formatPrice(priceNormal)}</option>
                        <option value="medium">Medium - Rp ${formatPrice(priceMedium)}</option>
                        <option value="premium">Premium - Rp ${formatPrice(pricePremium)}</option>
                    </select>
                    <input type="number" class="item-quantity" value="1" min="1">
                    <input type="text" class="panel-price-input" data-panel="${panelId}" 
                        data-raw-value="${priceNormal}" 
                        value="${formatPrice(priceNormal)}">
                    <button class="btn-delete" onclick="removeEstimateItem(this)">Remove</button>
                </div>
            `;
        }).join('');
        listElement.innerHTML = itemsHTML;
        spinner.style.display = 'none';
        const totalAmountElement = document.getElementById('totalAmount');
        totalAmountElement.textContent = formatPrice(total);
    } catch (error) {
        listElement.innerHTML = '<p>Error loading prices.</p>';
    } finally {
        spinner.style.display = 'none';
    }
}

function removeEstimateItem(button) {
    button.parentElement.remove();
    updateEstimateTotal();
}

async function loadPriceItems() {
    const dropdown = document.getElementById('itemsDropdown');
    dropdown.innerHTML = '<option disabled>Loading items...</option>';

    try {
        const prices = await api.getPrices();
        allPriceItems = Object.entries(prices).map(([id, data]) => ({
            id,
            name: data.name,
            normal: data.normal,
            medium: data.medium,
            premium: data.premium
        }));
        dropdown.innerHTML = ''; // Clear loading option
        dropdown.setAttribute('multiple', true);
        dropdown.setAttribute('size', '10');
        allPriceItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            dropdown.appendChild(option);
        });
    } catch (error) {
        dropdown.innerHTML = '<option disabled>Error loading items.</option>';
        console.error('Failed to load price items:', error);
    }
}

function showItemSelector() {
    const modal = document.getElementById('itemSelectorModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('searchItemInput').value = '';
        document.getElementById('itemsDropdown').selectedIndex = 0;
        
        // Force display of all items initially
        filterItems();
        
        // Set a minimum height for the dropdown
        document.getElementById('itemsDropdown').style.minHeight = '200px';
    }
}

function filterItems() {
    const searchInput = document.getElementById('searchItemInput');
    const dropdown = document.getElementById('itemsDropdown');
    
    if (!searchInput || !dropdown) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    // Show all items when search is empty
    if (!searchTerm) {
        for (let i = 0; i < dropdown.options.length; i++) {
            dropdown.options[i].style.display = '';
        }
        return;
    }
    
    // Filter items
    for (let i = 0; i < dropdown.options.length; i++) {
        const option = dropdown.options[i];
        option.style.display = option.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
    }
}

function addSelectedItem() {
    const dropdown = document.getElementById('itemsDropdown');
    if (!dropdown) return;

    // Get all selected options
    const selectedOptions = Array.from(dropdown.selectedOptions);
    if (selectedOptions.length === 0) {
        alert('Please select at least one item');
        return;
    }

    const listElement = document.getElementById('estimateItemsList');
    if (!listElement) return;

    selectedOptions.forEach(option => {
        const selectedId = option.value;
        const item = allPriceItems.find(i => i.id === selectedId);
        if (!item) return;

        const itemHTML = `
            <div class="estimate-item">
                <span>${item.name}</span>
                <select onchange="onEstimateSizeChange(this)" data-panel="${item.id}">
                    <option value="normal" selected>Normal - Rp ${formatPrice(item.normal)}</option>
                    <option value="medium">Medium - Rp ${formatPrice(item.medium)}</option>
                    <option value="premium">Premium - Rp ${formatPrice(item.premium)}</option>
                </select>
                <input type="number" class="item-quantity" value="1" min="1">
                <input type="text" class="panel-price-input" data-panel="${item.id}" 
                       data-raw-value="${item.normal}" 
                       value="${formatPrice(item.normal)}">
                <button class="btn-delete" onclick="removeEstimateItem(this)">Remove</button>
            </div>
        `;
        listElement.insertAdjacentHTML('beforeend', itemHTML);
        
        // Add listeners to the new inputs
        const newItem = listElement.lastElementChild;
        const priceInput = newItem.querySelector('.panel-price-input');
        const quantityInput = newItem.querySelector('.item-quantity');
        addInputListeners(quantityInput, priceInput);
    });

    updateEstimateTotal(); // Recalculate total
}

function addItemToEstimate(item) {
    const listElement = document.getElementById('estimateItemsList');
    const totalAmountElement = document.getElementById('totalAmount');
    
    if (!listElement || !totalAmountElement) return;
    
    // Fixed: Use the actual item properties
    const itemHTML = `
        <div class="estimate-item">
            <span>${item.name}</span>
            <select onchange="onEstimateSizeChange(this)" data-panel="${item.id}">
                <option value="normal" selected>Normal - Rp ${item.normal.toLocaleString()}</option>
                <option value="medium">Medium - Rp ${item.medium.toLocaleString()}</option>
                <option value="premium">Premium - Rp ${item.premium.toLocaleString()}</option>
            </select>
            <input type="number" class="item-quantity" value="1" min="1">
            <input type="number" class="panel-price-input" data-panel="${item.id}" value="${item.normal}" min="0">
            <button class="btn-delete" onclick="removeEstimateItem(this)">Remove</button>
        </div>
    `;
    
    listElement.innerHTML += itemHTML;
    
    // Update total
    const currentTotal = parseInt(totalAmountElement.textContent.replace(/,/g, '')) || 0;
    totalAmountElement.textContent = (currentTotal + item.normal).toLocaleString();
}

function addExtraItem() {
    const extraItemName = prompt('Enter name for extra item:');
    if (!extraItemName) return;
    
    const extraItemPrice = parseFloat(prompt('Enter price for extra item:')) || 0;
    if (isNaN(extraItemPrice)) return;
    
    const listElement = document.getElementById('estimateItemsList');
    if (!listElement) return;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'estimate-item';
    
    itemDiv.innerHTML = `
        <span>${extraItemName}</span>
        <input type="text" class="panel-price-input" 
               data-raw-value="${extraItemPrice}" 
               value="${formatPrice(extraItemPrice)}">
        <button class="btn-delete" onclick="this.parentElement.remove(); updateEstimateTotal();">Remove</button>
    `;
    
    listElement.appendChild(itemDiv);
    
    // Add listeners to the new input
    const priceInput = itemDiv.querySelector('.panel-price-input');
    addInputListeners(null, priceInput);
    
    updateEstimateTotal();
}

async function loadSavedEstimate(estimate) {
    // Fill customer form
    document.getElementById('customerName').value = estimate.customer.name || '';
    document.getElementById('customerAddress').value = estimate.customer.address || '';
    document.getElementById('customerPhone').value = estimate.customer.phone || '';
    document.getElementById('customerCar').value = estimate.customer.car || '';
    document.getElementById('customerColor').value = estimate.customer.color || '';
    document.getElementById('customerLicense').value = estimate.customer.license || '';
    
    // Load items with panel IDs
    await updateEstimateItemsFromDocument(estimate.items);
}

async function updateEstimateItemsFromDocument(items) {
    const listElement = document.getElementById('estimateItemsList');
    const spinner = document.getElementById('loadingSpinner');
    const totalAmountElement = document.getElementById('totalAmount');
    
    if (!listElement || !spinner) return;

    // Show loading spinner and clear list
    spinner.style.display = 'block';
    listElement.innerHTML = '';

    try {
        const prices = await api.getPrices();
        let total = 0;
        
        const itemsHTML = (items || []).map(item => {
            const panelId = item.panelId || '';
            const numericId = panelIdMap[panelId] || panelId;
            const panelName = panelNames[panelId] || item.panel || item.name || 'Unknown Panel';
            const size = item.size || 'normal';
            const savedPrice = item.price || 0;
            const priceNormal = prices[numericId]?.normal || 0;
            const priceMedium = prices[numericId]?.medium || 0;
            const pricePremium = prices[numericId]?.premium || 0;
            const quantity = item.quantity || 1;
            total += savedPrice * quantity;

            // Determine if the item is a standard panel with price data
            const hasPriceData = Boolean(prices[numericId]);

            return `
                <div class="estimate-item">
                    <span>${panelName}</span>
                    ${hasPriceData ? `
                        <select onchange="onEstimateSizeChange(this)" data-panel="${panelId}">
                            <option value="normal" ${size === 'normal' ? 'selected' : ''}>Normal - Rp ${formatPrice(priceNormal)}</option>
                            <option value="medium" ${size === 'medium' ? 'selected' : ''}>Medium - Rp ${formatPrice(priceMedium)}</option>
                            <option value="premium" ${size === 'premium' ? 'selected' : ''}>Premium - Rp ${formatPrice(pricePremium)}</option>
                        </select>
                    ` : ''}
                    <input type="number" class="item-quantity" value="${quantity}" min="1">
                    <input type="text" class="panel-price-input" data-panel="${panelId}" 
                           data-raw-value="${savedPrice}" 
                           value="${formatPrice(savedPrice)}">
                    <button class="btn-delete" onclick="removeEstimateItem(this)">Remove</button>
                </div>
            `;
        }).join('');
        
        listElement.innerHTML = itemsHTML;
        totalAmountElement.textContent = formatPrice(total);
        
        // Add listeners to all price inputs
        document.querySelectorAll('.estimate-item').forEach(item => {
            const priceInput = item.querySelector('.panel-price-input');
            const quantityInput = item.querySelector('.item-quantity');
            if (priceInput && quantityInput) {
                addInputListeners(quantityInput, priceInput);
            }
        });
    } catch (error) {
        listElement.innerHTML = '<p>Error loading prices.</p>';
    } finally {
        // Always hide spinner whether success or error
        spinner.style.display = 'none';
    }
}

function onEstimateSizeChange(select) {
    const panelId = select.dataset.panel;
    const size = select.value;
    const priceInput = select.parentElement.querySelector('.panel-price-input');
    const newPrice = getSelectedPrice(panelId, size);
    
    // Update raw value and formatted display
    priceInput.dataset.rawValue = newPrice;
    priceInput.value = formatPrice(newPrice);
    
    updateEstimateTotal();
}

function getSelectedPrice(panelId, size) {
    const priceElement = document.querySelector(`select[data-panel='${panelId}']`);
    if (!priceElement) return 0;
    const option = [...priceElement.options].find(opt => opt.value === size);
    const match = option?.textContent.match(/Rp ([\d,]+)/);
    const rawPrice = match ? match[1].replace(/,/g, '') : '0';
    return parseFloat(rawPrice); // Use parseFloat instead of parseInt
}

function updateEstimateTotal() {
    let total = 0;
    const itemElements = document.querySelectorAll('#estimateItemsList .estimate-item');
    
    itemElements.forEach(item => {
        const priceInput = item.querySelector('.panel-price-input');
        const quantityInput = item.querySelector('.item-quantity');
        
        // Get raw value from data attribute
        const price = parseInt(priceInput.dataset.rawValue) || 0;
        const quantity = parseInt(quantityInput.value) || 1;
        
        total += price * quantity;
    });
    
    const totalElement = document.getElementById('totalAmount');
    if (totalElement) {
        totalElement.textContent = formatPrice(total);
    }
}

async function saveEstimate() {
    const customerData = {
        name: document.getElementById('customerName').value,
        address: document.getElementById('customerAddress').value,
        phone: document.getElementById('customerPhone').value,
        car: document.getElementById('customerCar').value,
        color: document.getElementById('customerColor').value,
        license: document.getElementById('customerLicense').value
    };
    if (!customerData.name) {
        alert('Customer name is required!');
        return;
    }
    // Gather all items
    const items = [];
    let total = 0;
    const itemElements = document.querySelectorAll('#estimateItemsList .estimate-item');
    itemElements.forEach(itemElement => {
        const panelId = itemElement.querySelector('select')?.dataset.panel;
        const size = itemElement.querySelector('select')?.value || 'normal';
        const panelName = itemElement.querySelector('span').textContent;
        const quantityInput = itemElement.querySelector('.item-quantity');
        const quantity = parseInt(quantityInput.value) || 1;
        const priceInput = itemElement.querySelector('.panel-price-input');
        const rawValue = priceInput.dataset.rawValue;
        const price = parseInt(rawValue) || 0;
        items.push({
            panelId: panelId,
            panel: panelName,
            size: size,
            price: price,
            quantity: quantity
        });
        total += price * quantity;
    });
    if (items.length === 0) {
        alert('Please add at least one item to the estimate');
        return;
    }
    const estimate = {
        id: Date.now(),
        date: new Date().toLocaleDateString('id-ID'),
        customer: customerData,
        items: items,
        total: total
    };
    try {
        const response = await api.saveEstimate(estimate);
        if (response.success) {
            alert('Estimate saved successfully!');
            sessionStorage.removeItem('selectedPanels');
            window.location.href = 'history.html';
        } else {
            alert('Failed to save estimate: ' + (response.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error saving estimate: ' + error.message);
    }
}

function createTempEstimate() {
    const customerData = {
        name: document.getElementById('customerName').value || 'Customer',
        address: document.getElementById('customerAddress').value || '-',
        phone: document.getElementById('customerPhone').value || '-',
        car: document.getElementById('customerCar').value || '-',
        color: document.getElementById('customerColor').value || '-',
        license: document.getElementById('customerLicense').value || '-'
    };

    const items = [];
    let total = 0;

    // Get all panel rows in the estimate list
    const itemElements = document.querySelectorAll('#estimateItemsList .estimate-item');
    itemElements.forEach(itemElement => {
        const panelId = itemElement.querySelector('select')?.dataset.panel;
        const size = itemElement.querySelector('select')?.value || 'normal';
        const panelName = itemElement.querySelector('span').textContent;
        const quantityInput = itemElement.querySelector('.item-quantity');
        const quantity = parseInt(quantityInput.value) || 1;
        const priceInput = itemElement.querySelector('.panel-price-input');
        const rawValue = priceInput.dataset.rawValue;
        const price = parseInt(rawValue) || 0;

        items.push({
            panelId: panelId,
            panel: panelName,
            size: size,
            price: price,
            quantity: quantity
        });
        total += price * quantity;
    });

    return {
        id: Date.now(),
        date: new Date().toLocaleDateString('id-ID'),
        customer: customerData,
        items: items,
        total: total
    };
}

// Function to generate printable content
function printEstimateContent(estimate) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Estimate - ${estimate.customer.name}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                body {
                    font-family: 'Roboto', Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    font-size: 12px;
                    color: #333;
                }
                .logo {
                    width: 110px;
                    height: 110px;
                    object-fit: cover;
                    border-radius: 50%;
                    border: 3px solid #cc1818;
                    margin-bottom: 10px;
                    background: #fff;
                    display: block;
                }
                .header {
                    border-bottom: 2px solid #cc1818;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .company-info h2 {
                    margin: 0;
                    font-size: 24px;
                    color: #cc1818;
                    font-weight: 700;
                }
                .document-info h3 {
                    margin: 0 0 5px 0;
                    color: #cc1818;
                }
                .customer-info {
                    background: #f8f8f8;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }
                .panels-table {
                    border-collapse: collapse;
                    width: 100%;
                }
                .panels-table th,
                .panels-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: center;
                }
                .panels-table th {
                    background: #cc1818;
                    color: white;
                    font-weight: 500;
                }
                .total-section {
                    text-align: right;
                    font-size: 16px;
                    font-weight: 700;
                    color: #cc1818;
                    padding: 10px 0;
                    border-top: 2px solid #cc1818;
                }
                .signature-section {
                    bottom: 80px;
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                }
                .signature-box {
                    text-align: center;
                    width: 200px;
                    margin-top: auto;
                }
                .signature-line {
                    border-top: 1px solid #333;
                    margin-top: 10px;
                    padding-top: 5px;
                }
                .signature-logo {
                    max-height: 100px;
                    margin-bottom: 2px;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }
                .footer {
                    text-align: center;
                    font-size: 10px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }
                @media print {
                    @page {
                        size: A4;
                        margin: 1cm;
                    }

                    body {
                        width: 210mm;
                        height: 297mm;
                        margin: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .customer-info {
                        background: #f8f8f8 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        page-break-inside: avoid !important;
                    }

                    .footer {
                        position: fixed;
                        bottom: 0;
                        width: 100%;
                        page-break-inside: avoid !important;
                    }

                    .signature-section {
                        position: fixed;
                        bottom: 80px;
                        width: 100%;
                        page-break-inside: avoid !important;
                    }

                    .header,
                    .panels-table,
                    .total-section {
                        page-break-inside: avoid !important;
                    }

                    .page-break {
                        page-break-before: always;
                    }
                }
            </style>
        </head>
        <body>
    `);

    // Split items into chunks of 25
    const chunks = [];
    for (let i = 0; i < estimate.items.length; i += 25) {
        chunks.push(estimate.items.slice(i, i + 25));
    }

    chunks.forEach((chunk, index) => {
        printWindow.document.write(`
            ${index > 0 ? '<div class="page-break"></div>' : ''}
            <div class="page">
                <!-- Logo on Top -->
                <div style="text-align: left; margin-bottom: 10px;">
                    <img src="../images/mrpoles.jpg" alt="MrPoles" class="logo" style="max-height: 100px;">
                </div>

                <!-- Company Info & Document Info in a Table -->
                <div class="header">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <!-- Left: Company Info -->
                            <td style="width: 70%; vertical-align: top;">
                                <div class="company-info">
                                    <h2 style="margin: 0; color: red;">MR POLES BODY REPAIR</h2>
                                    <p style="margin: 2px 0;">Professional Auto Body Solutions</p>
                                    <p style="margin: 2px 0;">Phone: +62 822-1305-2001 / +62 821-8616-2222</p>
                                    <p style="margin: 2px 0;">Instagram: @mrpoles_lampung</p>
                                    <p style="font-weight: bold; margin-top: 8px;">
                                        Estimate - ${estimate.customer.name}
                                    </p>
                                </div>
                            </td>

                            <!-- Right: Document Info -->
                            <td style="width: 30%; vertical-align: top; text-align: right;">
                                <div class="document-info">
                                    <h3 style="color: red; margin-bottom: 5px;">SERVICE ORDER</h3>
                                    <p><strong>No:</strong> ESTIMATE - ${estimate.id.toString().substr(-6)}</p>
                                    <p><strong>Date:</strong> ${estimate.date}</p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="customer-info">
                    <div>
                        <p><strong>Customer:</strong> ${estimate.customer.name}</p>
                        <p><strong>Phone:</strong> ${estimate.customer.phone}</p>
                    </div>
                    <div>
                        <p><strong>Car:</strong> ${estimate.customer.car}</p>
                        <p><strong>Color:</strong> ${estimate.customer.color}</p>
                    </div>
                    <div>
                        <p><strong>License:</strong> ${estimate.customer.license}</p>
                        <p><strong>Address:</strong> ${estimate.customer.address}</p>
                    </div>
                </div>
                <table class="panels-table">
                    <tr>
                        <th>PANEL</th>
                        <th>QTY</th>
                        <th>AMOUNT</th>
                    </tr>
                    ${chunk.map(item => `
                        <tr>
                            <td><strong>${item.panel}</strong></td>
                            <td style="text-align: center;"><strong>${item.quantity}</strong></td>
                            <td><strong>Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</strong></td>
                        </tr>
                    `).join('')}
                </table>
                <div class="total-section">
                    <p>Total: Rp ${estimate.total.toLocaleString('id-ID')}</p>
                </div>
                <div class="signature-section">
                    <div class="signature-box">
                        <img src="../images/mrpoles_stamp.png" alt="MrPoles" class="signature-logo">
                        <div class="signature-line">( _______________________ )</div>
                        <div>MR POLES BODY REPAIR</div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line">( _______________________ )</div>
                        <div>CUSTOMER'S SIGNATURE</div>
                    </div>
                </div>
                <div class="footer">
                    <p>*NOT RESPONSIBLE FOR ITEMS LEFT IN CAR</p>
                    <p>WE APPRECIATE YOUR BUSINESS</p>
                    <p>© ${new Date().getFullYear()} Mr Poles Body Repair. All rights reserved.</p>
                </div>
            </div>
        `);
    });

    printWindow.document.write(`
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Expose functions to global scope
window.panelNames = panelNames;
window.saveEstimate = saveEstimate;
window.printEstimate = function() {
    const estimate = createTempEstimate();
    printEstimateContent(estimate);
};
window.onEstimateSizeChange = onEstimateSizeChange;
window.updateEstimateTotal = updateEstimateTotal;
window.addExtraItem = addExtraItem;
window.removeEstimateItem = removeEstimateItem;
window.addCustomItem = showCustomItemModal;