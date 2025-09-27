# ML Backend - Emotion Detection API

This folder contains a FastAPI service that loads a TensorFlow model (`model1.h5`) and exposes a `/predict/` endpoint for CSV uploads. The service is integrated with the Next.js app via a proxy route at `web/src/app/api/emotion/route.ts`.

## Prerequisites
- Python 3.10 or 3.11 recommended
- The model file placed at `ml-backend/model1.h5`
- Windows (commands below use PowerShell), but Linux/Mac work with equivalent commands

## Setup (Windows PowerShell)
```powershell
# From the repository root
cd ml-backend

# Optional: create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Ensure the model file exists
# Copy your model file into this folder as: ml-backend/model1.h5

# Run the API
python backend_app.py
# or:
# uvicorn backend_app:app --host 0.0.0.0 --port 8504 --reload
```

The API will be available at: `http://localhost:8504/`
- Health: `GET /`  
- Predict: `POST /predict/` (multipart form with `file` field containing a `.csv`)

## CSV Format
- Must include a `'Label'` column.  
- Feature columns should be numeric.  
- Label values can be `NEUTRAL`, `POSITIVE`, `NEGATIVE` (they are encoded to 0/1/2 internally and then features are standardized).

## Integration with Next.js
Create/update `.env.local` in the `web/` folder with:
```
ML_API_URL=http://localhost:8504
```
Then start your Next.js dev server in another terminal:
```powershell
cd web
pnpm dev
# or: npm run dev / yarn dev
```
Use the Next.js proxy route: `POST /api/emotion` with a multipart form (`file` field). It forwards the request to `${ML_API_URL}/predict/` and returns JSON like:
```json
{
  "predicted_emotion": "NEUTRAL",
  "prediction_time": "2025-01-01 12:34:56"
}
```

## Notes
- CORS is enabled to allow requests from `http://localhost:3000` by default in `backend_app.py`.
- If you deploy, tighten CORS origins and set `ML_API_URL` accordingly.
