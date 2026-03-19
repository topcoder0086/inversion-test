# Use official Python runtime
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Environment variables for better Python behavior
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq-dev \
        gcc \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip (good practice)
RUN pip install --upgrade pip

# Copy only requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose port (optional, depends on your app)
EXPOSE 8000

# Default command (change if needed, e.g. gunicorn in production)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
