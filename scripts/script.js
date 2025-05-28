// script.js

// Global variables
let selectedPanels = [];
let currentEstimate = null;
let currentInvoice = null;

// Default prices
const defaultPrices = {
    'bonnet': { normal: 50000, medium: 75000, premium: 100000 },
    'roof': { normal: 60000, medium: 90000, premium: 120000 },
    'trunk': { normal: 50000, medium: 75000, premium: 100000 },
    'lf-fender': { normal: 40000, medium: 60000, premium: 80000 },
    'lf-door': { normal: 45000, medium: 65000, premium: 85000 },
    'lr-door': { normal: 45000, medium: 65000, premium: 85000 },
    'lr-fender': { normal: 40000, medium: 60000, premium: 80000 },
    'rf-fender': { normal: 40000, medium: 60000, premium: 80000 },
    'rf-door': { normal: 45000, medium: 65000, premium: 85000 },
    'rr-door': { normal: 45000, medium: 65000, premium: 85000 },
    'rr-fender': { normal: 40000, medium: 60000, premium: 80000 }
};

// Panel names mapping
const panelNames = {
    'bonnet': 'BONNET (1)',
    'roof': 'ROOF (2)', 
    'trunk': 'TRUNK (3)',
    'lf-fender': 'LF FENDER (4)',
    'lf-door': 'LF DOOR (5)',
    'lr-door': 'LR DOOR (6)',
    'lr-fender': 'LR FENDER (7)',
    'rf-fender': 'RF FENDER (8)',
    'rf-door': 'RF DOOR (9)',
    'rr-door': 'RR DOOR (10)',
    'rr-fender': 'RR FENDER (11)'
};

// Initialize app for each page
document.addEventListener('DOMContentLoaded', function() {
    // Restore panels from sessionStorage if present (for estimate page)
    if (document.getElementById('estimateItemsList')) {
        const pendingPanels = sessionStorage.getItem('pendingEstimatePanels');
        if (pendingPanels) {
            selectedPanels = JSON.parse(pendingPanels);
            sessionStorage.removeItem('pendingEstimatePanels');
            localStorage.setItem('selectedPanels', JSON.stringify(selectedPanels));
        } else {
            selectedPanels = JSON.parse(localStorage.getItem('selectedPanels')) || [];
        }
        
        // Only load items if there are selected panels
        if (selectedPanels.length > 0) {
            loadEstimateItems();
            loadSelectedPanels();
        } else {
            // Redirect back to home if no panels selected
            alert('No panels selected. Please select panels first.');
            window.location.href = 'index.html';
        }
    } else if (document.getElementById('invoiceItemsList')) {
        const pendingPanels = sessionStorage.getItem('pendingInvoicePanels');
        if (pendingPanels) {
            selectedPanels = JSON.parse(pendingPanels);
            sessionStorage.removeItem('pendingInvoicePanels');
            localStorage.setItem('selectedPanels', JSON.stringify(selectedPanels));
        } else {
            selectedPanels = JSON.parse(localStorage.getItem('selectedPanels')) || [];
        }
        
        if (selectedPanels.length > 0) {
            loadInvoiceItems();
            loadSelectedPanels();
        } else {
            alert('No panels selected. Please select panels first.');
            window.location.href = 'index.html';
        }
    } else {
        selectedPanels = JSON.parse(localStorage.getItem('selectedPanels')) || [];
    }

    // Page-specific initializations
    if (document.getElementById('pricesTableBody')) {
        initializePrices();
        loadPricesTable();
    }

    if (document.getElementById('estimatesHistoryList')) {
        loadHistory();
    }

    // Initialize selected panels visualization
    updateSelectedPanelsList();

    // Check for saved estimate/invoice data
    const savedEstimate = JSON.parse(localStorage.getItem('currentEstimate'));
    if (savedEstimate) {
        currentEstimate = savedEstimate;
        localStorage.removeItem('currentEstimate');
        
        // Fill form if on estimate page
        if (document.getElementById('customerName')) {
            document.getElementById('customerName').value = savedEstimate.customer.name;
            document.getElementById('customerAddress').value = savedEstimate.customer.address;
            document.getElementById('customerPhone').value = savedEstimate.customer.phone;
            document.getElementById('customerCar').value = savedEstimate.customer.car;
            document.getElementById('customerColor').value = savedEstimate.customer.color;
            document.getElementById('customerLicense').value = savedEstimate.customer.license;
            
            // Set selected panels from estimate
            selectedPanels = savedEstimate.items.map(item => {
                const panelKey = Object.keys(panelNames).find(key => panelNames[key] === item.panel);
                return panelKey;
            }).filter(Boolean);
            
            localStorage.setItem('selectedPanels', JSON.stringify(selectedPanels));
            loadEstimateItems();
            
            // Set correct sizes
            setTimeout(() => {
                const selects = document.querySelectorAll('#estimateItemsList select');
                selects.forEach((select, index) => {
                    if (savedEstimate.items[index]) {
                        select.value = savedEstimate.items[index].size;
                    }
                });
                updateEstimateTotal();
            }, 100);
        }
    }

    const savedInvoice = JSON.parse(localStorage.getItem('currentInvoice'));
    if (savedInvoice) {
        currentInvoice = savedInvoice;
        localStorage.removeItem('currentInvoice');
        
        // Fill form if on invoice page
        if (document.getElementById('invoiceCustomerName')) {
            document.getElementById('invoiceCustomerName').value = savedInvoice.customer.name;
            document.getElementById('invoiceCustomerAddress').value = savedInvoice.customer.address;
            document.getElementById('invoiceCustomerPhone').value = savedInvoice.customer.phone;
            document.getElementById('invoiceCustomerCar').value = savedInvoice.customer.car;
            document.getElementById('invoiceCustomerColor').value = savedInvoice.customer.color;
            document.getElementById('invoiceCustomerLicense').value = savedInvoice.customer.license;
            
            // Set selected panels from invoice
            selectedPanels = savedInvoice.items.map(item => {
                const panelKey = Object.keys(panelNames).find(key => panelNames[key] === item.panel);
                return panelKey;
            }).filter(Boolean);
            
            localStorage.setItem('selectedPanels', JSON.stringify(selectedPanels));
            loadInvoiceItems();
            
            // Set correct sizes
            setTimeout(() => {
                const selects = document.querySelectorAll('#invoiceItemsList select');
                selects.forEach((select, index) => {
                    if (savedInvoice.items[index]) {
                        select.value = savedInvoice.items[index].size;
                    }
                });
                updateInvoiceTotal();
            }, 100);
        }
    }
});

