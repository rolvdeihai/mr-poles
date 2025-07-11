// history.js - Logic for history.html
import * as api from './api.js';

// Panel Names Mapping
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

let currentEstimatePage = 1;
let currentInvoicePage = 1;
const itemsPerPage = 5;
let filteredEstimates = [];
let filteredInvoices = [];

// Create reverse mapping for display names to IDs
const reversePanelMap = {};
Object.entries(panelNames).forEach(([id, name]) => {
    reversePanelMap[name] = id;
});

// Global variables
let estimates = [];
let invoices = [];

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const response = await api.getHistory();
        
        // Safe document parsing with fallbacks
        estimates = (response.estimates || []).map(doc => ({
            ...doc,
            // Ensure items is always an array
            items: Array.isArray(doc.items) ? doc.items : [],
            // Add fallback for customer object
            customer: doc.customer || {
                name: doc['customer name'] || '',
                address: doc.address || '',
                phone: doc.phone || '',
                car: doc.car || '',
                color: doc.color || '',
                license: doc.license || ''
            }
        }));
        
        invoices = (response.invoices || []).map(doc => ({
            ...doc,
            items: Array.isArray(doc.items) ? doc.items : [],
            customer: doc.customer || {
                name: doc['customer name'] || '',
                address: doc.address || '',
                phone: doc.phone || '',
                car: doc.car || '',
                color: doc.color || '',
                license: doc.license || ''
            }
        }));

        filteredEstimates = [...estimates];
        filteredInvoices = [...invoices];
        
        setupHistoryControls();
        loadHistory();
    } catch (error) {
        console.error('Failed to load history:', error);
        alert('Failed to load history. Please try again later.');
    }
});

// Normalize document data from backend
function normalizeDocument(doc) {
    // Handle different backend data structures
    return {
        id: doc.id || doc.ID || Date.now(),
        date: doc.date || new Date().toLocaleDateString('id-ID'),
        customer: {
            name: doc['customer name'] || doc.customer?.name || '',
            address: doc.address || doc.customer?.address || '',
            phone: doc.phone || doc.customer?.phone || '',
            car: doc.car || doc.customer?.car || '',
            color: doc.color || doc.customer?.color || '',
            license: doc.license || doc.customer?.license || ''
        },
        items: Array.isArray(doc.items) ? 
            doc.items.map(item => ({
                ...item,
                panelId: item.panelId || reversePanelMap[item.panel] || ''
            })) : [],
        total: doc.total || 0,
        number: doc.number || (doc.id ? 'INV-' + doc.id.toString().substr(-6) : '')
    };
}

function setupHistoryControls() {
  const searchInput = document.getElementById('searchInput');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    filteredEstimates = estimates.filter(doc => 
      doc.customer.name.toLowerCase().includes(term) ||
      doc.customer.car.toLowerCase().includes(term) ||
      doc.date.toLowerCase().includes(term)
    );
    
    filteredInvoices = invoices.filter(doc => 
      doc.customer.name.toLowerCase().includes(term) ||
      doc.customer.car.toLowerCase().includes(term) ||
      doc.date.toLowerCase().includes(term)
    );
    
    currentEstimatePage = 1;
    currentInvoicePage = 1;
    loadHistory();
  });

  // Pagination handlers
  prevBtn.addEventListener('click', () => {
    const activeTab = document.querySelector('.history-content.active').id;
    if (activeTab === 'estimatesHistory' && currentEstimatePage > 1) {
      currentEstimatePage--;
      loadHistory();
    } else if (activeTab === 'invoicesHistory' && currentInvoicePage > 1) {
      currentInvoicePage--;
      loadHistory();
    }
  });

  nextBtn.addEventListener('click', () => {
    const activeTab = document.querySelector('.history-content.active').id;
    if (activeTab === 'estimatesHistory' && 
        currentEstimatePage < Math.ceil(filteredEstimates.length/itemsPerPage)) {
      currentEstimatePage++;
      loadHistory();
    } else if (activeTab === 'invoicesHistory' && 
               currentInvoicePage < Math.ceil(filteredInvoices.length/itemsPerPage)) {
      currentInvoicePage++;
      loadHistory();
    }
  });
}

