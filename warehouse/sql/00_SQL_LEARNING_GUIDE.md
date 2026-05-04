# 📚 SQL Learning Guide for Data Warehouse

Learn SQL by exploring your own data! This guide teaches you SQL concepts using your Talastock warehouse.

---

## 🎯 Learning Path

1. **Basic Queries** (15 min) - SELECT, WHERE, ORDER BY
2. **Aggregations** (15 min) - COUNT, SUM, AVG, GROUP BY
3. **Joins** (20 min) - Combining tables
4. **Advanced** (20 min) - Window functions, CTEs, subqueries

**Total Time**: ~70 minutes

---

## 🚀 Setup

### Open pgAdmin
1. Go to http://localhost:5050
2. Login: `admin@talastock.com` / `admin`
3. Navigate to: **Servers → Talastock Warehouse → Databases → talastock_warehouse**
4. Right-click → **Query Tool**

### Your Data
You have **9,696 sales transactions** across **100 products** in **5 categories**.

---

## 📖 Part 1: Basic Queries (15 min)

### Concept 1: SELECT - Get Data

**What it does**: Retrieves data from a table

**Example 1: Get all products**
```sql
SELECT * 
FROM analytics.dim_products
LIMIT 10;
```

**What you'll see**: 10 products with all their details

**Try it yourself**: Change `LIMIT 10` to `LIMIT 5`

---

**Example 2: Get specific columns**
```sql
SELECT 
    name,
    category,
    price
FROM analytics.dim_products
LIMIT 10;
```

**What you'll see**: Only product name, category, and price

**💡 Tip**: Only select columns you need - it's faster!

---

### Concept 2: WHERE - Filter Data

**What it does**: Filters rows based on conditions

**Example 3: Get only Beverage products**
```sql
SELECT 
    name,
    category,
    price
FROM analytics.dim_products
WHERE category = 'Beverage';
```

**What you'll see**: Only products in the Beverage category

**Try it yourself**: Change `'Beverage'` to `'Snacks'` or `'Essentials'`

---

**Example 4: Get expensive products (price > 100)**
```sql
SELECT 
    name,
    category,
    price
FROM analytics.dim_products
WHERE price > 100
ORDER BY price DESC;
```

**What you'll see**: Products over ₱100, most expensive first

**Try it yourself**: Change `100` to `50` or `200`

---

**Example 5: Multiple conditions (AND)**
```sql
SELECT 
    name,
    category,
    price
FROM analytics.dim_products
WHERE category = 'Beverage'
  AND price > 30;
```

**What you'll see**: Beverages that cost more than ₱30

**Try it yourself**: Change `AND` to `OR` - see the difference!

---

### Concept 3: ORDER BY - Sort Results

**What it does**: Sorts results by one or more columns

**Example 6: Sort by price (cheapest first)**
```sql
SELECT 
    name,
    category,
    price
FROM analytics.dim_products
ORDER BY price ASC
LIMIT 10;
```

**What you'll see**: 10 cheapest products

**Try it yourself**: Change `ASC` to `DESC` for most expensive

---

**Example 7: Sort by multiple columns**
```sql
SELECT 
    name,
    category,
    price
FROM analytics.dim_products
ORDER BY category ASC, price DESC;
```

**What you'll see**: Products grouped by category, expensive ones first within each category

---

### ✅ Practice Exercise 1

**Challenge**: Find all products in the "Snacks" category that cost less than ₱50, sorted by price (cheapest first).

<details>
<summary>Click to see answer</summary>

```sql
SELECT 
    name,
    category,
    price
FROM analytics.dim_products
WHERE category = 'Snacks'
  AND price < 50
ORDER BY price ASC;
```
</details>

---

## 📊 Part 2: Aggregations (15 min)

### Concept 4: COUNT - Count Rows

**What it does**: Counts the number of rows

**Example 8: How many products do we have?**
```sql
SELECT COUNT(*) as total_products
FROM analytics.dim_products;
```

**What you'll see**: Total number of products (should be 100)

---

**Example 9: How many products per category?**
```sql
SELECT 
    category,
    COUNT(*) as product_count
FROM analytics.dim_products
GROUP BY category
ORDER BY product_count DESC;
```

**What you'll see**: Number of products in each category

**💡 Key concept**: `GROUP BY` groups rows with the same value

