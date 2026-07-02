import io
import os
import logging
import urllib.request
import time
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import onnxruntime as ort
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
MODEL_PATH = "birefnet-lite.onnx"
# Primary: Fast global CDN mirror. Secondary: Official Hugging Face repo.
MODEL_URLS = [
    "https://hf-mirror.com/onnx-community/BiRefNet_lite-ONNX/resolve/main/onnx/model.onnx",
    "https://huggingface.co/onnx-community/BiRefNet_lite-ONNX/resolve/main/onnx/model.onnx"
]

CHUNK_SIZE = 1024 * 64  # 64KB chunks
session: Optional[ort.InferenceSession] = None
model_ready = False

def download_file_with_resume(url: str, filepath: str, max_retries=3, chunk_size=CHUNK_SIZE, timeout=15) -> bool:
    """
    Robustly downloads a file using python's standard urllib library.
    Supports resuming interrupted transfers, automatic retries with backoff, and chunked streaming.
    """
    import urllib.error
    import http.client
    import socket
    
    attempt = 0
    backoff = 1.0
    
    while attempt < max_retries:
        resume_pos = os.path.getsize(filepath) if os.path.exists(filepath) else 0
        
        # Set a browser-like User-Agent to avoid regional blocking
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        if resume_pos > 0:
            req.add_header('Range', f'bytes={resume_pos}-')
            logger.info(f"Resuming download from byte offset: {resume_pos}")
        
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                status = response.status
                headers = response.info()
                
                if status == 200:
                    mode = 'wb'
                    resume_pos = 0
                    total_expected_size = int(headers.get('Content-Length', 0))
                elif status == 206:
                    mode = 'ab'
                    content_length = int(headers.get('Content-Length', 0))
                    total_expected_size = resume_pos + content_length
                else:
                    raise urllib.error.HTTPError(url, status, "Unexpected HTTP status", headers, None)
                
                # Download chunk-by-chunk
                with open(filepath, mode) as f:
                    while True:
                        try:
                            chunk = response.read(chunk_size)
                            if not chunk:
                                break
                            f.write(chunk)
                            resume_pos += len(chunk)
                            if total_expected_size > 0:
                                percent = (resume_pos / total_expected_size) * 100
                                print(f"Progress: {percent:.1f}% ({resume_pos}/{total_expected_size} bytes)", end='\r')
                        except (http.client.IncompleteRead, socket.timeout, ConnectionResetError) as chunk_error:
                            raise chunk_error
                
                # Content-Length Validation
                if total_expected_size > 0 and resume_pos != total_expected_size:
                    raise ValueError(f"Size mismatch: expected {total_expected_size} bytes, got {resume_pos}")
                
                print(f"\nDownload completed successfully: {resume_pos} bytes")
                return True
                
        except urllib.error.HTTPError as e:
            # Handle already fully downloaded file (HTTP 416 Range Not Satisfiable)
            if e.code == 416:
                try:
                    head_req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}, method='HEAD')
                    with urllib.request.urlopen(head_req, timeout=timeout) as head_resp:
                        total_expected_size = int(head_resp.headers.get('Content-Length', 0))
                    if resume_pos == total_expected_size:
                        logger.info(f"File already fully downloaded ({resume_pos} bytes).")
                        return True
                    else:
                        os.remove(filepath)
                        resume_pos = 0
                except Exception:
                    os.remove(filepath)
                    resume_pos = 0
            
            if e.code in [400, 401, 403, 404]:
                logger.error(f"Terminal HTTP Error {e.code}: {e.reason}")
                return False
                
            attempt += 1
            logger.warning(f"HTTP Error {e.code} on attempt {attempt}/{max_retries}. Retrying in {backoff}s...")
            time.sleep(backoff)
            backoff *= 2
            
        except (urllib.error.URLError, http.client.IncompleteRead, ConnectionResetError, socket.timeout) as e:
            attempt += 1
            logger.warning(f"Connection error ({e.__class__.__name__}) on attempt {attempt}/{max_retries}. Retrying in {backoff}s...")
            time.sleep(backoff)
            backoff *= 2
            
    return False

