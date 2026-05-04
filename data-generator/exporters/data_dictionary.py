"""
Data Dictionary Generator

Creates documentation for generated datasets:
- Field names and descriptions
- Data types
- Valid ranges
- Business meaning
"""

from pathlib import Path
from datetime import datetime


def generate_data_dictionary(products_df, sales_df, output_dir='output'):
    """
    Generate data dictionary markdown file
    
    Args:
        products_df: Products DataFrame
        sales_df: Sales DataFrame
        output_dir: Output directory path
        
    Returns:
        Path to generated file
    """
    print(f"\n📖 Generating data dictionary...")
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    filepath = output_path / 'DATA_DICTIONARY.md'
    
    content = f"""# Data Dictionary

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This document describes the structure and meaning of the generated business data.

---

## Products Dataset

**Purpose:** Product catalog for Filipino SME (sari-sari store / mini grocery)

**Record Count:** {len(products_df):,}

### Fields

| Field | Type | Description | Valid Range | Business Meaning |
|-------|------|-------------|-------------|------------------|
| `sku` | string | Stock Keeping Unit | Format: XX-XXXX-NNN | Unique product identifier |
| `name` | string | Product name | 1-100 characters | Full product name with brand and size |
| `category` | string | Product category | Food, Beverage, Essentials, Household, Personal Care | Product classification |
| `brand` | string | Brand name | 1-50 characters | Manufacturer or brand |
| `price` | decimal | Retail price | ₱{products_df['price'].min():.2f} - ₱{products_df['price'].max():.2f} | Selling price to customers (PHP) |
| `cost_price` | decimal | Cost price | ₱{products_df['cost_price'].min():.2f} - ₱{products_df['cost_price'].max():.2f} | Purchase price from supplier (PHP) |
| `unit` | string | Unit of measure | piece, pack, bottle, etc. | How product is sold |
| `supplier` | string | Supplier name | 1-100 characters | Product supplier/distributor |

### Sample Data

```
{products_df.head(3).to_string()}
```

---

## Sales Dataset

**Purpose:** Sales transactions with temporal patterns (peak hours, payday effects)

**Record Count:** {len(sales_df):,}

**Date Range:** {sales_df['timestamp'].min()} to {sales_df['timestamp'].max()}

**Total Revenue:** ₱{sales_df['total_amount'].sum():,.2f}

### Fields

| Field | Type | Description | Valid Range | Business Meaning |
|-------|------|-------------|-------------|------------------|
| `transaction_id` | string | Transaction ID | Format: TXN-YYYYMMDD-NNNNN | Unique transaction identifier |
| `timestamp` | datetime | Transaction date/time | {sales_df['timestamp'].min().date()} to {sales_df['timestamp'].max().date()} | When sale occurred |
| `product_sku` | string | Product SKU | Must exist in Products | Links to product catalog |
| `product_name` | string | Product name | 1-100 characters | Product sold |
| `category` | string | Product category | Food, Beverage, etc. | Product classification |
| `brand` | string | Brand name | 1-50 characters | Product brand |
| `quantity` | integer | Quantity sold | 1-10 units | Number of units purchased |
| `unit_price` | decimal | Price per unit | ₱{sales_df['unit_price'].min():.2f} - ₱{sales_df['unit_price'].max():.2f} | Price at time of sale (PHP) |
| `total_amount` | decimal | Total amount | quantity × unit_price | Total transaction value (PHP) |
| `payment_method` | string | Payment method | Cash, GCash, Card | How customer paid |
| `customer_type` | string | Customer type | walk-in, regular | Customer classification |
| `customer_name` | string | Customer name | 1-100 characters or NULL | Name for regular customers only |

### Sample Data

```
{sales_df.head(3).to_string()}
```

---

## Temporal Patterns

The sales data includes realistic temporal patterns:

### Peak Hours
- **Morning Rush (7-9 AM):** 30% of daily sales (breakfast items)
- **Evening Rush (5-7 PM):** 40% of daily sales (dinner shopping)
- **Night Snacks (8-10 PM):** 20% of daily sales (evening purchases)
- **Off-Peak (10 AM - 5 PM):** 10% of daily sales

### Day of Week
- **Weekdays:** Baseline sales
- **Weekends (Sat/Sun):** 20% increase in sales

### Payday Effects
- **15th of month:** 50% increase in sales
- **30th/31st of month:** 50% increase in sales
- **Days before payday:** 10% decrease in sales

### Product Popularity (Pareto Principle)
- **Top 20% of products:** Generate 60% of sales
- **Middle 30% of products:** Generate 30% of sales
- **Bottom 50% of products:** Generate 10% of sales

---

## Data Quality Issues

The generated data intentionally includes realistic quality issues for ETL testing:

### Missing Values (~8%)
- `customer_name`: Walk-in customers have NULL names
- `payment_method`: Some transactions missing payment info
- `customer_type`: Some transactions missing customer type

### Duplicates (~2.5%)
- Random duplicate transactions to test deduplication logic

### Wrong Data Types (~5%)
- Numeric fields converted to strings: "₱50.00", "1,234"
- Text in numeric fields: "five" instead of 5

### Invalid Values (~3%)
- Negative quantities: -5 units
- Zero prices: ₱0.00
- Future dates: Timestamps ahead of current date

### Inconsistent Schemas
Different export formats use different column names:
- Format 1: `product_name`, `quantity`, `total_amount`
- Format 2: `Item`, `Qty`, `Amount`
- Format 3: `Product`, `Units`, `Total`

---

## File Formats

The data is exported in multiple formats to test ETL flexibility:

### CSV Files
- `products.csv` - Product catalog (standard format)
- `sales_standard.csv` - Sales data (clean format)
- `sales_messy.csv` - Sales data (encoding issues)

### JSON Files
- `sales_flat.json` - Flat array of objects
- `sales_nested.json` - Nested structure with metadata
- `sales_api_format.json` - API response format

### Excel Files
- `sales_formatted.xlsx` - Multi-sheet with formatting
- `sales_messy.xlsx` - Merged cells and extra headers

### TSV Files
- `sales_alternative.tsv` - Tab-separated with reordered columns

---

## Business Context

This data simulates a typical Filipino sari-sari store or mini grocery:

**Location:** Urban area (Manila, Quezon City, etc.)

**Products:** Common Filipino brands
- Food: Lucky Me, Nissin, Argentina, Century
- Beverage: Coca-Cola, Nescafé, San Miguel
- Essentials: Datu Puti, Silver Swan, UFC
- Household: Tide, Surf, Joy
- Personal Care: Safeguard, Colgate, Palmolive

**Customer Base:**
- 70% walk-in customers (anonymous)
- 30% regular customers (known by name)

**Payment Methods:**
- 60% Cash
- 30% GCash (popular e-wallet in Philippines)
- 10% Card

**Operating Hours:** 6 AM - 10 PM daily

---

## Usage Notes

### For ETL Development
1. Test extraction from multiple formats (CSV, JSON, Excel, TSV)
2. Handle inconsistent column names across formats
3. Detect and handle data quality issues
4. Validate data types and ranges
5. Deduplicate records
6. Handle missing values appropriately

### For Data Analysis
1. Analyze temporal patterns (peak hours, payday effects)
2. Identify top-selling products
3. Calculate profit margins by category
4. Forecast demand based on historical patterns
5. Optimize inventory levels

### For Data Quality Monitoring
1. Track missing value rates over time
2. Detect anomalies in sales patterns
3. Validate referential integrity (SKUs exist in products)
4. Monitor data freshness
5. Alert on unusual patterns

---

**End of Data Dictionary**
"""
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Generated data dictionary: {filepath}")
    
    return filepath


