// Google Apps Script Code for Sri Vinaya Tender Backend
// Deploy this as a Web App with execute permissions for "Anyone"

// Sheet IDs from your Google Sheets URLs
const SHEET_ID = '1JH0ve9dfGtStpaozYB86WPwP3c9gFjJ-';
const MASTER_GID = '1245849665';
const PAYMENTS_GID = '577116218'; 
const LOGBOOK_GID = '659815523';

// Main function to handle all HTTP requests
function doPost(e) {
  try {
    // Safety check for testing in Apps Script editor
    if (!e || !e.postData) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'This function must be called via HTTP POST request. Use testConnection() for testing.' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const requestData = JSON.parse(e.postData.contents);
    const { action, data, timestamp } = requestData;
    
    console.log(`Processing action: ${action}`, data);
    
    let result;
    
    switch (action) {
      case 'getCustomers':
        result = getCustomers();
        break;
      case 'addCustomer':
        result = addCustomer(data);
        break;
      case 'updateCustomer':
        result = updateCustomer(data.customerID, data.updates);
        break;
      case 'deleteCustomer':
        result = deleteCustomer(data.customerID);
        break;
      case 'getPayments':
        result = getPayments();
        break;
      case 'addPayment':
        result = addPayment(data);
        break;
      case 'getLogbook':
        result = getLogbook();
        break;
      case 'syncAll':
        result = syncAll();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing request:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Get reference to sheets
function getMasterSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName('Master') || 
         SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
}

function getPaymentsSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName('Payments') ||
         SpreadsheetApp.openById(SHEET_ID).getSheets()[1];
}

function getLogbookSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName('Logbook') ||
         SpreadsheetApp.openById(SHEET_ID).getSheets()[2];
}

// Customer CRUD Operations
function getCustomers() {
  const sheet = getMasterSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const customers = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Skip empty rows
      customers.push({
        customerID: row[0].toString(),
        name: row[1],
        phone: row[2].toString(),
        tenderName: row[3],
        startDate: formatDate(row[4]),
        principal: parseFloat(row[5]) || 0,
        disbursedAmount: parseFloat(row[6]) || 0,
        interest: parseFloat(row[7]) || 0,
        durationMonths: parseInt(row[8]) || 0,
        installmentType: row[9],
        totalInstallments: parseInt(row[10]) || 0,
        installmentAmount: parseFloat(row[11]) || 0,
        paidInstallments: parseInt(row[12]) || 0,
        remainingInstallments: parseInt(row[13]) || 0,
        collectedAmount: parseFloat(row[14]) || 0,
        remainingAmount: parseFloat(row[15]) || 0,
        nextDueDate: formatDate(row[16]),
        status: row[17] || 'ACTIVE',
        notes: row[18] || ''
      });
    }
  }
  
  return customers;
}

function addCustomer(customerData) {
  const sheet = getMasterSheet();
  const lastRow = sheet.getLastRow();
  const newCustomerID = (lastRow).toString();
  
  // Calculate derived fields
  const totalInstallments = customerData.installmentType === 'DAY' 
    ? customerData.durationMonths * 30 
    : customerData.durationMonths;
  
  const installmentAmount = (customerData.principal + customerData.interest) / totalInstallments;
  const remainingAmount = customerData.principal + customerData.interest - (customerData.collectedAmount || 0);
  const remainingInstallments = totalInstallments - (customerData.paidInstallments || 0);
  
  const newCustomer = {
    customerID: newCustomerID,
    name: customerData.name,
    phone: customerData.phone,
    tenderName: customerData.tenderName,
    startDate: customerData.startDate,
    principal: customerData.principal,
    disbursedAmount: customerData.disbursedAmount,
    interest: customerData.interest,
    durationMonths: customerData.durationMonths,
    installmentType: customerData.installmentType,
    totalInstallments: totalInstallments,
    installmentAmount: installmentAmount,
    paidInstallments: customerData.paidInstallments || 0,
    remainingInstallments: remainingInstallments,
    collectedAmount: customerData.collectedAmount || 0,
    remainingAmount: remainingAmount,
    nextDueDate: customerData.nextDueDate,
    status: customerData.status || 'ACTIVE',
    notes: customerData.notes || ''
  };
  
  // Add to sheet
  sheet.appendRow([
    newCustomer.customerID,
    newCustomer.name,
    newCustomer.phone,
    newCustomer.tenderName,
    newCustomer.startDate,
    newCustomer.principal,
    newCustomer.disbursedAmount,
    newCustomer.interest,
    newCustomer.durationMonths,
    newCustomer.installmentType,
    newCustomer.totalInstallments,
    newCustomer.installmentAmount,
    newCustomer.paidInstallments,
    newCustomer.remainingInstallments,
    newCustomer.collectedAmount,
    newCustomer.remainingAmount,
    newCustomer.nextDueDate,
    newCustomer.status,
    newCustomer.notes
  ]);
  
  // Log the action
  addLogEntry('CUSTOMER_ADDED', `{"CustomerID":"${newCustomer.customerID}","Name":"${newCustomer.name}"}`);
  
  return newCustomer;
}

