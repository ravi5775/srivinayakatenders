// Google Apps Script to automatically setup Sri Vinaya Tender sheets
// Run this script to create the complete sheet structure

function createCompleteSheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or update Master sheet
  createMasterSheet(ss);
  
  // Create or update Payments sheet  
  createPaymentsSheet(ss);
  
  // Create or update Logbook sheet
  createLogbookSheet(ss);
  
  // Create combined view sheet
  createCombinedViewSheet(ss);
  
  // Apply formatting
  applyFormatting(ss);
  
  console.log('✅ Complete sheet structure created successfully!');
}

function createMasterSheet(ss) {
  let sheet = ss.getSheetByName('Master');
  if (!sheet) {
    sheet = ss.insertSheet('Master');
  }
  
  // Master sheet headers
  const masterHeaders = [
    'CustomerID', 'Name', 'Phone', 'TenderName', 'StartDate', 
    'Principal', 'DisbursedAmount', 'Interest', 'DurationMonths', 
    'InstallmentType', 'TotalInstallments', 'InstallmentAmount', 
    'PaidInstallments', 'RemainingInstallments', 'CollectedAmount', 
    'RemainingAmount', 'NextDueDate', 'Status', 'Notes'
  ];
  
  sheet.getRange(1, 1, 1, masterHeaders.length).setValues([masterHeaders]);
  sheet.getRange(1, 1, 1, masterHeaders.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, masterHeaders.length).setBackground('#e8f4fd');
  
  // Add sample data
  const sampleData = [
    ['001', 'Rajesh Kumar', '9876543210', 'Daily Plan', '2024-01-01', 10000, 10000, 2000, 12, 'DAY', 360, 33.33, 30, 330, 1000, 11000, '2024-01-31', 'ACTIVE', 'Regular customer'],
    ['002', 'Priya Sharma', '9876543211', 'Monthly Plan', '2024-01-15', 25000, 25000, 5000, 24, 'MONTH', 24, 1250, 2, 22, 2500, 27500, '2024-03-15', 'ACTIVE', 'New customer']
  ];
  
  if (sheet.getLastRow() === 1) { // Only add sample data if sheet is empty
    sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  }
}

function createPaymentsSheet(ss) {
  let sheet = ss.getSheetByName('Payments');
  if (!sheet) {
    sheet = ss.insertSheet('Payments');
  }
  
  const paymentHeaders = [
    'CustomerID', 'Name', 'TenderName', 'DateOfPayment', 
    'AmountPaid', 'InstallmentsCovered', 'NewNextDueDate', 'Notes'
  ];
  
  sheet.getRange(1, 1, 1, paymentHeaders.length).setValues([paymentHeaders]);
  sheet.getRange(1, 1, 1, paymentHeaders.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, paymentHeaders.length).setBackground('#e8f4fd');
  
  // Add sample payment data
  const samplePayments = [
    ['001', 'Rajesh Kumar', 'Daily Plan', '2024-01-31', 1000, 30, '2024-02-29', 'Monthly payment'],
    ['002', 'Priya Sharma', 'Monthly Plan', '2024-02-15', 1250, 1, '2024-03-15', 'First installment'],
    ['002', 'Priya Sharma', 'Monthly Plan', '2024-03-15', 1250, 1, '2024-04-15', 'Second installment']
  ];
  
  if (sheet.getLastRow() === 1) { // Only add sample data if sheet is empty
    sheet.getRange(2, 1, samplePayments.length, samplePayments[0].length).setValues(samplePayments);
  }
}

function createLogbookSheet(ss) {
  let sheet = ss.getSheetByName('Logbook');
  if (!sheet) {
    sheet = ss.insertSheet('Logbook');
  }
  
  const logbookHeaders = [
    'Timestamp_ISO', 'Action', 'ActorEmail', 'Details_JSON', 'EntryHash'
  ];
  
  sheet.getRange(1, 1, 1, logbookHeaders.length).setValues([logbookHeaders]);
  sheet.getRange(1, 1, 1, logbookHeaders.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, logbookHeaders.length).setBackground('#e8f4fd');
  
  // Add sample log entries
  const sampleLogs = [
    [new Date().toISOString(), 'CUSTOMER_ADDED', 'admin@srivinayatender.com', '{"CustomerID":"001","Name":"Rajesh Kumar"}', 'hash001'],
    [new Date().toISOString(), 'PAYMENT_ADDED', 'admin@srivinayatender.com', '{"CustomerID":"001","Amount":1000}', 'hash002']
  ];
  
  if (sheet.getLastRow() === 1) { // Only add sample data if sheet is empty
    sheet.getRange(2, 1, sampleLogs.length, sampleLogs[0].length).setValues(sampleLogs);
  }
}

