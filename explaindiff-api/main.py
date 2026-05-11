from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import json
import os
import hashlib
import uuid
import base64
import io
import traceback
import pickle
import requests
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score
from dotenv import load_dotenv


load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_cache(cache_key):
    try:
        response = requests.get(
            f"{os.getenv('UPSTASH_REDIS_REST_URL')}/get/{cache_key}",
            headers={
                "Authorization": f"Bearer {os.getenv('UPSTASH_REDIS_REST_TOKEN')}",
            },
            timeout=15,
        )
        result = response.json().get("result")
        if result is not None:
            return json.loads(result)
        return None
    except Exception:
        return None


def set_cache(cache_key, data):
    try:
        requests.post(
            f"{os.getenv('UPSTASH_REDIS_REST_URL')}/set/{cache_key}",
            headers={
                "Authorization": f"Bearer {os.getenv('UPSTASH_REDIS_REST_TOKEN')}",
            },
            json={"value": json.dumps(data), "ex": 86400},
            timeout=15,
        )
    except Exception as exc:
        print(exc)


def save_to_supabase(
    session_id,
    dataset_name,
    model_a_name,
    model_b_name,
    agreement_rate,
    total_samples,
    disagreements,
    results,
    ai_report,
):
    response = requests.post(
        f"{os.getenv('SUPABASE_URL')}/rest/v1/comparison_sessions",
        headers={
            "apikey": os.getenv("SUPABASE_KEY", ""),
            "Authorization": f"Bearer {os.getenv('SUPABASE_KEY', '')}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        json={
            "session_id": session_id,
            "dataset_name": dataset_name,
            "model_a_name": model_a_name,
            "model_b_name": model_b_name,
            "agreement_rate": agreement_rate,
            "total_samples": total_samples,
            "disagreements": disagreements,
            "results": json.dumps(results),
            "ai_report": ai_report,
        },
        timeout=20,
    )
    print(response.status_code)
    if response.status_code != 201:
        print(response.text)


@app.get("/history")
def get_history():
    try:
        response = requests.get(
            f"{os.getenv('SUPABASE_URL')}/rest/v1/comparison_sessions?select=*&order=created_at.desc&limit=10",
            headers={
                "apikey": os.getenv("SUPABASE_KEY", ""),
                "Authorization": f"Bearer {os.getenv('SUPABASE_KEY', '')}",
            },
            timeout=20,
        )
        response.raise_for_status()
        return response.json()
    except Exception:
        return []


def preprocess_data(df, target_column):
    df = df.dropna(subset=[target_column]).copy()
    missing_ratio = df.isna().mean()
    df = df.loc[:, missing_ratio <= 0.5].copy()

    if target_column not in df.columns:
        raise ValueError("Target column was removed during preprocessing due to excessive missing values.")

    X_df = df.drop(columns=[target_column]).copy()
    y_array = df[target_column].to_numpy()

    numeric_columns = X_df.select_dtypes(include=[np.number]).columns
    non_numeric_columns = X_df.select_dtypes(exclude=[np.number]).columns

    for column in numeric_columns:
        X_df[column] = X_df[column].fillna(X_df[column].median())

    for column in non_numeric_columns:
        mode_series = X_df[column].mode(dropna=True)
        fill_value = mode_series.iloc[0] if not mode_series.empty else "missing"
        X_df[column] = X_df[column].fillna(fill_value)

    for column in non_numeric_columns:
        encoder = LabelEncoder()
        X_df[column] = encoder.fit_transform(X_df[column].astype(str))

    feature_names = X_df.columns.tolist()
    scaler = StandardScaler()
    X_array = scaler.fit_transform(X_df).astype(np.float32)

    return X_array, y_array, feature_names


