// Acceder a ipcRenderer desde el contexto seguro
const { ipcRenderer } = window.electron;

// Mostrar la sección de Inicio al cargar
document.addEventListener('DOMContentLoaded', function() {
    showSection('home');
});

// Manejar el formulario para agregar clientes
document.getElementById('customer-form').addEventListener('submit', (event) => {
    event.preventDefault();
  
    const name = document.getElementById('customer-name').value;
    const address = document.getElementById('customer-address').value;
    const city = document.getElementById('customer-city').value;
    const postal_code = document.getElementById('customer-postal-code').value;
    const country = document.getElementById('customer-country').value;
    const cif = document.getElementById('customer-cif').value;
    const phone = document.getElementById('customer-phone').value;
    const email = document.getElementById('customer-email').value;

    const customerData = { name, address, city, postal_code, country, cif, phone, email };
    if (!/^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/.test(cif)) {
        alert("Por favor, ingresa un CIF válido.");
        return; // No continuar con la ejecución si el CIF no es válido
    }
  
    ipcRenderer.send('add-customer', customerData);
});

// Manejar la selección del cliente y cargar su información
document.getElementById('customer-select').addEventListener('change', (event) => {
    const customerId = parseInt(event.target.value, 10);
    ipcRenderer.send('get-customer', customerId);
});

// Manejar los datos del cliente recibidos y mostrar en el formulario
ipcRenderer.receive('customer-data', (customer) => {
    console.log("Recibido cliente:", customer);
});

document.getElementById('invoice-form').addEventListener('submit', (event) => {
    event.preventDefault();
  
    const customer_id = parseInt(document.getElementById('customer-select').value, 10);
    const date = document.getElementById('invoice-date').value; // Capturar la fecha
  
    // Recoger los servicios añadidos
    const services = [];
    document.querySelectorAll('.service-row').forEach(row => {
        const description = row.querySelector('.service-description').value;
        const quantity = parseInt(row.querySelector('.service-quantity').value, 10);
        const price = parseFloat(row.querySelector('.service-price').value);
        const total = quantity * price;
  
        services.push({ description, quantity, price, total });
    });
  
    // Enviar la factura con los servicios y la fecha al backend
    ipcRenderer.send('generate-invoice', { customer_id, date, services });
});
  

// Recibir la lista de clientes y actualizar el select
ipcRenderer.receive('customers', (customers) => {
    const customerSelect = document.getElementById('customer-select');

    // Añadir la opción predeterminada "Elige el cliente"
    customerSelect.innerHTML = '<option value="">Elige el cliente</option>';
  
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name;
        customerSelect.appendChild(option);
    });
});

// Agregar nueva fila de servicio
document.getElementById('add-service-btn').addEventListener('click', () => {
    const servicesContainer = document.getElementById('services-container');
  
    const serviceRow = document.createElement('div');
    serviceRow.className = 'service-row';
  
    serviceRow.innerHTML = `
        <input type="text" class="service-description" placeholder="Descripción del servicio" required>
        <input type="number" class="service-quantity" value=1 placeholder="Cantidad" required disabled>
        <input type="number" class="service-price" placeholder="Precio (€)" step="0.01" required>
        <button type="button" class="remove-service-btn">Eliminar</button>
    `;
  
    servicesContainer.appendChild(serviceRow);
});

document.getElementById('edit-add-service-btn').addEventListener('click', () => {
    const servicesContainer = document.getElementById('edit-services-container');

    const serviceRow = document.createElement('div');
    serviceRow.className = 'edit-service-row';

    serviceRow.innerHTML = `
        <input type="text" class="service-description" placeholder="Descripción del servicio" required>
        <input type="number" class="service-quantity" value=1 placeholder="Cantidad" required disabled>
        <input type="number" class="service-price" placeholder="Precio (€)" step="0.01" required>
        <button type="button" class="edit-remove-service-btn">Eliminar</button>
    `;

    servicesContainer.appendChild(serviceRow);
});

// Eliminar una fila de servicio
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-service-btn')) {
        event.target.closest('.service-row').remove();
        updateTotalAmount(); // Recalcular el total después de eliminar un servicio
    }
});

