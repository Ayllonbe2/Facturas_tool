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

def alter_table():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Verificar si la columna 'paid' ya existe
    c.execute("PRAGMA table_info(invoices);")
    columns = [column[1] for column in c.fetchall()]

    if 'paid' not in columns:
        # Añadir la nueva columna 'paid' de tipo booleano (INTEGER en SQLite) con default False
        c.execute("ALTER TABLE invoices ADD COLUMN paid INTEGER DEFAULT 0;")
        conn.commit()
        print("Columna 'paid' añadida exitosamente a la tabla 'invoices'.")
    else:
        print("La columna 'paid' ya existe en la tabla 'invoices'.")

    conn.close()

if __name__ == '__main__':
    #clear_database()
    alter_table()
    print("La base de datos ha sido limpiada.")
