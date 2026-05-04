"""
Data Cleaner Module

Provides robust cleaning functions to handle messy data including:
- String to numeric conversion with multiple format support
- Missing value handling
- Duplicate removal
- Data validation
"""

import pandas as pd
import numpy as np
import re


def clean_numeric_string(value):
    """
    Convert any string format to numeric, handling:
    - Currency symbols (₱, $)
    - Commas (1,234.56)
    - Text numbers (one, two, three, etc.)
    - Whitespace
    - Mixed formats
    
    Args:
        value: Any value (string, number, None)
        
    Returns:
        float or None (never returns NaN)
    """
    # Handle None and actual NaN
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    
    # Already numeric
    if isinstance(value, (int, float)) and not np.isnan(value):
        return float(value)
    
    # Convert to string for processing
    value_str = str(value).strip().lower()
    
    # Handle empty strings
    if not value_str or value_str == 'nan':
        return None
    
    # Text number mapping
    text_to_num = {
        'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
        'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
        'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
        'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
        'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000
    }
    
    # Check if it's a text number
    if value_str in text_to_num:
        return float(text_to_num[value_str])
    
    # Remove currency symbols
    value_str = re.sub(r'[₱$€£¥]', '', value_str)
    
    # Remove commas
    value_str = value_str.replace(',', '')
    
    # Remove whitespace
    value_str = value_str.strip()
    
    # Try to convert to float
    try:
        result = float(value_str)
        # Check for infinity or NaN
        if np.isinf(result) or np.isnan(result):
            return None
        return result
    except (ValueError, TypeError):
        return None


def clean_numeric_column(df, column_name):
    """
    Clean a numeric column, converting all values to proper numbers
    
    Args:
        df: DataFrame
        column_name: Name of column to clean
        
    Returns:
        DataFrame with cleaned column
    """
    if column_name not in df.columns:
        return df
    
    print(f"   Cleaning {column_name}...")
    
    # Count original NaN/None
    original_missing = df[column_name].isna().sum()
    
    # Apply cleaning function
    df[column_name] = df[column_name].apply(clean_numeric_string)
    
    # Count new missing (failed conversions)
    new_missing = df[column_name].isna().sum()
    failed_conversions = new_missing - original_missing
    
    if failed_conversions > 0:
        print(f"      ⚠️  {failed_conversions} values could not be converted (set to None)")
    
    # Convert to numeric type
    df[column_name] = pd.to_numeric(df[column_name], errors='coerce')
    
    # Final check - replace any remaining NaN with None
    df[column_name] = df[column_name].replace({np.nan: None})
    
    return df


def remove_nan_rows(df, columns):
    """
    Remove rows where specified columns have NaN or None values
    
    Args:
        df: DataFrame
        columns: List of column names to check
        
    Returns:
        DataFrame with NaN rows removed
    """
    print(f"\n   Removing rows with NaN in critical columns...")
    
    original_count = len(df)
    
    for column in columns:
        if column in df.columns:
            # Remove rows where column is None or NaN
            df = df[df[column].notna()]
            # Also check for string 'NaN'
            if df[column].dtype == 'object':
                df = df[df[column] != 'NaN']
                df = df[df[column] != 'nan']
    
    removed_count = original_count - len(df)
    
    if removed_count > 0:
        print(f"      Removed {removed_count} rows with NaN values")
        print(f"      Remaining: {len(df)} rows")
    else:
        print(f"      No NaN rows found")
    
    return df


