# routes/__init__.py
from .customers import router as customers_router
from .invoices import router as invoices_router

__all__ = ["customers_router", "invoices_router"]