function createCombinedViewSheet(ss) {
  let sheet = ss.getSheetByName('CombinedView');
  if (!sheet) {
    sheet = ss.insertSheet('CombinedView');
  }
  
  // Combined view headers (Master + Payment summary)
  const combinedHeaders = [
    // Master columns (A-S)
    'CustomerID', 'Name', 'Phone', 'TenderName', 'StartDate', 
    'Principal', 'DisbursedAmount', 'Interest', 'DurationMonths', 
    'InstallmentType', 'TotalInstallments', 'InstallmentAmount', 
    'PaidInstallments', 'RemainingInstallments', 'CollectedAmount', 
    'RemainingAmount', 'NextDueDate', 'Status', 'Notes',
    // Payment summary columns (T-X)
    'LastPaymentDate', 'LastPaymentAmount', 'TotalPayments', 
    'AveragePaymentAmount', 'PaymentFrequency'
  ];
  
  sheet.getRange(1, 1, 1, combinedHeaders.length).setValues([combinedHeaders]);
  sheet.getRange(1, 1, 1, combinedHeaders.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, combinedHeaders.length).setBackground('#e8f4fd');
  
  // Add formulas to pull data from Master sheet (row 2 as example)
  if (sheet.getLastRow() === 1) {
    // Copy master data with formulas
    sheet.getRange('A2').setFormula('=IF(Master!A2<>"",Master!A2,"")');
    sheet.getRange('B2:S2').setFormula('=IF(Master!A2<>"",Master!B2:S2,"")');
    
    // Payment summary formulas
    sheet.getRange('T2').setFormula('=IF(A2<>"",MAXIFS(Payments!D:D,Payments!A:A,A2),"")'); // Last payment date
    sheet.getRange('U2').setFormula('=IF(A2<>"",INDEX(Payments!E:E,MATCH(T2,Payments!D:D,0)),"")'); // Last payment amount
    sheet.getRange('V2').setFormula('=IF(A2<>"",COUNTIF(Payments!A:A,A2),"")'); // Total payments count
    sheet.getRange('W2').setFormula('=IF(V2>0,AVERAGEIF(Payments!A:A,A2,Payments!E:E),"")'); // Average payment
    sheet.getRange('X2').setFormula('=IF(V2>1,(T2-MINIFS(Payments!D:D,Payments!A:A,A2))/(V2-1),"")'); // Payment frequency
  }
}

function applyFormatting(ss) {
  const sheets = ['Master', 'Payments', 'Logbook', 'CombinedView'];
  
  sheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      // Freeze header row
      sheet.setFrozenRows(1);
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, sheet.getLastColumn());
      
      // Apply borders to data range
      const range = sheet.getDataRange();
      range.setBorder(true, true, true, true, true, true);
      
      // Format specific columns based on sheet
      if (sheetName === 'Master' || sheetName === 'CombinedView') {
        // Format currency columns
        const currencyColumns = [6, 7, 8, 12, 15, 16]; // Principal, Disbursed, Interest, InstallmentAmount, CollectedAmount, RemainingAmount
        currencyColumns.forEach(col => {
          if (sheet.getLastRow() > 1) {
            sheet.getRange(2, col, sheet.getLastRow() - 1, 1).setNumberFormat('#,##0.00');
          }
        });
        
        // Format date columns
        const dateColumns = [5, 17]; // StartDate, NextDueDate
        dateColumns.forEach(col => {
          if (sheet.getLastRow() > 1) {
            sheet.getRange(2, col, sheet.getLastRow() - 1, 1).setNumberFormat('yyyy-mm-dd');
          }
        });
      }
      
      if (sheetName === 'Payments') {
        // Format payment amount
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 5, sheet.getLastRow() - 1, 1).setNumberFormat('#,##0.00'); // AmountPaid
          sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).setNumberFormat('yyyy-mm-dd'); // DateOfPayment
          sheet.getRange(2, 7, sheet.getLastRow() - 1, 1).setNumberFormat('yyyy-mm-dd'); // NewNextDueDate
        }
      }
    }
  });
  
  console.log('✅ Formatting applied successfully!');
}

// Function to add data validation
function addDataValidation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('Master');
  
  if (masterSheet) {
    // Status column validation
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['ACTIVE', 'COMPLETED', 'DELETED'])
      .setAllowInvalid(false)
      .build();
    masterSheet.getRange('R:R').setDataValidation(statusRule);
    
    // Installment type validation
    const installmentRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['DAY', 'MONTH'])
      .setAllowInvalid(false)
      .build();
    masterSheet.getRange('J:J').setDataValidation(installmentRule);
    
    console.log('✅ Data validation added successfully!');
  }
}

// Run this function to setup everything
function setupComplete() {
  createCompleteSheetStructure();
  addDataValidation();
  console.log('🎉 Complete setup finished! Your Sri Vinaya Tender database is ready.');
}