function loadHistory() {
  // Define container elements inside the function
  const estimatesContainer = document.getElementById('estimatesHistoryList');
  const invoicesContainer = document.getElementById('invoicesHistoryList');
  const pageInfoElement = document.getElementById('pageInfo');

  // Calculate pagination slices
  const estimateStart = (currentEstimatePage - 1) * itemsPerPage;
  const estimateSlice = filteredEstimates.slice(estimateStart, estimateStart + itemsPerPage);
  
  const invoiceStart = (currentInvoicePage - 1) * itemsPerPage;
  const invoiceSlice = filteredInvoices.slice(invoiceStart, invoiceStart + itemsPerPage);
  
  // Update page info
  if (pageInfoElement) {
    const activeTab = document.querySelector('.history-content.active').id;
    if (activeTab === 'estimatesHistory') {
      pageInfoElement.textContent = `Page ${currentEstimatePage} of ${Math.ceil(filteredEstimates.length / itemsPerPage)}`;
    } else if (activeTab === 'invoicesHistory') {
      pageInfoElement.textContent = `Page ${currentInvoicePage} of ${Math.ceil(filteredInvoices.length / itemsPerPage)}`;
    }
  }

  // Render estimates
  if (estimatesContainer) {
    if (filteredEstimates.length === 0) {
      estimatesContainer.innerHTML = '<p>No matching estimates found</p>';
    } else {
      estimatesContainer.innerHTML = estimateSlice.map(estimate => {
        // Create chunks of 3 items per line
        const itemsChunks = [];
        for (let i = 0; i < estimate.items.length; i += 3) {
            itemsChunks.push(estimate.items.slice(i, i + 3).map(item => item.panel).join(', '));
        }
        
        const itemsHTML = itemsChunks.join('<br>');
        
        return`
            <div class="history-item">
            <div class="history-header">
                <h4>${estimate.customer.name}</h4>
                <span class="history-date">${estimate.date}</span>
            </div>
            <div class="history-details">
                <p><strong>Car:</strong> ${estimate.customer.car} (${estimate.customer.color})</p>
                <p><strong>Total:</strong> Rp ${estimate.total.toLocaleString()}</p>
                <p><strong>Items:</strong> ${itemsHTML}</p>
            </div>
            <div class="history-actions">
                <button class="btn-small btn-view" onclick="viewEstimate('${estimate.id}')">View</button>
                <button class="btn-small btn-print" onclick="reprintEstimate('${estimate.id}')">Print</button>
                <button class="btn-small btn-delete" onclick="deleteEstimate('${estimate.id}')">Delete</button>
                <button class="btn-small btn-view" onclick="createInvoiceFromEstimate('${estimate.id}')">Create Invoice</button>
            </div>
            </div>
      `}).join('');
    }
  }
  
  // Render invoices
  if (invoicesContainer) {
    if (filteredInvoices.length === 0) {
      invoicesContainer.innerHTML = '<p>No matching invoices found</p>';
    } else {
      invoicesContainer.innerHTML = invoiceSlice.map(invoice => {
        const itemsChunks = [];
        for (let i = 0; i < invoice.items.length; i += 3) {
            itemsChunks.push(invoice.items.slice(i, i + 3).map(item => item.panel).join(', '));
        }
        
        const itemsHTML = itemsChunks.join('<br>');
        
        return `
            <div class="history-item">
            <div class="history-header">
                <h4>${invoice.customer.name}</h4>
                <span class="history-date">${invoice.date}</span>
            </div>
            <div class="history-details">
                <p><strong>Car:</strong> ${invoice.customer.car} (${invoice.customer.color})</p>
                <p><strong>Total:</strong> Rp ${invoice.total.toLocaleString()}</p>
                <p><strong>Items:</strong> ${itemsHTML}</p>
            </div>
            <div class="history-actions">
                <button class="btn-small btn-view" onclick="viewInvoice('${invoice.id}')">View</button>
                <button class="btn-small btn-print" onclick="reprintInvoice('${invoice.id}')">Print</button>
                <button class="btn-small btn-delete" onclick="deleteInvoice('${invoice.id}')">Delete</button>
                <button class="btn-small btn-view" onclick="createEstimateFromInvoice('${invoice.id}')">Create Estimate</button>
            </div>
            </div>
      `}).join('');
    }
  }
}

