# routes/invoices.py
from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import List
from models import Invoice, Service, RegenerateInvoiceRequest
from database import get_db_connection
from utils import generate_pdf, get_customer_by_id, end_of_month
import logging

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

@router.post('/generate_invoice')
def generate_invoice(invoice: Invoice):
    logger.info(f"Received invoice data: {invoice}")
    date = invoice.date if invoice.date else datetime.now()
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("""
        INSERT INTO invoices (customer_id, amount, vat, paid, date)
        VALUES (?, ?, ?, ?, ?)
    """, (
        invoice.customer_id,
        sum(service.total for service in invoice.services),
        invoice.vat,
        invoice.paid,
        date.strftime("%Y-%m-%d")
    ))
    invoice_id = c.lastrowid

    for service in invoice.services:
        c.execute("""
            INSERT INTO invoice_services (invoice_id, description, quantity, price, total, vat)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            invoice_id,
            service.description,
            service.quantity,
            service.price,
            service.total,
            service.vat if service.vat is not None else invoice.vat
        ))

    conn.commit()
    conn.close()

    return {"status": "success", "invoice_id": invoice_id}

@router.put('/update_invoice/{invoice_id}')
def update_invoice(invoice_id: int, invoice: Invoice):
    logger.info(f"Updating invoice data: {invoice}")
    conn = get_db_connection()
    c = conn.cursor()

    date_str = invoice.date.strftime("%Y-%m-%d") if invoice.date else datetime.now().strftime("%Y-%m-%d")

    c.execute("""
        UPDATE invoices 
        SET customer_id = ?, amount = ?, vat = ?, paid = ?, date = ? 
        WHERE id = ?
    """, (
        invoice.customer_id,
        invoice.amount,
        invoice.vat,
        invoice.paid,
        date_str,
        invoice_id
    ))

    c.execute("DELETE FROM invoice_services WHERE invoice_id = ?", (invoice_id,))

    for service in invoice.services:
        c.execute("""
            INSERT INTO invoice_services (invoice_id, description, quantity, price, total, vat) 
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            invoice_id,
            service.description,
            service.quantity,
            service.price,
            service.total,
            service.vat
        ))

    conn.commit()
    conn.close()
    return {"status": "success", "invoice_id": invoice_id}

@router.get('/get_invoice/{invoice_id}', response_model=Invoice)
def get_invoice(invoice_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT id, customer_id, amount, date, paid, vat
        FROM invoices
        WHERE id = ?
    """, (invoice_id,))
    invoice = c.fetchone()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    c.execute("""
        SELECT id, invoice_id, description, quantity, price, total, vat
        FROM invoice_services
        WHERE invoice_id = ?
    """, (invoice_id,))
    services = c.fetchall()
    conn.close()

    service_list = [
        Service(
            id=s[0],
            invoice_id=s[1],
            description=s[2],
            quantity=s[3],
            price=s[4],
            total=s[5],
            vat=s[6]
        )
        for s in services
    ]

    invoice_date = datetime.strptime(invoice[3], "%Y-%m-%d")

    return Invoice(
        id=invoice[0],
        customer_id=invoice[1],
        services=service_list,
        amount=invoice[2],
        paid=invoice[4],
        date=invoice_date,
        vat=invoice[5]
    )

@router.get('/get_invoices')
def get_invoices():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT invoices.id, customers.name, invoices.amount, invoices.date, invoices.paid
        FROM invoices 
        JOIN customers ON invoices.customer_id = customers.id
    """)
    invoices = c.fetchall()
    conn.close()
    if not invoices:
        return []
    return [
        {
            "id": f"FAC-{str(invoice[0]).zfill(10)}",
            "customer": invoice[1],
            "value": invoice[2],
            "date": invoice[3],
            "paid": invoice[4]
        }
        for invoice in invoices
    ]

@router.put('/update_invoice_payment/{invoice_id}')
def update_invoice_payment(invoice_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT paid FROM invoices WHERE id = ?", (invoice_id,))
    current_status = c.fetchone()

    if current_status is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Invoice not found")

    new_status = not current_status[0]
    c.execute("UPDATE invoices SET paid = ? WHERE id = ?", (new_status, invoice_id))
    conn.commit()
    conn.close()

    return {"status": "success", "invoice_id": invoice_id, "new_paid_status": new_status}

@router.post('/regenerate_invoice/{invoice_id}')
def regenerate_invoice(invoice_id: int, request: RegenerateInvoiceRequest):
    save_path = request.save_path
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    invoice = c.fetchone()

    if not invoice:
        conn.close()
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice_vat = invoice[3]

    customer = get_customer_by_id(invoice[1])

    c.execute("SELECT * FROM invoice_services WHERE invoice_id = ?", (invoice_id,))
    services_data = c.fetchall()
    conn.close()

    service_list = [
        Service(
            id=service[0],
            invoice_id=service[1],
            description=service[2],
            quantity=service[3],
            price=service[4],
            total=service[5],
            vat=service[6]
        )
        for service in services_data
    ]

    date_invoice = datetime.strptime(invoice[5], '%Y-%m-%d').date()

    save_path = generate_pdf(invoice_id, date_invoice, customer, service_list, save_path, invoice_vat)

    return {"status": "success", "file_path": save_path}

@router.delete('/delete_invoice/{invoice_id}')
def delete_invoice(invoice_id: int):
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    invoice = c.fetchone()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    c.execute("DELETE FROM invoice_services WHERE invoice_id = ?", (invoice_id,))
    c.execute("DELETE FROM invoices WHERE id = ?", (invoice_id,))

    conn.commit()
    conn.close()

    return {"status": "success"}
