from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)    
    # 1. Enable CORS for all routes
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # 2. Register Auth Blueprint
    from .auth import auth
    app.register_blueprint(auth, url_prefix='/auth')
    
    # 3. Register Laundry Blueprint (THIS WAS MISSING)
    from .laundry import laundry
    app.register_blueprint(laundry, url_prefix='/laundry')
    
    return app