function updateCustomer(customerID, updates) {
  const sheet = getMasterSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === customerID.toString()) {
      // Update the row with new values
      const currentRow = data[i];
      
      // Update fields that were provided
      if (updates.name !== undefined) currentRow[1] = updates.name;
      if (updates.phone !== undefined) currentRow[2] = updates.phone;
      if (updates.tenderName !== undefined) currentRow[3] = updates.tenderName;
      if (updates.startDate !== undefined) currentRow[4] = updates.startDate;
      if (updates.principal !== undefined) currentRow[5] = updates.principal;
      if (updates.disbursedAmount !== undefined) currentRow[6] = updates.disbursedAmount;
      if (updates.interest !== undefined) currentRow[7] = updates.interest;
      if (updates.durationMonths !== undefined) currentRow[8] = updates.durationMonths;
      if (updates.installmentType !== undefined) currentRow[9] = updates.installmentType;
      if (updates.paidInstallments !== undefined) currentRow[12] = updates.paidInstallments;
      if (updates.collectedAmount !== undefined) currentRow[14] = updates.collectedAmount;
      if (updates.nextDueDate !== undefined) currentRow[16] = updates.nextDueDate;
      if (updates.status !== undefined) currentRow[17] = updates.status;
      if (updates.notes !== undefined) currentRow[18] = updates.notes;
      
      // Recalculate derived fields
      const totalInstallments = currentRow[9] === 'DAY' 
        ? currentRow[8] * 30 
        : currentRow[8];
      const installmentAmount = (currentRow[5] + currentRow[7]) / totalInstallments;
      const remainingAmount = currentRow[5] + currentRow[7] - currentRow[14];
      const remainingInstallments = totalInstallments - currentRow[12];
      
      currentRow[10] = totalInstallments;
      currentRow[11] = installmentAmount;
      currentRow[13] = remainingInstallments;
      currentRow[15] = remainingAmount;
      
      // Write back to sheet
      sheet.getRange(i + 1, 1, 1, currentRow.length).setValues([currentRow]);
      
      // Log the action
      addLogEntry('CUSTOMER_UPDATED', `{"CustomerID":"${customerID}","Updates":${JSON.stringify(updates)}}`);
      
      // Return updated customer
      return {
        customerID: currentRow[0].toString(),
        name: currentRow[1],
        phone: currentRow[2].toString(),
        tenderName: currentRow[3],
        startDate: formatDate(currentRow[4]),
        principal: parseFloat(currentRow[5]),
        disbursedAmount: parseFloat(currentRow[6]),
        interest: parseFloat(currentRow[7]),
        durationMonths: parseInt(currentRow[8]),
        installmentType: currentRow[9],
        totalInstallments: parseInt(currentRow[10]),
        installmentAmount: parseFloat(currentRow[11]),
        paidInstallments: parseInt(currentRow[12]),
        remainingInstallments: parseInt(currentRow[13]),
        collectedAmount: parseFloat(currentRow[14]),
        remainingAmount: parseFloat(currentRow[15]),
        nextDueDate: formatDate(currentRow[16]),
        status: currentRow[17],
        notes: currentRow[18]
      };
    }
  }
  
  return null;
}

function deleteCustomer(customerID) {
  // Instead of deleting, mark as DELETED
  const updates = { status: 'DELETED' };
  const result = updateCustomer(customerID, updates);
  addLogEntry('CUSTOMER_DELETED', `{"CustomerID":"${customerID}"}`);
  return result !== null;
}

// Payment Operations
function getPayments() {
  const sheet = getPaymentsSheet();
  const data = sheet.getDataRange().getValues();
  const payments = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Skip empty rows
      payments.push({
        id: `PAY${i.toString().padStart(3, '0')}`,
        customerID: row[0].toString(),
        name: row[1],
        tenderName: row[2],
        dateOfPayment: formatDate(row[3]),
        amountPaid: parseFloat(row[4]) || 0,
        installmentsCovered: parseInt(row[5]) || 0,
        newNextDueDate: formatDate(row[6]),
        paymentMode: 'Cash', // Default
        notes: row[7] || ''
      });
    }
  }
  
  return payments;
}

