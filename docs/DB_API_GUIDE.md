# Database API Documentation

## Overview
All consumption data, bills, and reports are now pulled from the database. This document explains the database structure and how to add/manage data.

## Database Tables

### 1. **User Table**
- Stores user profile information
- Fields: name, email, phone, location (state, city, ward, locality)

### 2. **Bill Table**
- Stores utility bills (electricity, water, gas)
- Fields: utility_type, consumption, amount, dates, status

### 3. **ServiceReport Table**
- Stores user complaints and service requests
- Fields: report_type, utility_type, title, description, status, priority

### 4. **Community Table**
- Stores community engagement data
- Fields: points_earned, challenges_participated, reports_submitted

## API Endpoints

### Dashboard Data
**GET** `/api/dashboard`
- Returns: User profile, consumption data, reports stats, community points
- Data source: Database (shows 0 if no data)

### Utilities Data
**GET** `/api/utilities`
- Returns: Last 12 months consumption data for all utilities
- Data source: Database bills table

### Records/Bills
**GET** `/api/records`
- Returns: All bills sorted by date
- Data source: Database bills table

### Add New Bill
**POST** `/api/bills/add`
Content-Type: application/json

```json
{
  "utility_type": "electricity",
  "consumption": 245,
  "consumption_unit": "kWh",
  "amount": 2450,
  "billing_period_start": "2026-01-01",
  "billing_period_end": "2026-01-31",
  "due_date": "2026-02-15",
  "status": "pending"
}
```

**utility_type options:** "electricity", "water", "gas"
**consumption_unit options:** "kWh" (electricity), "kL" (water), "SCM" (gas)
**status options:** "pending", "paid", "overdue"

### Get All Bills
**GET** `/api/bills?utility_type=electricity`
- Optional query param: utility_type
- Returns: All bills for the user

### Submit Service Report
**POST** `/api/services/submit`
Content-Type: application/json

```json
{
  "report_type": "power_outage",
  "utility_type": "electricity",
  "title": "Frequent power cuts",
  "description": "Experiencing power cuts 3-4 times daily",
  "priority": "high",
  "location": "Sector 12, Andheri"
}
```

**report_type options:** "power_outage", "water_supply", "gas_leakage", "bill_issue", "street_light", "general"
**priority options:** "low", "medium", "high", "urgent"

## How to Add Data

### Option 1: Run Seed Script
```bash
python seed_data.py
```
This adds sample data:
- 9 bills (3 per utility)
- 5 service reports
- Community stats

### Option 2: Use API (with curl or Postman)

Add electricity bill:
```bash
curl -X POST http://127.0.0.1:5000/api/bills/add \
  -H "Content-Type: application/json" \
  -d '{
    "utility_type": "electricity",
    "consumption": 300,
    "consumption_unit": "kWh",
    "amount": 3000,
    "status": "pending"
  }'
```

Add water bill:
```bash
curl -X POST http://127.0.0.1:5000/api/bills/add \
  -H "Content-Type: application/json" \
  -d '{
    "utility_type": "water",
    "consumption": 25,
    "consumption_unit": "kL",
    "amount": 500,
    "status": "paid"
  }'
```

Add gas bill:
```bash
curl -X POST http://127.0.0.1:5000/api/bills/add \
  -H "Content-Type: application/json" \
  -d '{
    "utility_type": "gas",
    "consumption": 20,
    "consumption_unit": "SCM",
    "amount": 900,
    "status": "paid"
  }'
```

### Option 3: Use PowerShell

```powershell
# Add electricity bill
Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/bills/add" -Method POST -ContentType "application/json" -Body '{"utility_type":"electricity","consumption":250,"consumption_unit":"kWh","amount":2500,"status":"pending"}'

# Add water bill
Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/bills/add" -Method POST -ContentType "application/json" -Body '{"utility_type":"water","consumption":20,"consumption_unit":"kL","amount":400,"status":"paid"}'

# Add gas bill
Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/bills/add" -Method POST -ContentType "application/json" -Body '{"utility_type":"gas","consumption":15,"consumption_unit":"SCM","amount":750,"status":"paid"}'
```

## Current Database State

After running `seed_data.py`, you should have:
- **1 User**: Suhan Kumar (or the first registered user)
- **9 Bills**: 3 electricity, 3 water, 3 gas bills
- **5 Service Reports**: Mix of open, in-progress, and resolved
- **1 Community Record**: With points and participation stats

## Verification

To check current data:
1. Visit dashboard: http://127.0.0.1:5000/#!/
2. Visit utilities: http://127.0.0.1:5000/#!/utilities
3. Visit records: http://127.0.0.1:5000/#!/records

All pages now show data from database. If database is empty, values will show as 0.

## Note
- The system uses the first registered user for demo purposes when no one is logged in
- All consumption values, bills, and reports are now database-driven
- No more hardcoded mock data!
