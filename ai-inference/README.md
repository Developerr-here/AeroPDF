# PixelPDF Local AI Background Removal Inference Service

This folder contains a standalone FastAPI microservice that downloads and runs the state-of-the-art **BiRefNet** model inside ONNX Runtime.

---

## Setup Instructions

### 1. Pre-requisites
Ensure you have **Python 3.9 to 3.11** installed on your server or local machine.

### 2. Install Dependencies
Open your terminal in this directory (`ai-inference`) and install the required libraries:
```bash
pip install -r requirements.txt
```

### 3. Run the Inference Server
Start the local FastAPI server using `uvicorn`:
```bash
uvicorn app:app --host 127.0.0.1 --port 8000
```

---

## How It Works

1. **Automatic Download**: On startup, `app.py` checks if the pre-trained weights file (`birefnet-general.onnx`) is cached locally. If it isn't, it downloads it directly from Hugging Face (~150MB).
2. **FastAPI Server**: Runs on port `8000`.
3. **Automatic Fallback**: The Node.js Express server is configured to check `http://localhost:8000/remove-bg` first. If the Python server is offline or fails, it falls back to the SaaS key, and then to browser chroma-key mode, ensuring no service interruptions.
