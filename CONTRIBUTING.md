# Contributing

## Getting started

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test: run the full pipeline and verify the dashboard
5. Commit: `git commit -m "feat: description"`
6. Push and open a pull request

## What to contribute

- Additional SQL queries in `warehouse/sql/`
- New Airflow DAG examples
- More Filipino products in `data-generator/data/filipino_products.json`
- Dashboard improvements
- Documentation fixes

## Code style

**Python**: PEP 8, docstrings on functions, meaningful variable names  
**SQL**: uppercase keywords, CTEs for readability, comments on complex logic  
**TypeScript**: strict types, no `any`, one component per file

## Commit format

```
feat: add customer metrics aggregate table
fix: handle NaN in unit_price column
docs: update forecasting pipeline guide
```

## Questions

Open an issue with the `question` label.