// Función para mostrar la sección correspondiente
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    // Cargar contenido específico para cada sección
    if (sectionId === 'create-invoice') {
        loadCustomers();
    } else if (sectionId === 'view-clients') {
        viewAllCustomers();
    } else if (sectionId === 'view-invoices') {
        viewAllInvoices();
    }
}

// Lógica para cargar clientes en el select
function loadCustomers() {
    ipcRenderer.send('load-customers');
}

// Función para editar un cliente
function editCustomer(customerId) {
    ipcRenderer.send('get-customer', customerId);
    ipcRenderer.once('customer-data', (customer) => {
        document.getElementById('edit-customer-id').value = customer.id;
        document.getElementById('edit-customer-name').value = customer.name;
        document.getElementById('edit-customer-address').value = customer.address;
        document.getElementById('edit-customer-city').value = customer.city;
        document.getElementById('edit-customer-postal-code').value = customer.postal_code;
        document.getElementById('edit-customer-country').value = customer.country;
        document.getElementById('edit-customer-cif').value = customer.cif;
        document.getElementById('edit-customer-phone').value = customer.phone;
        document.getElementById('edit-customer-email').value = customer.email;
        showSection('edit-client');
    });
}

// Lógica para ver todos los clientes
function viewAllCustomers() {
    ipcRenderer.send('load-all-customers');
    ipcRenderer.once('all-customers', (customers) => {
        const clientsTableBody = document.getElementById('clients-table').querySelector('tbody');
        clientsTableBody.innerHTML = ''; // Limpiar las filas actuales

        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.address}</td>
                <td>${customer.city}</td>
                <td>${customer.postal_code}</td>
                <td>${customer.country}</td>
                <td>${customer.cif}</td>
                <td>${customer.phone}</td>
                <td>${customer.email}</td>
                <td><button id="editCustomer" onclick="editCustomer(${customer.id})">Editar</button></td>
            `;
            clientsTableBody.appendChild(row);
        });
    });
}

// Función para regenerar una factura
function regenerateInvoice(invoiceId) {
    if (confirm(`¿Estás seguro de que deseas regenerar la factura con ID: ${invoiceId}?`)) {
        ipcRenderer.send('regenerate-invoice', invoiceId);
    }
}

function editInvoice(invoiceId) {
    ipcRenderer.send('get-invoice', invoiceId);

    ipcRenderer.once('invoice-data', (invoice) => {
        document.getElementById('edit-invoice-id').value = invoice.id;
        document.getElementById('edit-invoice-customer-id').value = invoice.customer_id;

        ipcRenderer.send('get-customer', invoice.customer_id);

        ipcRenderer.once('customer-data', (customer) => {
            document.getElementById('edit-invoice-customer').value = customer.name;
        });

        // Asignar la fecha al campo de fecha
        if (invoice.date) {
            const date = new Date(invoice.date);
            const formattedDate = [
                date.getFullYear(),
                ('0' + (date.getMonth() + 1)).slice(-2),
                ('0' + date.getDate()).slice(-2)
            ].join('-');  // Formatear manualmente a YYYY-MM-DD
            document.getElementById('edit-invoice-date').value = formattedDate;
        }

        const servicesContainer = document.getElementById('edit-services-container');
        servicesContainer.innerHTML = ''; // Limpiar los servicios actuales

        let totalAmount = 0; // Inicializar el monto total

        invoice.services.forEach(service => {
            totalAmount += service.total; // Sumar al total el valor del servicio

            const serviceRow = document.createElement('div');
            serviceRow.className = 'edit-service-row';

            serviceRow.innerHTML = `
                <input type="text" class="service-description" value="${service.description}" required>
                <input type="number" class="service-quantity" value="${service.quantity}" required disabled>
                <input type="number" class="service-price" value="${service.price}" step="0.01" required>
                <input type="number" class="service-total" value="${service.total}" readonly>
                <button type="button" class="edit-remove-service-btn">Eliminar</button>
            `;

            servicesContainer.appendChild(serviceRow);
        });

        document.getElementById('edit-invoice-amount').value = totalAmount.toFixed(2); // Mostrar el monto total

        // Verificar si esta factura es la última generada
        ipcRenderer.send('get-last-invoice-id');
        
        ipcRenderer.once('last-invoice-id', (lastInvoiceId) => {
            console.log(`ID de la última factura: ${lastInvoiceId.last_invoice_id}`);  // Debugging
            console.log(`ID de la factura actual: ${invoice.id}`);  // Debugging
            
            const deleteButton = document.getElementById('delete-invoice-btn');
            if (parseInt(invoice.id) === parseInt(lastInvoiceId.last_invoice_id)) {
                deleteButton.style.display = 'block'; // Mostrar el botón de eliminar
                deleteButton.onclick = () => {
                    if (confirm(`¿Estás seguro de que deseas eliminar la factura con ID: ${invoice.id}?`)) {
                        ipcRenderer.send('delete-invoice', invoice.id);
                    }
                };
            } else {
                deleteButton.style.display = 'none'; // Ocultar el botón de eliminar
            }
        });

        showSection('edit-invoice'); // Asegúrate de que tienes esta sección en tu HTML
    });
}

// Recibir el último ID de factura desde el backend
ipcRenderer.receive('last-invoice-id', (id) => {
    return id;
});

// Manejar la eliminación de facturas
ipcRenderer.on('invoice-deleted', () => {
    showSection('view-invoices');
    viewAllInvoices(); // Recargar la lista de facturas después de la eliminación
});

function toggleInvoicePaid(invoiceId) {
    fetch(`http://127.0.0.1:8520/update_invoice_payment/${invoiceId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Encuentra el checkbox correspondiente en el DOM y actualiza su estado
            const checkbox = document.querySelector(`#invoice-checkbox-${invoiceId}`);
            if (checkbox) {
                checkbox.checked = data.new_paid_status; // Actualiza el estado del checkbox
            } else {
                console.error('Checkbox no encontrado en el DOM');
            }
        } else {
            console.error('Error en la respuesta del servidor:', data);
        }
    })
    .catch(error => console.error('Error updating invoice payment:', error));
}

