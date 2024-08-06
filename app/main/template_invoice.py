from fpdf import Template
import datetime
import calendar
from dateutil.relativedelta import relativedelta

#this will define the ELEMENTS that will compose the template. 
elements = [
    { 'name': 'company_logo', 'type': 'I', 'x1': 20.0, 'y1': 17.0, 'x2': 60.0, 'y2': 57.0, 'font': None, 'size': 0.0, 'bold': 0, 'italic': 0, 'underline': 0, 'align': 'C', 'text': 'logo', 'priority': 2, 'multiline': False},
    { 'name': 'company_name', 'type': 'T', 'x1': 20.0, 'y1': 60, 'x2': 70, 'y2': 70, 'font': 'Arial', 'size': 10, 'bold': 1, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': False},
    { 'name': 'company_address', 'type': 'T', 'x1': 20.0, 'y1': 70, 'x2': 70, 'y2': 75, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': True},
    { 'name': 'company_CIF', 'type': 'T', 'x1': 20.0, 'y1': 80, 'x2': 70, 'y2': 85, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': False},
    { 'name': 'company_phone', 'type': 'T', 'x1': 20.0, 'y1': 85, 'x2': 70, 'y2': 90, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': False},
    { 'name': 'company_email', 'type': 'T', 'x1': 20.0, 'y1': 90, 'x2': 70, 'y2': 95, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': False},
    { 'name': 'factura', 'type': 'T', 'x1': 100.0, 'y1': 17.0, 'x2': 200.0, 'y2': 27.0, 'font': 'Arial', 'size': 18, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'C', 'text': '', 'priority': 2, 'multiline': False, 'text':'Factura'},
    { 'name': 'factura_id', 'type': 'T', 'x1': 100.0, 'y1': 27.0, 'x2': 200.0, 'y2': 37.0, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'C', 'text': '', 'priority': 2, 'multiline': False},
    { 'name': 'date_today', 'type': 'T', 'x1': 125.0, 'y1': 70, 'x2': 250, 'y2': 75, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': True},
    { 'name': 'terminos', 'type': 'T', 'x1': 125.0, 'y1': 75, 'x2': 250, 'y2': 80, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': True},
    { 'name': 'end_date', 'type': 'T', 'x1': 125.0, 'y1': 80, 'x2': 250, 'y2': 85, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': True},
    { 'name': 'cliente_name', 'type': 'T', 'x1': 20.0, 'y1': 105, 'x2': 70, 'y2': 110, 'font': 'Arial', 'size': 10, 'bold': 1, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': False},
    { 'name': 'cliente_address', 'type': 'T', 'x1': 20.0, 'y1': 110, 'x2': 70, 'y2': 115, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': True},
    { 'name': 'cliente_CIF', 'type': 'T', 'x1': 20.0, 'y1': 125, 'x2': 70, 'y2': 130, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': False},
    { 'name': 'cliente_phone', 'type': 'T', 'x1': 20.0, 'y1': 130, 'x2': 70, 'y2': 135, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': False},
    { 'name': 'cliente_email', 'type': 'T', 'x1': 20.0, 'y1': 135, 'x2': 70, 'y2': 140, 'font': 'Arial', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0,'align': 'L', 'text': '', 'priority': 2, 'multiline': False},
    #{ 'name': 'multline_text', 'type': 'T', 'x1': 20, 'y1': 100, 'x2': 40, 'y2': 105, 'font': 'helvetica', 'size': 10, 'bold': 0, 'italic': 0, 'underline': 0, 'background': 0x88ff00, 'align': 'C', 'text': 'Lorem ipsum dolor sit amet, consectetur adipisici elit', 'priority': 2, 'multiline': True, 'wrapmode': 'WORD'},
    #{ 'name': 'box', 'type': 'B', 'x1': 15.0, 'y1': 15.0, 'x2': 185.0, 'y2': 260.0, 'font': 'helvetica', 'size': 0.0, 'bold': 0, 'italic': 0, 'underline': 0, 'align': 'C', 'text': None, 'priority': 0, 'multiline': False},
    #{ 'name': 'box_x', 'type': 'B', 'x1': 95.0, 'y1': 15.0, 'x2': 105.0, 'y2': 25.0, 'font': 'helvetica', 'size': 0.0, 'bold': 1, 'italic': 0, 'underline': 0, 'align': 'C', 'text': None, 'priority': 2, 'multiline': False},
    #{ 'name': 'line1', 'type': 'L', 'x1': 100.0, 'y1': 25.0, 'x2': 100.0, 'y2': 57.0, 'font': 'helvetica', 'size': 0, 'bold': 0, 'italic': 0, 'underline': 0, 'align': 'C', 'text': None, 'priority': 3, 'multiline': False},
    { 'name': 'barcode', 'type': 'BC', 'x1': 20.0, 'y1': 246.5, 'x2': 140.0, 'y2': 254.0, 'font': 'Interleaved 2of5 NT', 'size': 0.75, 'bold': 0, 'italic': 0, 'underline': 0, 'align': 'C', 'text': '200000000001000159053338016581200810081', 'priority': 3, 'multiline': False},
]

#here we instantiate the template
f = Template(format="A4", elements=elements,
             title="Sample Invoice")
f.add_page()

#we FILL some of the fields of the template with the information we want
#note we access the elements treating the template instance as a "dict"
f["company_name"] = "Acanata S.L."
f["company_address"] = "Rivas Vaciamadrid\n28523, España"
f["company_CIF"] = "CIF: B56285562"
f["company_phone"] = "tlf: 608236720"
f["company_email"] = "email: a.martinez@acanata.es"
f["company_logo"] = "app/assets/acanata.png"

one_year_from_now = datetime.datetime.now() + relativedelta(years=1)
date_formated = one_year_from_now.strftime("%d/%m/%Y")

f["date_today"] = "Fecha de la factura:\t "+str(date_formated)
f["terminos"] = "Terminos:\t Vencimiento a final de mes"

res = calendar.monthrange(one_year_from_now.year, one_year_from_now.month)
day = res[1]

end_date = datetime.datetime(one_year_from_now.year, one_year_from_now.month, day)
end_date_formated = end_date.strftime("%d/%m/%Y")
f["end_date"] = "Fecha de vencimiento:\t "+str(end_date_formated)


f["factura_id"] = "FAC-00001"

f["cliente_name"] = "Cliente: Empresa S.L."
f["cliente_address"] = "Direccion 1\nCiudad\nCódigo postal, España"
f["cliente_CIF"] = "CIF: XXXXXXXXXXX"
f["cliente_phone"] = "tlf: XXXXXXXXX"
f["cliente_email"] = "email: email@correo.es"


#and now we render the page
f.render("./template.pdf")
