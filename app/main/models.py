# models.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime

class RegenerateInvoiceRequest(BaseModel):
    save_path: str

class Customer(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., example="Nombre")
    address: str = Field(..., example="Dirección")
    city: str = Field(..., example="Ciudad")
    postal_code: str = Field(..., example="Código Postal")
    country: str = Field(..., example="País")
    cif: str = Field(..., example="CIF")
    phone: str = Field(..., example="Teléfono")
    email: str = Field(..., example="Email")

class Service(BaseModel):
    id: Optional[int] = None
    invoice_id: Optional[int] = None
    description: str
    quantity: int
    price: float
    total: float
    vat: Optional[float] = None

class Invoice(BaseModel):
    id: Optional[int] = None
    customer_id: int
    services: List[Service]
    amount: Optional[float] = None
    vat: Optional[float] = None
    paid: Optional[bool] = Field(default=False)
    date: Optional[datetime] = None

    @validator('paid', pre=True)
    def parse_paid(cls, v):
        if isinstance(v, str):
            if v.lower() in {'true', '1', 'yes'}:
                return True
            elif v.lower() in {'false', '0', 'no'}:
                return False
        return bool(v)
