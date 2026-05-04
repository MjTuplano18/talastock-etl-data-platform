"""
Data Quality Issues Module

Introduces realistic data quality problems:
- Missing values (5-10%)
- Duplicates (2-3%)
- Wrong data types (5%)
- Invalid values (3%)
- Inconsistent formatting

This makes the data realistic for testing ETL pipelines
"""

import random
import pandas as pd
import numpy as np

# Import configuration
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from config import (
    MISSING_VALUE_RATE,
    DUPLICATE_RATE,
    WRONG_TYPE_RATE,
    INVALID_VALUE_RATE
)


def introduce_missing_values(df, columns, rate=MISSING_VALUE_RATE):
    """
    Randomly remove values from specified columns
    
    Args:
        df: DataFrame to modify
        columns: List of column names to affect
        rate: Percentage of values to remove (0.08 = 8%)
        
    Returns:
        Modified DataFrame
    """
    df = df.copy()
    num_rows = len(df)
    num_missing = int(num_rows * rate)
    
    print(f"\n🔴 Introducing missing values ({rate:.1%})...")
    
    for column in columns:
        if column in df.columns:
            # Randomly select rows to make null
            missing_indices = random.sample(range(num_rows), 
                                          min(num_missing, num_rows))
            df.loc[missing_indices, column] = None
            
            actual_missing = df[column].isna().sum()
            print(f"   {column}: {actual_missing} missing values")
    
    return df


def introduce_duplicates(df, rate=DUPLICATE_RATE):
    """
    Duplicate random rows
    
    Args:
        df: DataFrame to modify
        rate: Percentage of rows to duplicate (0.025 = 2.5%)
        
    Returns:
        Modified DataFrame with duplicates
    """
    df = df.copy()
    num_rows = len(df)
    num_duplicates = int(num_rows * rate)
    
    print(f"\n🔴 Introducing duplicates ({rate:.1%})...")
    
    # Randomly select rows to duplicate
    duplicate_indices = random.sample(range(num_rows), num_duplicates)
    duplicates = df.iloc[duplicate_indices].copy()
    
    # Append duplicates
    df = pd.concat([df, duplicates], ignore_index=True)
    
    print(f"   Added {num_duplicates} duplicate rows")
    print(f"   Total rows: {len(df)}")
    
    return df


def introduce_wrong_types(df, numeric_columns, rate=WRONG_TYPE_RATE):
    """
    Convert numeric values to strings with formatting issues
    
    Args:
        df: DataFrame to modify
        numeric_columns: List of numeric column names
        rate: Percentage of values to convert
        
    Returns:
        Modified DataFrame
    """
    df = df.copy()
    num_rows = len(df)
    num_wrong = int(num_rows * rate)
    
    print(f"\n🔴 Introducing wrong data types ({rate:.1%})...")
    
    for column in numeric_columns:
        if column in df.columns:
            # Convert column to object type first to allow mixed types
            df[column] = df[column].astype(object)
            
            # Randomly select rows
            wrong_indices = random.sample(range(num_rows), 
                                        min(num_wrong, num_rows))
            
            for idx in wrong_indices:
                value = df.at[idx, column]
                if pd.notna(value):
                    # Convert to string with various formats
                    format_choice = random.choice([
                        'currency',  # "₱50.00"
                        'string',    # "50"
                        'text',      # "fifty"
                        'comma'      # "1,234"
                    ])
                    
                    if format_choice == 'currency':
                        df.at[idx, column] = f"₱{value:.2f}"
                    elif format_choice == 'string':
                        df.at[idx, column] = str(int(value))
                    elif format_choice == 'text':
                        # Only for small numbers
                        if value <= 10:
                            text_map = {1: 'one', 2: 'two', 3: 'three', 
                                      4: 'four', 5: 'five'}
                            df.at[idx, column] = text_map.get(int(value), str(int(value)))
                    elif format_choice == 'comma':
                        if value >= 1000:
                            df.at[idx, column] = f"{value:,.2f}"
            
            # Count affected
            affected = sum(isinstance(df.at[i, column], str) 
                         for i in range(len(df)) 
                         if pd.notna(df.at[i, column]))
            print(f"   {column}: {affected} values converted to string")
    
    return df


