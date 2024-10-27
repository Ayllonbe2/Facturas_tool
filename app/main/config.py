# config.py
import os
import sys
import logging

# Configurar logging
logging.basicConfig(
    filename='app.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Definir el logger
logger = logging.getLogger(__name__)

# Ruta de la base de datos y del logo
if hasattr(sys, '_MEIPASS'):
    # Estamos en un entorno empaquetado
    init_path = sys._MEIPASS
    db_path = os.path.abspath(os.path.join(sys.executable, '..', '..', 'app', 'main', 'invoices.db'))
    logo_path = os.path.abspath(os.path.join(sys.executable, '..', '..', 'app', 'assets', 'acanata.png'))
else:
    init_path = os.path.dirname(__file__)
    db_path = os.path.join(init_path, 'invoices.db')
    logo_path = os.path.join(init_path, '..', 'assets', 'acanata.png')

logo_path = os.path.normpath(logo_path)

# Crear directorio si no existe
os.makedirs(os.path.dirname(db_path), exist_ok=True)
