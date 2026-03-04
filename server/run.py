from app import create_app

app = create_app()

if __name__ == '__main__':
    # host='0.0.0.0' makes it accessible on your local network
    app.run(debug=True, port=5000)