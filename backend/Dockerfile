FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libzmq3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# We install these explicitly to ensure the DRL daemon and FastAPI server have what they need
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" websockets pyzmq pyroute2 tensorflow numpy pydantic

# Note: The code is mounted via docker-compose volume in dev, 
# but we copy it anyway for a complete image.
COPY . .

CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8000"]