// Modified selectPanel function
function selectPanel(panelId) {
    const panelBtn = document.querySelector(`[data-panel="${panelId}"]`);
    
    if (!panelBtn) return; // Exit if not on home page
    
    if (selectedPanels.includes(panelId)) {
        selectedPanels = selectedPanels.filter(p => p !== panelId);
        panelBtn.classList.remove('selected');
    } else {
        selectedPanels.push(panelId);
        panelBtn.classList.add('selected');
    }
    
    updateSelectedPanelsList();
    localStorage.setItem('selectedPanels', JSON.stringify(selectedPanels));
}

// New function to load selected panels
function loadSelectedPanels() {
    selectedPanels = JSON.parse(localStorage.getItem('selectedPanels')) || [];
    updateSelectedPanelsList();
}

function updateSelectedPanelsList() {
    const listElement = document.getElementById('selectedPanelsList');
    const actionButtons = document.getElementById('actionButtons');
    
    if (!listElement) return; // Exit if not on home page
    
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

// Price management functions
function initializePrices() {
    if (!localStorage.getItem('panelPrices')) {
        localStorage.setItem('panelPrices', JSON.stringify(defaultPrices));
    }
}

function getPrices() {
    return JSON.parse(localStorage.getItem('panelPrices')) || defaultPrices;
}

function loadPricesTable() {
    const prices = getPrices();
    const tbody = document.getElementById('pricesTableBody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    Object.keys(panelNames).forEach(panelId => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${panelNames[panelId]}</td>
            <td><input type="number" value="${prices[panelId].normal}" data-panel="${panelId}" data-size="normal"></td>
            <td><input type="number" value="${prices[panelId].medium}" data-panel="${panelId}" data-size="medium"></td>
            <td><input type="number" value="${prices[panelId].premium}" data-panel="${panelId}" data-size="premium"></td>
            <td><button class="btn-small btn-view" onclick="resetPanelPrice('${panelId}')">Reset</button></td>
        `;
        tbody.appendChild(row);
    });
}

function savePrices() {
    const prices = getPrices();
    const inputs = document.querySelectorAll('#pricesTableBody input');
    
    inputs.forEach(input => {
        const panelId = input.dataset.panel;
        const size = input.dataset.size;
        const value = parseInt(input.value) || 0;
        
        prices[panelId][size] = value;
    });
    
    localStorage.setItem('panelPrices', JSON.stringify(prices));
    alert('Harga berhasil disimpan!');
}

function resetPanelPrice(panelId) {
    const prices = getPrices();
    prices[panelId] = { ...defaultPrices[panelId] };
    localStorage.setItem('panelPrices', JSON.stringify(prices));
    loadPricesTable();
}

// Modified createEstimate function
function createEstimate() {
    if (selectedPanels.length === 0) {
        alert('Pilih panel terlebih dahulu!');
        return;
    }
    // Use sessionStorage to pass panels to estimate.html
    sessionStorage.setItem('pendingEstimatePanels', JSON.stringify(selectedPanels));
    window.location.href = 'estimate.html';
}

// New createInvoice function
function createInvoice() {
    if (selectedPanels.length === 0) {
        alert('Pilih panel terlebih dahulu!');
        return;
    }
    // Use sessionStorage to pass panels to invoice.html
    sessionStorage.setItem('pendingInvoicePanels', JSON.stringify(selectedPanels));
    window.location.href = 'invoice.html';
}

function loadEstimateItems() {
    const prices = getPrices();
    const itemsList = document.getElementById('estimateItemsList');
    if (!itemsList) return;
    itemsList.innerHTML = '';
    let total = 0;

    let savedItems = null;
    if (currentEstimate && currentEstimate.items) {
        savedItems = currentEstimate.items;
    }

    selectedPanels.forEach((panelId, idx) => {
        let size = 'normal';
        let price = prices[panelId][size];
        if (savedItems) {
            const saved = savedItems[idx];
            if (saved && saved.panel === panelNames[panelId]) {
                size = saved.size;
                price = saved.price;
            }
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'estimate-item';
        itemDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 5px;">
                <span>${panelNames[panelId]}</span>
                <select onchange="onEstimateSizeChange(this)" data-panel="${panelId}">
                    <option value="normal" ${size === 'normal' ? 'selected' : ''}>Normal - Rp ${prices[panelId].normal.toLocaleString()}</option>
                    <option value="medium" ${size === 'medium' ? 'selected' : ''}>Medium - Rp ${prices[panelId].medium.toLocaleString()}</option>
                    <option value="premium" ${size === 'premium' ? 'selected' : ''}>Premium - Rp ${prices[panelId].premium.toLocaleString()}</option>
                </select>
                <input type="number" class="panel-price-input" data-panel="${panelId}" value="${price}" min="0" style="width:120px; margin-left:10px;" oninput="updateEstimateTotal()">
            </div>
        `;
        itemsList.appendChild(itemDiv);
        total += parseInt(price) || 0;
    });

    updateEstimateTotal();
}