---

### Concept 5: SUM - Add Up Values

**What it does**: Adds up numeric values

**Example 10: Total revenue**
```sql
SELECT 
    SUM(total_amount) as total_revenue
FROM analytics.fact_sales;
```

**What you'll see**: Total revenue from all sales (₱956,608.59)

---

**Example 11: Revenue by payment method**
```sql
SELECT 
    payment_method,
    SUM(total_amount) as total_revenue,
    COUNT(*) as transaction_count
FROM analytics.fact_sales
GROUP BY payment_method
ORDER BY total_revenue DESC;
```

**What you'll see**: How much revenue came from Cash vs GCash vs Card

**Try it yourself**: Add `AVG(total_amount)` to see average transaction value

---

### Concept 6: AVG - Calculate Average

**What it does**: Calculates the average of numeric values

**Example 12: Average transaction value**
```sql
SELECT 
    AVG(total_amount) as avg_transaction,
    MIN(total_amount) as smallest_sale,
    MAX(total_amount) as largest_sale
FROM analytics.fact_sales;
```

**What you'll see**: Average, smallest, and largest transaction amounts

---

**Example 13: Average by customer type**
```sql
SELECT 
    customer_type,
    COUNT(*) as transactions,
    AVG(total_amount) as avg_transaction,
    SUM(total_amount) as total_revenue
FROM analytics.fact_sales
GROUP BY customer_type
ORDER BY total_revenue DESC;
```

**What you'll see**: Which customer type spends more on average

---

### Concept 7: HAVING - Filter Groups

**What it does**: Filters groups (like WHERE but for GROUP BY)

**Example 14: Categories with more than 15 products**
```sql
SELECT 
    category,
    COUNT(*) as product_count
FROM analytics.dim_products
GROUP BY category
HAVING COUNT(*) > 15
ORDER BY product_count DESC;
```

**What you'll see**: Only categories with 15+ products

**💡 Difference**: `WHERE` filters rows, `HAVING` filters groups

---

### ✅ Practice Exercise 2

**Challenge**: Find the total revenue and number of transactions for each payment method, but only show payment methods with more than 3,000 transactions.

<details>
<summary>Click to see answer</summary>

```sql
SELECT 
    payment_method,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue
FROM analytics.fact_sales
GROUP BY payment_method
HAVING COUNT(*) > 3000
ORDER BY total_revenue DESC;
```
</details>

---

## 🔗 Part 3: Joins (20 min)

### Concept 8: INNER JOIN - Combine Tables

**What it does**: Combines rows from two tables based on a matching column

**Example 15: Sales with product names**
```sql
SELECT 
    f.transaction_id,
    p.name as product_name,
    p.category,
    f.quantity,
    f.total_amount
FROM analytics.fact_sales f
INNER JOIN analytics.dim_products p 
    ON f.product_key = p.product_key
LIMIT 10;
```

**What you'll see**: Sales transactions with readable product names

**💡 Key concept**: 
- `f` and `p` are **aliases** (shortcuts)
- `ON` specifies how tables connect
- `product_key` is the **foreign key**

---

**Example 16: Sales with dates**
```sql
SELECT 
    f.transaction_id,
    d.date,
    d.day_of_week_name,
    f.total_amount
FROM analytics.fact_sales f
INNER JOIN analytics.dim_dates d 
    ON f.date_key = d.date_key
LIMIT 10;
```

**What you'll see**: Sales with readable dates and day names

---

**Example 17: Sales with product AND date**
```sql
SELECT 
    f.transaction_id,
    p.name as product,
    p.category,
    d.date,
    d.day_of_week_name,
    f.quantity,
    f.total_amount
FROM analytics.fact_sales f
INNER JOIN analytics.dim_products p ON f.product_key = p.product_key
INNER JOIN analytics.dim_dates d ON f.date_key = d.date_key
LIMIT 10;
```

**What you'll see**: Complete transaction details with product and date info

**💡 Tip**: You can join multiple tables!

---

**Example 18: Revenue by category and day of week**
```sql
SELECT 
    p.category,
    d.day_of_week_name,
    COUNT(*) as transactions,
    SUM(f.total_amount) as total_revenue
FROM analytics.fact_sales f
INNER JOIN analytics.dim_products p ON f.product_key = p.product_key
INNER JOIN analytics.dim_dates d ON f.date_key = d.date_key
GROUP BY p.category, d.day_of_week_name
ORDER BY p.category, total_revenue DESC;
```

