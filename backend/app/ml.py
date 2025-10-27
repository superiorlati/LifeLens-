# ml.py -- feature extraction, training, and lightweight inference for LifeLens prototype

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
from .db import get_conn, save_model, load_model_spec

def gather_features_labels(user_id: str, min_days: int = 1):
    """
    For each habit of the user, collect recent logs and compute simple features:
      - streak: consecutive trailing successes (int)
      - mean_success: proportion of successes in window [0,14] days
      - recency_hours: hours since last log
    Label: heuristic 1 if last log occurred within 24 hours (proxy for 'continued engagement'), else 0.
    Returns: X (n x 3), y (n)
    """
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM habits WHERE user_id = ?", (user_id,))
    habit_rows = cur.fetchall()
    X = []; y = []
    for (habit_id,) in habit_rows:
        cur.execute("SELECT timestamp, success FROM logs WHERE user_id = ? AND habit_id = ? ORDER BY timestamp ASC",
                    (user_id, habit_id))
        rows = cur.fetchall()
        if not rows:
            continue
        # consider last 14 days
        cutoff = datetime.utcnow() - timedelta(days=14)
        recent = [(datetime.fromisoformat(ts), s) for (ts, s) in rows if datetime.fromisoformat(ts) > cutoff]
        if not recent:
            continue
        successes = [s for (_, s) in recent]
        # streak: count consecutive trailing 1s
        streak = 0
        for s in reversed(successes):
            if s == 1:
                streak += 1
            else:
                break
        mean_success = float(np.mean(successes))
        recency_hours = (datetime.utcnow() - recent[-1][0]).total_seconds() / 3600.0
        label = 1 if recent[-1][0] > datetime.utcnow() - timedelta(hours=24) else 0
        X.append([streak, mean_success, recency_hours])
        y.append(label)
    conn.close()
    if not X:
        return None, None
    return np.array(X, dtype=float), np.array(y, dtype=int)

def train_user_model(user_id: str, min_samples: int = 5):
    """
    Train logistic regression if enough samples exist. Save scaler & serialized model params to DB.
    Returns True if trained, False otherwise.
    """
    X, y = gather_features_labels(user_id)
    if X is None or len(X) < min_samples:
        return False
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    model = LogisticRegression(max_iter=200)
    model.fit(Xs, y)
    # serialize model parameters
    model_spec = {"coef": model.coef_.tolist(), "intercept": model.intercept_.tolist(), "classes": model.classes_.tolist()}
    scaler_spec = {"mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist()}
    save_model(user_id, scaler_spec, model_spec)
    return True

def make_predictor(user_id: str):
    """
    Return a function predictor(features_vector) -> probability in [0,1],
    or None if no model saved for user.
    """
    spec = load_model_spec(user_id)
    if not spec:
        return None
    scaler = spec["scaler"]
    model = spec["model"]
    mean = np.array(scaler["mean"], dtype=float)
    scale = np.array(scaler["scale"], dtype=float)
    coef = np.array(model["coef"], dtype=float).reshape(-1)
    intercept = float(model["intercept"][0])
    def predict(feature_vector):
        x = (np.array(feature_vector, dtype=float) - mean) / scale
        z = float(np.dot(coef, x) + intercept)
        prob = 1.0 / (1.0 + np.exp(-z))
        return float(prob)
    return predict
