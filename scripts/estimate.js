// Import API functions
import * as api from './api.js';

// estimate.js - Logic for estimate.html
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
    document.getElementById('addCustomItemBtn')?.addEventListener('click', addCustomItem);
    
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

// Updated addInputListeners function
function addInputListeners(quantityInput, priceInput) {
    // Quantity input: only digits (if present)
    if (quantityInput) {
        quantityInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '');
        });
    }

    // Price input: format on blur
    priceInput.addEventListener('blur', function(e) {
        const rawValue = this.value.replace(/\D/g, '');
        const num = parseInt(rawValue) || 0;
        this.dataset.rawValue = num;
        this.value = formatPrice(num);
    });
    
    // Save raw value during input
    priceInput.addEventListener('input', function(e) {
        const rawValue = this.value.replace(/\D/g, '');
        this.dataset.rawValue = rawValue;
    });
}

// Updated addCustomItem function
function addCustomItem() {
    // Prompt for custom item name
    const customName = prompt('Enter name for custom item:');
    if (!customName) return;

    // Prompt for custom item price
    const customPriceInput = prompt('Enter price for custom item:');
    const customPrice = parseFloat(customPriceInput);
    if (isNaN(customPrice)) {
        alert('Invalid price entered!');
        return;
    }

    const listElement = document.getElementById('estimateItemsList');
    if (!listElement) return;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'estimate-item';

    itemDiv.innerHTML = `
        <span>${customName}</span>
        <input type="number" class="item-quantity" value="1" min="1">
        <input type="text" class="panel-price-input" 
               data-raw-value="${customPrice}" 
               value="${formatPrice(customPrice)}">
        <button class="btn-delete" onclick="this.parentElement.remove(); updateEstimateTotal();">Remove</button>
    `;

    listElement.appendChild(itemDiv);
    
    // Add event listeners to the new inputs
    const priceInput = itemDiv.querySelector('.panel-price-input');
    const quantityInput = itemDiv.querySelector('.item-quantity');
    addInputListeners(quantityInput, priceInput); // This was missing
    
    updateEstimateTotal();
}

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

        // UPDATED: Use the new formatted price input
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
    
    // UPDATED: Use the new formatted price input
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

            // UPDATED: Use the new formatted price input
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
        // const priceInput = itemElement.querySelector('.panel-price-input');
        // const price = parseInt(priceInput.value) || 0;
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
        // const priceInput = itemElement.querySelector('.panel-price-input');
        // const price = parseInt(priceInput.value) || 0;
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
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                }
                .signature-box {
                    text-align: center;
                    width: 200px;
                }
                .signature-line {
                    border-top: 1px solid #333;
                    margin-top: 40px;
                    padding-top: 5px;
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
                    }
                    .footer {
                        position: fixed;
                        bottom: 0;
                        width: 100%;
                    }
                    .signature-section {
                        position: fixed;
                        bottom: 80px;
                        width: 100%;
                    }
                    .page-break {
                        page-break-after: always;
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
                <div class="header">
                    <div class="company-info">
                        <img src="../images/mrpoles.jpg" alt="MrPoles" class="logo">
                        <h2>MRPOLES BODY REPAIR</h2>
                        <p>Professional Auto Body Solutions</p>
                        <p>Phone: +62 822-1305-2001</p>
                        <p>Instagram: @mrpoles_lampung</p>
                        <p style="font-weight:bold; margin-top:8px;">Estimate - ${estimate.customer.name}</p>
                    </div>
                    <div class="document-info">
                        <h3>SERVICE ORDER</h3>
                        <p><strong>No:</strong> ESTIMATE - ${estimate.id.toString().substr(-6)}</p>
                        <p><strong>Date:</strong> ${estimate.date}</p>
                    </div>
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
                        <th>AMOUNT</th>
                    </tr>
                    ${chunk.map(item => `
                        <tr>
                            <td><strong>${item.panel}${item.quantity > 1 ? ` (x${item.quantity})` : ''}</strong></td>
                            <td><strong>Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</strong></td>
                        </tr>
                    `).join('')}
                </table>
                <div class="total-section">
                    <p>Total: Total: Rp ${estimate.total.toLocaleString('id-ID')}</p>
                </div>
                <div class="signature-section">
                    <div class="signature-box">
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
                    <p>© ${new Date().getFullYear()} MrPoles Body Repair. All rights reserved.</p>
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
window.addCustomItem = addCustomItem;