def compare_models(model_a, model_b, X, y, feature_names):
    preds_a = model_a.predict(X)
    preds_b = model_b.predict(X)

    agreement_mask = preds_a == preds_b
    agreement_count = int(np.sum(agreement_mask))
    total_samples = len(y)
    disagreement_indices = np.where(~agreement_mask)[0].tolist()
    agreement_rate = round((agreement_count / total_samples) * 100, 2) if total_samples else 0.0

    accuracy_a = round(accuracy_score(y, preds_a) * 100, 2)
    accuracy_b = round(accuracy_score(y, preds_b) * 100, 2)

    try:
        if hasattr(model_a, "predict_proba"):
            confidence_a = np.max(model_a.predict_proba(X), axis=1).tolist()
        else:
            confidence_a = np.zeros(total_samples).tolist()
    except Exception:
        confidence_a = np.zeros(total_samples).tolist()

    try:
        if hasattr(model_b, "predict_proba"):
            confidence_b = np.max(model_b.predict_proba(X), axis=1).tolist()
        else:
            confidence_b = np.zeros(total_samples).tolist()
    except Exception:
        confidence_b = np.zeros(total_samples).tolist()

    feature_importance = []
    importances_a = getattr(model_a, "feature_importances_", None)
    importances_b = getattr(model_b, "feature_importances_", None)

    if importances_a is not None or importances_b is not None:
        combined_scores = []
        for idx, feature in enumerate(feature_names):
            score_a = float(importances_a[idx]) if importances_a is not None and idx < len(importances_a) else 0.0
            score_b = float(importances_b[idx]) if importances_b is not None and idx < len(importances_b) else 0.0
            combined_scores.append((feature, score_a, score_b, max(score_a, score_b)))

        top_features = sorted(combined_scores, key=lambda item: item[3], reverse=True)[:10]
        feature_importance = [
            {
                "feature": feature,
                "importance_a": round(score_a, 6),
                "importance_b": round(score_b, 6),
            }
            for feature, score_a, score_b, _ in top_features
        ]

    prediction_distribution = []
    unique_classes = np.unique(np.concatenate([preds_a, preds_b]))
    for class_label in unique_classes:
        prediction_distribution.append(
            {
                "class_label": str(class_label),
                "count_a": int(np.sum(preds_a == class_label)),
                "count_b": int(np.sum(preds_b == class_label)),
            }
        )

    return {
        "agreement_rate": agreement_rate,
        "disagreement_count": len(disagreement_indices),
        "disagreement_indices": disagreement_indices,
        "accuracy_a": accuracy_a,
        "accuracy_b": accuracy_b,
        "feature_importance": feature_importance,
        "prediction_distribution": prediction_distribution,
        "confidence_a": confidence_a,
        "confidence_b": confidence_b,
    }


def analyse_disagreements(model_a, model_b, X, y, feature_names, disagreement_indices):
    records = []
    for index in disagreement_indices[:10]:
        feature_values = {feature_names[i]: float(X[index][i]) for i in range(len(feature_names))}
        records.append(
            {
                "sample_id": int(index),
                "features": feature_values,
                "pred_a": str(model_a.predict(X[index:index + 1])[0]),
                "pred_b": str(model_b.predict(X[index:index + 1])[0]),
                "actual": str(y[index]),
            }
        )
    return records


def generate_report(
    agreement_rate,
    disagreement_count,
    accuracy_a,
    accuracy_b,
    model_a_name,
    model_b_name,
    dataset_name,
):
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are an ML expert. Given model comparison results explain why two "
                            "models might differ and which one to prefer. Be specific and under 100 words."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Dataset: {dataset_name} Model A: {model_a_name} accuracy {accuracy_a}% "
                            f"Model B: {model_b_name} accuracy {accuracy_b}% Agreement rate: "
                            f"{agreement_rate}% Disagreements: {disagreement_count} samples"
                        ),
                    },
                ],
            },
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        return payload["choices"][0]["message"]["content"]
    except Exception:
        return "Report unavailable"


