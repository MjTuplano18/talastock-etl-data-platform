"""
JSON Exporter Module

Exports data to JSON format with various structures:
- Flat JSON (array of objects)
- Nested JSON (API-like structure)
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime


def export_to_json(data, filename, output_dir='output', indent=2):
    """
    Export data to JSON file
    
    Args:
        data: Data to export (dict or list)
        filename: Output filename (without extension)
        output_dir: Output directory path
        indent: JSON indentation (default: 2)
        
    Returns:
        Path to exported file
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    filepath = output_path / f"{filename}.json"
    
    # Custom JSON encoder for datetime objects
    class DateTimeEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            if pd.isna(obj):
                return None
            return super().default(obj)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=indent, cls=DateTimeEncoder, ensure_ascii=False)
    
    print(f"✅ Exported to {filepath}")
    
    return filepath


def export_flat_json(df, filename, output_dir='output'):
    """
    Export as flat JSON array
    
    Format: [{"field1": "value1", "field2": "value2"}, ...]
    """
    print(f"\n📄 Exporting flat JSON: {filename}.json")
    
    # Convert DataFrame to list of dicts
    data = df.to_dict(orient='records')
    
    return export_to_json(data, filename, output_dir)


def export_nested_json(df, filename, output_dir='output', root_key='data'):
    """
    Export as nested JSON (API-like structure)
    
    Format:
    {
        "metadata": {...},
        "data": [...]
    }
    """
    print(f"\n📄 Exporting nested JSON: {filename}.json")
    
    # Create nested structure
    nested_data = {
        'metadata': {
            'generated_at': datetime.now().isoformat(),
            'record_count': len(df),
            'columns': list(df.columns),
        },
        root_key: df.to_dict(orient='records')
    }
    
    return export_to_json(nested_data, filename, output_dir)


def export_api_format_json(df, filename, output_dir='output'):
    """
    Export in API response format
    
    Simulates receiving data from a REST API
    """
    print(f"\n📄 Exporting API format JSON: {filename}.json")
    
    # Transform to API-like structure
    records = []
    
    for _, row in df.iterrows():
        # Restructure data to be more nested (like an API response)
        if 'product_sku' in row and 'product_name' in row:
            # Sales data
            record = {
                'id': row.get('transaction_id'),
                'product': {
                    'sku': row.get('product_sku'),
                    'name': row.get('product_name'),
                    'category': row.get('category'),
                    'brand': row.get('brand'),
                },
                'transaction': {
                    'quantity': row.get('quantity'),
                    'unit_price': row.get('unit_price'),
                    'total': row.get('total_amount'),
                },
                'payment': {
                    'method': row.get('payment_method'),
                },
                'customer': {
                    'type': row.get('customer_type'),
                    'name': row.get('customer_name'),
                },
                'timestamp': row.get('timestamp'),
            }
        else:
            # Product data
            record = {
                'sku': row.get('sku'),
                'name': row.get('name'),
                'category': row.get('category'),
                'brand': row.get('brand'),
                'pricing': {
                    'retail': row.get('price'),
                    'cost': row.get('cost_price'),
                },
                'unit': row.get('unit'),
                'supplier': row.get('supplier'),
            }
        
        records.append(record)
    
    api_response = {
        'status': 'success',
        'timestamp': datetime.now().isoformat(),
        'count': len(records),
        'data': records
    }
    
    return export_to_json(api_response, filename, output_dir)


if __name__ == "__main__":
    # Test JSON exporter
    import pandas as pd
    
    test_data = pd.DataFrame({
        'transaction_id': ['TXN001', 'TXN002'],
        'product_sku': ['LM-FOOD-001', 'CC-BEV-001'],
        'product_name': ['Lucky Me Pancit Canton', 'Coca-Cola 1.5L'],
        'category': ['Food', 'Beverage'],
        'brand': ['Lucky Me', 'Coca-Cola'],
        'quantity': [2, 1],
        'unit_price': [15.00, 65.00],
        'total_amount': [30.00, 65.00],
        'payment_method': ['Cash', 'GCash'],
        'customer_type': ['walk-in', 'regular'],
        'customer_name': [None, 'Juan Dela Cruz'],
        'timestamp': [datetime.now(), datetime.now()]
    })
    
    export_flat_json(test_data, 'test_flat')
    export_nested_json(test_data, 'test_nested')
    export_api_format_json(test_data, 'test_api')
