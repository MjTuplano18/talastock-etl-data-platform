"""
CSV Exporter Module

Exports data to CSV format with various options:
- Standard CSV (clean format)
- Messy CSV (inconsistent columns, encoding issues)
"""

import pandas as pd
from pathlib import Path


def export_to_csv(df, filename, output_dir='output', encoding='utf-8', index=False):
    """
    Export DataFrame to CSV file
    
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
    
    filepath = output_path / f"{filename}.csv"
    
    df.to_csv(filepath, index=index, encoding=encoding)
    
    print(f"✅ Exported to {filepath}")
    print(f"   Rows: {len(df)}, Columns: {len(df.columns)}")
    
    return filepath


def export_standard_csv(df, filename, output_dir='output'):
    """
    Export clean, standard CSV format
    
    This is the "ideal" format with consistent columns and UTF-8 encoding
    """
    print(f"\n📄 Exporting standard CSV: {filename}.csv")
    return export_to_csv(df, filename, output_dir, encoding='utf-8')


def export_messy_csv(df, filename, output_dir='output'):
    """
    Export messy CSV with encoding issues
    
    Simulates receiving data from legacy systems with encoding problems
    Uses 'replace' error handling to simulate encoding issues
    """
    print(f"\n📄 Exporting messy CSV: {filename}.csv")
    
    # Use latin-1 encoding with error handling to simulate encoding issues
    # This will replace characters that can't be encoded
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    filepath = output_path / f"{filename}.csv"
    
    # Use errors='replace' to handle characters that can't be encoded
    df.to_csv(filepath, index=False, encoding='latin-1', errors='replace')
    
    print(f"✅ Exported to {filepath}")
    print(f"   Rows: {len(df)}, Columns: {len(df.columns)}")
    print(f"   Note: Some characters replaced due to encoding limitations")
    
    return filepath


if __name__ == "__main__":
    # Test CSV exporter
    import pandas as pd
    
    test_data = pd.DataFrame({
        'id': [1, 2, 3],
        'name': ['Product A', 'Product B', 'Product C'],
        'price': [10.50, 20.00, 15.75]
    })
    
    export_standard_csv(test_data, 'test_standard')
    export_messy_csv(test_data, 'test_messy')
