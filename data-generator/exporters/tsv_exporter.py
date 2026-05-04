"""
TSV (Tab-Separated Values) Exporter Module

Exports data to TSV format:
- Tab-separated instead of comma-separated
- Different column order
- Alternative format for testing ETL flexibility
"""

import pandas as pd
from pathlib import Path


def export_to_tsv(df, filename, output_dir='output', encoding='utf-8', index=False):
    """
    Export DataFrame to TSV file
    
    Args:
        df: DataFrame to export
        filename: Output filename (without extension)
        output_dir: Output directory path
        encoding: File encoding (default: utf-8)
        index: Whether to include index column
        
    Returns:
        Path to exported file
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    filepath = output_path / f"{filename}.tsv"
    
    # Use tab separator
    df.to_csv(filepath, sep='\t', index=index, encoding=encoding)
    
    print(f"✅ Exported to {filepath}")
    print(f"   Rows: {len(df)}, Columns: {len(df.columns)}")
    
    return filepath


def export_tsv_with_reordered_columns(df, filename, output_dir='output'):
    """
    Export TSV with columns in different order
    
    This tests ETL pipeline's ability to handle different column orders
    """
    print(f"\n📄 Exporting TSV (reordered columns): {filename}.tsv")
    
    df = df.copy()
    
    # Reorder columns (reverse order)
    columns = list(df.columns)
    columns.reverse()
    df = df[columns]
    
    return export_to_tsv(df, filename, output_dir)


if __name__ == "__main__":
    # Test TSV exporter
    import pandas as pd
    
    test_data = pd.DataFrame({
        'id': [1, 2, 3],
        'name': ['Product A', 'Product B', 'Product C'],
        'price': [10.50, 20.00, 15.75],
        'category': ['Food', 'Beverage', 'Food']
    })
    
    export_to_tsv(test_data, 'test_standard')
    export_tsv_with_reordered_columns(test_data, 'test_reordered')
