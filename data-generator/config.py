"""
Configuration Module

Defines all parameters for data generation including:
- Data generation quantities
- Temporal patterns (peak hours, payday effects)
- Data quality issue rates
- Filipino product brands and categories
"""

# Data Generation Parameters
NUM_PRODUCTS = 100
NUM_SALES_RECORDS = 10000
DATE_RANGE_MONTHS = 6

# Temporal Patterns
# Format: (start_hour, end_hour, percentage_of_daily_sales)
PEAK_HOURS = {
    'morning': (7, 9, 0.30),   # 7-9 AM, 30% of daily sales (breakfast rush)
    'evening': (17, 19, 0.40),  # 5-7 PM, 40% of daily sales (dinner rush)
    'night': (20, 22, 0.20),    # 8-10 PM, 20% of daily sales (evening snacks)
    'off_peak': (10, 17, 0.10), # 10 AM - 5 PM, 10% of daily sales
}

# Day of week multipliers
WEEKEND_BOOST = 1.2  # 20% increase on weekends (Saturday/Sunday)
WEEKDAY_BASELINE = 1.0

# Payday effects (15th and 30th/31st of month)
PAYDAY_BOOST = 1.5  # 50% increase on payday
PAYDAY_DAYS = [15, 30, 31]

# Product popularity (Pareto principle: 80/20 rule)
# Top 20% of products generate 60% of sales
PRODUCT_POPULARITY = {
    'top_20_percent': 0.60,    # Top products: 60% of sales
    'middle_30_percent': 0.30,  # Middle products: 30% of sales
    'bottom_50_percent': 0.10,  # Bottom products: 10% of sales
}

# Data Quality Issues
MISSING_VALUE_RATE = 0.08   # 8% missing values
DUPLICATE_RATE = 0.025       # 2.5% duplicates
WRONG_TYPE_RATE = 0.05       # 5% wrong data types
INVALID_VALUE_RATE = 0.03    # 3% invalid values

# Filipino Product Brands by Category
BRANDS = {
    'Food': [
        'Lucky Me',      # Instant noodles
        'Nissin',        # Instant noodles
        'Payless',       # Instant noodles
        'Argentina',     # Canned meat
        'Purefoods',     # Processed meat
        'CDO',           # Processed meat
        'Century',       # Canned fish
        'Ligo',          # Canned sardines
    ],
    'Beverage': [
        'Coca-Cola',     # Soft drinks
        'Pepsi',         # Soft drinks
        'Sprite',        # Soft drinks
        'Royal',         # Soft drinks
        'Nescafé',       # Coffee
        'Great Taste',   # Coffee
        'San Miguel',    # Beer
        'Red Horse',     # Beer
    ],
    'Essentials': [
        'Datu Puti',     # Vinegar, soy sauce
        'Silver Swan',   # Soy sauce
        'UFC',           # Ketchup, banana sauce
        'Del Monte',     # Ketchup, tomato sauce
        'Mama Sita\'s',  # Cooking mixes
        'Knorr',         # Seasoning
        'Maggi',         # Seasoning
    ],
    'Household': [
        'Tide',          # Laundry detergent
        'Surf',          # Laundry detergent
        'Ariel',         # Laundry detergent
        'Downy',         # Fabric softener
        'Joy',           # Dishwashing liquid
        'Zonrox',        # Bleach
    ],
    'Personal Care': [
        'Safeguard',     # Soap
        'Palmolive',     # Soap, shampoo
        'Colgate',       # Toothpaste
        'Close Up',      # Toothpaste
        'Head & Shoulders',  # Shampoo
        'Cream Silk',    # Conditioner
        'Dove',          # Soap, shampoo
    ],
}

# Product Categories
CATEGORIES = list(BRANDS.keys())

# Payment Methods (Filipino context)
PAYMENT_METHODS = {
    'Cash': 0.60,      # 60% cash payments
    'GCash': 0.30,     # 30% GCash (popular e-wallet)
    'Card': 0.10,      # 10% card payments
}

# Customer Types
CUSTOMER_TYPES = {
    'walk-in': 0.70,   # 70% walk-in customers
    'regular': 0.30,   # 30% regular customers
}

# Price Ranges by Category (in PHP)
PRICE_RANGES = {
    'Food': (10, 150),           # ₱10 - ₱150
    'Beverage': (15, 200),       # ₱15 - ₱200
    'Essentials': (20, 300),     # ₱20 - ₱300
    'Household': (30, 500),      # ₱30 - ₱500
    'Personal Care': (25, 400),  # ₱25 - ₱400
}

# Cost Price Multiplier (cost is 70-80% of retail price)
COST_PRICE_MIN = 0.70
COST_PRICE_MAX = 0.80

# Units of Measurement
UNITS = ['piece', 'pack', 'bottle', 'sachet', 'can', 'box', 'kg', 'liter']
