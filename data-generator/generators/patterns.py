"""
Temporal Patterns Module

Implements realistic time-based sales patterns:
- Peak hours (morning rush, evening rush)
- Day of week effects (weekend boost)
- Payday effects (15th and 30th of month)
- Product popularity (Pareto principle)
"""

import random
from datetime import datetime, timedelta
import numpy as np

# Import configuration
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from config import (
    PEAK_HOURS, WEEKEND_BOOST, WEEKDAY_BASELINE,
    PAYDAY_BOOST, PAYDAY_DAYS, PRODUCT_POPULARITY
)


def get_hour_probability(hour):
    """
    Get probability weight for a given hour of day
    
    Returns higher probability during peak hours:
    - Morning: 7-9 AM (30% of sales)
    - Evening: 5-7 PM (40% of sales)
    - Night: 8-10 PM (20% of sales)
    - Off-peak: 10 AM - 5 PM (10% of sales)
    """
    for period, (start_hour, end_hour, weight) in PEAK_HOURS.items():
        if start_hour <= hour < end_hour:
            return weight
    
    # Very low probability for other hours (store closed or very slow)
    return 0.01


def get_day_boost(date):
    """
    Get sales boost multiplier for day of week
    
    Weekends (Saturday=5, Sunday=6) have 20% higher sales
    """
    day_of_week = date.weekday()
    
    if day_of_week in [5, 6]:  # Saturday or Sunday
        return WEEKEND_BOOST
    else:
        return WEEKDAY_BASELINE


def is_payday(date):
    """
    Check if date is a payday (15th or 30th/31st of month)
    
    Filipino businesses typically pay on these dates
    """
    return date.day in PAYDAY_DAYS


def get_payday_boost(date):
    """
    Get sales boost multiplier for payday
    
    Sales increase 50% on payday dates
    """
    if is_payday(date):
        return PAYDAY_BOOST
    else:
        return 1.0


def generate_timestamp_distribution(start_date, end_date, num_sales):
    """
    Generate timestamps with realistic temporal patterns
    
    Args:
        start_date: Start of date range
        end_date: End of date range
        num_sales: Number of sales to generate
        
    Returns:
        List of datetime objects with realistic distribution
    """
    timestamps = []
    
    # Calculate total days
    total_days = (end_date - start_date).days
    
    # Generate base daily distribution
    daily_sales = []
    current_date = start_date
    
    while current_date <= end_date:
        # Base sales for the day
        base_sales = num_sales / total_days
        
        # Apply day of week boost
        day_boost = get_day_boost(current_date)
        
        # Apply payday boost
        payday_boost = get_payday_boost(current_date)
        
        # Calculate actual sales for this day
        day_sales = int(base_sales * day_boost * payday_boost)
        
        daily_sales.append((current_date, day_sales))
        current_date += timedelta(days=1)
    
    # Normalize to match target num_sales
    total_generated = sum(sales for _, sales in daily_sales)
    scale_factor = num_sales / total_generated
    
    # Generate timestamps for each day
    for date, sales_count in daily_sales:
        sales_count = int(sales_count * scale_factor)
        
        # Generate hours based on peak hour probabilities
        for _ in range(sales_count):
            # Choose hour based on probability distribution
            hour_probs = [get_hour_probability(h) for h in range(24)]
            hour = random.choices(range(24), weights=hour_probs)[0]
            
            # Random minute and second
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            
            timestamp = datetime(
                date.year, date.month, date.day,
                hour, minute, second
            )
            timestamps.append(timestamp)
    
    # Sort chronologically
    timestamps.sort()
    
    # Trim to exact num_sales if needed
    return timestamps[:num_sales]


def get_product_popularity_weight(popularity_tier):
    """
    Get sales probability weight based on product popularity tier
    
    Implements Pareto principle (80/20 rule):
    - High popularity (top 20%): 60% of sales
    - Medium popularity (middle 30%): 30% of sales
    - Low popularity (bottom 50%): 10% of sales
    """
    if popularity_tier == 'high':
        return 0.60
    elif popularity_tier == 'medium':
        return 0.30
    else:  # low
        return 0.10


def select_products_with_popularity(products_df, popularity_map, num_selections):
    """
    Select products based on popularity distribution
    
    Args:
        products_df: DataFrame of products
        popularity_map: Dict mapping SKU to popularity tier
        num_selections: Number of products to select
        
    Returns:
        List of selected product SKUs
    """
    # Create weighted list
    skus = []
    weights = []
    
    for _, product in products_df.iterrows():
        sku = product['sku']
        tier = popularity_map.get(sku, 'low')
        weight = get_product_popularity_weight(tier)
        
        skus.append(sku)
        weights.append(weight)
    
    # Normalize weights
    total_weight = sum(weights)
    weights = [w / total_weight for w in weights]
    
    # Select products
    selected = random.choices(skus, weights=weights, k=num_selections)
    
    return selected


def generate_quantity(product_price):
    """
    Generate realistic purchase quantity based on product price
    
    Cheaper items: 1-10 units
    Mid-range items: 1-5 units
    Expensive items: 1-3 units
    """
    if product_price < 30:
        # Cheap items (sachets, small packs)
        return random.choices([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 
                            weights=[10, 15, 20, 15, 12, 10, 8, 5, 3, 2])[0]
    elif product_price < 100:
        # Mid-range items
        return random.choices([1, 2, 3, 4, 5], 
                            weights=[40, 30, 15, 10, 5])[0]
    else:
        # Expensive items
        return random.choices([1, 2, 3], 
                            weights=[70, 20, 10])[0]


if __name__ == "__main__":
    # Test temporal patterns
    from datetime import datetime
    
    print("Testing temporal patterns...")
    
    # Test hour probabilities
    print("\nHour probabilities:")
    for hour in [7, 8, 12, 17, 18, 20, 22]:
        prob = get_hour_probability(hour)
        print(f"  {hour:02d}:00 - {prob:.2%}")
    
    # Test day boost
    print("\nDay of week boost:")
    test_date = datetime(2024, 5, 6)  # Monday
    for i in range(7):
        date = test_date + timedelta(days=i)
        boost = get_day_boost(date)
        day_name = date.strftime('%A')
        print(f"  {day_name}: {boost:.1f}x")
    
    # Test payday
    print("\nPayday detection:")
    for day in [14, 15, 16, 29, 30, 31]:
        date = datetime(2024, 5, day)
        payday = is_payday(date)
        boost = get_payday_boost(date)
        print(f"  May {day}: Payday={payday}, Boost={boost:.1f}x")
    
    # Test timestamp generation
    print("\nGenerating 100 timestamps...")
    start = datetime(2024, 5, 1)
    end = datetime(2024, 5, 7)
    timestamps = generate_timestamp_distribution(start, end, 100)
    
    print(f"Generated {len(timestamps)} timestamps")
    print(f"First: {timestamps[0]}")
    print(f"Last: {timestamps[-1]}")
    
    # Show hour distribution
    hour_counts = {}
    for ts in timestamps:
        hour = ts.hour
        hour_counts[hour] = hour_counts.get(hour, 0) + 1
    
    print("\nHour distribution:")
    for hour in sorted(hour_counts.keys()):
        count = hour_counts[hour]
        bar = '█' * (count // 2)
        print(f"  {hour:02d}:00 [{count:2d}] {bar}")
