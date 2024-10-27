# utils.py
import calendar
from datetime import datetime
import base64
import os
from weasyprint import HTML
from config import logo_path
import logging

logger = logging.getLogger("uvicorn.error")

def end_of_month(date: datetime) -> str:
    last_day = calendar.monthrange(date.year, date.month)[1]
    return datetime(date.year, date.month, last_day).strftime("%d-%m-%Y")

def get_customer_by_id(customer_id):
    from database import get_db_connection
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
    customer = c.fetchone()
    conn.close()
    return customer

def generate_pdf(invoice_id, date, customer, services, save_path, invoice_vat):
    formatted_invoice_id = str(invoice_id).zfill(10)
    # Normalizar la ruta para asegurarte de que funcione en todos los sistemas operativos
    
    # Insert logo as base64 string in the PDF
    with open(logo_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    
    data_uri = f"data:image/png;base64,{encoded_string}"

    # Create a string with HTML content
    servicios_html = ""
    total_vat_amount = 0
    subtotal = 0
    for i, service in enumerate(services, start=1):
        service_vat_rate = service.vat if service.vat is not None else invoice_vat
        print(service.description,service_vat_rate, service.vat)
        service_vat_amount = service.total * (service_vat_rate / 100)
        total_with_vat = service.total + service_vat_amount
        subtotal += service.total
        total_vat_amount += service_vat_amount
        servicios_html += f"""
        <tr>
            <td>{i}</td>
            <td>{service.description}</td>
            <td>{service.total:.2f} €</td>
            <td>{service_vat_rate}%</td>
            <td>{service_vat_amount:.2f} €</td>
            <td>{total_with_vat:.2f} €</td>
        </tr>
        """
    grand_total = subtotal + total_vat_amount
    # Formatear la fecha actual
    factura_date = date.strftime("%d-%m-%Y")

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
            font-size: 10pt;
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
            font-size: 10pt;
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
            font-size: 10pt;
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
                        <tr> 
                            <td>Término:</td>
                            <td>Vencimiento a final de mes</td>
                        </tr>
                        <tr>
                            <td>Fecha de la factura:</td>
                            <td>{end_of_month(date)}</td>
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
                           <!-- <th>Cantidad</th> -->
                            <th>Precio (€)</th>
                            <th>IVA (%)</th>
                            <th>IVA (€)</th>
                            <th>Total (€)</th>
                          <!--  <th>Total (€)</th> -->
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
                            <td>{subtotal:.2f} €</td>
                        </tr>
                        <tr>
                            <td>IVA Total:</td>
                            <td>{total_vat_amount:.2f} €</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold;">Total:</td>
                            <td>{grand_total:.2f} €</td>
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
     # Convert HTML to PDF and save it to the specified path
    HTML(string=html_content).write_pdf(save_path)
    

    return save_path