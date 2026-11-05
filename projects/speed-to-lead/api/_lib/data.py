"""Synthetic data for the Leadline demo. The selling company (Northstar Analytics),
its reps, the enrichment database and every lead are fictional."""
from datetime import datetime, timezone

SELLER = {
    "name": "Northstar Analytics",
    "product": "shipment-visibility and demand-forecasting software for logistics, e-commerce and retail teams",
}

# Fixed clock so scheduling and evals are deterministic.
NOW = datetime(2026, 11, 3, 6, 0, tzinfo=timezone.utc)  # Tuesday 06:00 UTC

ICP = {
    "industries": {"logistics": 30, "ecommerce": 25, "retail": 22, "manufacturing": 18, "saas": 8},
    "employees": [(50, 200, 14), (201, 1000, 22), (1001, 5000, 25), (5001, 10**9, 12)],
    "regions": {"AE": 15, "SA": 15, "PK": 12, "GB": 13, "US": 13},
    "seniority": {"c_level": 18, "vp": 16, "director": 14, "head": 14, "manager": 9, "individual": 3},
}

REPS = {
    "sara": {"name": "Sara Haddad", "tz": "Asia/Dubai", "regions": ["AE", "SA"], "email": "sara@northstar.example"},
    "ayesha": {"name": "Ayesha Siddiqui", "tz": "Asia/Karachi", "regions": ["PK", "GB"], "email": "ayesha@northstar.example"},
    "daniel": {"name": "Daniel Brooks", "tz": "America/New_York", "regions": ["US"], "email": "daniel@northstar.example"},
}

# Busy calendar blocks (rep local time, ISO without offset).
BUSY = {
    "sara": [("2026-11-03T09:00", "2026-11-03T11:00"), ("2026-11-04T13:00", "2026-11-04T15:00")],
    "ayesha": [("2026-11-03T10:00", "2026-11-03T12:30"), ("2026-11-04T09:00", "2026-11-04T10:00")],
    "daniel": [("2026-11-03T09:00", "2026-11-03T10:30"), ("2026-11-04T14:00", "2026-11-04T16:00")],
}

COMPANIES = {
    "gulfline.example": {"name": "Gulfline Freight", "industry": "logistics", "employees": 1800, "country": "AE"},
    "souqcart.example": {"name": "SouqCart", "industry": "ecommerce", "employees": 420, "country": "SA"},
    "indusmart.example": {"name": "Indus Mart", "industry": "retail", "employees": 3200, "country": "PK"},
    "brightloom.example": {"name": "Brightloom Textiles", "industry": "manufacturing", "employees": 650, "country": "PK"},
    "harbourway.example": {"name": "Harbourway Logistics", "industry": "logistics", "employees": 260, "country": "GB"},
    "peakparcel.example": {"name": "PeakParcel", "industry": "logistics", "employees": 9000, "country": "US"},
    "cornerbakery.example": {"name": "Corner Bakery Co", "industry": "food_service", "employees": 12, "country": "US"},
    "pixelpets.example": {"name": "Pixel Pets", "industry": "ecommerce", "employees": 35, "country": "GB"},
    "desertdunes.example": {"name": "Desert Dunes Retail", "industry": "retail", "employees": 140, "country": "AE"},
    "cloudnest.example": {"name": "CloudNest", "industry": "saas", "employees": 90, "country": "US"},
    "routewise.example": {"name": "RouteWise Analytics", "industry": "competitor", "employees": 300, "country": "GB"},
}

COMPETITOR_DOMAINS = {"routewise.example"}
FREE_EMAIL_DOMAINS = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"}
