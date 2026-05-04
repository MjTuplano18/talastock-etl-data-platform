# Data Generator - Phase 1

**Enterprise Data Platform for Talastock**

Generates realistic synthetic business data for a Filipino SME (sari-sari store / mini grocery) with authentic temporal patterns and intentional data quality issues for ETL testing.

---

## Features

### ✅ Realistic Filipino Product Catalog
- 50-100 products with real Filipino brands
- Lucky Me, Nescafé, Coca-Cola, San Miguel, Datu Puti, Tide, Safeguard, etc.
- Realistic prices in PHP (₱10 - ₱500)
- Cost prices (70-80% of retail)

### ✅ Temporal Sales Patterns
- **Peak Hours:** Morning rush (7-9 AM), Evening rush (5-7 PM), Night snacks (8-10 PM)
- **Weekend Boost:** 20% higher sales on Saturday/Sunday
- **Payday Effects:** 50% increase on 15th and 30th of month
- **Product Popularity:** Pareto principle (80/20 rule)

### ✅ Data Quality Issues
- Missing values (8%)
- Duplicates (2.5%)
- Wrong data types (5%)
- Invalid values (3%)
- Inconsistent column names across formats

### ✅ Multiple Export Formats
- **CSV:** Standard, messy encoding, multiple variants
- **JSON:** Flat, nested, API format
- **Excel:** Formatted multi-sheet, messy with merged cells
- **TSV:** Tab-separated with reordered columns

---

## Installation

### 1. Create Virtual Environment

```bash
cd data-platform/data-generator
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Usage

### Basic Usage

Generate 100 products and 10,000 sales records over 6 months:

```bash
python generate_data.py
```

### Custom Parameters

```bash
python generate_data.py --products 50 --sales 5000 --months 3
```

### Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--products` | 100 | Number of products to generate |
| `--sales` | 10000 | Number of sales transactions |
| `--months` | 6 | Months of historical data |

---

## Output Files

All files are generated in the `output/` directory:

### Product Data
- `products.csv` - Clean product catalog

### Sales Data (Clean)
- `sales_clean.csv` - Clean sales data (no quality issues)

### Sales Data (With Quality Issues)
- `sales_standard.csv` - Standard CSV format
- `sales_messy_encoding.csv` - Encoding issues (latin-1)
- `sales_variant1.csv` - Different column names (Item, Qty, Amount)
- `sales_variant2.csv` - Different column names (Product, Units, Total)

### JSON Formats
- `sales_flat.json` - Flat array of objects
- `sales_nested.json` - Nested with metadata
- `sales_api_format.json` - API response structure

### Excel Formats
- `sales_formatted.xlsx` - Multi-sheet with formatting
- `sales_messy_excel.xlsx` - Merged cells and extra headers

### TSV Format
- `sales_alternative.tsv` - Tab-separated with reordered columns

### Documentation
- `DATA_DICTIONARY.md` - Complete field documentation

---

## Example Output

### Products Sample

```csv
sku,name,category,brand,price,cost_price,unit,supplier
LM-FOOD-001,Lucky Me Pancit Canton Original,Food,Lucky Me,15.00,12.00,pack,Lucky Me Distributor
CC-BEV-001,Coca-Cola 1.5L,Beverage,Coca-Cola,65.00,52.00,bottle,Coca-Cola Distributor
```

### Sales Sample

```csv
transaction_id,timestamp,product_sku,product_name,quantity,unit_price,total_amount,payment_method
TXN-20240501-00001,2024-05-01 08:15:23,LM-FOOD-001,Lucky Me Pancit Canton Original,2,15.00,30.00,Cash
TXN-20240501-00002,2024-05-01 17:45:12,CC-BEV-001,Coca-Cola 1.5L,1,65.00,65.00,GCash
```

---

## Data Statistics

After generation, you'll see statistics like:

```
✅ Successfully generated:
   • 100 products
   • 10,000 sales transactions
   • 10,250 messy sales records (with quality issues)
   • Total revenue: ₱1,234,567.89

📁 Output files in: C:\path\to\output

⏱️  Total time: 15.23 seconds
```

---

## Temporal Patterns Explained

### Peak Hours Distribution

| Time | % of Sales | Description |
|------|-----------|-------------|
| 7-9 AM | 30% | Breakfast rush |
| 5-7 PM | 40% | Dinner shopping |
| 8-10 PM | 20% | Evening snacks |
| Other | 10% | Off-peak hours |

