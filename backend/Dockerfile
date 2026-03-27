FROM python:3.11-slim

# Install Tesseract (with Hindi support)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-hin \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port (Render uses 10000)
EXPOSE 10000

# Start Flask app
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10000"]