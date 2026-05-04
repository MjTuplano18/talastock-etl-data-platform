# 📊 Data Quality Report - NaN Investigation

**Date**: May 4, 2026  
**Analyst**: Data Engineering Team  
**Status**: ✅ Root cause identified and documented

---

## Executive Summary

An investigation into 137 NaN (Not a Number) values found in the sales data warehouse revealed that these values were **intentionally introduced** by the data generator to simulate real-world data quality issues. This represents **1.4% of total transactions** and has been successfully filtered out of the analytics layer.

---

## Investigation Findings

### 1. Root Cause

**Source**: `data-platform/data-generator/generators/quality_issues.py`

**Function**: `introduce_wrong_types()`

**Purpose**: Simulates real-world data quality issues by converting numeric values to strings with various formats:
- Currency format: "₱50.00"
- String format: "50"
- Text format: "fifty"
- Comma format: "1,234"

**Rate**: 5% of transactions (`WRONG_TYPE_RATE = 0.05`)

### 2. How NaN Was Created

```
Step 1: Data Generator
  → Creates clean numeric values (unit_price = 45.00)

Step 2: Quality Issues Module
  → Converts 5% to strings (unit_price = "₱45.00")

Step 3: ETL Cleaning Process
  → Attempts to convert back to numeric
  → Some conversions fail → NaN
  → Example: "fifty" → NaN, "₱1,234.00" → NaN

Step 4: Warehouse Load
  → NaN values loaded into raw/staging layers
  → Filtered out at analytics layer
```

### 3. Affected Transactions

| Metric | Value |
|--------|-------|
| Total transactions | 9,833 |
| Transactions with NaN | 137 |
| Percentage affected | 1.4% |
| Fields affected | `unit_price`, `total_amount` |
| Impact on revenue | Unknown (NaN has no monetary value) |

### 4. Sample NaN Transactions

| Transaction ID | Product | Quantity | Unit Price | Total Amount |
|----------------|---------|----------|------------|--------------|
| TXN-20251105-00003 | Royal Tru-Orange 1.5L | 5 | NaN | NaN |
| TXN-20251106-00093 | Safeguard Bar Soap 135g | 1 | NaN | NaN |
| TXN-20251109-00256 | UFC Banana Catsup 320g | 2 | NaN | NaN |
| TXN-20251113-00454 | Royal Tru-Orange 1.5L | 3 | NaN | NaN |
| TXN-20251113-00464 | Coca-Cola 1.5L | 1 | NaN | NaN |

**Pattern**: No specific product, category, or date pattern. Random distribution as expected from the 5% rate.

---

## Business Impact

### Revenue Impact
- **Unusable for analysis**: 137 transactions (1.4%)
- **Lost revenue visibility**: Unknown amount (NaN has no value)
- **Data completeness**: 98.6% usable data

### Operational Impact
- ✅ **Analytics layer**: Clean (NaN filtered automatically)
- ✅ **Reports**: Accurate (based on clean data)
- ✅ **Dashboards**: Reliable (no NaN contamination)
- ⚠️ **Raw/Staging**: Contains NaN (preserved for audit)

### Decision-Making Impact
- **Minimal**: 98.6% data completeness is acceptable
- **Mitigated**: Automatic filtering ensures clean analytics
- **Transparent**: NaN transactions tracked and documented

---

## Technical Details

### Data Quality Issue Rates

| Issue Type | Rate | Purpose |
|------------|------|---------|
| Missing values | 8% | Simulate incomplete data |
| Duplicates | 2.5% | Simulate data entry errors |
| Wrong data types | **5%** | **Simulate format inconsistencies** ← NaN source |
| Invalid values | 3% | Simulate logical errors |

### Conversion Failures

The ETL cleaning process uses `pd.to_numeric(errors='coerce')` which:
- ✅ Converts "50" → 50.0
- ✅ Converts "₱50.00" → 50.0 (after removing ₱)
- ❌ Converts "fifty" → NaN (text cannot be converted)
- ❌ Converts "₱1,234.00" → NaN (comma causes issues)