// Lógica para ver todas las facturas
function viewAllInvoices() {
    ipcRenderer.send('load-all-invoices');
    ipcRenderer.once('all-invoices', (invoices) => {
        try {
            const invoicesTableBody = document.getElementById('invoices-table').querySelector('tbody');
            invoicesTableBody.innerHTML = ''; // Limpiar las filas actuales

            if (invoices.length === 0) {
                throw new Error("No invoices found");
            }

            // Cargar los datos a la tabla usando Bootstrap Table
            $('#invoices-table').bootstrapTable('load', invoices.map(invoice => ({
                pagado: `<input type="checkbox" id="invoice-checkbox-${invoice.id.replace("FAC-", "")}" onclick="toggleInvoicePaid(${invoice.id.replace("FAC-", "")}, this.checked)" ${invoice.paid ? 'checked disabled' : ''}>`,
                id: `<span style="opacity:${invoice.paid ? '0.5' : '1'};">${invoice.id}</span>`,
                customer: `<span style="opacity:${invoice.paid ? '0.5' : '1'};">${invoice.customer}</span>`,
                value: `<span style="opacity:${invoice.paid ? '0.5' : '1'};">${invoice.value}</span>`,
                date: `<span style="opacity:${invoice.paid ? '0.5' : '1'};">${invoice.date}</span>`,
                acciones: `
                    <button id="editInvoice" onclick="editInvoice(${invoice.id.replace("FAC-", "")})" ${invoice.paid ? 'disabled' : ''}>Editar</button>
                    <button onclick="regenerateInvoice(${invoice.id.replace("FAC-", "")})">Regenerar</button>
                `
            })));
        } catch (error) {
            console.error('Error loading invoices:', error.message);
            const invoicesTableBody = document.getElementById('invoices-table').querySelector('tbody');
            invoicesTableBody.innerHTML = '<tr><td colspan="5">No invoices found</td></tr>';
        }
    });
}

document.getElementById('filter-paid-status').addEventListener('change', function() {
    const filterValue = this.value;
    filterTableByPaidStatus(filterValue);
});

