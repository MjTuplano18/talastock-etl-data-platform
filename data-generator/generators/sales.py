"""
Sales Generator Module

Generates realistic sales transactions with:
- Temporal patterns (peak hours, weekends, payday)
- Product popularity distribution (Pareto principle)
- Realistic quantities and payment methods
- Transaction metadata
"""

import random
from datetime import datetime, timedelta
import pandas as pd
from faker import Faker

# Import other modules
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from config import PAYMENT_METHODS, CUSTOMER_TYPES
from generators.patterns import (
    generate_timestamp_distribution,
    select_products_with_popularity,
    generate_quantity
)

fake = Faker('fil_PH')


def generate_transaction_id(index, date):
    """
    Generate transaction ID
    
    Format: TXN-YYYYMMDD-XXXXX
    Example: TXN-20240501-00001
    """
    date_str = date.strftime('%Y%m%d')
    return f"TXN-{date_str}-{index:05d}"


def select_payment_method():
    """
    Select payment method based on Filipino payment preferences
    
    60% Cash, 30% GCash, 10% Card
    """
    methods = list(PAYMENT_METHODS.keys())
    weights = list(PAYMENT_METHODS.values())
    return random.choices(methods, weights=weights)[0]


def select_customer_type():
    """
    Select customer type
    
    70% walk-in, 30% regular
    """
    types = list(CUSTOMER_TYPES.keys())
    weights = list(CUSTOMER_TYPES.values())
    return random.choices(types, weights=weights)[0]


def generate_sales(products_df, popularity_map, num_sales, start_date, end_date):
    """
    Generate sales transactions with realistic patterns
    
    Args:
        products_df: DataFrame of products
        popularity_map: Dict mapping SKU to popularity tier
        num_sales: Number of sales to generate
        start_date: Start of date range
        end_date: End of date range
        
    Returns:
        pandas.DataFrame with sales data
    """
    print(f"\n💰 Generating {num_sales} sales transactions...")
    print(f"   Date range: {start_date.date()} to {end_date.date()}")
    
    # Generate timestamps with temporal patterns
    print("   Applying temporal patterns (peak hours, weekends, payday)...")
    timestamps = generate_timestamp_distribution(start_date, end_date, num_sales)
    
    # Select products with popularity distribution
    print("   Applying product popularity (Pareto principle)...")
    selected_skus = select_products_with_popularity(
        products_df, popularity_map, num_sales
    )
    
    # Generate sales records
    print("   Creating transaction records...")
    sales = []
    
    for i, (timestamp, sku) in enumerate(zip(timestamps, selected_skus), 1):
        # Get product details
        product = products_df[products_df['sku'] == sku].iloc[0]
        
        # Generate quantity based on price
        quantity = generate_quantity(product['price'])
        
        # Calculate amounts
        unit_price = product['price']
        total_amount = round(quantity * unit_price, 2)
        
        # Generate transaction details
        sale = {
            'transaction_id': generate_transaction_id(i, timestamp),
            'timestamp': timestamp,
            'product_sku': sku,
            'product_name': product['name'],
            'category': product['category'],
            'brand': product['brand'],
            'quantity': quantity,
            'unit_price': unit_price,
            'total_amount': total_amount,
            'payment_method': select_payment_method(),
            'customer_type': select_customer_type(),
        }
        
        sales.append(sale)
        
        # Progress indicator
        if i % 1000 == 0:
            print(f"   Progress: {i}/{num_sales} transactions...")
    
    df = pd.DataFrame(sales)
    
    # Summary statistics
    print(f"\n✅ Generated {len(df)} sales transactions")
    print(f"   Total revenue: ₱{df['total_amount'].sum():,.2f}")
    print(f"   Average transaction: ₱{df['total_amount'].mean():.2f}")
    print(f"   Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    # Payment method distribution
    print(f"\n   Payment methods:")
    for method, count in df['payment_method'].value_counts().items():
        pct = count / len(df) * 100
        print(f"     {method}: {count} ({pct:.1f}%)")
    
    # Top products
    print(f"\n   Top 5 products by revenue:")
    top_products = df.groupby('product_name')['total_amount'].sum().sort_values(ascending=False).head(5)
    for product, revenue in top_products.items():
        print(f"     {product}: ₱{revenue:,.2f}")
    
    return df


def add_customer_names(sales_df):
    """
    Add customer names for regular customers
    
    Walk-in customers remain anonymous
    Regular customers get Filipino names
    """
    print("\n👤 Adding customer names...")
    
    # Generate pool of regular customer names
    num_regular_customers = 50
    regular_customers = [fake.name() for _ in range(num_regular_customers)]
    
    # Assign names
    def get_customer_name(row):
        if row['customer_type'] == 'regular':
            return random.choice(regular_customers)
        else:
            return None
    
    sales_df['customer_name'] = sales_df.apply(get_customer_name, axis=1)
    
    regular_count = sales_df['customer_name'].notna().sum()
    print(f"✅ Added names for {regular_count} regular customer transactions")
    
    return sales_df


if __name__ == "__main__":
    # Test the generator
    from generators.products import generate_products, get_product_popularity_tier
    from datetime import datetime
    
    print("Testing sales generator...")
    
    # Generate test products
    products_df = generate_products(50)
    popularity_map = get_product_popularity_tier(products_df)
    
    # Generate test sales
    start_date = datetime(2024, 5, 1)
    end_date = datetime(2024, 5, 7)
    
    sales_df = generate_sales(
        products_df, 
        popularity_map, 
        500,  # 500 sales
        start_date, 
        end_date
    )
    
    # Add customer names
    sales_df = add_customer_names(sales_df)
    
    print("\nSample sales:")
    print(sales_df.head(10))
    
    print("\nData types:")
    print(sales_df.dtypes)
