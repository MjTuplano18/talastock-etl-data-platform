"""
Main Entry Point for Data Generator

This script orchestrates the entire data generation process:
1. Generate product catalog
2. Generate sales transactions with temporal patterns
3. Apply data quality issues
4. Export to multiple formats

Usage:
    python generate_data.py --products 100 --sales 10000 --months 6
"""

import argparse
from datetime import datetime, timedelta
from pathlib import Path

# Import generators
from generators.products import generate_products, get_product_popularity_tier
from generators.sales import generate_sales, add_customer_names
from generators.quality_issues import (
    apply_all_quality_issues,
    create_messy_variant
)

# Import exporters
from exporters.csv_exporter import export_standard_csv, export_messy_csv
from exporters.json_exporter import (
    export_flat_json,
    export_nested_json,
    export_api_format_json
)
from exporters.excel_exporter import (
    export_formatted_excel,
    export_messy_excel,
    create_summary_sheet
)
from exporters.tsv_exporter import export_tsv_with_reordered_columns
from exporters.data_dictionary import generate_data_dictionary


def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(
        description='Generate realistic business data for Filipino SME'
    )
    parser.add_argument(
        '--products',
        type=int,
        default=100,
        help='Number of products to generate (default: 100)'
    )
    parser.add_argument(
        '--sales',
        type=int,
        default=10000,
        help='Number of sales records to generate (default: 10000)'
    )
    parser.add_argument(
        '--months',
        type=int,
        default=6,
        help='Number of months of historical data (default: 6)'
    )
    
    args = parser.parse_args()
    
    start_time = datetime.now()
    
    print("=" * 60)
    print("Enterprise Data Platform - Data Generator")
    print("Phase 1: Realistic Business Data Generation")
    print("=" * 60)
    print(f"\nConfiguration:")
    print(f"  Products: {args.products}")
    print(f"  Sales Records: {args.sales}")
    print(f"  Time Period: {args.months} months")
    print(f"  Start Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n" + "=" * 60)
    
    # Step 1: Generate Products
    print("\n" + "=" * 60)
    print("STEP 1: Generate Product Catalog")
    print("=" * 60)
    products_df = generate_products(args.products)
    popularity_map = get_product_popularity_tier(products_df)
    
    # Step 2: Generate Sales
    print("\n" + "=" * 60)
    print("STEP 2: Generate Sales Transactions")
    print("=" * 60)
    
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=args.months * 30)
    
    sales_df = generate_sales(
        products_df,
        popularity_map,
        args.sales,
        start_date,
        end_date
    )
    
    # Add customer names
    sales_df = add_customer_names(sales_df)
    
    # Step 3: Create Clean Exports (before quality issues)
    print("\n" + "=" * 60)
    print("STEP 3: Export Clean Data")
    print("=" * 60)
    
    # Export products (clean)
    export_standard_csv(products_df, 'products', 'output')
    
    # Export sales (clean)
    export_standard_csv(sales_df, 'sales_clean', 'output')
    
    # Step 4: Apply Data Quality Issues
    print("\n" + "=" * 60)
    print("STEP 4: Apply Data Quality Issues")
    print("=" * 60)
    
    # Create messy sales data
    sales_messy = apply_all_quality_issues(sales_df.copy(), issue_type='sales')
    
    # Step 5: Export to Multiple Formats
    print("\n" + "=" * 60)
    print("STEP 5: Export to Multiple Formats")
    print("=" * 60)
    
    # CSV exports
    export_standard_csv(sales_messy, 'sales_standard', 'output')
    export_messy_csv(sales_messy, 'sales_messy_encoding', 'output')
    
    # Create variants with different column names
    sales_variant1 = create_messy_variant(sales_messy.copy(), 'variant1')
    sales_variant2 = create_messy_variant(sales_messy.copy(), 'variant2')
    
    export_standard_csv(sales_variant1, 'sales_variant1', 'output')
    export_standard_csv(sales_variant2, 'sales_variant2', 'output')
    
    # JSON exports
    export_flat_json(sales_df, 'sales_flat', 'output')
    export_nested_json(sales_df, 'sales_nested', 'output')
    export_api_format_json(sales_df, 'sales_api_format', 'output')
    
    # Excel exports
    summary_df = create_summary_sheet(sales_df)
    
    export_formatted_excel({
        'Products': products_df,
        'Sales': sales_df,
        'Summary': summary_df
    }, 'sales_formatted', 'output')
    
    export_messy_excel({
        'Sales': sales_messy
    }, 'sales_messy_excel', 'output')
    
    # TSV export
    export_tsv_with_reordered_columns(sales_df, 'sales_alternative', 'output')
    
    # Step 6: Generate Data Dictionary
    print("\n" + "=" * 60)
    print("STEP 6: Generate Data Dictionary")
    print("=" * 60)
    
    generate_data_dictionary(products_df, sales_df, 'output')
    
    # Final Summary
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE!")
    print("=" * 60)
    print(f"\n✅ Successfully generated:")
    print(f"   • {len(products_df)} products")
    print(f"   • {len(sales_df)} sales transactions")
    print(f"   • {len(sales_messy)} messy sales records (with quality issues)")
    print(f"   • Total revenue: ₱{sales_df['total_amount'].sum():,.2f}")
    print(f"\n📁 Output files in: {Path('output').absolute()}")
    print(f"\n⏱️  Total time: {duration:.2f} seconds")
    print(f"   End time: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n" + "=" * 60)
    print("\n📖 Next steps:")
    print("   1. Review generated files in output/ directory")
    print("   2. Read DATA_DICTIONARY.md for field descriptions")
    print("   3. Proceed to Phase 2: Apache Airflow ETL Pipeline")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
