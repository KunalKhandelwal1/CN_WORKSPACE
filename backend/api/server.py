from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import metrics, training, simulation

app = FastAPI(title="DRL-TCP Simulation API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/api/metrics", tags=["Metrics"])
app.include_router(training.router, prefix="/api/training", tags=["Training"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["Simulation"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