@app.websocket("/ws/compare")
async def compare_ws(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connected")

    try:
        payload = await websocket.receive_json()
        print("Data received")

        model_a_data = payload["model_a_data"]
        model_b_data = payload["model_b_data"]
        dataset_data = payload["dataset_data"]
        target_column = payload["target_column"]
        model_a_name = payload["model_a_name"]
        model_b_name = payload["model_b_name"]
        dataset_name = payload.get("dataset_name", "uploaded_dataset")

        cache_source = f"{model_a_data}{model_b_data}{dataset_data}{target_column}"
        cache_key = hashlib.md5(cache_source.encode("utf-8")).hexdigest()

        await websocket.send_json({"step": "Checking cache...", "progress": 5})
        cached_result = get_cache(cache_key)
        if cached_result is not None:
            await websocket.send_json({"step": "Cache hit", "progress": 95})
            await websocket.send_json(
                {
                    "step": "Complete",
                    "progress": 100,
                    "results": cached_result,
                }
            )
            return

        await websocket.send_json({"step": "Loading models...", "progress": 10})
        model_a = pickle.loads(base64.b64decode(model_a_data))
        model_b = pickle.loads(base64.b64decode(model_b_data))

        await websocket.send_json({"step": "Parsing dataset...", "progress": 20})
        csv_bytes = base64.b64decode(dataset_data)
        df = pd.read_csv(io.BytesIO(csv_bytes))

        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset.")

        await websocket.send_json({"step": "Preprocessing data...", "progress": 30})
        X, y, feature_names = preprocess_data(df, target_column)

        await websocket.send_json({"step": "Getting Model A predictions...", "progress": 45})
        await websocket.send_json({"step": "Getting Model B predictions...", "progress": 60})
        comparison = compare_models(model_a, model_b, X, y, feature_names)

        await websocket.send_json({"step": "Analysing disagreements...", "progress": 70})
        disagreement_records = analyse_disagreements(
            model_a,
            model_b,
            X,
            y,
            feature_names,
            comparison["disagreement_indices"],
        )

        await websocket.send_json({"step": "Comparing feature importance...", "progress": 80})
        await websocket.send_json({"step": "Generating AI report...", "progress": 88})
        ai_report = generate_report(
            comparison["agreement_rate"],
            comparison["disagreement_count"],
            comparison["accuracy_a"],
            comparison["accuracy_b"],
            model_a_name,
            model_b_name,
            dataset_name,
        )

        final_results = {
            "dataset_name": dataset_name,
            "model_a_name": model_a_name,
            "model_b_name": model_b_name,
            "total_samples": int(len(y)),
            "agreement_rate": comparison["agreement_rate"],
            "disagreement_count": comparison["disagreement_count"],
            "disagreement_indices": comparison["disagreement_indices"],
            "accuracy_a": comparison["accuracy_a"],
            "accuracy_b": comparison["accuracy_b"],
            "feature_importance": comparison["feature_importance"],
            "prediction_distribution": comparison["prediction_distribution"],
            "confidence_a": comparison["confidence_a"],
            "confidence_b": comparison["confidence_b"],
            "disagreements": disagreement_records,
            "ai_report": ai_report,
            "feature_names": feature_names,
        }

        await websocket.send_json({"step": "Saving to history...", "progress": 94})
        set_cache(cache_key, final_results)
        session_id = str(uuid.uuid4())

        try:
            save_to_supabase(
                session_id=session_id,
                dataset_name=dataset_name,
                model_a_name=model_a_name,
                model_b_name=model_b_name,
                agreement_rate=comparison["agreement_rate"],
                total_samples=int(len(y)),
                disagreements=comparison["disagreement_count"],
                results=final_results,
                ai_report=ai_report,
            )
        except Exception:
            traceback.print_exc()

        await websocket.send_json(
            {
                "step": "Complete",
                "progress": 100,
                "results": final_results,
                "session_id": session_id,
            }
        )
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        traceback.print_exc()
        try:
            await websocket.send_json({"error": str(exc)})
        except Exception:
            pass


@app.get("/health")
def health_check():
    return {"status": "ok"}
