// supabaseManager.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ============ CONFIGURATION ============
const supabaseUrl = 'https://cmmtqnfiseiathmtxajz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbXRxbmZpc2VpYXRobXR4YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTIyNzEsImV4cCI6MjA4Mjc2ODI3MX0.atai377maH07ojRCWGJ9XajYtzgwm7mEGAX9Rcxsuwg';
// ============ END CONFIGURATION ============

const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase initialized with URL:', supabaseUrl);

// Test function to verify tables exist
async function verifyTables() {
  try {
    const tables = ['prices', 'estimates', 'invoices'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`⚠️ Table '${table}' might not exist or has error:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists, has ${data?.length || 0} rows`);
      }
    }
  } catch (err) {
    console.error('Error verifying tables:', err);
  }
}

// Run verification on load
verifyTables();

// Unified response creator
function createResponse(data, status = "success") {
  return {
    status: status,
    data: data,
    error: status === "error" ? (data?.message || data?.error || "Unknown error") : null
  };
}

export async function loginUser(username, password) {
    try {
        console.log('🔵 Login attempt for user:', username);
        
        // Query the users table
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .maybeSingle();
        
        if (error) {
            console.error('❌ Login query error:', error);
            return { success: false, error: 'Database error' };
        }
        
        if (!data) {
            console.log('❌ Invalid credentials for user:', username);
            return { success: false, error: 'Invalid username or password' };
        }
        
        console.log('✅ Login successful for user:', username);
        
        // Return user data without password
        return { 
            success: true, 
            user: {
                id: data.id,
                username: data.username,
                name: data.name || data.username,
                role: data.role || 'staff'
            }
        };
        
    } catch (err) {
        console.error('❌ Login error:', err.message);
        return { success: false, error: err.message };
    }
}

// ======== PRICES HANDLING ========
export async function savePrices(prices) {
  try {
    console.log('🔵 savePrices called with keys:', Object.keys(prices || {}));
    
    // Validate input
    if (!prices || typeof prices !== 'object') {
      console.error('❌ Prices data is invalid or empty');
      return { success: false, error: 'Prices data is invalid or empty' };
    }
    
    const priceKeys = Object.keys(prices);
    if (priceKeys.length === 0) {
      console.error('❌ Cannot save empty prices object');
      return { success: false, error: 'Cannot save empty prices object' };
    }
    
    console.log(`🔄 Clearing existing prices (${priceKeys.length} items to save)...`);
    
    // Clear existing prices first
    const { error: deleteError } = await supabase
      .from('prices')
      .delete()
      .neq('panel_id', '');
    
    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      return { success: false, error: deleteError.message };
    }
    
    // Prepare data for batch insert
    const priceArray = priceKeys.map(panelId => {
      const priceData = prices[panelId];
      return {
        panel_id: panelId,
        name: priceData?.name || panelId,
        normal: parseInt(priceData?.normal) || 0,
        medium: parseInt(priceData?.medium) || 0,
        premium: parseInt(priceData?.premium) || 0
      };
    });
    
    console.log(`🔄 Inserting ${priceArray.length} prices...`, priceArray);
    
    // Insert new prices
    const { error: insertError } = await supabase
      .from('prices')
      .insert(priceArray);
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return { success: false, error: insertError.message };
    }
    
    console.log('✅ Prices saved successfully');
    return { success: true, count: priceArray.length };
  } catch (err) {
    console.error('❌ Error saving prices:', err.message);
    return { success: false, error: err.message };
  }
}

export async function getPrices() {
  try {
    console.log('🔵 getPrices called');
    
    const { data, error } = await supabase
      .from('prices')
      .select('*')
      .order('panel_id');
    
    if (error) {
      console.error('❌ Get prices error:', error);
      return {};
    }
    
    // Convert to expected format
    const prices = {};
    data.forEach(item => {
      prices[item.panel_id] = {
        name: item.name,
        normal: item.normal,
        medium: item.medium,
        premium: item.premium
      };
    });
    
    console.log(`✅ Got ${Object.keys(prices).length} prices`);
    return prices;
  } catch (err) {
    console.error('❌ Error getting prices:', err.message);
    return {};
  }
}