function onEstimateSizeChange(select) {
    const panelId = select.dataset.panel;
    const size = select.value;
    const prices = getPrices();
    const priceInput = select.parentElement.querySelector('.panel-price-input');
    priceInput.value = prices[panelId][size];
    updateEstimateTotal();
}

function updateEstimateTotal() {
    let total = 0;
    const priceInputs = document.querySelectorAll('#estimateItemsList .panel-price-input');
    priceInputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    const totalElement = document.getElementById('totalAmount');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString();
    }
    // Update label to use Rp
    const totalLabel = totalElement?.closest('.total-section')?.querySelector('h3');
    if (totalLabel) {
        totalLabel.innerHTML = `Total: Rp <span id="totalAmount">${total.toLocaleString()}</span>`;
    }
}

// Do the same for invoice
function loadInvoiceItems() {
    const prices = getPrices();
    const itemsList = document.getElementById('invoiceItemsList');
    if (!itemsList) return;
    itemsList.innerHTML = '';
    let total = 0;

    let savedItems = null;
    if (currentInvoice && currentInvoice.items) {
        savedItems = currentInvoice.items;
    }

    selectedPanels.forEach((panelId, idx) => {
        let size = 'normal';
        let price = prices[panelId][size];
        if (savedItems) {
            const saved = savedItems[idx];
            if (saved && saved.panel === panelNames[panelId]) {
                size = saved.size;
                price = saved.price;
            }
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'invoice-item';
        itemDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 5px;">
                <span>${panelNames[panelId]}</span>
                <select onchange="onInvoiceSizeChange(this)" data-panel="${panelId}">
                    <option value="normal" ${size === 'normal' ? 'selected' : ''}>Normal - Rp ${prices[panelId].normal.toLocaleString()}</option>
                    <option value="medium" ${size === 'medium' ? 'selected' : ''}>Medium - Rp ${prices[panelId].medium.toLocaleString()}</option>
                    <option value="premium" ${size === 'premium' ? 'selected' : ''}>Premium - Rp ${prices[panelId].premium.toLocaleString()}</option>
                </select>
                <input type="number" class="panel-price-input" data-panel="${panelId}" value="${price}" min="0" style="width:120px; margin-left:10px;" oninput="updateInvoiceTotal()">
            </div>
        `;
        itemsList.appendChild(itemDiv);
        total += parseInt(price) || 0;
    });

    updateInvoiceTotal();
}

function onInvoiceSizeChange(select) {
    const panelId = select.dataset.panel;
    const size = select.value;
    const prices = getPrices();
    const priceInput = select.parentElement.querySelector('.panel-price-input');
    priceInput.value = prices[panelId][size];
    updateInvoiceTotal();
}

function updateInvoiceTotal() {
    let total = 0;
    const priceInputs = document.querySelectorAll('#invoiceItemsList .panel-price-input');
    priceInputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    const totalElement = document.getElementById('invoiceTotalAmount');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString();
    }
    // Update label to use Rp
    const totalLabel = totalElement?.closest('.total-section')?.querySelector('h3');
    if (totalLabel) {
        totalLabel.innerHTML = `Total: Rp <span id="invoiceTotalAmount">${total.toLocaleString()}</span>`;
    }
}

function saveEstimate() {
    const customerData = {
        name: document.getElementById('customerName').value,
        address: document.getElementById('customerAddress').value,
        phone: document.getElementById('customerPhone').value,
        car: document.getElementById('customerCar').value,
        color: document.getElementById('customerColor').value,
        license: document.getElementById('customerLicense').value
    };
    
    if (!customerData.name) {
        alert('Nama pelanggan harus diisi!');
        return;
    }
    
    const prices = getPrices();
    const selects = document.querySelectorAll('#estimateItemsList select');
    const priceInputs = document.querySelectorAll('#estimateItemsList .panel-price-input');
    const items = [];
    let total = 0;
    
    selects.forEach((select, i) => {
        const panelId = select.dataset.panel;
        const size = select.value;
        const price = parseInt(priceInputs[i].value) || 0;
        items.push({
            panel: panelNames[panelId],
            size: size,
            price: price
        });
        total += price;
    });
    
    const estimate = {
        id: Date.now(),
        date: new Date().toLocaleDateString('id-ID'),
        customer: customerData,
        items: items,
        total: total
    };
    
    // Save to localStorage
    const estimates = JSON.parse(localStorage.getItem('estimates')) || [];
    estimates.push(estimate);
    localStorage.setItem('estimates', JSON.stringify(estimates));
    
    currentEstimate = estimate;
    
    // Clear selected panels after save
    selectedPanels = [];
    localStorage.removeItem('selectedPanels');
    
    alert('Estimasi berhasil disimpan!');
    
    // Navigate based on setup
    window.location.href = 'history.html';
}

// Modified printEstimate function
function printEstimate() {
    let estimate;
    if (!currentEstimate && selectedPanels.length > 0) {
        estimate = createTempEstimate();
    } else if (currentEstimate) {
        estimate = currentEstimate;
    } else {
        alert('Tidak ada estimasi untuk dicetak!');
        return;
    }
    
    printEstimateContent(estimate);
}

function printEstimateContent(estimate) {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Estimasi - ${estimate.customer.name}</title>
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
                    box-shadow: 0 2px 8px rgba(204,24,24,0.10), 0 1.5px 8px rgba(0,0,0,0.07);
                    margin-bottom: 10px;
                    background: #fff;
                    display: block;
                }
                
                .header { 
                    border-bottom: 2px solid #cc1818;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                
                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                
                .company-info {
                    text-align: left;
                }
                
                .company-info h2 {
                    margin: 0;
                    font-size: 24px;
                    color: #cc1818;
                    font-weight: 700;
                }
                
                .document-info {
                    text-align: right;
                    background: #f8f8f8;
                    padding: 10px 15px;
                    border-radius: 5px;
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
                
                .customer-info p {
                    margin: 5px 0;
                }
                
                .content-layout {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                
                .car-diagram {
                    flex: 0 0 200px;
                    background: #f8f8f8;
                    padding: 15px;
                    border-radius: 5px;
                }
                
                .panels-table {
                    flex: 1;
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
                
                .panels-table tr:nth-child(even) {
                    background: #f8f8f8;
                }
                
                .sizes-legend {
                    background: #f8f8f8;
                    padding: 10px 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-size: 11px;
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
                    margin-top: 40px;
                    text-align: center;
                    font-size: 10px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-content">
                    <div class="company-info">
                        <img src="../images/mrpoles.jpg" alt="MrPoles" class="logo">
                        <h2>MRPOLES BODY REPAIR</h2>
                        <p>Professional Auto Body Solutions</p>
                        <p>Phone: +62 821-7592-2982</p>
                        <p>Instagram: @mrpoles_lampung</p>
                        <p style="font-weight:bold; margin-top:8px;">Estimasi - ${estimate.customer.name}</p> <!-- Tambahkan judul di sini -->
                    </div>
                    <div class="document-info">
                        <h3>SERVICE ORDER</h3>
                        <p><strong>No:</strong> ESTIMASI - ${estimate.id?.toString().substr(-6)}</p>
                        <p><strong>Date:</strong> ${estimate.date}</p>
                    </div>
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

            <div class="content-layout">
                <table class="panels-table">
                    <tr>
                        <th>PANEL</th>
                        <th>N</th>
                        <th>GB</th>
                        <th>OS</th>
                        <th>C</th>
                        <th>LC</th>
                        <th>MS</th>
                        <th>GC</th>
                        <th>AMOUNT</th>
                    </tr>
                    ${estimate.items.map(item => `
                        <tr>
                            <td><strong>${item.panel}</strong></td>
                            <td>${item.size === 'normal' ? '✓' : ''}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>${item.size === 'medium' ? '✓' : ''}</td>
                            <td>${item.size === 'premium' ? '✓' : ''}</td>
                            <td><strong>Rp ${item.price.toLocaleString()}</strong></td>
                        </tr>
                    `).join('')}
                </table>
            </div>

            <div class="sizes-legend">
                <strong>Size Categories:</strong><br>
                N: Normal | GB: Golf Ball | OS: Over Size | C: Crease | LC: Long Crease | MS: Mega Size | GC: Giant Crease
            </div>

            <div class="total-section">
                <p>Total: Rp ${estimate.total.toLocaleString()}</p>
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
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
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
    
    const prices = getPrices();
    const selects = document.querySelectorAll('#estimateItemsList select');
    const items = [];
    let total = 0;
    
    selects.forEach(select => {
        const panelId = select.dataset.panel;
        const size = select.value;
        const price = prices[panelId][size];
        
        items.push({
            panel: panelNames[panelId],
            size: size,
            price: price
        });
        
        total += price;
    });
    
    return {
        date: new Date().toLocaleDateString('id-ID'),
        customer: customerData,
        items: items,
        total: total
    };
}

// Invoice functions
function loadInvoiceItems() {
    const prices = getPrices();
    const itemsList = document.getElementById('invoiceItemsList');
    if (!itemsList) return;
    itemsList.innerHTML = '';
    let total = 0;

    let savedItems = null;
    if (currentInvoice && currentInvoice.items) {
        savedItems = currentInvoice.items;
    }

    selectedPanels.forEach((panelId, idx) => {
        let size = 'normal';
        let price = prices[panelId][size];
        if (savedItems) {
            const saved = savedItems[idx];
            if (saved && saved.panel === panelNames[panelId]) {
                size = saved.size;
                price = saved.price;
            }
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'invoice-item';
        itemDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 5px;">
                <span>${panelNames[panelId]}</span>
                <select onchange="onInvoiceSizeChange(this)" data-panel="${panelId}">
                    <option value="normal" ${size === 'normal' ? 'selected' : ''}>Normal - Rp ${prices[panelId].normal.toLocaleString()}</option>
                    <option value="medium" ${size === 'medium' ? 'selected' : ''}>Medium - Rp ${prices[panelId].medium.toLocaleString()}</option>
                    <option value="premium" ${size === 'premium' ? 'selected' : ''}>Premium - Rp ${prices[panelId].premium.toLocaleString()}</option>
                </select>
                <input type="number" class="panel-price-input" data-panel="${panelId}" value="${price}" min="0" style="width:120px; margin-left:10px;" oninput="updateInvoiceTotal()">
            </div>
        `;
        itemsList.appendChild(itemDiv);
        total += parseInt(price) || 0;
    });

    updateInvoiceTotal();
}

function onInvoiceSizeChange(select) {
    const panelId = select.dataset.panel;
    const size = select.value;
    const prices = getPrices();
    const priceInput = select.parentElement.querySelector('.panel-price-input');
    priceInput.value = prices[panelId][size];
    updateInvoiceTotal();
}

function updateInvoiceTotal() {
    let total = 0;
    const priceInputs = document.querySelectorAll('#invoiceItemsList .panel-price-input');
    priceInputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    const totalElement = document.getElementById('invoiceTotalAmount');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString();
    }
    // Update label to use Rp
    const totalLabel = totalElement?.closest('.total-section')?.querySelector('h3');
    if (totalLabel) {
        totalLabel.innerHTML = `Total: Rp <span id="invoiceTotalAmount">${total.toLocaleString()}</span>`;
    }
}

