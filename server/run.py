from app import create_app

app = create_app()

if __name__ == '__main__':
    # host='0.0.0.0' makes it accessible on your local network
    app.run(debug=True, port=5000)

    # if __name__ == '__main__':
    # # Use the PORT environment variable provided by Render, defaulting to 5000
    # port = int(os.environ.get("PORT", 5000))
    
    # CRITICAL: Change host to '0.0.0.0' for cloud deployment
    app.run(host='0.0.0.0', port=port)