// Updated addPrice to use the bulk approach
export async function addPrice(price) {
  try {
    console.log('🔵 addPrice called with:', price);
    
    if (!price || !price.panelId) {
      console.error('❌ Price object is invalid or missing panelId');
      return { success: false, error: 'Price object is invalid' };
    }
    
    // Get current prices
    console.log('🔄 Fetching current prices...');
    const { data: currentPrices, error: fetchError } = await supabase
      .from('prices')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Fetch error in addPrice:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    console.log(`🔄 Current prices count: ${currentPrices?.length || 0}`);
    
    // Convert to object format
    const pricesObj = {};
    if (currentPrices && currentPrices.length > 0) {
      currentPrices.forEach(item => {
        pricesObj[item.panel_id] = {
          name: item.name,
          normal: item.normal,
          medium: item.medium,
          premium: item.premium
        };
      });
    }
    
    // Add new price
    pricesObj[price.panelId] = {
      name: price.name || `Item ${price.panelId}`,
      normal: parseInt(price.normal) || 0,
      medium: parseInt(price.medium) || 0,
      premium: parseInt(price.premium) || 0
    };
    
    console.log(`🔄 Updated prices object has ${Object.keys(pricesObj).length} items`);
    
    // Save entire updated object
    console.log('🔄 Calling savePrices with updated object...');
    const result = await savePrices(pricesObj);
    
    if (result.success) {
      console.log(`✅ Price added successfully (ID: ${price.panelId})`);
    } else {
      console.error('❌ Failed to save prices in addPrice');
    }
    
    return result;
  } catch (err) {
    console.error('❌ Error in addPrice:', err.message);
    return { success: false, error: err.message };
  }
}

// Updated deletePrice to use the bulk approach
export async function deletePrice(panelId) {
  try {
    console.log('🔵 deletePrice called for:', panelId);
    
    if (!panelId) {
      return { success: false, error: 'Panel ID is required' };
    }
    
    // Get current prices
    console.log('🔄 Fetching current prices...');
    const { data: currentPrices, error: fetchError } = await supabase
      .from('prices')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Fetch error in deletePrice:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    console.log(`🔄 Current prices count: ${currentPrices?.length || 0}`);
    
    // Convert to object format and delete
    const pricesObj = {};
    let found = false;
    
    if (currentPrices && currentPrices.length > 0) {
      currentPrices.forEach(item => {
        if (item.panel_id !== panelId) {
          pricesObj[item.panel_id] = {
            name: item.name,
            normal: item.normal,
            medium: item.medium,
            premium: item.premium
          };
        } else {
          found = true;
        }
      });
    }
    
    if (!found) {
      console.log(`⚠️ Panel ID ${panelId} not found`);
      return { success: false, error: `Panel ID ${panelId} not found` };
    }
    
    console.log(`🔄 Updated prices object has ${Object.keys(pricesObj).length} items (removed 1)`);
    
    // Save entire updated object
    const result = await savePrices(pricesObj);
    
    if (result.success) {
      console.log(`✅ Price deleted successfully (ID: ${panelId})`);
    }
    
    return result;
  } catch (err) {
    console.error('❌ Error in deletePrice:', err.message);
    return { success: false, error: err.message };
  }
}

// ======== DOCUMENT HANDLING ========
export async function saveEstimate(estimate) {
  console.log('🔵 saveEstimate called');
  return saveDocument('estimates', estimate);
}

export async function saveInvoice(invoice) {
  console.log('🔵 saveInvoice called');
  return saveDocument('invoices', invoice);
}

