# routes/customers.py
from fastapi import APIRouter, HTTPException
from typing import List
from models import Customer
from database import get_db_connection
import logging

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

@router.post('/add_customer')
def add_customer(customer: Customer):
    logger.info(f"Received customer data: {customer}")
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        INSERT INTO customers (name, address, city, postal_code, country, cif, phone, email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (customer.name, customer.address, customer.city, customer.postal_code, customer.country, customer.cif, customer.phone, customer.email))
    conn.commit()
    customer_id = c.lastrowid
    conn.close()
    logger.info(f"Customer added with ID: {customer_id}")
    return {"status": "success", "customer_id": customer_id}

@router.get('/get_customers', response_model=List[Customer])
def get_customers():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM customers")
    customers = c.fetchall()
    conn.close()
    return [
        {
            "id": customer[0],
            "name": customer[1],
            "address": customer[2],
            "city": customer[3],
            "postal_code": customer[4],
            "country": customer[5],
            "cif": customer[6],
            "phone": customer[7],
            "email": customer[8]
        }
        for customer in customers
    ]

@router.get('/get_customer/{customer_id}', response_model=Customer)
def get_customer(customer_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
    customer = c.fetchone()
    conn.close()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "id": customer[0],
        "name": customer[1],
        "address": customer[2],
        "city": customer[3],
        "postal_code": customer[4],
        "country": customer[5],
        "cif": customer[6],
        "phone": customer[7],
        "email": customer[8]
    }

@router.put('/update_customer')
def update_customer(customer: Customer):
    logger.info(f"Updating customer data: {customer}")
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        UPDATE customers 
        SET name = ?, address = ?, city = ?, postal_code = ?, country = ?, cif = ?, phone = ?, email = ? 
        WHERE id = ?
    """, (customer.name, customer.address, customer.city, customer.postal_code, customer.country, customer.cif, customer.phone, customer.email, customer.id))
    conn.commit()
    conn.close()
    return {"status": "success", "customer_id": customer.id}

@router.delete('/delete_customer/{customer_id}')
def delete_customer(customer_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM customers WHERE id = ?", (customer_id,))
    c.execute("DELETE FROM invoices WHERE customer_id = ?", (customer_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}
