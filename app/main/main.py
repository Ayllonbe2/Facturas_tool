import os
import sqlite3
from fpdf import FPDF
from weasyprint import HTML
from fastapi import FastAPI, HTTPException, Request  
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import logging
from datetime import datetime
import base64

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


class Service(BaseModel):
    id: Optional[int] = None  # Este es opcional porque se genera automáticamente en la base de datos
    invoice_id: Optional[int] = None  # Este es opcional porque se establece cuando se crea una factura
    description: str
    workers: int
    price: float
    total: float

class Invoice(BaseModel):
    id: Optional[int] = None  # Este es opcional porque se genera automáticamente en la base de datos
    customer_id: int
    services: List[Service]  # Esta lista contendrá los servicios asociados a la factura
    amount: Optional[float] = None  # Esto se calculará automáticamente en el backend


def init_db():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Crear tabla de clientes
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
    
    # Crear tabla de facturas
    c.execute('''CREATE TABLE IF NOT EXISTS invoices (
                    id INTEGER PRIMARY KEY, 
                    customer_id INTEGER,
                    amount REAL,
                    date TEXT DEFAULT (datetime('now','localtime')),
                    FOREIGN KEY(customer_id) REFERENCES customers(id))''')
    
    # Crear tabla de servicios de factura
    c.execute('''CREATE TABLE IF NOT EXISTS invoice_services (
                    id INTEGER PRIMARY KEY,
                    invoice_id INTEGER,
                    description TEXT,
                    workers INTEGER,
                    price REAL,
                    total REAL,
                    FOREIGN KEY(invoice_id) REFERENCES invoices(id))''')
    
    conn.commit()
    conn.close()