**What you'll see**: Which categories sell best on which days

---

### ✅ Practice Exercise 3

**Challenge**: Find the top 5 products by revenue, showing product name, category, total revenue, and number of transactions.

<details>
<summary>Click to see answer</summary>

```sql
SELECT 
    p.name as product_name,
    p.category,
    COUNT(*) as transaction_count,
    SUM(f.total_amount) as total_revenue
FROM analytics.fact_sales f
INNER JOIN analytics.dim_products p ON f.product_key = p.product_key
GROUP BY p.name, p.category
ORDER BY total_revenue DESC
LIMIT 5;
```
</details>

---

## 🚀 Part 4: Advanced Queries (20 min)

### Concept 9: Subqueries - Query Within Query

**What it does**: Uses the result of one query inside another

**Example 19: Products above average price**
```sql
SELECT 
    name,
    category,
    price
FROM analytics.dim_products
WHERE price > (
    SELECT AVG(price) 
    FROM analytics.dim_products
)
ORDER BY price DESC;
```

**What you'll see**: Products more expensive than average

**💡 How it works**: Inner query calculates average, outer query uses it

---

**Example 20: Best selling product per category**
```sql
SELECT 
    category,
    product_name,
    total_revenue
FROM analytics.product_performance
WHERE revenue_rank = 1
ORDER BY total_revenue DESC;
```

**What you'll see**: #1 product in each category

---

### Concept 10: CTE (Common Table Expression) - Temporary Result

**What it does**: Creates a temporary named result set

**Example 21: Calculate then use**
```sql
WITH daily_totals AS (
    SELECT 
        d.date,
        d.day_of_week_name,
        SUM(f.total_amount) as daily_revenue
    FROM analytics.fact_sales f
    INNER JOIN analytics.dim_dates d ON f.date_key = d.date_key
    GROUP BY d.date, d.day_of_week_name
)
SELECT 
    day_of_week_name,
    AVG(daily_revenue) as avg_daily_revenue
FROM daily_totals
GROUP BY day_of_week_name
ORDER BY avg_daily_revenue DESC;
```

**What you'll see**: Average daily revenue by day of week

**💡 Why use CTE**: Makes complex queries easier to read

---

**Example 22: Multiple CTEs**
```sql
WITH 
product_revenue AS (
    SELECT 
        p.category,
        SUM(f.total_amount) as revenue
    FROM analytics.fact_sales f
    INNER JOIN analytics.dim_products p ON f.product_key = p.product_key
    GROUP BY p.category
),
total_revenue AS (
    SELECT SUM(revenue) as total
    FROM product_revenue
)
SELECT 
    pr.category,
    pr.revenue,
    ROUND((pr.revenue / tr.total * 100)::numeric, 2) as percentage
FROM product_revenue pr
CROSS JOIN total_revenue tr
ORDER BY pr.revenue DESC;
```

**What you'll see**: Revenue percentage by category

---

### Concept 11: Window Functions - Calculate Across Rows

**What it does**: Performs calculations across a set of rows

**Example 23: Running total**
```sql
SELECT 
    date,
    total_revenue,
    SUM(total_revenue) OVER (ORDER BY date) as running_total
FROM analytics.daily_sales_summary
ORDER BY date
LIMIT 30;
```

**What you'll see**: Cumulative revenue over time

**💡 Key concept**: `OVER` defines the window of rows to calculate across

---

**Example 24: Rank products by revenue**
```sql
SELECT 
    name,
    category,
    total_revenue,
    RANK() OVER (ORDER BY total_revenue DESC) as overall_rank,
    RANK() OVER (PARTITION BY category ORDER BY total_revenue DESC) as category_rank
FROM analytics.product_performance
LIMIT 20;
```

**What you'll see**: Product rankings overall and within category

**💡 `PARTITION BY`**: Like GROUP BY but doesn't collapse rows

---

### ✅ Practice Exercise 4

**Challenge**: Find the top 3 products in each category by revenue using a window function.

<details>
<summary>Click to see answer</summary>