// View Estimate
function viewEstimate(id) {
    const estimate = estimates.find(e => e.id == id);
    if (!estimate) return alert('Estimate not found!');

    // Ensure panel IDs are set
    const itemsWithPanelIds = estimate.items.map(item => ({
        ...item,
        panelId: item.panelId || reversePanelMap[item.panel] || ''
    }));

    // Pass data with panel IDs
    sessionStorage.setItem('currentEstimate', JSON.stringify({
        ...estimate,
        items: itemsWithPanelIds
    }));
    
    // Set panel IDs for loading
    const panelIds = itemsWithPanelIds.map(item => item.panelId).filter(Boolean);
    sessionStorage.setItem('pendingEstimatePanels', JSON.stringify(panelIds));
    
    window.location.href = 'estimate.html';
}

// Print Estimate
function reprintEstimate(id) {
    const estimate = estimates.find(e => e.id == id);
    if (!estimate) {
        alert('Estimate not found!');
        return;
    }

    printEstimateContent(estimate);
}

// Delete Estimate
async function deleteEstimate(id) {
  if (!confirm('Are you sure you want to delete this estimate?')) return;
  showLoading();

  try {
    const response = await api.deleteEstimate(id);
    if (response.success) {
      // Remove from local list
      estimates = estimates.filter(e => e.id != id);
      loadHistory();
      alert('Estimate deleted successfully!');
    } else {
      alert('Failed to delete estimate: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Error deleting estimate: ' + error.message);
  } finally {
    hideLoading();
  }
}

// View Invoice
function viewInvoice(id) {
    const invoice = invoices.find(inv => inv.id == id);
    if (!invoice) return alert('Invoice not found!');

    // Ensure panel IDs are set
    const itemsWithPanelIds = invoice.items.map(item => ({
        ...item,
        panelId: item.panelId || reversePanelMap[item.panel] || ''
    }));

    sessionStorage.setItem('currentInvoice', JSON.stringify({
        ...invoice,
        items: itemsWithPanelIds
    }));
    
    const panelIds = itemsWithPanelIds.map(item => item.panelId).filter(Boolean);
    sessionStorage.setItem('pendingInvoicePanels', JSON.stringify(panelIds));
    
    window.location.href = 'invoice.html';
}

// Print Invoice
function reprintInvoice(id) {
    const invoice = invoices.find(inv => inv.id == id);
    if (!invoice) {
        alert('Invoice not found!');
        return;
    }

    printInvoiceContent(invoice);
}

// Delete Invoice
async function deleteInvoice(id) {
  if (!confirm('Are you sure you want to delete this invoice?')) return;
  showLoading();
  
  try {
    const response = await api.deleteInvoice(id);
    if (response.success) {
      // Remove from local list
      invoices = invoices.filter(inv => inv.id != id);
      loadHistory();
      alert('Invoice deleted successfully!');
    } else {
      alert('Failed to delete invoice: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Error deleting invoice: ' + error.message);
  } finally {
    hideLoading();
  }
}

function showLoading() {
  const loader = document.getElementById('loadingIndicator');
  if (loader) loader.style.display = 'block';
}

function hideLoading() {
  const loader = document.getElementById('loadingIndicator');
  if (loader) loader.style.display = 'none';
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

// Create invoice from estimate
function createInvoiceFromEstimate(estimateId) {
    const estimate = estimates.find(e => e.id == estimateId);
    if (!estimate) return alert('Estimate not found!');

    // Ensure panel IDs are set
    const itemsWithPanelIds = estimate.items.map(item => ({
        ...item,
        panelId: item.panelId || reversePanelMap[item.panel] || ''
    }));

    sessionStorage.setItem('currentInvoice', JSON.stringify({
        customer: estimate.customer,
        items: itemsWithPanelIds,
        date: new Date().toLocaleDateString('id-ID'),
        id: Date.now(),
        number: 'INV-' + Date.now().toString().substr(-6),
        total: estimate.total
    }));
    
    const panelIds = itemsWithPanelIds.map(item => item.panelId).filter(Boolean);
    sessionStorage.setItem('pendingInvoicePanels', JSON.stringify(panelIds));
    
    window.location.href = 'invoice.html';
}

// Create estimate from invoice
function createEstimateFromInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id == invoiceId);
    if (!invoice) return alert('Invoice not found!');

    // Ensure panel IDs are set
    const itemsWithPanelIds = invoice.items.map(item => ({
        ...item,
        panelId: item.panelId || reversePanelMap[item.panel] || ''
    }));

    sessionStorage.setItem('currentEstimate', JSON.stringify({
        customer: invoice.customer,
        items: itemsWithPanelIds,
        date: new Date().toLocaleDateString('id-ID'),
        id: Date.now(),
        total: invoice.total
    }));
    
    const panelIds = itemsWithPanelIds.map(item => item.panelId).filter(Boolean);
    sessionStorage.setItem('pendingEstimatePanels', JSON.stringify(panelIds));
    
    window.location.href = 'estimate.html';
}

// Function to generate printable content for estimates
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
                <div class="company-info">
                    <img src="../images/mrpoles.jpg" alt="MrPoles" class="logo">
                    <h2>MRPOLES BODY REPAIR</h2>
                    <p>Professional Auto Body Solutions</p>
                    <p>Phone: +62 821-7592-2982</p>
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
                ${estimate.items.map(item => `
                    <tr>
                        <td><strong>${item.panel}</strong></td>
                        <td><strong>Rp ${item.price.toLocaleString()}</strong></td>
                    </tr>
                `).join('')}
            </table>
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

// Function to generate printable content for invoices
function printInvoiceContent(invoice) {
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
                <div class="company-info">
                    <img src="../images/mrpoles.jpg" alt="MrPoles" class="logo">
                    <h2>MRPOLES BODY REPAIR</h2>
                    <p>Professional Auto Body Solutions</p>
                    <p>Phone: +62 821-7592-2982</p>
                    <p>Instagram: @mrpoles_lampung</p>
                    <p style="font-weight:bold; margin-top:8px;">Invoice - ${invoice.customer.name}</p>
                </div>
                <div class="document-info">
                    <h3>SERVICE ORDER</h3>
                    <p><strong>No:</strong> ${invoice.number || 'INV-' + invoice.id.toString().substr(-6)}</p>
                    <p><strong>Date:</strong> ${invoice.date}</p>
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
            <table class="panels-table">
                <tr>
                    <th>PANEL</th>
                    <th>AMOUNT</th>
                </tr>
                ${invoice.items.map(item => `
                    <tr>
                        <td><strong>${item.panel}</strong></td>
                        <td><strong>Rp ${item.price.toLocaleString()}</strong></td>
                    </tr>
                `).join('')}
            </table>
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

// Expose functions to global scope
window.viewEstimate = viewEstimate;
window.reprintEstimate = reprintEstimate;
window.deleteEstimate = deleteEstimate;
window.viewInvoice = viewInvoice;
window.reprintInvoice = reprintInvoice;
window.deleteInvoice = deleteInvoice;
window.showHistoryTab = showHistoryTab;
window.createInvoiceFromEstimate = createInvoiceFromEstimate;
window.createEstimateFromInvoice = createEstimateFromInvoice;