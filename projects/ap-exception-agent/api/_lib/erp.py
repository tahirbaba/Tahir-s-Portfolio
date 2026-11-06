"""Fictional ERP data for Ledger (company: Crescent Distribution). Vendors, purchase orders,
goods receipts and posted invoices. All synthetic."""

VENDORS = {
    "V-100": {"name": "Gulf Packaging LLC", "tax_id": "100234567800003", "country": "AE", "iban": "AE070331234567890123456", "tax_rate": 0.05},
    "V-200": {"name": "Riyadh Office Supplies Co", "tax_id": "300987654300003", "country": "SA", "iban": "SA0380000000608010167519", "tax_rate": 0.15},
    "V-300": {"name": "Indus Logistics (Pvt) Ltd", "tax_id": "PK-4471209-3", "country": "PK", "iban": "PK36SCBL0000001123456702", "tax_rate": 0.18},
    "V-400": {"name": "Northline IT Services Ltd", "tax_id": "GB123456789", "country": "GB", "iban": "GB29NWBK60161331926819", "tax_rate": 0.20},
}

# PO lines: (sku, description, qty, unit_price)
POS = {
    "PO-5001": {"vendor": "V-100", "currency": "AED", "lines": [("BOX-L", "Corrugated boxes, large", 2000, 3.20), ("TAPE", "Packing tape 48mm", 300, 6.50)]},
    "PO-5002": {"vendor": "V-200", "currency": "SAR", "lines": [("PAPER-A4", "A4 paper, 5-ream box", 120, 85.00), ("TONER", "Toner cartridge", 20, 410.00)]},
    "PO-5003": {"vendor": "V-300", "currency": "PKR", "lines": [("FRT-KHI-LHE", "Freight Karachi to Lahore, 40ft", 6, 185000.00)]},
    "PO-5004": {"vendor": "V-400", "currency": "GBP", "lines": [("SUPPORT-NOV", "Managed IT support, November", 1, 4800.00), ("LAPTOP", "Laptop setup", 8, 95.00)]},
    "PO-5005": {"vendor": "V-100", "currency": "AED", "lines": [("PALLET", "Wooden pallets", 400, 38.00)]},
}

# Goods received against each PO: sku -> qty received
RECEIPTS = {
    "PO-5001": {"BOX-L": 2000, "TAPE": 300},
    "PO-5002": {"PAPER-A4": 120, "TONER": 14},          # 6 toners not yet delivered
    "PO-5003": {"FRT-KHI-LHE": 6},
    "PO-5004": {"SUPPORT-NOV": 1, "LAPTOP": 8},
    "PO-5005": {"PALLET": 400},
}

# Already posted invoices (for duplicate detection): (vendor, invoice_number, total, date)
POSTED = [
    ("V-100", "GP-2291", 6720.00, "2026-10-12"),
    ("V-300", "IL-8812", 1309800.00, "2026-10-20"),
]

APPROVAL_LIMITS = {"AED": 25000, "SAR": 25000, "PKR": 1500000, "GBP": 5000}  # above this, the controller approves
PRICE_TOLERANCE = 0.02  # 2% unit-price tolerance
