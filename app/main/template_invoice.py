from weasyprint import HTML
import os
import base64
from datetime import datetime
import calendar
import locale




def get_last_day_of_month(year: int, month: int) -> str:
    # Obtener el último día del mes
    last_day = calendar.monthrange(year, month)[1]
    # Crear un objeto datetime con el último día del mes
    last_date = datetime(year, month, last_day)
    # Formatear la fecha a un string
    return last_date.strftime("%d-%m-%Y")

def format_number_custom(number: float, locale_name: str = 'es_ES.UTF-8', decimal_places: int = 2) -> str:
    # Establecer el locale
    locale.setlocale(locale.LC_ALL, locale_name)
    
    # Separar la parte entera y decimal del número
    integer_part, decimal_part = f"{number:.{decimal_places}f}".split(".")
    
    # Formatear la parte entera con separadores de miles
    formatted_integer = locale.format_string("%d", int(integer_part), grouping=True)
    
    # Combinar la parte entera formateada con la parte decimal
    formatted_number = f"{formatted_integer},{decimal_part}"
    
    return formatted_number

# Establecer el locale a 'es_ES'
locale.setlocale(locale.LC_ALL, 'es_ES.UTF-8')
# Path to the logo image
logo_path = os.path.abspath("app/assets/acanata.png")

# Leer la imagen y convertirla a Base64
with open(logo_path, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

# Crear el data URI
data_uri = f"data:image/png;base64,{encoded_string}"

factura_id = "FAC-00001"
cliente_name = "Empresa S.L."
cliente_direccion="Direccion 1 Direccion 2 Direccion Direccion Direccion Direccion"
cliente_ciudad = "Ciudad"
cliente_codigo_postal = 000000
cliente_country = "España"
cliente_cif = "XXXXXXXXXXX"
cliente_tel = "XXXXXXXXX"
cliente_email = "cliente@email.com"

servicios = "<tr>\n<td>1</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>15</td>\n<td>1000</td>\n<td>15000</td>\n</tr>"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"
servicios = servicios +"\n<tr>\n<td>2</td>\n<td>Comercialización de servicios propios del proveedor</td>\n<td>1</td>\n<td>200</td>\n<td>200</td>\n"

servicios_subtotal = 15200.252
servicios_iva=3192
servicios_total = 18392
now = datetime.now()
factura_date = now.strftime("%d-%m-%Y")
vencimiento_date = get_last_day_of_month(now.year, now.month)

# HTML content
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
                <p><strong>{factura_id}</strong></p>
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
                    <h3>Cliente: {cliente_name}</h3>
                    <p> {cliente_direccion} </p>
                    <p> {cliente_ciudad} </p>
                    <p> {cliente_codigo_postal}, {cliente_country}</p>
                    <p>CIF: {cliente_cif}</p>
                    <p>tlf: {cliente_tel}</p>
                    <p>email: {cliente_email} </p>
                </div>
            </div>
            <div class="col-6">
                   <table class="total-table">
        <tr>
            <td>Fecha de la factura:</td>
            <td> {factura_date}</td>
        </tr>
        <tr>
            <td>Terminos:</td>
            <td>Vencimiento a final de mes</td>
        </tr>
        <tr>
            <td>Fecha de vencimiento:</td>
            <td>{vencimiento_date}</td>
        </tr>
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
                    {servicios}                    
                </tbody>
            </table>
        </div>
        <div class="row">
        <div class="col-6">
        </div>
        <div class="col-6">
       <table class="total-table">
        <tr>
            <td>subotal:</td>
            <td>{format_number_custom(servicios_subtotal)} €</td>
        </tr>
        <tr>
            <td>IVA (21%):</td>
            <td>{format_number_custom(servicios_iva)} €</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">Total:</td>
            <td>{format_number_custom(servicios_total)} €</td>
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

# Convert HTML to PDF
HTML(string=html_content).write_pdf("invoice.pdf")