### Payday Effect

Sales increase 50% on:
- 15th of every month
- 30th/31st of every month

### Product Popularity (Pareto Principle)

| Tier | % of Products | % of Sales |
|------|--------------|-----------|
| High | 20% | 60% |
| Medium | 30% | 30% |
| Low | 50% | 10% |

---

## Data Quality Issues

### Missing Values (~8%)

- `customer_name`: NULL for walk-in customers
- `payment_method`: Some transactions missing
- `customer_type`: Some transactions missing

### Duplicates (~2.5%)

Random duplicate transaction records

### Wrong Data Types (~5%)

- Numeric as string: `"5"` instead of `5`
- Currency format: `"₱50.00"` instead of `50.00`
- Text numbers: `"five"` instead of `5`
- Comma formatting: `"1,234"` instead of `1234`

### Invalid Values (~3%)

- Negative quantities: `-5`
- Zero prices: `0.00`
- Future dates: Timestamps ahead of current date

### Inconsistent Schemas

Different files use different column names:
- `product_name` vs `Item` vs `Product`
- `quantity` vs `Qty` vs `Units`
- `total_amount` vs `Amount` vs `Total`

---

## Testing the Generator

### Test Individual Modules

```bash
# Test product generator
python generators/products.py

# Test temporal patterns
python generators/patterns.py

# Test sales generator
python generators/sales.py

# Test quality issues
python generators/quality_issues.py

# Test exporters
python exporters/csv_exporter.py
python exporters/json_exporter.py
python exporters/excel_exporter.py
python exporters/tsv_exporter.py
```

---

## Project Structure

```
data-generator/
├── generate_data.py          # Main entry point
├── config.py                 # Configuration parameters
├── requirements.txt          # Python dependencies
├── README.md                 # This file
│
├── data/
│   └── filipino_products.json  # Product catalog
│
├── generators/
│   ├── products.py           # Product generation
│   ├── sales.py              # Sales generation
│   ├── patterns.py           # Temporal patterns
│   └── quality_issues.py     # Data quality issues
│
├── exporters/
│   ├── csv_exporter.py       # CSV export
│   ├── json_exporter.py      # JSON export
│   ├── excel_exporter.py     # Excel export
│   ├── tsv_exporter.py       # TSV export
│   └── data_dictionary.py    # Documentation generator
│
└── output/                   # Generated files (gitignored)
```

---

## Configuration

Edit `config.py` to customize:

```python
# Data generation quantities
NUM_PRODUCTS = 100
NUM_SALES_RECORDS = 10000
DATE_RANGE_MONTHS = 6

# Temporal patterns
PAYDAY_BOOST = 1.5  # 50% increase
WEEKEND_BOOST = 1.2  # 20% increase

# Data quality issues
MISSING_VALUE_RATE = 0.08   # 8%
DUPLICATE_RATE = 0.025       # 2.5%
```

---

## Next Steps

After generating data:

1. **Review Output**
   - Check `output/` directory
   - Read `DATA_DICTIONARY.md`
   - Verify data looks realistic

2. **Proceed to Phase 2**
   - Set up Apache Airflow
   - Build ETL pipeline
   - Extract from generated files

3. **Test ETL Pipeline**
   - Handle multiple formats
   - Clean data quality issues
   - Load to data warehouse

---

## Troubleshooting

### Import Errors

If you get import errors, make sure you're in the correct directory:

```bash
cd data-platform/data-generator
python generate_data.py
```

### Missing Dependencies

Reinstall dependencies:

```bash
pip install -r requirements.txt --upgrade
```

### Permission Errors

Make sure `output/` directory is writable:

```bash
mkdir output
chmod 755 output  # Mac/Linux
```

---

## Educational Value

This data generator demonstrates:

✅ **Data Engineering Concepts**
- Synthetic data generation
- Temporal pattern modeling
- Data quality engineering
- Multi-format data export

✅ **Python Skills**
- Pandas DataFrame manipulation
- Faker library usage
- File I/O operations
- Object-oriented design

✅ **Business Understanding**
- Filipino SME operations
- Retail sales patterns
- Product catalog management
- Payment method distribution

---

## License

Part of the Talastock Enterprise Data Platform project.

---

**Status:** ✅ Complete  
**Phase:** 1 of 9  
**Next Phase:** Apache Airflow ETL Pipeline
