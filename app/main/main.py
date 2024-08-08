import os
import sqlite3
from fpdf import FPDF
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import logging

app = FastAPI()

# Define the path to the database
db_path = os.path.join(os.path.dirname(__file__), 'invoices.db')

# Set up logging
logger = logging.getLogger("uvicorn.error")

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


class Invoice(BaseModel):
    customer_id: int
    amount: float

def init_db():
    # Create the database file if it doesn't exist
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Create customers table if it doesn't exist
    c.execute('''CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY, 
                    name TEXT,
                    address TEXT,
                    city TEXT,
                    postal_code TEXT,
                    country TEXT,
                    cif TEXT,
                    phone TEXT, 
                    email TEXT)''')
    
    # Create invoices table if it doesn't exist
    c.execute('''CREATE TABLE IF NOT EXISTS invoices (
                    id INTEGER PRIMARY KEY, 
                    customer_id INTEGER,
                    amount REAL,
                    date TEXT DEFAULT (datetime('now','localtime')),
                    FOREIGN KEY(customer_id) REFERENCES customers(id))''')
    
    conn.commit()
    conn.close()

@app.post('/generate_invoice')
def generate_invoice(invoice: Invoice):
    logger.info(f"Received invoice data: {invoice}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("INSERT INTO invoices (customer_id, amount, date) VALUES (?, ?, datetime('now', 'localtime'))", (invoice.customer_id, invoice.amount))
    conn.commit()
    invoice_id = c.lastrowid
    conn.close()
    
    customer = get_customer_by_id(invoice.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    generate_pdf(invoice_id, customer, invoice.amount)
    
    return {"status": "success", "invoice_id": invoice_id}

@app.post('/add_customer')
def add_customer(customer: Customer):
    logger.info(f"Received customer data: {customer}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("INSERT INTO customers (name, address, city, postal_code, country, cif, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
              (customer.name, customer.address, customer.city, customer.postal_code, customer.country, customer.cif, customer.phone, customer.email))
    conn.commit()
    customer_id = c.lastrowid
    conn.close()
    logger.info(f"Customer added with ID: {customer_id}")
    return {"status": "success", "customer_id": customer_id}

@app.get('/get_customers', response_model=List[Customer])
def get_customers():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT * FROM customers")
    customers = c.fetchall()
    conn.close()
    return [{"id": customer[0], "name": customer[1], "address": customer[2], "city": customer[3], "postal_code": customer[4], "country": customer[5], "cif": customer[6], "phone": customer[7], "email": customer[8]} for customer in customers]

@app.get('/get_invoices')
def get_invoices():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
    SELECT invoices.id, customers.name, invoices.amount, invoices.date 
    FROM invoices 
    JOIN customers ON invoices.customer_id = customers.id
    """)
    invoices = c.fetchall()
    conn.close()
    if not invoices:
        return []
    return [{"id": invoice[0], "customer": invoice[1], "amount": invoice[2], "date": invoice[3]} for invoice in invoices]

def get_customer_by_id(customer_id):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
    customer = c.fetchone()
    conn.close()
    return customer

def generate_pdf(invoice_id, customer, amount):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size = 12)
    pdf.cell(200, 10, txt = f"Factura #{invoice_id}", ln = True, align = 'C')
    pdf.cell(200, 10, txt = f"Cliente: {customer[1]}", ln = True, align = 'L')
    pdf.cell(200, 10, txt = f"Dirección: {customer[2]}", ln = True, align = 'L')
    pdf.cell(200, 10, txt = f"Ciudad: {customer[3]}", ln = True, align = 'L')
    pdf.cell(200, 10, txt = f"Código Postal: {customer[4]}", ln = True, align = 'L')
    pdf.cell(200, 10, txt = f"País: {customer[5]}", ln = True, align = 'L')
    pdf.cell(200, 10, txt = f"CIF: {customer[6]}", ln = True, align = 'L')
    pdf.cell(200, 10, txt = f"Teléfono: {customer[7]}", ln = True, align = 'L')
    pdf.cell(200, 10, txt = f"Email: {customer[8]}", ln = True, align = 'L')
    pdf.cell(200, 10, txt = f"Monto: {amount}", ln = True, align = 'L')
    pdf_file = f"invoice_{invoice_id}.pdf"
    pdf.output(pdf_file)
    logger.info(f"PDF generado: {pdf_file}")

if __name__ == '__main__':
    init_db()
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
