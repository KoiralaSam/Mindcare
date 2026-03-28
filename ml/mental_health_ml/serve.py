from __future__ import annotations

import os
from pathlib import Path
import sys
from typing import Any

import joblib
import numpy as np
import pandas as pd
import yaml
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
ARTIFACT_PATH = Path(os.environ.get("ML_ARTIFACTS_DIR", str(ROOT / "artifacts"))) / "model_bundle.joblib"
CONFIG_PATH = Path(os.environ.get("ML_CONFIG_PATH", str(ROOT / "config.yaml")))

app = FastAPI(title="Mental health ML service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_bundle: dict[str, Any] | None = None


def _as_yes_no(value: Any) -> str | None:
    s = str(value).strip().lower()
    if s in {"yes", "y", "true", "1", "present", "positive"}:
        return "yes"
    if s in {"no", "n", "false", "0", "none", "negative"}:
        return "no"
    return None


def _normalize_column_name(name: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "_" for ch in name).strip("_")


def _derive_mental_state(df: pd.DataFrame) -> pd.Series:
    normalized = {c: _normalize_column_name(c) for c in df.columns}
    dep_cols = [c for c, n in normalized.items() if "depress" in n or "sad" in n]
    anx_cols = [c for c, n in normalized.items() if "anx" in n or "panic" in n or "worry" in n]
    proxy_cols = [
        c
        for c, n in normalized.items()
        if any(k in n for k in ["mental", "treatment", "interfere", "stress", "mood", "family_history"])
    ]

    labels: list[str] = []
    for _, row in df.iterrows():
        dep_yes = any(_as_yes_no(row[c]) == "yes" for c in dep_cols)
        anx_yes = any(_as_yes_no(row[c]) == "yes" for c in anx_cols)
        if dep_yes:
            labels.append("depression")
            continue
        if anx_yes:
            labels.append("anxiety")
            continue

        yes_votes = 0
        no_votes = 0
        for c in proxy_cols:
            yn = _as_yes_no(row[c])
            if yn == "yes":
                yes_votes += 1
            elif yn == "no":
                no_votes += 1

        if no_votes >= 2 and yes_votes == 0:
            labels.append("fluke_or_low_risk")
        else:
            labels.append("other")

    return pd.Series(labels, index=df.index, name="mental_state")


def _distribution(values: pd.Series) -> list[dict[str, Any]]:
    counts = values.astype(str).value_counts(dropna=False)
    return [{"label": k, "count": int(v)} for k, v in counts.items()]


def load_csv(path: Path) -> pd.DataFrame:
    if not path.is_file():
        raise FileNotFoundError(f"Data file not found: {path}")
    return pd.read_csv(path)


def load_dataframe_from_config(cfg: dict[str, Any]) -> pd.DataFrame:
    source = str(cfg.get("dataset_source", "local")).lower()
    if source == "kaggle":
        try:
            import kagglehub
            from kagglehub import KaggleDatasetAdapter
        except ModuleNotFoundError as e:
            raise HTTPException(
                503,
                "kagglehub is not installed. Run: pip install -r ml/requirements.txt",
            ) from e

        dataset = str(cfg.get("kaggle_dataset") or "imtkaggleteam/mental-health")
        file_path = str(cfg.get("kaggle_file_path") or "")
        if not file_path:
            base = Path(kagglehub.dataset_download(dataset))
            csvs = sorted([p for p in base.rglob("*.csv") if p.is_file()])
            if not csvs:
                raise HTTPException(503, f"No CSV files found in Kaggle dataset: {dataset}")
            file_path = csvs[0].name
        try:
            return kagglehub.load_dataset(
                KaggleDatasetAdapter.PANDAS,
                dataset,
                file_path,
            )
        except Exception as e:
            raise HTTPException(
                503,
                "Failed to load Kaggle dataset. Ensure Kaggle credentials are configured and "
                "set kaggle_file_path in ml/config.yaml if the dataset has multiple files.",
            ) from e

    data_path = ROOT / str(cfg["data_path"])
    if not data_path.is_file():
        raise HTTPException(503, f"Data file not found: {data_path}")
    return load_csv(data_path)


def summarize(df: pd.DataFrame) -> dict[str, Any]:
    return {
        "rows": int(len(df)),
        "columns": list(df.columns),
        "dtypes": {c: str(t) for c, t in df.dtypes.items()},
        "null_counts": {c: int(df[c].isna().sum()) for c in df.columns},
    }


def get_bundle() -> dict[str, Any]:
    global _bundle
    if _bundle is None:
        if not ARTIFACT_PATH.is_file():
            raise HTTPException(
                status_code=503,
                detail="No trained model. Run all cells in ml/mental_health_ml.ipynb, then restart uvicorn.",
            )
        _bundle = joblib.load(ARTIFACT_PATH)
    return _bundle


class PredictBody(BaseModel):
    features: dict[str, Any] = Field(..., description="Feature name -> value for one row")


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "service": "mental-health-ml",
        "docs": "/docs",
        "health": "/health",
        "analysis": "/analysis",
    }


@app.get("/health")
def health() -> dict[str, Any]:
    loaded = ARTIFACT_PATH.is_file()
    return {"ok": True, "model_loaded": loaded, "artifact": str(ARTIFACT_PATH)}


