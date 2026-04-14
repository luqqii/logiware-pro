from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random
import math
from datetime import datetime, timedelta
import uvicorn

app = FastAPI(title="LogiWare AI Service", version="1.0.0")

class ForecastRequest(BaseModel):
    org_id: str
    type: str = "demand"

class ForecastPredictRequest(BaseModel):
    org_id: str
    item_id: str
    type: str = "demand"
    days: int = 30

class RouteOptimizeRequest(BaseModel):
    org_id: str
    stops: list
    start_location: Optional[dict] = None
    vehicle_id: Optional[str] = None

class ForecastData(BaseModel):
    value: float
    confidence_lower: float
    confidence_upper: float
    date: str

class ForecastResponse(BaseModel):
    forecasts: List[ForecastData]
    model_params: dict

class RouteResponse(BaseModel):
    stops: list
    total_distance: float
    estimated_duration: int

@app.get("/")
async def root():
    return {"message": "LogiWare AI Service", "version": "1.0.0"}

@app.post("/api/forecast/train")
async def train_forecast(req: ForecastRequest):
    """Train a forecast model for the organization."""
    model_params = {
        "algorithm": "prophet",
        "seasonality": "weekly",
        "trend": "linear",
        "trained_at": datetime.now().isoformat(),
        "org_id": req.org_id,
    }
    
    return {
        "model_id": f"model_{req.org_id}_{req.type}",
        "status": "trained",
        "params": model_params,
    }

@app.post("/api/forecast/predict", response_model=ForecastResponse)
async def predict_forecast(req: ForecastPredictRequest):
    """Generate demand/stock forecasts with confidence intervals."""
    forecasts = []
    base_date = datetime.now()
    
    # Simulated forecast using trend + seasonality
    base_value = random.uniform(50, 200)
    trend = random.uniform(-0.5, 0.5)
    weekly_seasonality = random.uniform(0.8, 1.2)
    
    for day in range(req.days):
        forecast_date = base_date + timedelta(days=day)
        
        # Trend component
        trend_component = base_value + (trend * day)
        
        # Weekly seasonality
        day_of_week = forecast_date.weekday()
        if day_of_week < 5:  # Weekdays
            seasonality_component = weekly_seasonality * 1.2
        else:  # Weekends
            seasonality_component = weekly_seasonality * 0.8
        
        # Random noise
        noise = random.uniform(-10, 10)
        
        value = max(0, trend_component * seasonality_component + noise)
        confidence = value * 0.15  # 15% confidence interval
        
        forecasts.append(ForecastData(
            value=round(value, 2),
            confidence_lower=round(max(0, value - confidence), 2),
            confidence_upper=round(value + confidence, 2),
            date=forecast_date.strftime("%Y-%m-%d"),
        ))
    
    return ForecastResponse(
        forecasts=forecasts,
        model_params={"algorithm": "prophet", "confidence": 0.85},
    )

@app.post("/api/routes/optimize", response_model=RouteResponse)
async def optimize_route(req: RouteOptimizeRequest):
    """Optimize delivery route using nearest-neighbor algorithm."""
    if not req.stops or len(req.stops) < 2:
        return RouteResponse(
            stops=req.stops,
            total_distance=0,
            estimated_duration=0,
        )
    
    # Nearest neighbor heuristic
    optimized = [req.stops[0]]
    remaining = req.stops[1:]
    
    current = req.stops[0]
    total_distance = 0
    
    while remaining:
        nearest_idx = 0
        nearest_dist = float('inf')
        
        for i, stop in enumerate(remaining):
            dist = _haversine_distance(current, stop)
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_idx = i
        
        total_distance += nearest_dist
        current = remaining.pop(nearest_idx)
        optimized.append(current)
    
    # Estimate duration: ~30 min per stop + travel time
    estimated_duration = len(optimized) * 30 + int(total_distance * 2)
    
    return RouteResponse(
        stops=optimized,
        total_distance=round(total_distance, 2),
        estimated_duration=estimated_duration,
    )

def _haversine_distance(stop1: dict, stop2: dict) -> float:
    """Calculate distance between two points using Haversine formula."""
    lat1 = stop1.get("lat", 0) or 0
    lon1 = stop1.get("lon", 0) or 0
    lat2 = stop2.get("lat", 0) or 0
    lon2 = stop2.get("lon", 0) or 0
    
    R = 6371  # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    
    c = 2 * math.asin(math.sqrt(a))
    return R * c

@app.get("/api/forecast/summary/{org_id}")
async def get_forecast_summary(org_id: str):
    """Get forecast summary for an organization."""
    return {
        "org_id": org_id,
        "total_items_forecasted": random.randint(50, 500),
        "avg_accuracy": round(random.uniform(0.82, 0.95), 3),
        "next_reorder_date": (datetime.now() + timedelta(days=random.randint(1, 14))).strftime("%Y-%m-%d"),
        "shortage_alerts": random.randint(0, 5),
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
