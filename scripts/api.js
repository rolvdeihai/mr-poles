import * as supabaseManager from './supabaseManager.js';

// Simple localStorage auth check
const AUTH_KEY = 'mrpoles_user';

// Check if user is logged in
function checkLocalStorageAuth() {
    const user = localStorage.getItem(AUTH_KEY);
    if (!user) {
        window.location.href = '/auth/login.html';
        throw new Error('Not authenticated. Please login.');
    }
    return true;
}

// Unified request function with auth check
async function sendRequest(action, data = {}) {
  try {
    console.log(`🔵 [API] ${action} request:`, data);
    
    // Check authentication for all actions except login
    if (action !== 'login') {
        checkLocalStorageAuth();
    }
    
    // Pass the data in the correct structure
    const result = await supabaseManager.doPost(action, { data });
    
    console.log(`🔵 [API] ${action} result:`, result);
    
    if (result.status === "error") {
      console.error(`❌ [API] ${action} error:`, result.error);
      throw new Error(result.error || "API Error");
    }
    
    console.log(`✅ [API] ${action} success`);
    return result.data;
  } catch (error) {
    console.error(`❌ [API] ${action} failed:`, error.message);
    throw error;
  }
}

// ============ AUTH API ============
export async function login(username, password) {
  console.log('[API] login attempt for:', username);
  try {
    const result = await sendRequest('login', { username, password });
    
    if (result && result.success && result.user) {
      // Store user session in localStorage
      localStorage.setItem(AUTH_KEY, JSON.stringify(result.user));
      return { success: true, user: result.user };
    } else {
      return { success: false, error: result?.error || 'Login failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logout() {
  console.log('[API] logout');
  localStorage.removeItem(AUTH_KEY);
  return { success: true };
}

export async function checkAuth() {
  const user = localStorage.getItem(AUTH_KEY);
  if (user) {
    return { success: true, user: JSON.parse(user) };
  }
  return { success: false, error: 'Not authenticated' };
}

// ============ PRICES API ============
export async function savePrices(prices) {
  console.log('[API] savePrices (BULK):', Object.keys(prices || {}).length, 'items');
  return sendRequest('savePrices', { prices });
}

export async function getPrices() {
  console.log('[API] getPrices');
  return sendRequest('getPrices', {});
}

export async function addPrice(price) {
  console.log('[API] addPrice (SINGLE):', price);
  return sendRequest('addPrice', { price });
}

export async function deletePrice(panelId) {
  console.log('[API] deletePrice:', panelId);
  return sendRequest('deletePrice', { panelId });
}

// ============ DOCUMENTS API ============
export async function saveEstimate(estimate) {
  console.log('[API] saveEstimate:', estimate);
  return sendRequest('saveEstimate', { estimate });
}

export async function saveInvoice(invoice) {
  console.log('[API] saveInvoice:', invoice);
  return sendRequest('saveInvoice', { invoice });
}

export async function getHistory() {
  console.log('[API] getHistory');
  return sendRequest('getHistory', {});
}

export async function deleteEstimate(id) {
  console.log('[API] deleteEstimate:', id);
  return sendRequest('deleteEstimate', { id });
}

export async function deleteInvoice(id) {
  console.log('[API] deleteInvoice:', id);
  return sendRequest('deleteInvoice', { id });
}

// For direct access if needed
export { supabaseManager };