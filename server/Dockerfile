# Use Python base image
FROM python:3.10-slim

# Set workspace
WORKDIR /app

# Copy requirements first to leverage Docker cache
# Note: You need a requirements.txt file in your server folder!
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your server code
COPY . .

# Expose the port your Flask app runs on (usually 5000 or 8080)
EXPOSE 5000

# Command to run your application
CMD ["python", "run.py"]