def introduce_invalid_values(df, rate=INVALID_VALUE_RATE):
    """
    Introduce invalid values (negative quantities, zero prices, future dates)
    
    Args:
        df: DataFrame to modify
        rate: Percentage of rows to affect
        
    Returns:
        Modified DataFrame
    """
    df = df.copy()
    num_rows = len(df)
    num_invalid = int(num_rows * rate)
    
    print(f"\n🔴 Introducing invalid values ({rate:.1%})...")
    
    # Negative quantities
    if 'quantity' in df.columns:
        invalid_indices = random.sample(range(num_rows), 
                                      min(num_invalid, num_rows))
        for idx in invalid_indices:
            value = df.at[idx, 'quantity']
            # Only apply to numeric values
            if pd.notna(value) and isinstance(value, (int, float)):
                df.at[idx, 'quantity'] = -abs(value)
        print(f"   quantity: {len(invalid_indices)} negative values")
    
    # Zero prices
    if 'unit_price' in df.columns:
        invalid_indices = random.sample(range(num_rows), 
                                      min(num_invalid, num_rows))
        for idx in invalid_indices:
            value = df.at[idx, 'unit_price']
            # Only apply to numeric values
            if pd.notna(value) and isinstance(value, (int, float)):
                df.at[idx, 'unit_price'] = 0.0
        print(f"   unit_price: {len(invalid_indices)} zero values")
    
    # Future dates (if timestamp column exists)
    if 'timestamp' in df.columns:
        invalid_indices = random.sample(range(num_rows), 
                                      min(num_invalid // 2, num_rows))
        for idx in invalid_indices:
            # Add 1-30 days to make it future
            current = df.at[idx, 'timestamp']
            if pd.notna(current):
                future = current + pd.Timedelta(days=random.randint(1, 30))
                df.at[idx, 'timestamp'] = future
        print(f"   timestamp: {len(invalid_indices)} future dates")
    
    return df


def introduce_inconsistent_columns(df, column_mapping):
    """
    Rename columns to create inconsistent schemas
    
    Args:
        df: DataFrame to modify
        column_mapping: Dict of old_name -> new_name
        
    Returns:
        Modified DataFrame with renamed columns
    """
    df = df.copy()
    
    print(f"\n🔴 Introducing inconsistent column names...")
    
    for old_name, new_name in column_mapping.items():
        if old_name in df.columns:
            df = df.rename(columns={old_name: new_name})
            print(f"   {old_name} -> {new_name}")
    
    return df


def apply_all_quality_issues(df, issue_type='sales'):
    """
    Apply all data quality issues to a DataFrame
    
    Args:
        df: DataFrame to modify
        issue_type: 'sales' or 'products' (determines which columns to affect)
        
    Returns:
        Modified DataFrame with quality issues
    """
    print(f"\n{'='*60}")
    print(f"Applying Data Quality Issues to {issue_type.upper()} data")
    print(f"{'='*60}")
    
    df = df.copy()
    
    if issue_type == 'sales':
        # Missing values in non-critical columns
        df = introduce_missing_values(df, 
            columns=['customer_name', 'payment_method', 'customer_type'],
            rate=MISSING_VALUE_RATE
        )
        
        # Duplicates
        df = introduce_duplicates(df, rate=DUPLICATE_RATE)
        
        # IMPORTANT: Apply invalid values BEFORE wrong types
        # This ensures we're working with numeric values
        df = introduce_invalid_values(df, rate=INVALID_VALUE_RATE)
        
        # Wrong types in numeric columns (do this last)
        df = introduce_wrong_types(df,
            numeric_columns=['quantity', 'unit_price', 'total_amount'],
            rate=WRONG_TYPE_RATE
        )
        
    elif issue_type == 'products':
        # Missing values
        df = introduce_missing_values(df,
            columns=['supplier', 'unit'],
            rate=MISSING_VALUE_RATE
        )
        
        # Wrong types
        df = introduce_wrong_types(df,
            numeric_columns=['price', 'cost_price'],
            rate=WRONG_TYPE_RATE
        )
    
    print(f"\n✅ Quality issues applied")
    print(f"   Final row count: {len(df)}")
    
    return df


def create_messy_variant(df, variant_name):
    """
    Create a messy variant with inconsistent column names
    
    This simulates receiving data from different sources with different schemas
    """
    df = df.copy()
    
    # Different column name mappings for different variants
    mappings = {
        'variant1': {
            'product_name': 'Item',
            'quantity': 'Qty',
            'unit_price': 'Price',
            'total_amount': 'Amount',
            'payment_method': 'Payment',
        },
        'variant2': {
            'product_name': 'Product',
            'quantity': 'Units',
            'unit_price': 'UnitPrice',
            'total_amount': 'Total',
            'timestamp': 'Date',
        },
        'variant3': {
            'product_sku': 'SKU',
            'product_name': 'ProductName',
            'quantity': 'Quantity',
            'total_amount': 'TotalAmount',
        }
    }
    
    if variant_name in mappings:
        df = introduce_inconsistent_columns(df, mappings[variant_name])
    
    return df


if __name__ == "__main__":
    # Test quality issues
    from generators.products import generate_products
    from generators.sales import generate_sales
    from generators.products import get_product_popularity_tier
    from datetime import datetime
    
    print("Testing data quality issues...")
    
    # Generate test data
    products_df = generate_products(20)
    popularity_map = get_product_popularity_tier(products_df)
    
    start_date = datetime(2024, 5, 1)
    end_date = datetime(2024, 5, 3)
    
    sales_df = generate_sales(products_df, popularity_map, 100, start_date, end_date)
    
    # Apply quality issues
    messy_sales = apply_all_quality_issues(sales_df, issue_type='sales')
    
    print("\nSample messy data:")
    print(messy_sales.head(10))
    
    print("\nData types after issues:")
    print(messy_sales.dtypes)
    
    print("\nMissing value counts:")
    print(messy_sales.isna().sum())
