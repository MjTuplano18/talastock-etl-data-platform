# 🚀 dbt Commands Cheatsheet

Quick reference for common dbt commands.

---

## 🔧 Setup Commands

```bash
# Install dbt
pip install dbt-core dbt-postgres

# Check version
dbt --version

# Test connection
dbt debug

# Initialize new project (not needed - already done!)
dbt init project_name
```

---

## ▶️ Run Commands

```bash
# Run all models
dbt run

# Run specific model
dbt run --select stg_products

# Run specific folder
dbt run --select staging
dbt run --select marts
dbt run --select aggregates

# Run model and all dependencies
dbt run --select +fact_sales

# Run model and all downstream models
dbt run --select fact_sales+

# Run model, dependencies, and downstream
dbt run --select +fact_sales+

# Full refresh (rebuild from scratch)
dbt run --full-refresh

# Run specific target
dbt run --target prod
```

---

## 🧪 Test Commands

```bash
# Run all tests
dbt test

# Test specific model
dbt test --select stg_products

# Test specific folder
dbt test --select staging

# Test relationships only
dbt test --select test_type:relationships

# Test unique only
dbt test --select test_type:unique
```

---

## 📚 Documentation Commands

```bash
# Generate documentation
dbt docs generate

# Serve documentation (opens browser)
dbt docs serve

# Serve on specific port
dbt docs serve --port 8080
```

---

## 🔍 Inspection Commands

```bash
# List all models
dbt ls

# List models with details
dbt ls --select staging

# Show compiled SQL
dbt compile

# Show model dependencies
dbt ls --select +fact_sales --output json
```

---

## 🧹 Cleanup Commands

```bash
# Clean compiled files
dbt clean

# Remove target directory
rm -rf target/

# Remove logs
rm -rf logs/
```

---

## 🎯 Selection Syntax

```bash
# By model name
dbt run --select stg_products

# By folder
dbt run --select staging
dbt run --select marts.dimensions

# By tag
dbt run --select tag:daily

# Multiple selections
dbt run --select stg_products stg_sales

# Exclude models
dbt run --exclude stg_products

# Graph operators
dbt run --select +fact_sales      # model + dependencies
dbt run --select fact_sales+      # model + downstream
dbt run --select +fact_sales+     # model + both
dbt run --select 1+fact_sales     # model + 1 level up
dbt run --select fact_sales+2     # model + 2 levels down
```

---

## 🔄 Common Workflows

### Daily Development
```bash
# 1. Make changes to model
# 2. Run the model
dbt run --select my_model

# 3. Test the model
dbt test --select my_model

# 4. Check compiled SQL
cat target/compiled/talastock/models/path/to/my_model.sql
```

### Full Refresh
```bash
# 1. Clean everything
dbt clean

# 2. Run all models
dbt run --full-refresh

# 3. Run all tests
dbt test

# 4. Generate docs
dbt docs generate
```

### Production Deploy
```bash
# 1. Run in production
dbt run --target prod

# 2. Test in production
dbt test --target prod

# 3. Generate docs
dbt docs generate --target prod
```

---

## 🐛 Debugging

```bash
# Check connection
dbt debug

# Compile without running
dbt compile

# Show compiled SQL
cat target/compiled/talastock/models/path/to/model.sql

# Run with verbose logging
dbt run --select my_model --debug

# Check logs
cat logs/dbt.log
```

---

## 📊 Useful Flags

```bash
# Run in specific target
--target prod

# Full refresh
--full-refresh

# Verbose output
--debug

# Fail fast (stop on first error)
--fail-fast

# Threads (parallel execution)
--threads 8

# Variables
--vars '{"start_date": "2025-01-01"}'

# Exclude models
--exclude my_model

# Select by tag
--select tag:daily
```

---

## 🎓 Learning Commands

```bash
# See what would run (dry run)
dbt run --select my_model --dry-run

# Show SQL without running
dbt compile --select my_model

# List all resources
dbt ls

# Show dependencies
dbt ls --select +my_model --output json
```

---

## 💡 Pro Tips

### Speed Up Development
```bash
# Only run changed models
dbt run --select state:modified

# Run failed models only
dbt run --select result:error
```

### Better Testing
```bash
# Run tests for specific column
dbt test --select source:raw.products.sku

# Run custom tests only
dbt test --select test_type:generic
```

### Documentation
```bash
# Generate and serve in one command
dbt docs generate && dbt docs serve

# Generate docs for specific models
dbt docs generate --select staging
```

---

## 🔗 Quick Reference

| Task | Command |
|------|---------|
| Run all | `dbt run` |
| Test all | `dbt test` |
| Generate docs | `dbt docs generate` |
| View docs | `dbt docs serve` |
| Check connection | `dbt debug` |
| Clean | `dbt clean` |
| Run one model | `dbt run --select model_name` |
| Test one model | `dbt test --select model_name` |
| Full refresh | `dbt run --full-refresh` |
| Production run | `dbt run --target prod` |

---

## 📞 Need Help?

```bash
# Show help
dbt --help

# Show help for specific command
dbt run --help
dbt test --help
dbt docs --help
```

---

## 🎯 Your First Commands

```bash
# 1. Test connection
dbt debug

# 2. Run all models
dbt run

# 3. Run all tests
dbt test

# 4. Generate and view docs
dbt docs generate
dbt docs serve
```

---

**Print this out and keep it handy!** 📄

