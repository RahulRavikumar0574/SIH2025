from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.utils import to_categorical  # noqa: F401 (potentially used by the model)
from datetime import datetime
from pathlib import Path
import uvicorn

# -------------------
# Custom Layer
# -------------------
class ExpandDimsLayer(tf.keras.layers.Layer):
    def call(self, inputs):
        return tf.expand_dims(inputs, axis=-1)

# -------------------
# Load Model
# -------------------
MODEL_PATH = (Path(__file__).resolve().parent / "model1.h5").as_posix()

def load_model():
    try:
        model = tf.keras.models.load_model(
            MODEL_PATH,
            custom_objects={'ExpandDimsLayer': ExpandDimsLayer},
            compile=False
        )
        print(f"Model loaded successfully from {MODEL_PATH}!")
        return model
    except Exception as e:
        print(f"Error loading model from {MODEL_PATH}: {str(e)}")
        return None

model = load_model()
if model is None:
    raise RuntimeError("Failed to load model. Check the model path and file (ml-backend/model1.h5).")

# -------------------
# Transform Data
# -------------------
def transform_data(data: pd.DataFrame):
    encoding_data = {'NEUTRAL': 0, 'POSITIVE': 1, 'NEGATIVE': 2}
    data_encoded = data.replace(encoding_data)

    if "Label" not in data_encoded.columns:
        raise ValueError("CSV must contain a 'Label' column.")

    x = data_encoded.drop(["Label"], axis=1)
    scaler = StandardScaler()
    X = scaler.fit_transform(x)
    return X

# -------------------
# Label Mapping
# -------------------
label_mapping = {0: "NEGATIVE", 1: "NEUTRAL", 2: "POSITIVE"}

# -------------------
# FastAPI App
# -------------------
app = FastAPI(title="Brain Signal Emotion Detection API")

# Allow CORS from local Next.js dev and same-host deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "*",  # adjust as needed for production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Emotion Detection API is running. Use /predict endpoint to make predictions."}

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    # Only CSV supported
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        # Read CSV
        df = pd.read_csv(file.file)
        X = transform_data(df)

        # Predict
        predictions = model.predict(X)  # shape: (num_rows, 3)
        avg_prediction = np.mean(predictions, axis=0)  # average over rows
        final_index = int(np.argmax(avg_prediction))
        final_emotion = label_mapping[final_index]

        # Timestamp
        prediction_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return JSONResponse({
            "predicted_emotion": final_emotion,
            "prediction_time": prediction_time
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------
# Run API
# -------------------
if __name__ == "__main__":
    uvicorn.run("backend_app:app", host="0.0.0.0", port=8504, reload=True)