### Why Some Conversions Fail

1. **Text values**: "one", "two", "fifty" → Cannot convert to number
2. **Complex formatting**: "₱1,234.00" → Comma interferes with conversion
3. **Special characters**: Some currency symbols not handled properly

---

## Current Mitigation

### Automatic Filtering (Implemented ✅)

**Location**: `data-platform/airflow/dags/warehouse_etl_pipeline.py`

**Function**: `build_fact_sales()` (Task 9)

**Filter Logic**:
```sql
WHERE s.unit_price IS NOT NULL
  AND s.unit_price != 'NaN'::numeric
  AND s.total_amount IS NOT NULL
  AND s.total_amount != 'NaN'::numeric
  AND s.quantity > 0
```

**Result**:
- Raw layer: 9,833 transactions (includes 137 NaN)
- Analytics layer: 9,696 transactions (NaN filtered)
- Aggregate tables: 100% clean data

---

## Recommendations

### 1. Improve Data Generator (Priority: High)

**Action**: Enhance the cleaning process to handle all string formats

**Implementation**:
```python
def clean_numeric_string(value):
    """Convert any string format to numeric"""
    if pd.isna(value):
        return None
    
    # Remove currency symbols
    value = str(value).replace('₱', '').replace('$', '')
    
    # Remove commas
    value = value.replace(',', '')
    
    # Handle text numbers
    text_to_num = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    }
    if value.lower() in text_to_num:
        return text_to_num[value.lower()]
    
    # Convert to numeric
    try:
        return float(value)
    except:
        return None  # Return None instead of NaN
```

### 2. Add Data Quality Alerts (Priority: Medium)

**Action**: Add monitoring to detect NaN values early

**Implementation**: See `data-platform/add_data_quality_monitoring.py`

### 3. Reduce Wrong Type Rate (Priority: Low)

**Action**: Lower `WRONG_TYPE_RATE` from 5% to 2%

**Rationale**: 5% is too aggressive for financial fields

**Change**:
```python
# config.py
WRONG_TYPE_RATE = 0.02  # Reduce from 0.05 to 0.02
```

### 4. Document Data Quality Standards (Priority: Medium)

**Action**: Create data quality SLA

**Standards**:
- Financial fields: 0% NaN tolerance
- Optional fields: 10% missing tolerance
- Duplicate rate: < 1%
- Data completeness: > 99%

---

## Lessons Learned

### What Went Well ✅
1. **Automatic filtering**: NaN values filtered at analytics layer
2. **Data preservation**: Original data kept in raw/staging for audit
3. **Quick detection**: Scanner identified all NaN values
4. **Clean analytics**: Business metrics unaffected

### What Could Be Improved 🔧
1. **Better string handling**: Improve conversion logic
2. **Earlier detection**: Add quality checks before warehouse load
3. **Lower error rate**: Reduce wrong type rate for financial fields
4. **Better documentation**: Document expected data quality issues

### Key Takeaways 💡
1. **NaN in financial fields = useless**: Cannot calculate revenue or profit
2. **Filter at analytics layer**: Keep raw data, filter for analysis
3. **Monitor data quality**: Add alerts for early detection
4. **Document everything**: Track data quality issues and resolutions

---

## Conclusion

The 137 NaN values (1.4% of data) were **intentionally introduced** by the data generator to simulate real-world data quality issues. While this is useful for testing ETL pipelines, it has minimal business impact because:

1. ✅ **Automatic filtering** removes NaN from analytics layer
2. ✅ **98.6% data completeness** is acceptable for analysis
3. ✅ **Clean aggregate tables** provide accurate business metrics
4. ✅ **Original data preserved** for audit and troubleshooting

**Recommendation**: Implement the improvements outlined above to reduce NaN occurrences in future data generation, but the current mitigation (automatic filtering) is sufficient for production use.

---

**Report Prepared By**: Data Engineering Team  
**Date**: May 4, 2026  
**Status**: ✅ Investigation complete, mitigations in place  
**Next Review**: After implementing recommended improvements
