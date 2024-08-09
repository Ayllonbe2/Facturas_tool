import sqlite3
import os

# Define la ruta a la base de datos
db_path = os.path.join(os.path.dirname(__file__), 'invoices.db')

def clear_database():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Borrar todos los registros de la tabla de servicios de facturas
    c.execute("DELETE FROM invoice_services")
    
    # Borrar todos los registros de la tabla de facturas
    c.execute("DELETE FROM invoices")
    
    # Confirmar los cambios
    conn.commit()
    conn.close()

if __name__ == '__main__':
    clear_database()
    print("La base de datos ha sido limpiada.")
