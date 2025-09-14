# Sri Vinaya Tender - Google Sheets Integration Setup

## Overview
This system uses Google Apps Script as a backend API to perform CRUD operations directly on Google Sheets. All data is stored in your Google Sheets and updated in real-time.

## Sheet Structure

### Master Sheet (Customer Data)
- **Columns**: CustomerID, Name, Phone, TenderName, StartDate, Principal, DisbursedAmount, Interest, DurationMonths, InstallmentType, TotalInstallments, InstallmentAmount, PaidInstallments, RemainingInstallments, CollectedAmount, RemainingAmount, NextDueDate, Status, Notes

### Payments Sheet (Payment History)  
- **Columns**: CustomerID, Name, TenderName, DateOfPayment, AmountPaid, InstallmentsCovered, NewNextDueDate, Notes

### Logbook Sheet (Audit Trail)
- **Columns**: Timestamp_ISO, Action, ActorEmail, Details_JSON, EntryHash

## Setup Instructions

### Step 1: Prepare Your Google Sheets
1. Open your Google Sheet: `https://docs.google.com/spreadsheets/d/1JH0ve9dfGtStpaozYB86WPwP3c9gFjJ-/edit`
2. Ensure you have 3 sheets named exactly: `Master`, `Payments`, `Logbook`
3. Add the column headers as specified above

### Step 2: Deploy Google Apps Script
1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Replace the default `Code.gs` with the content from `Google-Apps-Script-Backend.gs`
4. Update the `SHEET_ID` variable with your actual sheet ID: `1JH0ve9dfGtStpaozYB86WPwP3c9gFjJ-`
5. Save the project

### Step 3: Deploy as Web App
1. In Apps Script, click "Deploy" > "New deployment"
2. Choose type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone" (required for API access)
5. Click "Deploy"
6. Copy the Web App URL (looks like: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`)

### Step 4: Configure Frontend
1. In your Lovable app, go to Admin Settings
2. Enter the Web App URL you copied in step 3
3. The system will now use real Google Sheets for all operations

## Features

### Real-time CRUD Operations
- ✅ Add/Edit/Delete customers in Master sheet
- ✅ Record payments in Payments sheet  
- ✅ Automatic calculations for installments and due dates
- ✅ Audit logging in Logbook sheet
- ✅ No data deletion - only status updates

### Admin Features
- 🔐 Secure login with session management
- 🌍 Multilingual support (English/Telugu)
- 🎨 Dark/Light theme switching
- 📊 Dashboard with KPIs and charts
- 🔄 Real-time sync with Google Sheets
- 📈 Separate tender management for Daily/Monthly plans

### Data Security
- All data stays in your Google Sheets
- Append-only logging for audit trails
- Session-based authentication
- No external database dependencies

## Troubleshooting

### Common Issues
1. **"Not Configured" error**: Ensure you've set the Web App URL in Admin Settings
2. **Permission denied**: Make sure the Apps Script is deployed with "Anyone" access
3. **Sheet not found**: Verify sheet names are exactly "Master", "Payments", "Logbook"
4. **Calculation errors**: Check that all numeric columns contain valid numbers

### Testing
- Use the demo credentials: `admin@srivinayatender.com` / `admin123`
- Test CRUD operations with the sample data
- Check that changes appear in your Google Sheets
- Verify audit entries in the Logbook sheet

## Support
For technical issues, check:
1. Browser console for error messages
2. Apps Script execution logs
3. Google Sheets permissions
4. Network connectivity

The system falls back to local data if the Google Sheets connection fails, ensuring continuous operation.