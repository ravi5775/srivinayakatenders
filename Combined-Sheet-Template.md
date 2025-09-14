# Sri Vinaya Tender - Combined Sheet Template

## Google Sheets Setup Instructions

### 1. Create New Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Create" > "Blank spreadsheet"
3. Rename it to "Sri Vinaya Tender - Complete Database"

### 2. Master Data Columns (Customer Information)
Create the first sheet named **"Master"** with these columns:

| Column | Field Name | Data Type | Description |
|--------|------------|-----------|-------------|
| A | CustomerID | Text | Unique customer identifier |
| B | Name | Text | Customer full name |
| C | Phone | Text | Customer phone number |
| D | TenderName | Text | Tender/Plan type (Daily/Monthly) |
| E | StartDate | Date | Loan start date |
| F | Principal | Number | Original loan amount |
| G | DisbursedAmount | Number | Amount actually given to customer |
| H | Interest | Number | Total interest amount |
| I | DurationMonths | Number | Loan duration in months |
| J | InstallmentType | Text | "DAY" or "MONTH" |
| K | TotalInstallments | Number | Total number of installments |
| L | InstallmentAmount | Number | Amount per installment |
| M | PaidInstallments | Number | Number of installments paid |
| N | RemainingInstallments | Number | Installments remaining |
| O | CollectedAmount | Number | Total amount collected so far |
| P | RemainingAmount | Number | Amount still to be collected |
| Q | NextDueDate | Date | Next payment due date |
| R | Status | Text | ACTIVE/COMPLETED/DELETED |
| S | Notes | Text | Additional notes |

### 3. Payment History Columns
Create the second sheet named **"Payments"** with these columns:

| Column | Field Name | Data Type | Description |
|--------|------------|-----------|-------------|
| A | CustomerID | Text | Reference to customer |
| B | Name | Text | Customer name |
| C | TenderName | Text | Tender type |
| D | DateOfPayment | Date | Payment date |
| E | AmountPaid | Number | Payment amount |
| F | InstallmentsCovered | Number | How many installments this payment covers |
| G | NewNextDueDate | Date | Next due date after this payment |
| H | Notes | Text | Payment notes |

### 4. Logbook/Audit Trail
Create the third sheet named **"Logbook"** with these columns:

| Column | Field Name | Data Type | Description |
|--------|------------|-----------|-------------|
| A | Timestamp_ISO | DateTime | When the action occurred |
| B | Action | Text | Type of action performed |
| C | ActorEmail | Text | Who performed the action |
| D | Details_JSON | Text | Detailed information in JSON format |
| E | EntryHash | Text | Unique hash for audit trail |

### 5. Combined View Sheet (Optional)
Create a fourth sheet named **"CombinedView"** with ALL columns:

| Column | Field Name | Source | Description |
|--------|------------|--------|-------------|
| A-S | All Master columns | Master Sheet | Customer data |
| T | LastPaymentDate | Payments | Date of most recent payment |
| U | LastPaymentAmount | Payments | Amount of most recent payment |
| V | TotalPayments | Payments | Count of all payments made |
| W | AveragePaymentAmount | Payments | Average payment size |
| X | PaymentFrequency | Calculated | Days between payments |

## Sample Data Structure

### Master Sheet Header Row:
```
CustomerID | Name | Phone | TenderName | StartDate | Principal | DisbursedAmount | Interest | DurationMonths | InstallmentType | TotalInstallments | InstallmentAmount | PaidInstallments | RemainingInstallments | CollectedAmount | RemainingAmount | NextDueDate | Status | Notes
```

### Payments Sheet Header Row:
```
CustomerID | Name | TenderName | DateOfPayment | AmountPaid | InstallmentsCovered | NewNextDueDate | Notes
```

### Logbook Sheet Header Row:
```
Timestamp_ISO | Action | ActorEmail | Details_JSON | EntryHash
```

## Quick Setup Commands

### For Google Sheets:
1. Copy the header rows above
2. Paste them into your respective sheets
3. Format the date columns as dates
4. Format the number columns as currency or numbers
5. Freeze the header row (View > Freeze > 1 row)

### Sheet Protection (Recommended):
1. Right-click on sheet tabs
2. Select "Protect sheet"
3. Allow specific people to edit
4. Protect formulas and calculated fields

## Notes:
- CustomerID should be auto-generated (sequential numbers)
- Use data validation for Status column (ACTIVE, COMPLETED, DELETED)
- Use data validation for InstallmentType (DAY, MONTH)
- All amount fields should be formatted as currency
- Date fields should use consistent format (YYYY-MM-DD recommended)