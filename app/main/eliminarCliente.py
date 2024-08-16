import sqlite3

# Ruta de la base de datos (asegúrate de que esta ruta es correcta)
db_path = 'app/main/invoices.db'  # Reemplaza esto con la ruta a tu base de datos

def eliminar_cliente(cliente_id):
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()

        # Eliminar el cliente con el ID especificado
        c.execute("DELETE FROM customers WHERE id = ?", (cliente_id,))

        # Eliminar también todas las facturas asociadas a ese cliente
        c.execute("DELETE FROM invoices WHERE customer_id = ?", (cliente_id,))

        conn.commit()

        if c.rowcount > 0:
            print(f"Cliente con ID {cliente_id} eliminado exitosamente.")
        else:
            print(f"No se encontró ningún cliente con ID {cliente_id}.")

    except sqlite3.Error as e:
        print(f"Error al eliminar el cliente: {e}")
    finally:
        conn.close()

# Eliminar el cliente con ID 4
eliminar_cliente(5)
