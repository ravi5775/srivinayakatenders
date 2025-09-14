# 🎯 Google Sheets Integration Setup

## Overview
This system uses Supabase Edge Functions to connect directly to Google Sheets API for real-time data management. All data is stored in your Google Sheets and synchronized with the application.

## Prerequisites
- ✅ Supabase project connected to Lovable
- ✅ Google Cloud Platform project with service account
- ✅ Google Sheets API enabled
- ✅ Google Sheet with proper structure

## Step 1: Create and Configure Google Sheet

### Create New Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"+ Blank"** to create new spreadsheet  
3. Rename it: **"Sri Vinaya Tender - Database"**

### Set Up Sheet Structure
Create these 3 sheets with exact names:

#### 1. Master Sheet
**Columns (Row 1):**
```
CustomerID | Name | Phone | TenderName | StartDate | Principal | DisbursedAmount | Interest | DurationMonths | InstallmentType | TotalInstallments | InstallmentAmount | PaidInstallments | CollectedAmount | RemainingAmount | RemainingInstallments | NextDueDate | Status | Notes
```

#### 2. Payments Sheet  
**Columns (Row 1):**
```
ID | CustomerID | Name | DateOfPayment | AmountPaid | RemainingAmount | InstallmentsCovered | NewRemainingAmount | NewNextDueDate | Notes
```

#### 3. Logbook Sheet
**Columns (Row 1):**
```
Timestamp | Action | ActorEmail | CustomerID | Details | Reserved1 | Reserved2
```

### Get Your Sheet ID
1. Copy the URL of your Google Sheet
2. Extract the ID from: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`
3. Save this ID - you'll need it for configuration

You already have a Google Service Account! Use the credentials you provided.

### Store Service Account in Supabase
1. In your Lovable project, the Google service account key needs to be stored as a Supabase secret
2. This will be configured automatically when you set up the integration
3. The service account email: `test-709@dev-accord-471818-b3.iam.gserviceaccount.com`

### Grant Sheet Access
1. Open your Google Sheet
2. Click **"Share"** button (top right)
3. Add the service account email: `test-709@dev-accord-471818-b3.iam.gserviceaccount.com`
4. Set permission to **"Editor"**
5. Click **"Send"**

## Step 3: Configure Supabase Integration

### Add Google Service Account Secret
The system will automatically prompt you to add the Google service account key as a secret when you first use the integration.

### Verify Edge Function Deployment
The Google Sheets edge function is already deployed in your Supabase project at:
- Function name: `google-sheets`
- Handles all CRUD operations
- Includes audit logging
- Automatic data validation

## Step 4: Test Connection

### Using the Application
1. Go to Admin Settings in your app
2. The system will automatically connect to your Google Sheets
3. Test by adding a customer or making a payment
4. Verify data appears in your Google Sheets

### Verification Checklist
- ✅ Service account has access to your sheet
- ✅ Sheet structure matches required format
- ✅ Supabase edge function is deployed
- ✅ Data syncs between app and sheets

---

If you already have your Google Sheet and service account set up:

1. **Share your Google Sheet** with: `test-709@dev-accord-471818-b3.iam.gserviceaccount.com`
2. **Copy your Sheet ID** from the URL
3. **Set up the Google service account secret** in Supabase
4. **Test the connection** in your application

---

## 🔧 Troubleshooting

### Common Issues
1. **"Permission denied"**: Ensure service account has Editor access to your sheet
2. **"Sheet not found"**: Verify sheet names are exactly "Master", "Payments", "Logbook"
3. **"Invalid credentials"**: Check that the service account key is properly configured in Supabase secrets
4. **"API disabled"**: Ensure Google Sheets API is enabled in your Google Cloud project

### Verification Steps
- ✅ Service account email has access to your Google Sheet
- ✅ Google Sheets API is enabled in your Google Cloud project  
- ✅ Sheet structure matches the required format exactly
- ✅ Supabase project is connected and edge function deployed
- ✅ Google service account secret is stored in Supabase

---

## 📊 Features Available

### Real-time Operations
- ✅ Add/Edit customers in Master sheet
- ✅ Record payments in Payments sheet
- ✅ Automatic calculations and updates
- ✅ Complete audit trail in Logbook sheet
- ✅ Status tracking and management

### Security & Reliability
- 🔐 Service account authentication
- 📝 Complete audit logging
- 🔄 Real-time data synchronization
- ⚡ Edge function performance
- 🛡️ Supabase security integration

---

## 🚀 Ready to Start

Your Google Sheets integration is now configured! The system will automatically:
- Connect to your Google Sheets using the service account
- Sync all data in real-time
- Maintain audit logs for all changes
- Handle authentication and permissions securely

Test the integration by adding a customer or recording a payment in your application.