```sql
WITH ranked_products AS (
    SELECT 
        name,
        category,
        total_revenue,
        RANK() OVER (PARTITION BY category ORDER BY total_revenue DESC) as rank
    FROM analytics.product_performance
)
SELECT 
    category,
    name,
    total_revenue,
    rank
FROM ranked_products
WHERE rank <= 3
ORDER BY category, rank;
```
</details>

---

## 🎯 Real Business Questions

Now let's answer real business questions!

### Question 1: What's our best day of the week?
```sql
SELECT 
    d.day_of_week_name,
    COUNT(*) as transactions,
    SUM(f.total_amount) as total_revenue,
    AVG(f.total_amount) as avg_transaction
FROM analytics.fact_sales f
INNER JOIN analytics.dim_dates d ON f.date_key = d.date_key
GROUP BY d.day_of_week_name, d.day_of_week
ORDER BY d.day_of_week;
```

---

### Question 2: Do people spend more on payday?
```sql
SELECT 
    CASE WHEN d.is_payday THEN 'Payday' ELSE 'Regular Day' END as day_type,
    COUNT(*) as transactions,
    AVG(f.total_amount) as avg_transaction,
    SUM(f.total_amount) as total_revenue
FROM analytics.fact_sales f
INNER JOIN analytics.dim_dates d ON f.date_key = d.date_key
GROUP BY d.is_payday
ORDER BY d.is_payday DESC;
```

---

### Question 3: What time of day is busiest?
```sql
SELECT 
    t.time_of_day,
    COUNT(*) as transactions,
    SUM(f.total_amount) as total_revenue
FROM analytics.fact_sales f
INNER JOIN analytics.dim_times t ON f.time_key = t.time_key
GROUP BY t.time_of_day
ORDER BY total_revenue DESC;
```

---

### Question 4: Which products have the best profit margin?
```sql
SELECT 
    name,
    category,
    TO_CHAR(profit_margin, 'FM999.00%') as margin,
    total_revenue,
    total_profit
FROM analytics.product_performance
ORDER BY profit_margin DESC
LIMIT 10;
```

---

## 🎓 SQL Cheat Sheet

### Basic Structure
```sql
SELECT columns
FROM table
WHERE condition
GROUP BY columns
HAVING group_condition
ORDER BY columns
LIMIT number;
```

### Common Functions
- `COUNT(*)` - Count rows
- `SUM(column)` - Add up values
- `AVG(column)` - Calculate average
- `MIN(column)` - Find minimum
- `MAX(column)` - Find maximum
- `ROUND(number, decimals)` - Round numbers

### Comparison Operators
- `=` - Equal
- `!=` or `<>` - Not equal
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal

### Logical Operators
- `AND` - Both conditions must be true
- `OR` - Either condition can be true
- `NOT` - Negates a condition
- `IN (list)` - Value is in list
- `BETWEEN x AND y` - Value is between x and y
- `LIKE 'pattern'` - Pattern matching

### Join Types
- `INNER JOIN` - Only matching rows
- `LEFT JOIN` - All from left, matching from right
- `RIGHT JOIN` - All from right, matching from left
- `FULL JOIN` - All rows from both tables

---

## 🚀 Next Steps

### Practice More
1. Try modifying the queries above
2. Answer your own business questions
3. Combine concepts (joins + aggregations + window functions)

### Learn More
- **Window Functions**: `RANK()`, `ROW_NUMBER()`, `LAG()`, `LEAD()`
- **Date Functions**: `DATE_TRUNC()`, `EXTRACT()`, `AGE()`
- **String Functions**: `CONCAT()`, `SUBSTRING()`, `UPPER()`, `LOWER()`
- **CASE Statements**: Conditional logic in SQL

### Resources
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- SQL Tutorial: https://www.sqltutorial.org/
- Practice: https://www.sql-practice.com/

---

## 💡 Tips for Learning SQL

1. **Start simple** - Master SELECT before moving to joins
2. **Run queries** - Don't just read, actually execute them
3. **Break it down** - Build complex queries step by step
4. **Use LIMIT** - Test with small results first
5. **Comment your code** - Use `--` for notes
6. **Format nicely** - Indent and space for readability
7. **Learn by doing** - Answer real business questions

---

**Ready to explore?** Open pgAdmin and start running these queries! 🚀

**Need help?** Check `01_quick_queries.sql` for more examples!