if __name__ == "__main__":
    # Test data dictionary generator
    import pandas as pd
    from datetime import datetime
    
    products_df = pd.DataFrame({
        'sku': ['LM-FOOD-001', 'CC-BEV-001'],
        'name': ['Lucky Me Pancit Canton', 'Coca-Cola 1.5L'],
        'category': ['Food', 'Beverage'],
        'brand': ['Lucky Me', 'Coca-Cola'],
        'price': [15.00, 65.00],
        'cost_price': [12.00, 52.00],
        'unit': ['pack', 'bottle'],
        'supplier': ['Lucky Me Distributor', 'Coca-Cola Distributor']
    })
    
    sales_df = pd.DataFrame({
        'transaction_id': ['TXN-20240501-00001', 'TXN-20240501-00002'],
        'timestamp': [datetime.now(), datetime.now()],
        'product_sku': ['LM-FOOD-001', 'CC-BEV-001'],
        'product_name': ['Lucky Me Pancit Canton', 'Coca-Cola 1.5L'],
        'category': ['Food', 'Beverage'],
        'brand': ['Lucky Me', 'Coca-Cola'],
        'quantity': [2, 1],
        'unit_price': [15.00, 65.00],
        'total_amount': [30.00, 65.00],
        'payment_method': ['Cash', 'GCash'],
        'customer_type': ['walk-in', 'regular'],
        'customer_name': [None, 'Juan Dela Cruz']
    })
    
    generate_data_dictionary(products_df, sales_df)