function filterTableByPaidStatus(filterValue) {
    ipcRenderer.send('load-all-invoices');
    ipcRenderer.once('all-invoices', (invoices) => {
        let filteredInvoices = invoices;
        if (filterValue === 'paid') {
            filteredInvoices = invoices.filter(invoice => invoice.paid === 1);
        } else if (filterValue === 'unpaid') {
            filteredInvoices = invoices.filter(invoice => invoice.paid === 0);
        }

        const formattedInvoices = filteredInvoices.map(invoice => ({
            pagado: `<input type="checkbox" id="invoice-checkbox-${invoice.id.replace("FAC-", "")}" onclick="toggleInvoicePaid(${invoice.id.replace("FAC-", "")}, this.checked)" ${invoice.paid ? 'checked disabled' : ''}>`,
            id: `<span style="opacity:${invoice.paid ? '0.5' : '1'};">${invoice.id}</span>`,
            customer: `<span style="opacity:${invoice.paid ? '0.5' : '1'};">${invoice.customer}</span>`,
            value: `<span style="opacity:${invoice.paid ? '0.5' : '1'};">${invoice.value}</span>`,
            date: `<span style="opacity:${invoice.paid ? '0.5' : '1'};">${invoice.date}</span>`,
            acciones: `
                <button id="editInvoice" onclick="editInvoice(${invoice.id.replace("FAC-", "")})" ${invoice.paid ? 'disabled' : ''}>Editar</button>
                <button onclick="regenerateInvoice(${invoice.id.replace("FAC-", "")})">Regenerar</button>
            `
        }));

        $('#invoices-table').bootstrapTable('load', formattedInvoices);
    });
}

// Manejar la eliminación de una fila de servicio en la edición
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-remove-service-btn')) {
        event.target.closest('.edit-service-row').remove();
        updateTotalAmount(); // Recalcular el total después de eliminar un servicio
    }
});

// Función para recalcular el monto total basado en los servicios en la edición
function updateTotalAmount() {
    let totalAmount = 0;
    document.querySelectorAll('.edit-service-row').forEach(row => {
        const total = parseFloat(row.querySelector('.service-total').value);
        totalAmount += total;
    });
    document.getElementById('edit-invoice-amount').value = totalAmount.toFixed(2);
}

document.getElementById('edit-invoice-form').addEventListener('submit', (event) => {
    event.preventDefault();
  
    const id = parseInt(document.getElementById('edit-invoice-id').value.replace('FAC-', ''), 10);
    const customer_id = parseInt(document.getElementById('edit-invoice-customer-id').value, 10);
    const date = new Date(document.getElementById('edit-invoice-date').value); // Capturar la fecha
  
    const services = [];
    let amount = 0;
    document.querySelectorAll('.edit-service-row').forEach(row => {
        const description = row.querySelector('.service-description').value;
        const quantity = parseInt(row.querySelector('.service-quantity').value, 10);
        const price = parseFloat(row.querySelector('.service-price').value);
        const total = quantity * price;
        amount = amount + total;
        services.push({ description, quantity, price, total });
    });
  
    const updatedInvoice = { id, customer_id, date, amount, services };
  
    ipcRenderer.send('update-invoice', updatedInvoice);
  
    ipcRenderer.once('invoice-updated', () => {
        showSection('view-invoices'); // Navegar de vuelta a la vista de facturas
    });
});

// Manejar el formulario para editar clientes
document.getElementById('edit-customer-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const id = document.getElementById('edit-customer-id').value;
    const name = document.getElementById('edit-customer-name').value;
    const address = document.getElementById('edit-customer-address').value;
    const city = document.getElementById('edit-customer-city').value;
    const postal_code = document.getElementById('edit-customer-postal-code').value;
    const country = document.getElementById('edit-customer-country').value;
    const cif = document.getElementById('edit-customer-cif').value;
    const phone = document.getElementById('edit-customer-phone').value;
    const email = document.getElementById('edit-customer-email').value;

    const updatedCustomer = { id, name, address, city, postal_code, country, cif, phone, email };
  
    ipcRenderer.send('update-customer', updatedCustomer);
  
    ipcRenderer.once('customer-updated', () => {
        showSection('view-clients');
    });
});

// Cargar clientes al iniciar
ipcRenderer.send('load-customers');