@app.post('/generate_invoice')
def generate_invoice(invoice: Invoice, request: Request):
    logger.info(f"Received invoice data: {invoice}")
    
    # Procesar los datos del cliente y generar la factura
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Insertar factura
    c.execute("INSERT INTO invoices (customer_id, amount, date) VALUES (?, ?, datetime('now', 'localtime'))", 
              (invoice.customer_id, sum(service.total for service in invoice.services)))
    invoice_id = c.lastrowid
    
    # Insertar servicios asociados a la factura
    for service in invoice.services:
        c.execute("INSERT INTO invoice_services (invoice_id, description, workers, price, total) VALUES (?, ?, ?, ?, ?)", 
                  (invoice_id, service.description, service.workers, service.price, service.total))
    
    conn.commit()
    conn.close()
    
    # Obtener los detalles del cliente para el PDF
    customer = get_customer_by_id(invoice.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Llamar a la función para generar el PDF
    generate_pdf(invoice_id, customer, invoice.services, sum(service.total for service in invoice.services))
    
    return {"status": "success", "invoice_id": invoice_id}

@app.put('/update_invoice/{invoice_id}')
def update_invoice(invoice_id: int, invoice: Invoice):
    logger.info(f"Updating invoice data: {invoice}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    print(invoice.customer_id, invoice.amount, invoice_id)
    # Primero, actualizar la tabla de facturas
    c.execute("""
        UPDATE invoices 
        SET customer_id = ?, amount = ? 
        WHERE id = ?
    """, (invoice.customer_id, invoice.amount, invoice_id))
    
    # Luego, eliminar los servicios existentes asociados a la factura
    c.execute("DELETE FROM invoice_services WHERE invoice_id = ?", (invoice_id,))
    
    # Insertar los nuevos servicios
    for service in invoice.services:
        print((invoice_id, service.description, service.workers, service.price, service.total))
        c.execute("""
            INSERT INTO invoice_services (invoice_id, description, workers, price, total) 
            VALUES (?, ?, ?, ?, ?)
        """, (invoice_id, service.description, service.workers, service.price, service.total))
    
    conn.commit()
    conn.close()
    return {"status": "success", "invoice_id": invoice_id}


@app.post('/regenerate_invoice/{invoice_id}')
def regenerate_invoice(invoice_id: int):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Obtener la información de la factura
    c.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    invoice = c.fetchone()

    if not invoice:
        conn.close()
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Obtener la información del cliente
    customer = get_customer_by_id(invoice[1])

    # Obtener los servicios asociados a la factura
    c.execute("SELECT * FROM invoice_services WHERE invoice_id = ?", (invoice_id,))
    services_data = c.fetchall()
    conn.close()

    # Convertir los servicios en objetos de la clase Service
    service_list = [
        Service(
            id=service[0],
            invoice_id=service[1],
            description=service[2],
            workers=service[3],
            price=service[4],
            total=service[5]
        )
        for service in services_data
    ]

    # Generar el PDF de la factura
    generate_pdf(invoice_id, customer, service_list, invoice[2])

    return {"status": "success"}



def get_customer_by_id(customer_id):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
    customer = c.fetchone()
    conn.close()
    return customer

def generate_pdf(invoice_id, customer, services, total_amount):
    formatted_invoice_id = str(invoice_id).zfill(10)
    # Load company logo or any other static information
    logo_path = os.path.abspath("app/assets/acanata.png")
    print(logo_path)
    # Insert logo as base64 string in the PDF
    with open(logo_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    
    data_uri = f"data:image/png;base64,{encoded_string}"

    # Create a string with HTML content
    servicios_html = ""
    for i, service in enumerate(services, start=1):
        servicios_html += f"""
        <tr>
            <td>{i}</td>
            <td>{service.description}</td>
            <td>{service.workers}</td>
            <td>{service.price}</td>
            <td>{service.total}</td>
        </tr>
        """

    # Formatear la fecha actual
    now = datetime.now()
    factura_date = now.strftime("%d-%m-%Y")

    html_content = f"""
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice</title>
    <style>
        @page {{
            size: A4;
            margin: 10mm; /* Márgenes del documento A4 */
        }}
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #fff; /* Cambiar el fondo a blanco */
            line-height: 150%;
            font-size: 9pt;
        }}
        .container {{
            width: 100%; /* Asegurarse de que la anchura sea del 100% */
            margin: 0 auto; /* Centrar el contenedor */
            background: #fff; /* Fondo blanco para el contenedor */
            padding: 20px; /* Añadir un poco de relleno */
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            box-sizing: border-box;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
        }}
        .header img {{
            width: 100px;
            height: auto;
        }}
        .header h1 {{
            margin: 0;
            text-align: center;
        }}
        .header p {{
            margin: 0;
            text-align: center;
        }}
        .footer {{
            position: absolute;
            bottom: 0;
            width: 100%;
            text-align: center;
            padding: 10px 0;
        }}
        .company-info, .invoice-info, .client-info, .invoice-details {{
            margin-bottom: 20px;
        }}

        .company-info p, .client-info p {{
            margin: 5px 0;
            line-height: 110%;
        }}
        .invoice-details table {{
            width: 95%;
            font-size: 8pt;
            border-collapse: collapse;
        }}
        .invoice-details th, .invoice-details td {{
            padding: 7px;
        }}
        .invoice-details th {{
            background: #f4f4f4;
        }}
        .row {{
            display: flex;
            flex-wrap: wrap;
            margin: 0 -15px;
        }}
        .col-6 {{
            flex: 0 0 50%;
            max-width: 50%;
            padding: 0 15px;
        }}
        .col-12 {{
            flex: 0 0 100%;
            max-width: 100%;
            padding: 0 15px;
        }}

         .total-table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
        }}
        .total-table th, .total-table td {{
            padding: 7px;
        }}
        .total-table th {{
            text-align: right;
            width: 50%; /* Ajustar el ancho de la celda del encabezado */
            font-weight: normal;
        }}
        .total-table td {{
            text-align: left;
            width: 70%; /* Ajustar el ancho de la celda de datos */
        }}
    </style>
</head>
    <body>
        <div class="container">
            <div class="row header">
                <div class="col-6">
                    <img src="{data_uri}" alt="Company Logo" class="logo">
                </div>
                <div class="col-6">
                    <h1>Factura</h1>
                    <p><strong>FAC-{formatted_invoice_id}</strong></p>
                </div>
            </div>
            <div class="company-info">
                <h3>Acanata S.L.</h3>
                <p>Rivas Vaciamadrid</p>
                <p>28523, España</p>
                <p>CIF: B56285562</p>
                <p>tlf: 608236720</p>
                <p>email: a.martinez@acanata.es</p>
            </div>
            <div class="row">
                <div class="col-6">
                    <div class="client-info">
                        <h3>Cliente: {customer[1]}</h3>
                        <p>{customer[2]}</p>
                        <p>{customer[3]}</p>
                        <p>{customer[4]}, {customer[5]}</p>
                        <p>CIF: {customer[6]}</p>
                        <p>tlf: {customer[7]}</p>
                        <p>email: {customer[8]}</p>
                    </div>
                </div>
                <div class="col-6">
                    <!-- Additional information here -->
                    <table class="total-table">
                        <tr>
                            <td>Fecha de la factura:</td>
                            <td>{factura_date}</td>
                        </tr>
                        <!-- Add more rows as needed -->
                    </table>
                </div>
            </div>
            <div class="invoice-details">
                <table class="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Descripción</th>
                            <th>Nº de trabajadores</th>
                            <th>Precio (€)</th>
                            <th>Total (€)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servicios_html}                    
                    </tbody>
                </table>
            </div>
            <div class="row">
                <div class="col-6">
                    <!-- Empty or additional information -->
                </div>
                <div class="col-6">
                    <table class="total-table">
                        <tr>
                            <td>Subtotal:</td>
                            <td>{total_amount} €</td>
                        </tr>
                        <tr>
                            <td>IVA (21%):</td>
                            <td>{total_amount * 0.21} €</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold;">Total:</td>
                            <td>{total_amount * 1.21} €</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
        <p style="font-size: 8pt;">Pago por transferencia bancaria: ES41 0128 0027 8601 0012 2084</p>
    <div class="footer">
        <p>&copy; 2024 Acanata S.L.</p>
    </div>
    </body>
    </html>
    """

    # Convert HTML to PDF and save it to the specified path
    invoicePDF = "invoice_"+str(invoice_id)+".pdf"
    HTML(string=html_content).write_pdf(invoicePDF)
    logger.info(f"PDF generado y guardado en: {invoicePDF}")

    return {"status": "success", "file_path": invoicePDF}

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

@app.get('/get_invoice/{invoice_id}', response_model=Invoice)
def get_invoice(invoice_id: int):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
    SELECT invoices.id, invoices.customer_id, invoices.amount, invoices.date
    FROM invoices
    WHERE invoices.id = ?
    """, (invoice_id,))
    invoice = c.fetchone()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    c.execute("""
    SELECT id, invoice_id, description, workers, price, total
    FROM invoice_services
    WHERE invoice_id = ?
    """, (invoice_id,))
    services = c.fetchall()
    conn.close()

    service_list = [Service(id=s[0], invoice_id=s[1], description=s[2], workers=s[3], price=s[4], total=s[5]) for s in services]

    return Invoice(
        id=invoice[0],
        customer_id=invoice[1],
        services=service_list,
        amount=invoice[2],
    )


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
    return [{"id": f"FAC-{str(invoice[0]).zfill(10)}", 
             "customer": invoice[1], 
             "value": invoice[2], 
             "date": invoice[3]} 
            for invoice in invoices]

@app.put('/update_customer')
def update_customer(customer: Customer):
    logger.info(f"Updating customer data: {customer}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
        UPDATE customers 
        SET name = ?, address = ?, city = ?, postal_code = ?, country = ?, cif = ?, phone = ?, email = ? 
        WHERE id = ?
    """, (customer.name, customer.address, customer.city, customer.postal_code, customer.country, customer.cif, customer.phone, customer.email, customer.id))
    conn.commit()
    conn.close()
    return {"status": "success", "customer_id": customer.id}

@app.get('/get_customer/{customer_id}', response_model=Customer)
def get_customer(customer_id: int):
    conn = sqlite3.connect(db_path)
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

def get_customer_by_id(customer_id):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
    customer = c.fetchone()
    conn.close()
    return customer

@app.delete('/delete_customer/{customer_id}')
def delete_customer(customer_id: int):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("DELETE FROM customers WHERE id = ?", (customer_id,))
    c.execute("DELETE FROM invoices WHERE customer_id = ?", (customer_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

if __name__ == '__main__':
    init_db()
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