async function saveDocument(tableName, doc) {
  try {
    console.log(`🔵 saveDocument called for ${tableName}:`, doc);
    
    const id = doc.id || Date.now().toString();
    
    const documentData = {
      id: id,
      date: new Date().toISOString(),
      customer_name: doc.customer?.name || '',
      address: doc.customer?.address || '',
      phone: doc.customer?.phone || '',
      car: doc.customer?.car || '',
      color: doc.customer?.color || '',
      license: doc.customer?.license || '',
      items: doc.items || [],
      total: parseInt(doc.total) || 0
    };
    
    console.log(`🔄 Saving ${tableName} data:`, documentData);
    
    // Check if exists
    const { data: existing, error: checkError } = await supabase
      .from(tableName)
      .select('id')
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors if not found
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error(`❌ Check error for ${tableName}:`, checkError);
      return { success: false, error: checkError.message };
    }
    
    let result;
    if (existing) {
      // Update existing
      console.log(`🔄 Updating existing ${tableName} ID: ${id}`);
      const { error } = await supabase
        .from(tableName)
        .update(documentData)
        .eq('id', id);
      
      if (error) {
        console.error(`❌ Update error for ${tableName}:`, error);
        return { success: false, error: error.message };
      }
      result = { success: true, id, action: 'updated' };
    } else {
      // Insert new
      console.log(`🔄 Inserting new ${tableName} ID: ${id}`);
      const { error } = await supabase
        .from(tableName)
        .insert(documentData);
      
      if (error) {
        console.error(`❌ Insert error for ${tableName}:`, error);
        return { success: false, error: error.message };
      }
      result = { success: true, id, action: 'inserted' };
    }
    
    console.log(`✅ ${tableName} saved successfully`);
    return result;
  } catch (err) {
    console.error(`❌ Error saving ${tableName}:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function getHistory() {
  try {
    console.log('🔵 getHistory called');
    
    const [estimates, invoices] = await Promise.all([
      getDocuments('estimates'),
      getDocuments('invoices')
    ]);
    
    console.log(`✅ Got ${estimates.length} estimates and ${invoices.length} invoices`);
    
    return {
      estimates,
      invoices
    };
  } catch (err) {
    console.error('❌ Error getting history:', err.message);
    return { estimates: [], invoices: [] };
  }
}

async function getDocuments(tableName) {
  try {
    console.log(`🔵 getDocuments called for ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error(`❌ Get error for ${tableName}:`, error);
      return [];
    }
    
    console.log(`✅ Got ${data.length} ${tableName}`);
    
    return data.map(doc => ({
      id: doc.id,
      date: doc.date,
      customer: {
        name: doc.customer_name || '',
        address: doc.address || '',
        phone: doc.phone || '',
        car: doc.car || '',
        color: doc.color || '',
        license: doc.license || ''
      },
      items: doc.items || [],
      total: doc.total
    }));
  } catch (err) {
    console.error(`❌ Error getting ${tableName}:`, err.message);
    return [];
  }
}

export async function deleteEstimate(id) {
  console.log(`🔵 deleteEstimate called for ID: ${id}`);
  return deleteDocument('estimates', id);
}

export async function deleteInvoice(id) {
  console.log(`🔵 deleteInvoice called for ID: ${id}`);
  return deleteDocument('invoices', id);
}

async function deleteDocument(tableName, id) {
  try {
    console.log(`🔄 Deleting ${tableName} ID: ${id}`);
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`❌ Delete error for ${tableName}:`, error);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ ${tableName} deleted successfully`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Error deleting ${tableName}:`, err.message);
    return { success: false, error: err.message };
  }
}

// For backward compatibility - FIXED VERSION
export async function doPost(action, payload) {
  try {
    console.log('🔵 doPost called with:', { action, payload });
    
    // Extract data from the payload structure
    // The payload should be: { data: { price: {...} } } or { data: { prices: {...} } } etc.
    const data = payload?.data || {};
    
    console.log(`🔄 Processing action: ${action} with data:`, data);
    
    let result;
    
    switch(action) {
      case 'login':
        result = await loginUser(data.username, data.password);
        break;
      case 'savePrices':
        result = await savePrices(data.prices);
        break;
      case 'saveEstimate':
        result = await saveEstimate(data.estimate);
        break;
      case 'saveInvoice':
        result = await saveInvoice(data.invoice);
        break;
      case 'getHistory':
        result = await getHistory();
        break;
      case 'getPrices':
        result = await getPrices();
        break;
      case 'deleteEstimate':
        result = await deleteEstimate(data.id);
        break;
      case 'deleteInvoice':
        result = await deleteInvoice(data.id);
        break;
      case 'addPrice':
        console.log('🔄 addPrice case - data.price:', data.price);
        result = await addPrice(data.price);
        break;
      case 'deletePrice':
        result = await deletePrice(data.panelId);
        break;
      default:
        console.error(`❌ Invalid action: ${action}`);
        return {
          status: "error",
          data: null,
          error: `Invalid action: ${action}`
        };
    }
    
    console.log(`✅ doPost result for ${action}:`, result);
    
    return {
      status: result?.success !== false ? "success" : "error",
      data: result,
      error: result?.error || null
    };
  } catch (err) {
    console.error('❌ doPost error:', err.message, err.stack);
    return {
      status: "error",
      data: null,
      error: err.message
    };
  }
}