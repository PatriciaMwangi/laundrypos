from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
import pymysql
import os
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'static/logos'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

auth = Blueprint('auth', __name__)
bcrypt = Bcrypt()

# Helper function to connect to XAMPP MySQL
def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='root',      # Default XAMPP user
        password='',      # Default XAMPP password is empty
        database='laundry_pos', # Replace with your actual DB name
        cursorclass=pymysql.cursors.DictCursor
    )

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # 1. Fetch user by username
            sql = "SELECT * FROM users WHERE username = %s"
            cursor.execute(sql, (username,))
            user = cursor.fetchone()

            # 2. Check if user exists and password hash matches
            if user and bcrypt.check_password_hash(user['password'], password):
                return jsonify({
                    "message": "Login successful",
                    "user": {
                        "id": user['user_id'],
                        "name": user['full_name'],
                        "phone_number":user['phone_number'],
                        "role": user['role'],
                        "business_id": user['business_id']
                    },
                    "token": "your_generated_jwt_token_here" # Optional for now
                }), 200
            else:
                return jsonify({"error": "Invalid username or password"}), 401
    finally:
        connection.close()
        
@auth.route('/register', methods=['POST'])
def register():
    # 1. Use request.form because we are sending multipart data (not JSON)
    # The keys here must match the data.append('key', ...) in React
    name = request.form.get('name')
    phone_number = request.form.get('phone_number') # Added this line
    county = request.form.get('county')
    kra_pin = request.form.get('kra_pin')
    location = request.form.get('location')
    landmark = request.form.get('landmark')
    
    # User/Admin details
    full_name = request.form.get('full_name')
    username = request.form.get('username')
    password = request.form.get('password')

    if not name or not username or not password:
        return jsonify({"error": "Missing required fields"}), 400
    
    # 2. Handle the Logo file
    logo_filename = None
    if 'logo' in request.files:
        file = request.files['logo']
        if file.filename != '':
            logo_filename = secure_filename(file.filename)
            file.save(os.path.join(UPLOAD_FOLDER, logo_filename))

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # 3. Create Business with all your table fields
            biz_sql = """
                INSERT INTO businesses (name, kra_pin, county, location, landmark, logo) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(biz_sql, (name, kra_pin, county, location, landmark, logo_filename))
            business_id = cursor.lastrowid 

            # 4. Hash Password & Create Admin
            hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
            user_sql = """
                INSERT INTO users (business_id, full_name, phone_number,username, password, role) 
                VALUES (%s, %s, %s, %s, %s 'Admin')
            """
            cursor.execute(user_sql, (business_id, full_name,phone_number, username, hashed_pw))
            
        connection.commit()
        return jsonify({"message": "Business and Admin created successfully"}), 201
    except pymysql.err.IntegrityError:
        connection.rollback()
        return jsonify({"error": "Username already exists"}), 409
    except Exception as e:
        connection.rollback()
        print(f"Error: {e}") # Log the actual error to your terminal
        return jsonify({"error": "Server error, try again later"}), 500
    finally:
        connection.close()

@auth.route('/add-staff', methods=['POST'])
def add_staff():
    data = request.get_json()
    
    # Validation: Ensure we have the necessary info
    required_fields = ['full_name', 'username', 'password', 'business_id']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing staff details"}), 400

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Hash the attendant's password
            hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
            
            # Insert as 'Attendant' role
            sql = """
                INSERT INTO users (business_id, full_name,phone_number, username, password, role) 
                VALUES (%s, %s, %s, %s, %s, 'Attendant')
            """
            cursor.execute(sql, (
                data['business_id'], 
                data['full_name'], 
                data['phone_number'],
                data['username'], 
                hashed_pw
            ))
            
        connection.commit()
        return jsonify({"message": "Attendant added successfully"}), 201
    except pymysql.err.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409
    finally:
        connection.close()