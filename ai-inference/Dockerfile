FROM python:3.11-slim

# Set environment variables to prevent Python/Pip from buffering or using memory caches
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_PREFER_BINARY=1

WORKDIR /app

# Copy requirements first to leverage Docker build caching
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# Copy the rest of the application files
COPY . .

# Expose port 8000 internally
EXPOSE 8000

# Start the FastAPI server using the direct python runner
CMD ["python", "app.py"]