@app.post("/predict")
def predict(body: PredictBody) -> dict[str, Any]:
    bundle = get_bundle()
    cols: list[str] = bundle["feature_columns"]
    schema = bundle.get("input_schema") or {}
    for col in cols:
        if col not in body.features:
            raise HTTPException(422, f"Missing required feature: {col}")
        allowed = schema.get(col)
        if isinstance(allowed, list):
            value = str(body.features.get(col))
            if value not in allowed:
                raise HTTPException(422, f"Invalid value for {col}: '{value}'. Allowed: {allowed}")
    row = {c: body.features.get(c) for c in cols}
    X = pd.DataFrame([row])
    pred = int(bundle["pipeline"].predict(X)[0])
    le = bundle.get("label_encoder")
    if le is not None:
        label = le.inverse_transform([pred])[0]
    else:
        label = pred
    return {
        "prediction": label,
        "prediction_code": pred,
        "target_column": bundle["target_column"],
    }


@app.post("/backend/predict")
def backend_predict(body: PredictBody) -> dict[str, Any]:
    """Alias endpoint for backend integrations using same request schema."""
    return predict(body)


@app.get("/model/info")
def model_info() -> dict[str, Any]:
    bundle = get_bundle()
    raw_classes = bundle.get("classes")
    if raw_classes is None:
        classes: list[str] = []
    else:
        classes = [str(x) for x in np.atleast_1d(raw_classes)]
    return {
        "feature_columns": bundle["feature_columns"],
        "target_column": bundle["target_column"],
        "classes": classes,
        "input_schema": bundle.get("input_schema") or {},
    }


@app.get("/dataset/summary")
def dataset_summary() -> dict[str, Any]:
    if not CONFIG_PATH.is_file():
        raise HTTPException(503, "config.yaml missing")
    with CONFIG_PATH.open(encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    df = load_dataframe_from_config(cfg)
    return summarize(df)


@app.get("/analysis")
def analysis() -> dict[str, Any]:
    bundle = get_bundle()
    if not CONFIG_PATH.is_file():
        raise HTTPException(503, "config.yaml missing")

    with CONFIG_PATH.open(encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    df = load_dataframe_from_config(cfg)
    feature_columns: list[str] = bundle["feature_columns"]
    X = pd.DataFrame([{c: row.get(c) for c in feature_columns} for row in df.to_dict(orient="records")])

    pipe = bundle["pipeline"]
    clf = pipe.named_steps["clf"]
    prep = pipe.named_steps["prep"]
    pred_codes = pipe.predict(X)
    le = bundle.get("label_encoder")

    if le is not None:
        predicted_labels = pd.Series(le.inverse_transform(pred_codes), name="predicted")
    else:
        predicted_labels = pd.Series(pred_codes, name="predicted").astype(str)

    try:
        prep_names = prep.get_feature_names_out()
        if hasattr(clf, "feature_importances_"):
            importances = clf.feature_importances_
            ranked = sorted(
                [{"feature": str(n), "importance": float(i)} for n, i in zip(prep_names, importances)],
                key=lambda x: x["importance"],
                reverse=True,
            )
            top_features = ranked[:12]
        elif hasattr(clf, "coef_"):
            coefs = np.asarray(clf.coef_)
            if coefs.ndim == 1:
                weights = np.abs(coefs)
            else:
                weights = np.mean(np.abs(coefs), axis=0)
            ranked = sorted(
                [{"feature": str(n), "importance": float(i)} for n, i in zip(prep_names, weights)],
                key=lambda x: x["importance"],
                reverse=True,
            )
            top_features = ranked[:12]
        else:
            top_features = []
    except Exception:
        top_features = []

    target_mode = str(bundle.get("target_mode") or cfg.get("target_mode") or "direct")
    target_col = str(bundle.get("target_column") or cfg.get("target_column") or "target")
    observed: list[dict[str, Any]] | None = None
    if target_mode == "derived_mental_state":
        observed = _distribution(_derive_mental_state(df))
    elif target_col in df.columns:
        observed = _distribution(df[target_col])

    metrics = bundle.get("metrics") or {}
    raw_classes = bundle.get("classes")
    classes = [str(x) for x in np.atleast_1d(raw_classes)] if raw_classes is not None else []
    training_metadata = bundle.get("training_metadata") or {}
    sample_count = int(len(df))
    if isinstance(training_metadata, dict):
        if observed is None:
            class_split = training_metadata.get("class_split")
            if isinstance(class_split, dict):
                overall_counts: list[dict[str, Any]] = []
                for label, split_counts in class_split.items():
                    if isinstance(split_counts, dict):
                        count = split_counts.get("overall")
                        if isinstance(count, (int, float)):
                            overall_counts.append({"label": str(label), "count": int(count)})
                if overall_counts:
                    observed = sorted(overall_counts, key=lambda x: x["count"], reverse=True)

        geo_rows = training_metadata.get("geo_rows")
        sent_rows = training_metadata.get("sentiment_rows_used")
        if isinstance(geo_rows, int) and isinstance(sent_rows, int):
            sample_count = int(geo_rows + sent_rows)

    return {
        "sample_count": sample_count,
        "target_mode": target_mode,
        "target_column": target_col,
        "classes": classes,
        "accuracy": float(metrics["accuracy"]) if "accuracy" in metrics else None,
        "feature_importance_top": top_features,
        "predicted_distribution": _distribution(predicted_labels),
        "observed_distribution": observed,
        "intake_question_columns": bundle.get("intake_question_columns") or [],
        "training_metadata": training_metadata,
        "classification_report": metrics.get("classification_report"),
    }


def _run_dev_server() -> None:
    """Allow running this file directly for local development."""
    try:
        import uvicorn
    except ModuleNotFoundError:
        print(
            "Missing dependency 'uvicorn'. Activate ml/.venv and run:\n"
            "  pip install -r ml/requirements.txt\n"
            "Then start with:\n"
            "  python -m uvicorn mental_health_ml.serve:app --host 127.0.0.1 --port 8000"
        )
        sys.exit(1)

    host = os.environ.get("ML_HOST", "127.0.0.1")
    port = int(os.environ.get("ML_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    _run_dev_server()
