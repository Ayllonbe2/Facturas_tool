# database.py
import sqlite3
from config import db_path

def get_db_connection():
    conn = sqlite3.connect(db_path)
    return conn

def init_db():
    conn = get_db_connection()
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
                    vat REAL,
                    paid BOOLEAN DEFAULT 0,
                    date TEXT DEFAULT (datetime('now','localtime')),
                    FOREIGN KEY(customer_id) REFERENCES customers(id))''')
    
    # Crear tabla de servicios de factura
    c.execute('''CREATE TABLE IF NOT EXISTS invoice_services (
                    id INTEGER PRIMARY KEY,
                    invoice_id INTEGER,
                    description TEXT,
                    quantity INTEGER,
                    price REAL,
                    total REAL,
                    vat REAL,
                    FOREIGN KEY(invoice_id) REFERENCES invoices(id))''')
    
    conn.commit()
    conn.close()