def validate_financial_data(df):
    """
    Validate financial data to ensure no NaN, negative, or zero values
    
    Args:
        df: DataFrame with financial columns
        
    Returns:
        DataFrame with only valid financial data
    """
    print(f"\n   Validating financial data...")
    
    original_count = len(df)
    
    # Check for NaN in critical financial columns
    financial_columns = ['unit_price', 'total_amount', 'quantity']
    
    for column in financial_columns:
        if column in df.columns:
            # Remove NaN
            df = df[df[column].notna()]
            
            # Remove zero or negative values
            if column in ['unit_price', 'total_amount']:
                df = df[df[column] > 0]
            elif column == 'quantity':
                df = df[df[column] > 0]
    
    removed_count = original_count - len(df)
    
    if removed_count > 0:
        print(f"      ⚠️  Removed {removed_count} rows with invalid financial data")
        print(f"      Remaining: {len(df)} valid transactions")
    else:
        print(f"      ✅ All financial data is valid")
    
    return df


def clean_sales_data(df):
    """
    Complete cleaning pipeline for sales data
    
    Args:
        df: Raw sales DataFrame
        
    Returns:
        Cleaned DataFrame with no NaN in financial fields
    """
    print(f"\n{'='*60}")
    print(f"🧹 Cleaning Sales Data")
    print(f"{'='*60}")
    print(f"   Input rows: {len(df)}")
    
    # Clean numeric columns
    numeric_columns = ['quantity', 'unit_price', 'total_amount']
    for column in numeric_columns:
        df = clean_numeric_column(df, column)
    
    # Remove rows with NaN in critical columns
    df = remove_nan_rows(df, ['unit_price', 'total_amount', 'quantity'])
    
    # Validate financial data
    df = validate_financial_data(df)
    
    # Final verification
    nan_count = df[['unit_price', 'total_amount', 'quantity']].isna().sum().sum()
    
    if nan_count > 0:
        print(f"\n   ⚠️  WARNING: {nan_count} NaN values still present!")
    else:
        print(f"\n   ✅ SUCCESS: No NaN values in financial fields")
    
    print(f"   Output rows: {len(df)}")
    print(f"   Data quality: {len(df)/len(df)*100:.1f}% clean")
    print(f"{'='*60}\n")
    
    return df


def clean_products_data(df):
    """
    Complete cleaning pipeline for products data
    
    Args:
        df: Raw products DataFrame
        
    Returns:
        Cleaned DataFrame
    """
    print(f"\n{'='*60}")
    print(f"🧹 Cleaning Products Data")
    print(f"{'='*60}")
    print(f"   Input rows: {len(df)}")
    
    # Clean numeric columns
    numeric_columns = ['price', 'cost_price']
    for column in numeric_columns:
        df = clean_numeric_column(df, column)
    
    # Remove rows with NaN in critical columns
    df = remove_nan_rows(df, ['price', 'cost_price'])
    
    # Validate prices are positive
    df = df[df['price'] > 0]
    df = df[df['cost_price'] > 0]
    
    print(f"   Output rows: {len(df)}")
    print(f"{'='*60}\n")
    
    return df


if __name__ == "__main__":
    # Test the cleaner
    print("Testing data cleaner...")
    
    # Test clean_numeric_string
    test_values = [
        "₱50.00",
        "1,234.56",
        "fifty",
        "100",
        None,
        np.nan,
        "NaN",
        "  45.67  ",
        "$99.99",
        "one",
        "invalid",
    ]
    
    print("\nTesting clean_numeric_string:")
    for value in test_values:
        result = clean_numeric_string(value)
        print(f"   {repr(value):20s} → {result}")
    
    # Test with DataFrame
    print("\nTesting with DataFrame:")
    test_df = pd.DataFrame({
        'quantity': [1, "2", "three", "₱5", None, "NaN"],
        'unit_price': ["₱45.00", "1,234.56", "fifty", 100, np.nan, "invalid"],
        'total_amount': [45.00, "2,469.12", None, 500, "NaN", "₱999.99"]
    })
    
    print("\nBefore cleaning:")
    print(test_df)
    
    cleaned_df = clean_sales_data(test_df)
    
    print("\nAfter cleaning:")
    print(cleaned_df)
    print("\nData types:")
    print(cleaned_df.dtypes)
