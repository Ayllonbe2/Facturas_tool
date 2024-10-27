# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from database import init_db
from routes.customers import router as customers_router
from routes.invoices import router as invoices_router
from config import logger

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(customers_router)
app.include_router(invoices_router)
# Si tienes más routers, inclúyelos aquí

# Ruta para apagar el servidor (si es necesaria)
import os
import signal
import asyncio

@app.post("/shutdown")
async def shutdown():
    pid = os.getpid()
    asyncio.create_task(graceful_shutdown(pid))
    return {"message": f"Shutdown signal sent to PID: {pid}"}

async def graceful_shutdown(pid):
    await asyncio.sleep(2)
    os.kill(pid, signal.SIGINT)
    return {"message": "Shutdown signal sent"}

if __name__ == '__main__':
    init_db()
    uvicorn.run(app, host='127.0.0.1', port=8520)
