"""
Product Generator Module

Generates realistic Filipino product catalog with:
- Real Filipino brands (Lucky Me, Nescafé, Coca-Cola, etc.)
- Realistic prices in PHP
- Cost prices (70-80% of retail)
- Product metadata (SKU, category, unit)
"""

import json
import random
from pathlib import Path
import pandas as pd
from faker import Faker

# Import configuration
import sys
sys.path.append(str(Path(__file__).parent.parent))
from config import (
    CATEGORIES, BRANDS, PRICE_RANGES, 
    COST_PRICE_MIN, COST_PRICE_MAX, UNITS
)

fake = Faker('fil_PH')  # Filipino locale


def load_product_catalog():
    """Load Filipino product catalog from JSON file"""
    catalog_path = Path(__file__).parent.parent / 'data' / 'filipino_products.json'
    with open(catalog_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['products']


def generate_sku(brand, category, index):
    """
    Generate SKU (Stock Keeping Unit) code
    
    Format: BRAND-CATEGORY-INDEX
    Example: LM-FOOD-001 (Lucky Me Food product #1)
    """
    brand_code = ''.join([c for c in brand.upper() if c.isalpha()])[:2]
    category_code = category.upper()[:4]
    return f"{brand_code}-{category_code}-{index:03d}"


def calculate_cost_price(retail_price):
    """
    Calculate cost price (70-80% of retail price)
    
    This simulates wholesale/supplier pricing
    """
    multiplier = random.uniform(COST_PRICE_MIN, COST_PRICE_MAX)
    return round(retail_price * multiplier, 2)


def add_price_variation(base_price):
    """
    Add slight price variation (±5%) to make data more realistic
    
    Real stores adjust prices slightly based on supplier deals
    """
    variation = random.uniform(0.95, 1.05)
    return round(base_price * variation, 2)


def generate_products(num_products=100):
    """
    Generate product catalog
    
    Args:
        num_products: Number of products to generate
        
    Returns:
        pandas.DataFrame with product data
    """
    print(f"\n📦 Generating {num_products} products...")
    
    # Load base product catalog
    catalog = load_product_catalog()
    
    # If we need more products than in catalog, duplicate with variations
    products = []
    product_index = 1
    
    while len(products) < num_products:
        for base_product in catalog:
            if len(products) >= num_products:
                break
                
            # Add price variation to make each instance unique
            retail_price = add_price_variation(base_product['base_price'])
            cost_price = calculate_cost_price(retail_price)
            
            product = {
                'sku': generate_sku(
                    base_product['brand'], 
                    base_product['category'], 
                    product_index
                ),
                'name': base_product['name'],
                'category': base_product['category'],
                'brand': base_product['brand'],
                'price': retail_price,
                'cost_price': cost_price,
                'unit': base_product['unit'],
                'supplier': f"{base_product['brand']} Distributor",
            }
            
            products.append(product)
            product_index += 1
    
    df = pd.DataFrame(products)
    
    print(f"✅ Generated {len(df)} products")
    print(f"   Categories: {df['category'].nunique()}")
    print(f"   Brands: {df['brand'].nunique()}")
    print(f"   Price range: ₱{df['price'].min():.2f} - ₱{df['price'].max():.2f}")
    
    return df


def get_product_popularity_tier(df):
    """
    Assign popularity tiers to products (Pareto principle)
    
    Top 20% = High popularity (60% of sales)
    Middle 30% = Medium popularity (30% of sales)
    Bottom 50% = Low popularity (10% of sales)
    
    Returns:
        Dictionary mapping SKU to popularity weight
    """
    num_products = len(df)
    
    # Calculate tier sizes
    top_20_count = int(num_products * 0.20)
    middle_30_count = int(num_products * 0.30)
    
    # Randomly assign products to tiers
    skus = df['sku'].tolist()
    random.shuffle(skus)
    
    popularity = {}
    
    # Top 20% - high popularity
    for sku in skus[:top_20_count]:
        popularity[sku] = 'high'
    
    # Middle 30% - medium popularity
    for sku in skus[top_20_count:top_20_count + middle_30_count]:
        popularity[sku] = 'medium'
    
    # Bottom 50% - low popularity
    for sku in skus[top_20_count + middle_30_count:]:
        popularity[sku] = 'low'
    
    return popularity


if __name__ == "__main__":
    # Test the generator
    df = generate_products(50)
    print("\nSample products:")
    print(df.head(10))
    
    print("\nPopularity distribution:")
    popularity = get_product_popularity_tier(df)
    print(f"High: {list(popularity.values()).count('high')}")
    print(f"Medium: {list(popularity.values()).count('medium')}")
    print(f"Low: {list(popularity.values()).count('low')}")
