from flask import Blueprint, request, session, jsonify
import pymysql
from .auth import get_db_connection
from datetime import date


laundry = Blueprint('laundry', __name__)

@laundry.route('/create-order', methods=['POST'])
def create_order():
    data = request.json
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Handle New Customer Auto-Registration
            cust_id = data.get('customer_id')
            
            if cust_id is None:
                # Insert customer including the optional physical_address
                cust_sql = """
                    INSERT INTO customers (first_name, last_name, phone_number, physical_address) 
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(cust_sql, (
                    data.get('first_name'), 
                    data.get('last_name', ''), 
                    data.get('phone'),
                    data.get('physical_address') # From the delivery field
                ))
                cust_id = cursor.lastrowid 

            # 2. Insert the Main Order
            order_sql = """
                INSERT INTO orders (business_id, customer_id, staff_id, order_number, total_amount,amount_paid, collection_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(order_sql, (
                data['business_id'], cust_id, data['staff_id'],
                data['order_number'], data['total_amount'],  data['amount_paid'], data['collection_date']
            ))
            
            new_order_id = cursor.lastrowid
            
            # 3. Insert order items
            items_sql = "INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, notes) VALUES (%s, %s, %s, %s, %s, %s)"
            for item in data['items']:
                cursor.execute(items_sql, (new_order_id, item['product_id'], item['quantity'], item['unit_price'], item['subtotal'], item.get('notes')))
            
            # 4. FETCH BUSINESS DETAILS FOR THE RECEIPT
            # Pulling columns: name, county, location, landmark based on business_id
            biz_sql = "SELECT name, county, location, landmark FROM businesses WHERE business_id = %s"
            cursor.execute(biz_sql, (data['business_id'],))
            business_info = cursor.fetchone()

        conn.commit()
        return jsonify({
            "message": "Order placed!", 
            "order_id": new_order_id,
            "receipt_header": business_info # Returns name, county, location, landmark
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@laundry.route('/customers-summary', methods=['GET'])
def get_customers_summary():
    # Get business_id from custom header instead of session
    business_id = request.headers.get('X-Business-Id')
    
    if not business_id:
        return jsonify({"error": "Unauthorized. Business ID missing."}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT 
                    c.customer_id, c.first_name, c.last_name, 
                    c.phone_number, c.physical_address,
                    COUNT(o.order_id) as total_services,
                    MAX(o.created_at) as last_visit
                FROM customers c
                LEFT JOIN orders o ON c.customer_id = o.customer_id
                WHERE c.business_id = %s
                GROUP BY c.customer_id
                ORDER BY total_services DESC
            """
            cursor.execute(sql, (business_id,))
            return jsonify(cursor.fetchall()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@laundry.route('/customer-orders/<int:customer_id>', methods=['GET'])
def get_customer_history(customer_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT order_number, total_amount, order_status, created_at FROM orders WHERE customer_id = %s ORDER BY created_at DESC"
            cursor.execute(sql, (customer_id,))
            return jsonify(cursor.fetchall()), 200
    finally:
        conn.close()
        
@laundry.route('/customers/<phone>', methods=['GET'])
def get_customer_by_phone(phone):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT * FROM customers WHERE phone_number = %s"
            cursor.execute(sql, (phone,))
            customer = cursor.fetchone()
            if customer:
                return jsonify(customer), 200
            else:
                return jsonify(None), 404
    finally:
        conn.close()

@laundry.route('/update-status/<int:order_id>', methods=['PATCH'])
def update_order_status(order_id):
    data = request.get_json()
    new_status = data.get('status') # e.g., 'Ready'
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "UPDATE orders SET order_status = %s WHERE order_id = %s"
            cursor.execute(sql, (new_status, order_id))
        connection.commit()
        return jsonify({"message": f"Order marked as {new_status}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@laundry.route('/process-payment/<int:order_id>', methods=['PATCH'])
def process_payment(order_id):
    data = request.get_json()
    amount_to_add = float(data.get('amount_paid', 0))
    payment_method = data.get('payment_method') # 'Cash' or 'M-Pesa'

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Get current totals
            cursor.execute("SELECT total_amount, amount_paid FROM orders WHERE order_id = %s", (order_id,))
            order = cursor.fetchone()
            
            new_total_paid = float(order['amount_paid']) + amount_to_add
            
            # 2. Determine new status
            if new_total_paid >= float(order['total_amount']):
                status = 'Paid'
            elif new_total_paid > 0:
                status = 'Partial'
            else:
                status = 'Pending'

            # 3. Update the database
            sql = "UPDATE orders SET amount_paid = %s, payment_status = %s WHERE order_id = %s"
            cursor.execute(sql, (new_total_paid, status, order_id))
            
        conn.commit()
        return jsonify({"message": "Payment updated", "new_status": status}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@laundry.route('/daily-summary/<int:business_id>', methods=['GET'])
def get_daily_summary(business_id):
    today = date.today()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Added missing comma
            # 2. Ensured subqueries use DATE() for comparison
            sql = """
                SELECT 
                    COUNT(order_id) as total_orders,
                    SUM(total_amount) as potential_revenue,
                    SUM(amount_paid) as actual_cash_collected,
                    (SELECT COUNT(*) FROM orders WHERE order_status = 'Received' AND business_id = %s) as pending_laundry,
                    (SELECT COUNT(*) FROM orders WHERE collection_date = %s AND business_id = %s) as orders_due_today,
                    (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = %s AND business_id = %s) as orders_made_today
                FROM orders 
                WHERE business_id = %s AND DATE(created_at) = %s
            """
            
            # We need 7 items in this tuple to match the 7 %s above
            params = (
                business_id,  # for pending_laundry
                today,        # for collection_date
                business_id,  # for orders_due_today biz_id
                today,        # for orders_made_today date
                business_id,  # for orders_made_today biz_id
                business_id,  # for main query biz_id
                today         # for main query date
            )
            
            cursor.execute(sql, params)
            summary = cursor.fetchone()
            
            report = {
                "total_orders": summary['total_orders'] or 0,
                "potential_revenue": float(summary['potential_revenue'] or 0),
                "actual_cash_collected": float(summary['actual_cash_collected'] or 0),
                "pending_laundry": summary['pending_laundry'] or 0,
                "orders_due_today": summary['orders_due_today'] or 0,
                "orders_made_today": summary['orders_made_today'] or 0
            }
            
            return jsonify(report), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@laundry.route('/orders-due-today/<int:business_id>', methods=['GET'])
def get_orders_due_today(business_id):
    today = date.today()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Join with customers table to get names and phone numbers
            sql = """
                SELECT 
                    o.order_number, 
                    c.first_name, 
                    c.last_name, 
                    c.phone_number, 
                    o.total_amount, 
                    o.amount_paid,
                    o.order_status
                FROM orders o
                JOIN customers c ON o.customer_id = c.customer_id
                WHERE o.business_id = %s 
                AND o.collection_date = %s
                AND o.order_status != 'Collected'
                ORDER BY o.created_at DESC
            """
            cursor.execute(sql, (business_id, today))
            orders = cursor.fetchall()
            return jsonify(orders), 200
    finally:
        conn.close()

@laundry.route('/update-payment/<int:order_id>', methods=['PATCH'])
def update_payment(order_id):
    data = request.json
    new_paid = data.get('amount_paid')
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Update amount_paid and recalculate balance
            sql = """
                UPDATE orders 
                SET amount_paid = %s
                WHERE order_id = %s
            """
            cursor.execute(sql, (new_paid, order_id))
        conn.commit()
        return jsonify({"message": "Payment updated"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@laundry.route('/complete-order/<string:order_number>', methods=['POST'])
def complete_order(order_number):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Update status to Collected and ensure balance is cleared
            # We use order_number since it's unique and already in our table
            sql = """
                UPDATE orders 
                SET order_status = 'Collected', 
                    amount_paid = total_amount
                WHERE order_number = %s
            """
            cursor.execute(sql, (order_number,))
            
            if cursor.rowcount == 0:
                return jsonify({"error": "Order not found"}), 404
                
        conn.commit()
        return jsonify({"message": "Order marked as collected and fully paid"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Route for updating price
@laundry.route('/products/<int:product_id>', methods=['PATCH'])
def update_product_price(product_id):
    data = request.get_json()
    new_price = data.get('price')
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Update the price for the specific product_id
            sql = "UPDATE products SET price = %s WHERE product_id = %s"
            cursor.execute(sql, (new_price, product_id))
        conn.commit()
        return jsonify({"message": "Price updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Route for deleting a service
@laundry.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Instead of a hard delete, we set is_available to 0
            # This keeps your historical order data safe!
            sql = "UPDATE products SET is_available = 0 WHERE product_id = %s"
            cursor.execute(sql, (product_id,))
        conn.commit()
        return jsonify({"message": "Service removed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
        
@laundry.route('/products', methods=['POST'])
def add_product():
    data = request.get_json()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO products (business_id, name, category, price, description)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                data['business_id'], data['name'], data['category'], 
                data['price'], data.get('description')
            ))
        conn.commit()
        return jsonify({"message": "Service added successfully"}), 201
    finally:
        conn.close()

@laundry.route('/products/<int:business_id>', methods=['GET'])
def get_products(business_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM products WHERE business_id = %s AND is_available = 1", (business_id,))
            return jsonify(cursor.fetchall()), 200
    finally:
        conn.close()

@laundry.route('/orders/<int:business_id>', methods=['GET'])
def get_orders(business_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # We JOIN orders with customers to get the names and addresses
            sql = """
                SELECT 
                    o.order_id, 
                    o.order_number, 
                    o.order_status, 
                    o.collection_date, 
                    o.total_amount,
                    o.amount_paid,
                    c.first_name, 
                    c.last_name, 
                    c.phone_number,
                    c.physical_address
                FROM orders o
                JOIN customers c ON o.customer_id = c.customer_id
                WHERE o.business_id = %s
                ORDER BY o.created_at DESC
            """
            cursor.execute(sql, (business_id,))
            orders = cursor.fetchall()
            return jsonify(orders), 200
    finally:
        conn.close()

@laundry.route('/order-details/<int:order_id>', methods=['GET'])
def get_order_details(order_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Fetch Order + Customer + Business details
            sql_order = """
                SELECT o.*, c.first_name, c.last_name, b.name as biz_name, b.location, b.kra_pin
                FROM orders o
                JOIN customers c ON o.customer_id = c.customer_id
                JOIN businesses b ON o.business_id = b.business_id
                WHERE o.order_id = %s
            """
            cursor.execute(sql_order, (order_id,))
            order_info = cursor.fetchone()

            # 2. Fetch the specific items in that order
            sql_items = """
                SELECT oi.*, p.name 
                FROM order_items oi
                JOIN products p ON oi.product_id = p.product_id
                WHERE oi.order_id = %s
            """
            cursor.execute(sql_items, (order_id,))
            items = cursor.fetchall()

            return jsonify({
                "order": order_info,
                "items": items
            }), 200
    finally:
        conn.close()