function saveEstimate() {
    const customerData = {
        name: document.getElementById('customerName').value,
        address: document.getElementById('customerAddress').value,
        phone: document.getElementById('customerPhone').value,
        car: document.getElementById('customerCar').value,
        color: document.getElementById('customerColor').value,
        license: document.getElementById('customerLicense').value
    };
    
    if (!customerData.name) {
        alert('Nama pelanggan harus diisi!');
        return;
    }
    
    const prices = getPrices();
    const selects = document.querySelectorAll('#estimateItemsList select');
    const priceInputs = document.querySelectorAll('#estimateItemsList .panel-price-input');
    const items = [];
    let total = 0;
    
    selects.forEach((select, i) => {
        const panelId = select.dataset.panel;
        const size = select.value;
        const price = parseInt(priceInputs[i].value) || 0;
        items.push({
            panel: panelNames[panelId],
            size: size,
            price: price
        });
        total += price;
    });
    
    const estimate = {
        id: Date.now(),
        date: new Date().toLocaleDateString('id-ID'),
        customer: customerData,
        items: items,
        total: total
    };
    
    // Save to localStorage
    const estimates = JSON.parse(localStorage.getItem('estimates')) || [];
    estimates.push(estimate);
    localStorage.setItem('estimates', JSON.stringify(estimates));
    
    currentEstimate = estimate;
    
    // Clear selected panels after save
    selectedPanels = [];
    localStorage.removeItem('selectedPanels');
    
    alert('Estimasi berhasil disimpan!');
    
    // Navigate based on setup
    window.location.href = 'history.html';
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
    
    const prices = getPrices();
    const selects = document.querySelectorAll('#estimateItemsList select');
    const items = [];
    let total = 0;
    
    selects.forEach(select => {
        const panelId = select.dataset.panel;
        const size = select.value;
        const price = prices[panelId][size];
        
        items.push({
            panel: panelNames[panelId],
            size: size,
            price: price
        });
        
        total += price;
    });
    
    return {
        date: new Date().toLocaleDateString('id-ID'),
        customer: customerData,
        items: items,
        total: total
    };
}