function addPayment(paymentData) {
  const paymentsSheet = getPaymentsSheet();
  const lastRow = paymentsSheet.getLastRow();
  
  // Add payment to payments sheet
  paymentsSheet.appendRow([
    paymentData.customerID,
    paymentData.name,
    paymentData.tenderName,
    paymentData.dateOfPayment,
    paymentData.amountPaid,
    paymentData.installmentsCovered,
    paymentData.newNextDueDate,
    paymentData.notes || ''
  ]);
  
  // Update master sheet with new payment info
  const masterSheet = getMasterSheet();
  const masterData = masterSheet.getDataRange().getValues();
  
  for (let i = 1; i < masterData.length; i++) {
    if (masterData[i][0].toString() === paymentData.customerID.toString()) {
      // Update collected amount and paid installments
      masterData[i][12] = (parseInt(masterData[i][12]) || 0) + paymentData.installmentsCovered; // paidInstallments
      masterData[i][14] = (parseFloat(masterData[i][14]) || 0) + paymentData.amountPaid; // collectedAmount
      masterData[i][16] = paymentData.newNextDueDate; // nextDueDate
      
      // Recalculate remaining fields
      masterData[i][13] = masterData[i][10] - masterData[i][12]; // remainingInstallments
      masterData[i][15] = (masterData[i][5] + masterData[i][7]) - masterData[i][14]; // remainingAmount
      
      masterSheet.getRange(i + 1, 1, 1, masterData[i].length).setValues([masterData[i]]);
      break;
    }
  }
  
  const newPayment = {
    id: `PAY${lastRow.toString().padStart(3, '0')}`,
    customerID: paymentData.customerID,
    name: paymentData.name,
    tenderName: paymentData.tenderName,
    dateOfPayment: paymentData.dateOfPayment,
    amountPaid: paymentData.amountPaid,
    installmentsCovered: paymentData.installmentsCovered,
    newNextDueDate: paymentData.newNextDueDate,
    paymentMode: paymentData.paymentMode || 'Cash',
    notes: paymentData.notes || ''
  };
  
  // Log the action
  addLogEntry('PAYMENT_ADDED', `{"CustomerID":"${paymentData.customerID}","Amount":${paymentData.amountPaid}}`);
  
  return newPayment;
}

// Logbook Operations
function getLogbook() {
  const sheet = getLogbookSheet();
  const data = sheet.getDataRange().getValues();
  const logbook = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Skip empty rows
      logbook.push({
        id: `LOG${i.toString().padStart(3, '0')}`,
        timestampISO: row[0],
        action: row[1],
        actorEmail: row[2],
        detailsJSON: row[3],
        entryHash: row[4] || `hash${i}`
      });
    }
  }
  
  return logbook.reverse(); // Most recent first
}

function addLogEntry(action, detailsJSON) {
  const sheet = getLogbookSheet();
  const timestamp = new Date().toISOString();
  const actorEmail = 'admin@srivinayatender.com';
  const hash = `hash${sheet.getLastRow()}`;
  
  sheet.appendRow([
    timestamp,
    action,
    actorEmail,
    detailsJSON,
    hash
  ]);
}

// Utility Functions
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function syncAll() {
  // This function can be used to perform any cleanup or validation
  // For now, it just returns success
  return { message: 'All data synced successfully', timestamp: new Date().toISOString() };
}

// Test functions - Use these for testing in Apps Script editor
function testConnection() {
  try {
    const customers = getCustomers();
    const payments = getPayments(); 
    const logbook = getLogbook();
    
    console.log('✅ Connection Test Successful!');
    console.log(`Found ${customers.length} customers`);
    console.log(`Found ${payments.length} payments`);
    console.log(`Found ${logbook.length} logbook entries`);
    
    return {
      success: true,
      customerCount: customers.length,
      paymentCount: payments.length,
      logbookCount: logbook.length
    };
  } catch (error) {
    console.error('❌ Connection Test Failed:', error);
    return { success: false, error: error.toString() };
  }
}

function testGetCustomers() {
  console.log(getCustomers());
}

// Handle GET requests (for direct URL access)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      message: 'Sri Vinaya Tender API is running', 
      timestamp: new Date().toISOString(),
      note: 'Use POST requests for data operations'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}