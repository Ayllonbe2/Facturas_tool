import sqlite3

def rename_column(db_path):
    # Conectarse a la base de datos SQLite
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Cambiar el nombre de la columna
    cursor.execute("ALTER TABLE invoice_services RENAME COLUMN workers TO quantity;")
    
    # Guardar los cambios y cerrar la conexión
    conn.commit()
    conn.close()

rename_column('app/main/invoices.db')