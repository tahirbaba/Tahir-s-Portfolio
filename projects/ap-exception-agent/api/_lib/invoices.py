"""Demo invoice documents (synthetic) with the fields a careful reader would extract and the expected control outcome."""

INVOICES = [
    {"id": "clean", "title": "Clean invoice, auto-posted", "doc": """GULF PACKAGING LLC
Al Quoz Industrial 3, Dubai, UAE · TRN 100234567800003
TAX INVOICE  GP-2340            Date: 2026-10-28
Bill to: Crescent Distribution · PO: PO-5001

Corrugated boxes, large        2,000 x   3.20 AED    6,400.00
Packing tape 48mm                300 x   6.50 AED    1,950.00
                                     Subtotal        8,350.00
                                     VAT 5%            417.50
                                     TOTAL AED       8,767.50
Pay to IBAN AE07 0331 2345 6789 0123 456""",
     "fields": {"vendor_name": "Gulf Packaging LLC", "vendor_tax_id": "100234567800003", "invoice_number": "GP-2340", "invoice_date": "2026-10-28", "po_number": "PO-5001", "currency": "AED",
                "lines": [{"description": "Corrugated boxes, large", "qty": 2000, "unit_price": 3.20}, {"description": "Packing tape 48mm", "qty": 300, "unit_price": 6.50}],
                "subtotal": 8350.00, "tax": 417.50, "total": 8767.50, "bank_iban": "AE070331234567890123456"},
     "expect": "post"},
    {"id": "partial", "title": "Billed for goods not yet received", "doc": """RIYADH OFFICE SUPPLIES CO · شركة الرياض للمستلزمات المكتبية
VAT No. 300987654300003
فاتورة ضريبية / TAX INVOICE  ROS-77810      Date: 2026-10-30
PO: PO-5002

A4 paper, 5-ream box              120 x    85.00 SAR    10,200.00
Toner cartridge                    20 x   410.00 SAR     8,200.00
                              المجموع الفرعي / Subtotal  18,400.00
                              ضريبة القيمة المضافة 15%     2,760.00
                              الإجمالي / TOTAL SAR      21,160.00
IBAN SA03 8000 0000 6080 1016 7519""",
     "fields": {"vendor_name": "Riyadh Office Supplies Co", "vendor_tax_id": "300987654300003", "invoice_number": "ROS-77810", "invoice_date": "2026-10-30", "po_number": "PO-5002", "currency": "SAR",
                "lines": [{"description": "A4 paper, 5-ream box", "qty": 120, "unit_price": 85.00}, {"description": "Toner cartridge", "qty": 20, "unit_price": 410.00}],
                "subtotal": 18400.00, "tax": 2760.00, "total": 21160.00, "bank_iban": "SA0380000000608010167519"},
     "expect": "exception"},
    {"id": "price", "title": "Unit price creeping above the PO", "doc": """NORTHLINE IT SERVICES LTD
VAT GB123456789 · Manchester, UK
INVOICE NIT-1193                   Date: 2026-11-02
Your PO: PO-5004

Managed IT support, November        1 x 4,800.00 GBP   4,800.00
Laptop setup                         8 x   105.00 GBP     840.00
                                     Subtotal          5,640.00
                                     VAT 20%           1,128.00
                                     Total GBP         6,768.00
Bank: GB29 NWBK 6016 1331 9268 19""",
     "fields": {"vendor_name": "Northline IT Services Ltd", "vendor_tax_id": "GB123456789", "invoice_number": "NIT-1193", "invoice_date": "2026-11-02", "po_number": "PO-5004", "currency": "GBP",
                "lines": [{"description": "Managed IT support, November", "qty": 1, "unit_price": 4800.00}, {"description": "Laptop setup", "qty": 8, "unit_price": 105.00}],
                "subtotal": 5640.00, "tax": 1128.00, "total": 6768.00, "bank_iban": "GB29NWBK60161331926819"},
     "expect": "exception"},
    {"id": "duplicate", "title": "The same invoice, sent twice", "doc": """GULF PACKAGING LLC
TRN 100234567800003
TAX INVOICE  GP-2291   (REMINDER COPY)   Date: 2026-10-12
PO: PO-5001

Corrugated boxes, large          2,000 x 3.20 AED    6,400.00
                                     Subtotal        6,400.00
                                     VAT 5%            320.00
                                     TOTAL AED       6,720.00
IBAN AE07 0331 2345 6789 0123 456""",
     "fields": {"vendor_name": "Gulf Packaging LLC", "vendor_tax_id": "100234567800003", "invoice_number": "GP-2291", "invoice_date": "2026-10-12", "po_number": "PO-5001", "currency": "AED",
                "lines": [{"description": "Corrugated boxes, large", "qty": 2000, "unit_price": 3.20}], "subtotal": 6400.00, "tax": 320.00, "total": 6720.00, "bank_iban": "AE070331234567890123456"},
     "expect": "reject"},
    {"id": "bank", "title": "New bank account: possible fraud", "doc": """INDUS LOGISTICS (PVT) LTD · انڈس لاجسٹکس
NTN PK-4471209-3 · Karachi
SALES TAX INVOICE IL-8890          Date: 2026-11-01
PO: PO-5003

Freight Karachi to Lahore, 40ft     5 x 185,000.00 PKR    925,000.00
                                     Subtotal            925,000.00
                                     GST 18%             166,500.00
                                     Total PKR         1,091,500.00
PLEASE NOTE OUR NEW BANK ACCOUNT: PK18 MEZN 0001 2345 6789 0001""",
     "fields": {"vendor_name": "Indus Logistics (Pvt) Ltd", "vendor_tax_id": "PK-4471209-3", "invoice_number": "IL-8890", "invoice_date": "2026-11-01", "po_number": "PO-5003", "currency": "PKR",
                "lines": [{"description": "Freight Karachi to Lahore, 40ft", "qty": 5, "unit_price": 185000.00}], "subtotal": 925000.00, "tax": 166500.00, "total": 1091500.00, "bank_iban": "PK18MEZN0001234567890001"},
     "expect": "hold"},
    {"id": "approval", "title": "Clean but above the auto-post limit", "doc": """NORTHLINE IT SERVICES LTD
VAT GB123456789
INVOICE NIT-1201                   Date: 2026-11-03
Your PO: PO-5004

Managed IT support, November        1 x 4,800.00 GBP   4,800.00
Laptop setup                         8 x    95.00 GBP     760.00
                                     Subtotal          5,560.00
                                     VAT 20%           1,112.00
                                     Total GBP         6,672.00
Bank: GB29 NWBK 6016 1331 9268 19""",
     "fields": {"vendor_name": "Northline IT Services Ltd", "vendor_tax_id": "GB123456789", "invoice_number": "NIT-1201", "invoice_date": "2026-11-03", "po_number": "PO-5004", "currency": "GBP",
                "lines": [{"description": "Managed IT support, November", "qty": 1, "unit_price": 4800.00}, {"description": "Laptop setup", "qty": 8, "unit_price": 95.00}],
                "subtotal": 5560.00, "tax": 1112.00, "total": 6672.00, "bank_iban": "GB29NWBK60161331926819"},
     "expect": "approval"},
    {"id": "tax", "title": "Wrong VAT rate", "doc": """GULF PACKAGING LLC
TRN 100234567800003
TAX INVOICE  GP-2355            Date: 2026-11-02
PO: PO-5005

Wooden pallets                    400 x  38.00 AED   15,200.00
                                     Subtotal       15,200.00
                                     VAT 10%         1,520.00
                                     TOTAL AED      16,720.00
IBAN AE07 0331 2345 6789 0123 456""",
     "fields": {"vendor_name": "Gulf Packaging LLC", "vendor_tax_id": "100234567800003", "invoice_number": "GP-2355", "invoice_date": "2026-11-02", "po_number": "PO-5005", "currency": "AED",
                "lines": [{"description": "Wooden pallets", "qty": 400, "unit_price": 38.00}], "subtotal": 15200.00, "tax": 1520.00, "total": 16720.00, "bank_iban": "AE070331234567890123456"},
     "expect": "exception"},
]