// Invoice functions
function loadInvoiceItems() {
    const prices = getPrices();
    const itemsList = document.getElementById('invoiceItemsList');
    if (!itemsList) return;
    itemsList.innerHTML = '';
    let total = 0;

    let savedItems = null;
    if (currentInvoice && currentInvoice.items) {
        savedItems = currentInvoice.items;
    }

    selectedPanels.forEach((panelId, idx) => {
        let size = 'normal';
        let price = prices[panelId][size];
        if (savedItems) {
            const saved = savedItems[idx];
            if (saved && saved.panel === panelNames[panelId]) {
                size = saved.size;
                price = saved.price;
            }
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'invoice-item';
        itemDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 5px;">
                <span>${panelNames[panelId]}</span>
                <select onchange="onInvoiceSizeChange(this)" data-panel="${panelId}">
                    <option value="normal" ${size === 'normal' ? 'selected' : ''}>Normal - Rp ${prices[panelId].normal.toLocaleString()}</option>
                    <option value="medium" ${size === 'medium' ? 'selected' : ''}>Medium - Rp ${prices[panelId].medium.toLocaleString()}</option>
                    <option value="premium" ${size === 'premium' ? 'selected' : ''}>Premium - Rp ${prices[panelId].premium.toLocaleString()}</option>
                </select>
                <input type="number" class="panel-price-input" data-panel="${panelId}" value="${price}" min="0" style="width:120px; margin-left:10px;" oninput="updateInvoiceTotal()">
            </div>
        `;
        itemsList.appendChild(itemDiv);
        total += parseInt(price) || 0;
    });

    updateInvoiceTotal();
}

function onInvoiceSizeChange(select) {
    const panelId = select.dataset.panel;
    const size = select.value;
    const prices = getPrices();
    const priceInput = select.parentElement.querySelector('.panel-price-input');
    priceInput.value = prices[panelId][size];
    updateInvoiceTotal();
}

function updateInvoiceTotal() {
    let total = 0;
    const priceInputs = document.querySelectorAll('#invoiceItemsList .panel-price-input');
    priceInputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    const totalElement = document.getElementById('invoiceTotalAmount');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString();
    }
    // Update label to use Rp
    const totalLabel = totalElement?.closest('.total-section')?.querySelector('h3');
    if (totalLabel) {
        totalLabel.innerHTML = `Total: Rp <span id="invoiceTotalAmount">${total.toLocaleString()}</span>`;
    }
}

function saveInvoice() {
    const customerData = {
        name: document.getElementById('invoiceCustomerName').value,
        address: document.getElementById('invoiceCustomerAddress').value,
        phone: document.getElementById('invoiceCustomerPhone').value,
        car: document.getElementById('invoiceCustomerCar').value,
        color: document.getElementById('invoiceCustomerColor').value,
        license: document.getElementById('invoiceCustomerLicense').value
    };
    
    if (!customerData.name) {
        alert('Nama pelanggan harus diisi!');
        return;
    }
    
    const prices = getPrices();
    const selects = document.querySelectorAll('#invoiceItemsList select');
    const priceInputs = document.querySelectorAll('#invoiceItemsList .panel-price-input');
    const items = [];
    let total = 0;
    
    selects.forEach((select, i) => {
        const panelId = select.dataset.panel;
        const size = select.value;
        const price = parseInt(priceInputs[i].value) || 0;
        items.push({
            panel: panelNames[panelId],
            size: size,
            price: price
        });
        total += price;
    });
    
    const invoice = {
        id: Date.now(),
        number: 'INV-' + Date.now().toString().substr(-6),
        date: new Date().toLocaleDateString('id-ID'),
        customer: customerData,
        items: items,
        total: total
    };
    
    // Save to localStorage
    const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    invoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    
    currentInvoice = invoice;
    
    // Clear selected panels after save
    selectedPanels = [];
    localStorage.removeItem('selectedPanels');
    
    alert('Nota berhasil disimpan!');
    
    // Navigate based on setup
    window.location.href = 'history.html';
}

function printInvoice() {
    let invoice;
    if (!currentInvoice && selectedPanels.length > 0) {
        invoice = createTempInvoice();
    } else if (currentInvoice) {
        invoice = currentInvoice;
    } else {
        alert('Tidak ada nota untuk dicetak!');
        return;
    }
    
    printInvoiceContent(invoice);
}

function printInvoiceContent(invoice) {
    // Create print window
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - ${invoice.customer.name}</title>
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
                    box-shadow: 0 2px 8px rgba(204,24,24,0.10), 0 1.5px 8px rgba(0,0,0,0.07);
                    margin-bottom: 10px;
                    background: #fff;
                    display: block;
                }
                
                .header { 
                    border-bottom: 2px solid #cc1818;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                
                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                
                .company-info {
                    text-align: left;
                }
                
                .company-info h2 {
                    margin: 0;
                    font-size: 24px;
                    color: #cc1818;
                    font-weight: 700;
                }
                
                .document-info {
                    text-align: right;
                    background: #f8f8f8;
                    padding: 10px 15px;
                    border-radius: 5px;
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
                
                .customer-info p {
                    margin: 5px 0;
                }
                
                .content-layout {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                
                .car-diagram {
                    flex: 0 0 200px;
                    background: #f8f8f8;
                    padding: 15px;
                    border-radius: 5px;
                }
                
                .panels-table {
                    flex: 1;
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
                
                .panels-table tr:nth-child(even) {
                    background: #f8f8f8;
                }
                
                .sizes-legend {
                    background: #f8f8f8;
                    padding: 10px 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-size: 11px;
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
                    margin-top: 40px;
                    text-align: center;
                    font-size: 10px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-content">
                    <div class="company-info">
                        <img src="../images/mrpoles.jpg" alt="MrPoles" class="logo">
                        <h2>MRPOLES BODY REPAIR</h2>
                        <p>Professional Auto Body Solutions</p>
                        <p>Phone: +62 821-7592-2982</p>
                        <p>Instagram: @mrpoles_lampung</p>
                        <p style="font-weight:bold; margin-top:8px;">Estimasi - ${invoice.customer.name}</p> <!-- Tambahkan judul di sini -->
                    </div>
                    <div class="document-info">
                        <h3>SERVICE ORDER</h3>
                        <p><strong>No:</strong> INVOICE - ${invoice.id?.toString().substr(-6)}</p>
                        <p><strong>Date:</strong> ${invoice.date}</p>
                    </div>
                </div>
            </div>

            <div class="customer-info">
                <div>
                    <p><strong>Customer:</strong> ${invoice.customer.name}</p>
                    <p><strong>Phone:</strong> ${invoice.customer.phone}</p>
                </div>
                <div>
                    <p><strong>Car:</strong> ${invoice.customer.car}</p>
                    <p><strong>Color:</strong> ${invoice.customer.color}</p>
                </div>
                <div>
                    <p><strong>License:</strong> ${invoice.customer.license}</p>
                    <p><strong>Address:</strong> ${invoice.customer.address}</p>
                </div>
            </div>

            <div class="content-layout">
                <table class="panels-table">
                    <tr>
                        <th>PANEL</th>
                        <th>N</th>
                        <th>GB</th>
                        <th>OS</th>
                        <th>C</th>
                        <th>LC</th>
                        <th>MS</th>
                        <th>GC</th>
                        <th>AMOUNT</th>
                    </tr>
                    ${invoice.items.map(item => `
                        <tr>
                            <td><strong>${item.panel}</strong></td>
                            <td>${item.size === 'normal' ? '✓' : ''}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>${item.size === 'medium' ? '✓' : ''}</td>
                            <td>${item.size === 'premium' ? '✓' : ''}</td>
                            <td><strong>Rp ${item.price.toLocaleString()}</strong></td>
                        </tr>
                    `).join('')}
                </table>
            </div>

            <div class="sizes-legend">
                <strong>Size Categories:</strong><br>
                N: Normal | GB: Golf Ball | OS: Over Size | C: Crease | LC: Long Crease | MS: Mega Size | GC: Giant Crease
            </div>

            <div class="total-section">
                <p>Total: Rp ${invoice.total.toLocaleString()}</p>
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
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

function createTempInvoice() {
    const customerData = {
        name: document.getElementById('invoiceCustomerName').value || 'Customer',
        address: document.getElementById('invoiceCustomerAddress').value || '-',
        phone: document.getElementById('invoiceCustomerPhone').value || '-',
        car: document.getElementById('invoiceCustomerCar').value || '-',
        color: document.getElementById('invoiceCustomerColor').value || '-',
        license: document.getElementById('invoiceCustomerLicense').value || '-'
    };
    
    const prices = getPrices();
    const selects = document.querySelectorAll('#invoiceItemsList select');
    const items = [];
    let total = 0;
    
    selects.forEach(select => {
        const panelId = select.dataset.panel;
        const size = select.value;
        const price = prices[panelId][size];
        
        items.push({
            panel: panelNames[panelId],
            size: size,
            price: price
        });
        
        total += price;
    });
    
    return {
        number: 'INV-' + Date.now().toString().substr(-6),
        date: new Date().toLocaleDateString('id-ID'),
        customer: customerData,
        items: items,
        total: total
    };
}

// History functions
function loadHistory() {
    const estimates = JSON.parse(localStorage.getItem('estimates')) || [];
    const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    
    const estimatesContainer = document.getElementById('estimatesHistoryList');
    const invoicesContainer = document.getElementById('invoicesHistoryList');
    
    // Load estimates history
    if (estimatesContainer) {
        if (estimates.length === 0) {
            estimatesContainer.innerHTML = '<p>Belum ada estimasi tersimpan.</p>';
        } else {
            estimatesContainer.innerHTML = estimates.map(estimate => `
                <div class="history-item">
                    <div class="history-header">
                        <h4>${estimate.customer.name}</h4>
                        <span class="history-date">${estimate.date}</span>
                    </div>
                    <div class="history-details">
                        <p><strong>Mobil:</strong> ${estimate.customer.car} (${estimate.customer.color})</p>
                        <p><strong>Total:</strong> Rp ${estimate.total.toLocaleString()}</p>
                        <p><strong>Items:</strong> ${estimate.items.map(item => item.panel).join(', ')}</p>
                    </div>
                    <div class="history-actions">
                        <button class="btn-small btn-view" onclick="viewEstimate(${estimate.id})">View</button>
                        <button class="btn-small btn-print" onclick="reprintEstimate(${estimate.id})">Print</button>
                        <button class="btn-small btn-delete" onclick="deleteEstimate(${estimate.id})">Delete</button>
                        <button class="btn-small btn-view" onclick="createInvoiceFromEstimate(${estimate.id})">Buat Nota</button>
                    </div>
                </div>
            `).reverse().join('');
        }
    }

    // Load invoices history
    if (invoicesContainer) {
        if (invoices.length === 0) {
            invoicesContainer.innerHTML = '<p>Belum ada nota tersimpan.</p>';
        } else {
            invoicesContainer.innerHTML = invoices.map(invoice => `
                <div class="history-item">
                    <div class="history-header">
                        <h4>${invoice.customer.name}</h4>
                        <span class="history-date">${invoice.date}</span>
                    </div>
                    <div class="history-details">
                        <p><strong>Mobil:</strong> ${invoice.customer.car} (${invoice.customer.color})</p>
                        <p><strong>Total:</strong> Rp ${invoice.total.toLocaleString()}</p>
                        <p><strong>Items:</strong> ${invoice.items.map(item => item.panel).join(', ')}</p>
                    </div>
                    <div class="history-actions">
                        <button class="btn-small btn-view" onclick="viewInvoice(${invoice.id})">View</button>
                        <button class="btn-small btn-print" onclick="reprintInvoice(${invoice.id})">Print</button>
                        <button class="btn-small btn-delete" onclick="deleteInvoice(${invoice.id})">Delete</button>
                        <button class="btn-small btn-view" onclick="createEstimateFromInvoice(${invoice.id})">Buat Estimasi</button>
                    </div>
                </div>
            `).reverse().join('');
        }
    }
}

// Helper: Find estimate by ID
function findEstimateById(id) {
    const estimates = JSON.parse(localStorage.getItem('estimates')) || [];
    return estimates.find(e => e.id === id);
}

// Helper: Find invoice by ID
function findInvoiceById(id) {
    const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    return invoices.find(inv => inv.id === id);
}

// View Estimate
function viewEstimate(id) {
    const estimate = findEstimateById(id);
    if (!estimate) return alert('Estimasi tidak ditemukan!');
    localStorage.setItem('currentEstimate', JSON.stringify(estimate));
    window.location.href = 'estimate.html';
}

// Print Estimate from history
function reprintEstimate(id) {
    const estimate = findEstimateById(id);
    if (!estimate) return alert('Estimasi tidak ditemukan!');
    printEstimateContent(estimate);
}

// Delete Estimate
function deleteEstimate(id) {
    if (!confirm('Hapus estimasi ini?')) return;
    let estimates = JSON.parse(localStorage.getItem('estimates')) || [];
    estimates = estimates.filter(e => e.id !== id);
    localStorage.setItem('estimates', JSON.stringify(estimates));
    loadHistory();
}

// View Invoice
function viewInvoice(id) {
    const invoice = findInvoiceById(id);
    if (!invoice) return alert('Nota tidak ditemukan!');
    localStorage.setItem('currentInvoice', JSON.stringify(invoice));
    window.location.href = 'invoice.html';
}

// Print Invoice from history
function reprintInvoice(id) {
    const invoice = findInvoiceById(id);
    if (!invoice) return alert('Nota tidak ditemukan!');
    printInvoiceContent(invoice);
}

// Delete Invoice
function deleteInvoice(id) {
    if (!confirm('Hapus nota ini?')) return;
    let invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    invoices = invoices.filter(inv => inv.id !== id);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    loadHistory();
}

// Tab switching for history.html
function showHistoryTab(tab) {
    const estimatesTab = document.getElementById('estimatesHistory');
    const invoicesTab = document.getElementById('invoicesHistory');
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tab === 'estimates') {
        estimatesTab.classList.add('active');
        invoicesTab.classList.remove('active');
        tabBtns[0].classList.add('active');
        tabBtns[1].classList.remove('active');
    } else {
        estimatesTab.classList.remove('active');
        invoicesTab.classList.add('active');
        tabBtns[0].classList.remove('active');
        tabBtns[1].classList.add('active');
    }
}

function resetSelectedPanels() {
    selectedPanels = [];
    localStorage.removeItem('selectedPanels');
    updateSelectedPanelsList();
    // Optionally, remove 'selected' class from all panel buttons
    document.querySelectorAll('.panel-btn.selected').forEach(btn => btn.classList.remove('selected'));
}

function createInvoiceFromEstimate(estimateId) {
    const estimate = findEstimateById(estimateId);
    if (!estimate) return alert('Estimasi tidak ditemukan!');
    // Prepare data for invoice page
    localStorage.setItem('currentInvoice', JSON.stringify({
        customer: estimate.customer,
        items: estimate.items,
        date: new Date().toLocaleDateString('id-ID'),
        number: 'INV-' + Date.now().toString().substr(-6),
        total: estimate.total
    }));
    // Also set selectedPanels for invoice page
    selectedPanels = estimate.items.map(item => {
        const panelKey = Object.keys(panelNames).find(key => panelNames[key] === item.panel);
        return panelKey;
    }).filter(Boolean);
    localStorage.setItem('selectedPanels', JSON.stringify(selectedPanels));
    window.location.href = 'invoice.html';
}

function createEstimateFromInvoice(invoiceId) {
    const invoice = findInvoiceById(invoiceId);
    if (!invoice) return alert('Nota tidak ditemukan!');
    // Prepare data for estimate page
    localStorage.setItem('currentEstimate', JSON.stringify({
        customer: invoice.customer,
        items: invoice.items,
        date: new Date().toLocaleDateString('id-ID'),
        total: invoice.total
    }));
    // Also set selectedPanels for estimate page
    selectedPanels = invoice.items.map(item => {
        const panelKey = Object.keys(panelNames).find(key => panelNames[key] === item.panel);
        return panelKey;
    }).filter(Boolean);
    localStorage.setItem('selectedPanels', JSON.stringify(selectedPanels));
    window.location.href = 'estimate.html';
}