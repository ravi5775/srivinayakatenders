import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const GOOGLE_SHEETS_API_URL = "https://sheets.googleapis.com/v4/spreadsheets";

interface RequestBody {
  action: string;
  data?: any;
  spreadsheetId: string;
  sheetName?: string;
}

interface GoogleCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { action, data, spreadsheetId, sheetName }: RequestBody = await req.json();
    
    // Get service account credentials from Supabase secrets
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      throw new Error('Google service account key not configured');
    }

    const credentials = JSON.parse(serviceAccountKey);
    
    // Create JWT for Google API authentication
    const token = await getAccessToken(credentials);
    
    let result;
    
    switch (action) {
      case 'getCustomers':
        result = await getSheetData(spreadsheetId, `${sheetName || 'Master'}!A2:Z`, token);
        break;
      case 'addCustomer':
        result = await appendToSheet(spreadsheetId, `${sheetName || 'Master'}!A:Z`, [data], token);
        // Also add to logbook
        await addLogEntry(spreadsheetId, token, 'ADD_USER', data.actorEmail || 'system', data);
        break;
      case 'updateCustomer':
        result = await updateSheetRow(spreadsheetId, sheetName || 'Master', data, token);
        await addLogEntry(spreadsheetId, token, 'UPDATE_USER', data.actorEmail || 'system', data);
        break;
      case 'addPayment':
        result = await addPaymentRecord(spreadsheetId, data, token);
        break;
      case 'getPayments':
        result = await getSheetData(spreadsheetId, `Payments!A2:Z`, token);
        break;
      case 'getLogbook':
        result = await getSheetData(spreadsheetId, `Logbook!A2:Z`, token);
        break;
      case 'recordPayment':
        result = await recordPayment(spreadsheetId, data, token);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

async function getAccessToken(credentials: any): Promise<string> {
  const jwt = await createJWT(credentials);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await response.json();
  return tokenData.access_token;
}

async function createJWT(credentials: GoogleCredentials): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  
  // Import the private key and sign the JWT
  const signature = await signWithRSA(signingInput, credentials.private_key);
  
  return `${signingInput}.${signature}`;
}

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function signWithRSA(data: string, privateKey: string): Promise<string> {
  // Clean up the private key
  const key = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  // Convert base64 to binary
  const binaryKey = Uint8Array.from(atob(key), c => c.charCodeAt(0));
  
  // Import the key
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
  
  // Sign the data
  const dataBuffer = new TextEncoder().encode(data);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    dataBuffer
  );
  
  // Convert to base64url
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

async function getSheetData(spreadsheetId: string, range: string, token: string) {
  const response = await fetch(
    `${GOOGLE_SHEETS_API_URL}/${spreadsheetId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  
  const data = await response.json();
  return data.values || [];
}

async function appendToSheet(spreadsheetId: string, range: string, values: any[], token: string) {
  const response = await fetch(
    `${GOOGLE_SHEETS_API_URL}/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );
  
  return await response.json();
}

async function updateSheetRow(spreadsheetId: string, sheetName: string, data: any, token: string) {
  // Get all rows to find the one to update
  const rows = await getSheetData(spreadsheetId, `${sheetName}!A2:Z`, token);
  
  // Find the row index by customer ID (assuming first column is customerID)
  const rowIndex = rows.findIndex((row: any[]) => row[0] === data.customerID);
  
  if (rowIndex === -1) {
    throw new Error('Customer not found');
  }
  
  // Calculate the actual row number (adding 2 for header + 0-based index)
  const rowNumber = rowIndex + 2;
  
  const response = await fetch(
    `${GOOGLE_SHEETS_API_URL}/${spreadsheetId}/values/${sheetName}!A${rowNumber}:Z${rowNumber}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [data.updates] }),
    }
  );
  
  return await response.json();
}

async function addLogEntry(spreadsheetId: string, token: string, action: string, actorEmail: string, details: any) {
  const logEntry = [
    new Date().toISOString(),
    action,
    actorEmail,
    details.customerID || '',
    JSON.stringify(details),
    '',
    '',
  ];
  
  await appendToSheet(spreadsheetId, 'Logbook!A:Z', [logEntry], token);
}

async function addPaymentRecord(spreadsheetId: string, data: any, token: string) {
  // Add to Payments sheet
  const paymentRow = [
    data.id || `PAY${Date.now()}`,
    data.customerID,
    data.name,
    data.dateOfPayment,
    data.amountPaid,
    data.remainingAmount,
    data.installmentsCovered,
    data.newRemainingAmount,
    data.newNextDueDate,
    data.notes || '',
  ];
  
  const result = await appendToSheet(spreadsheetId, 'Payments!A:Z', [paymentRow], token);
  
  // Add log entry
  await addLogEntry(spreadsheetId, token, 'ADD_PAYMENT', data.actorEmail || 'system', data);
  
  return result;
}

async function recordPayment(spreadsheetId: string, data: any, token: string) {
  // Get customer data from Master sheet
  const masterRows = await getSheetData(spreadsheetId, 'Master!A2:Z', token);
  const customerIndex = masterRows.findIndex((row: any[]) => row[0] === data.customerID);
  
  if (customerIndex === -1) {
    throw new Error('Customer not found in Master sheet');
  }
  
  const customerRow = masterRows[customerIndex];
  
  // Parse current values
  const paidInstallments = parseInt(customerRow[11] || '0', 10);
  const collectedAmount = parseFloat(customerRow[12] || '0');
  const remainingAmount = parseFloat(customerRow[13] || customerRow[9]);
  const remainingInstallments = parseInt(customerRow[14] || customerRow[8], 10);
  
  // Calculate new values
  const newPaidInstallments = paidInstallments + data.installments;
  const newCollectedAmount = collectedAmount + data.amount;
  const newRemainingAmount = remainingAmount - data.amount;
  const newRemainingInstallments = remainingInstallments - data.installments;
  
  // Determine new status
  let newStatus = customerRow[16] || 'ACTIVE';
  if (newRemainingInstallments <= 0 || newRemainingAmount <= 0) {
    newStatus = 'CLOSED';
  }
  
  // Update Master row
  const updatedRow = [...customerRow];
  updatedRow[11] = newPaidInstallments;
  updatedRow[12] = newCollectedAmount;
  updatedRow[13] = newRemainingAmount;
  updatedRow[14] = newRemainingInstallments;
  updatedRow[15] = data.newNextDueDate || customerRow[15];
  updatedRow[16] = newStatus;
  
  // Update the Master sheet
  const masterRowNumber = customerIndex + 2;
  await fetch(
    `${GOOGLE_SHEETS_API_URL}/${spreadsheetId}/values/Master!A${masterRowNumber}:Z${masterRowNumber}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [updatedRow] }),
    }
  );
  
  // Add payment record
  await addPaymentRecord(spreadsheetId, {
    ...data,
    name: customerRow[1],
    remainingAmount: remainingAmount,
    newRemainingAmount: newRemainingAmount,
  }, token);
  
  return { success: true, updatedCustomer: updatedRow };
}