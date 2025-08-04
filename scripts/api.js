// scripts/api.js
const API_URL = 'https://script.google.com/macros/s/AKfycbwaOg0XDyI1kKdcT0734sWZ8ezN3hP4ItUXdrD6X8OA1_s17QTrAHuW4_QwCavZfP-g/exec';
const SECRET_KEY = "yoyo"; // Match backend secret

// Unified Axios request function
async function sendRequest(action, data = {}) {
  try {
    const payload = {
      action: action,
      data: data,
      secret: SECRET_KEY  // Include secret key
    };

    const response = await axios.post(API_URL, JSON.stringify(payload), {
      headers: { 
        'Content-Type': 'text/plain;charset=utf-8' 
      }
    });

    if (response.data.status === "error") {
      throw new Error(response.data.error || "API Error");
    }
    
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Prices API
export async function savePrices(prices) {
  return sendRequest('savePrices', { prices });
}

export async function getPrices() {
  return sendRequest('getPrices');
}

// Documents API
export async function saveEstimate(estimate) {
  return sendRequest('saveEstimate', { estimate });
}

export async function saveInvoice(invoice) {
  return sendRequest('saveInvoice', { invoice });
}

export async function getHistory() {
  return sendRequest('getHistory');
}

export async function deleteEstimate(id) {
  return sendRequest('deleteEstimate', { id });
}

export async function deleteInvoice(id) {
  return sendRequest('deleteInvoice', { id });
}

export async function addPrice(price) {
  return sendRequest('addPrice', { price });
}

export async function deletePrice(panelId) {
  return sendRequest('deletePrice', { panelId });
}