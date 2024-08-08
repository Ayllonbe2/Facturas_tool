import os
import sqlite3
from fpdf import FPDF
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Define the path to the database
db_path = os.path.join(os.path.dirname(__file__), 'invoices.db')

class Customer(BaseModel):
    id: int
    name: str
    email: str
    phone: str

class Invoice(BaseModel):
    customer_id: int
    amount: float

def init_db():
    # Create the database file if it doesn't exist
    if not os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS invoices (
                        id INTEGER PRIMARY KEY, 
                        customer_id INTEGER,
                        amount REAL,
                        date TEXT DEFAULT (datetime('now','localtime')),
                        FOREIGN KEY(customer_id) REFERENCES customers(id))''')
        c.execute('''CREATE TABLE IF NOT EXISTS customers (
                        id INTEGER PRIMARY KEY, 
                        name TEXT, 
                        email TEXT, 
                        phone TEXT)''')
        conn.commit()
        conn.close()

@app.post('/generate_invoice')
def generate_invoice(invoice: Invoice):
    print(f"Received invoice data: {invoice}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("INSERT INTO invoices (customer_id, amount) VALUES (?, ?)", (invoice.customer_id, invoice.amount))
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
    print(f"Received customer data: {customer}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)", (customer.name, customer.email, customer.phone))
    conn.commit()
    customer_id = c.lastrowid
    conn.close()
    print(f"Customer added with ID: {customer_id}")
    return {"status": "success", "customer_id": customer_id}

@app.get('/get_customers', response_model=List[Customer])
def get_customers():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT * FROM customers")
    customers = c.fetchall()
    conn.close()
    return [{"id": customer[0], "name": customer[1], "email": customer[2], "phone": customer[3]} for customer in customers]

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
    pdf.cell(200, 10, txt = f"Email: {customer[2]}", ln = True, align = 'L')
    pdf.cell(200, 10, txt = f"Teléfono: {customer[3]}", ln = True, align = 'L')
    pdf.cell(200, 10, txt = f"Monto: {amount}", ln = True, align = 'L')
    pdf_file = f"invoice_{invoice_id}.pdf"
    pdf.output(pdf_file)
    print(f"PDF generado: {pdf_file}")

if __name__ == '__main__':
    init_db()
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