def load_model():
    """Load or download and load the ONNX model."""
    global session, model_ready
    
    try:
        # Check if model file exists and is valid
        if os.path.exists(MODEL_PATH):
            try:
                logger.info("Validating existing model file...")
                test_session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
                del test_session
                logger.info("Model validation successful")
            except Exception as e:
                logger.warning(f"Model validation failed: {e}. Re-downloading...")
                try:
                    os.remove(MODEL_PATH)
                except Exception:
                    pass
        
        # Download if needed
        if not os.path.exists(MODEL_PATH):
            logger.info("Model file not found. Starting download...")
            success = False
            for url in MODEL_URLS:
                if download_file_with_resume(url, MODEL_PATH):
                    success = True
                    break
            
            if not success:
                raise RuntimeError("Failed to download model from all sources")
        
        # Load model with optimized CPU settings
        logger.info("Loading ONNX model...")
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1
        opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        opts.add_session_config_entry("session.use_env_allocators", "1")
        opts.enable_cpu_mem_arena = False
        
        session = ort.InferenceSession(
            MODEL_PATH,
            sess_options=opts,
            providers=['CPUExecutionProvider']
        )
        
        model_ready = True
        logger.info("Model loaded successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        model_ready = False
        return False

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for FastAPI."""
    load_model()
    yield

# Create FastAPI app
app = FastAPI(title="PixelPDF AI Inference Server", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok" if model_ready else "loading",
        "model": "BiRefNet-Lite",
        "model_ready": model_ready,
        "model_path": MODEL_PATH if os.path.exists(MODEL_PATH) else None
    }

@app.post("/remove-bg")
def remove_background(file: UploadFile = File(...)):
    """Remove background from uploaded image."""
    global session
    
    if not model_ready or session is None:
        raise HTTPException(
            status_code=503,
            detail="AI Model is not ready yet. Please wait."
        )
    
    try:
        start_time = time.time()
        
        # 1. Read input image bytes synchronously
        img_bytes = file.file.read()
        if len(img_bytes) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image too large (max 50MB)")
            
        orig_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        orig_w, orig_h = orig_img.size
        
        # Max resolution limit of 1280px to prevent container out-of-memory (OOM) crashes
        MAX_DIM = 1280
        if max(orig_w, orig_h) > MAX_DIM:
            scale = MAX_DIM / max(orig_w, orig_h)
            new_w = int(orig_w * scale)
            new_h = int(orig_h * scale)
            orig_img = orig_img.resize((new_w, new_h), Image.Resampling.BILINEAR)
            orig_w, orig_h = orig_img.size
        
        # 2. Get expected model input dimensions dynamically
        input_shape = session.get_inputs()[0].shape
        input_h = input_shape[2] if len(input_shape) > 2 and isinstance(input_shape[2], int) else 1024
        input_w = input_shape[3] if len(input_shape) > 3 and isinstance(input_shape[3], int) else 1024
        
        # 3. Preprocess image
        resized_img = orig_img.resize((input_w, input_h), Image.Resampling.BILINEAR)
        img_array = np.array(resized_img, dtype=np.float32) / 255.0
        
        # Normalize with ImageNet stats
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_array = (img_array - mean) / std
        
        # Transpose shape: [H, W, C] -> [C, H, W] and add batch dimension
        img_array = np.transpose(img_array, (2, 0, 1))
        input_tensor = np.expand_dims(img_array, axis=0).astype(np.float32)
        
        # 4. Run inference
        input_name = session.get_inputs()[0].name
        outputs = session.run(None, {input_name: input_tensor})
        logits = outputs[0]
        
        # 5. Postprocess mask: Sigmoid
        mask = 1.0 / (1.0 + np.exp(-logits))
        mask_2d = mask[0, 0]
        mask_uint8 = (mask_2d * 255).astype(np.uint8)
        
        # 6. Resize mask to original dimensions
        mask_pil = Image.fromarray(mask_uint8).resize(
            (orig_w, orig_h), 
            Image.Resampling.BILINEAR
        )
        
        # 7. Apply alpha channel
        rgba_img = orig_img.convert("RGBA")
        rgba_img.putalpha(mask_pil)
        
        # 8. Save result to binary buffer
        output_io = io.BytesIO()
        rgba_img.save(output_io, format="PNG")
        output_io.seek(0)
        
        processing_time = time.time() - start_time
        logger.info(f"Background removed in {processing_time:.2f}s")
        
        response_bytes = output_io.getvalue()
        
        # Free up memory explicitly before sending response
        try:
            del orig_img, resized_img, img_array, mask_pil, rgba_img, outputs, logits, mask, mask_2d, mask_uint8, output_io
            import gc
            gc.collect()
        except Exception:
            pass
            
        return Response(
            content=response_bytes,
            media_type="image/png",
            headers={
                "X-Processing-Time": str(processing_time),
                "X-Image-Size": f"{orig_w}x{orig_h}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Image processing failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1
    )
