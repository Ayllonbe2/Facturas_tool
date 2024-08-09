const { ipcRenderer } = require('electron');

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
  
    ipcRenderer.send('add-customer', customerData);
});

// Manejar la selección del cliente y cargar su información
document.getElementById('customer-select').addEventListener('change', (event) => {
    const customerId = parseInt(event.target.value, 10);
    ipcRenderer.send('get-customer', customerId);
});

// Manejar los datos del cliente recibidos y mostrar en el formulario
ipcRenderer.on('customer-data', (event, customer) => {
    console.log("Recibido cliente:", customer);
});

// Manejar el formulario para generar facturas
document.getElementById('invoice-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const customer_id = parseInt(document.getElementById('customer-select').value, 10);

  // Recoger los servicios añadidos
  const services = [];
  document.querySelectorAll('.service-row').forEach(row => {
    const description = row.querySelector('.service-description').value;
    const workers = parseInt(row.querySelector('.service-workers').value, 10);
    const price = parseFloat(row.querySelector('.service-price').value);
    const total = workers * price;

    services.push({ description, workers, price, total });
  });

  // Enviar la factura con los servicios al backend
  ipcRenderer.send('generate-invoice', { customer_id, services });
});

// Recibir la lista de clientes y actualizar el select
ipcRenderer.on('customers', (event, customers) => {
  const customerSelect = document.getElementById('customer-select');

  // Añadir la opción predeterminada "Elige el cliente"
  customerSelect.innerHTML = '<option value="">Elige el cliente</option>';
  
  customers.forEach(customer => {
    console.log(customer);
    const option = document.createElement('option');
    option.value = customer.id;
    option.textContent = customer.name;
    customerSelect.appendChild(option);
  });

  console.log('Loaded customers:', customers);
});

// Agregar nueva fila de servicio
document.getElementById('add-service-btn').addEventListener('click', () => {
    const servicesContainer = document.getElementById('services-container');
  
    const serviceRow = document.createElement('div');
    serviceRow.className = 'service-row';
  
    serviceRow.innerHTML = `
        <input type="text" class="service-description" placeholder="Descripción del servicio" required>
        <input type="number" class="service-workers" placeholder="Nº de trabajadores" required>
        <input type="number" class="service-price" placeholder="Precio por trabajador (€)" required>
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
      <input type="number" class="service-workers" placeholder="Nº de trabajadores" required>
      <input type="number" class="service-price" placeholder="Precio por trabajador (€)" required>
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
    ipcRenderer.once('customer-data', (event, customer) => {
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
    ipcRenderer.once('all-customers', (event, customers) => {
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

// Función para editar una factura
function editInvoice(invoiceId) {
    ipcRenderer.send('get-invoice', invoiceId);
    ipcRenderer.once('invoice-data', (event, invoice) => {
        document.getElementById('edit-invoice-id').value = invoice.id;
        document.getElementById('edit-invoice-customer-id').value = invoice.customer_id;

        ipcRenderer.send('get-customer', invoice.customer_id);

        ipcRenderer.once('customer-data', (event, customer) => {
            document.getElementById('edit-invoice-customer').value = customer.name;
        });

        const servicesContainer = document.getElementById('edit-services-container');
        servicesContainer.innerHTML = ''; // Limpiar los servicios actuales

        let totalAmount = 0; // Inicializar el monto total

        invoice.services.forEach(service => {
            totalAmount += service.total; // Sumar al total el valor del servicio

            const serviceRow = document.createElement('div');
            serviceRow.className = 'edit-service-row';

            serviceRow.innerHTML = `
                <input type="text" class="service-description" value="${service.description}" required>
                <input type="number" class="service-workers" value="${service.workers}" required>
                <input type="number" class="service-price" value="${service.price}" required>
                <input type="number" class="service-total" value="${service.total}" readonly>
                <button type="button" class="edit-remove-service-btn">Eliminar</button>
            `;

            servicesContainer.appendChild(serviceRow);
        });

        document.getElementById('edit-invoice-amount').value = totalAmount.toFixed(2); // Mostrar el monto total

        showSection('edit-invoice'); // Asegúrate de que tienes esta sección en tu HTML
    });
}

// Lógica para ver todas las facturas
function viewAllInvoices() {
    ipcRenderer.send('load-all-invoices');
    ipcRenderer.once('all-invoices', (event, invoices) => {
        try {
            const invoicesTableBody = document.getElementById('invoices-table').querySelector('tbody');
            invoicesTableBody.innerHTML = ''; // Limpiar las filas actuales

            if (invoices.length === 0) {
                throw new Error("No invoices found");
            }

            invoices.forEach(invoice => {
                // Eliminar "FAC-" para obtener un ID numérico
                const idNumerico = parseInt(invoice.id.replace("FAC-", ""), 10);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${invoice.id}</td>
                    <td>${invoice.customer}</td>
                    <td>${invoice.value}</td>
                    <td>${invoice.date}</td>
                    <td>
                        <button id="editInvoice" onclick="editInvoice(${idNumerico})">Editar</button>
                        <button onclick="regenerateInvoice(${idNumerico})">Regenerar</button>
                    </td>
                `;
                invoicesTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading invoices:', error.message);
            const invoicesTableBody = document.getElementById('invoices-table').querySelector('tbody');
            invoicesTableBody.innerHTML = '<tr><td colspan="5">No invoices found</td></tr>';
        }
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

// Manejar la actualización de la factura
document.getElementById('edit-invoice-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const id = parseInt(document.getElementById('edit-invoice-id').value.replace('FAC-', ''), 10);
  const customer_id = parseInt(document.getElementById('edit-invoice-customer-id').value, 10);

  const services = [];
  let amount = 0;
  document.querySelectorAll('.edit-service-row').forEach(row => {
      const description = row.querySelector('.service-description').value;
      const workers = parseInt(row.querySelector('.service-workers').value, 10);
      const price = parseFloat(row.querySelector('.service-price').value);
      const total = workers * price;
      amount = amount + total;
      services.push({ description, workers, price, total });
  });
  console.log(services)
  const updatedInvoice = { id, customer_id, amount, services };

  ipcRenderer.send('update-invoice', updatedInvoice);

  ipcRenderer.on('invoice-updated', () => {
      showSection('view-invoices'); // Navegar de vuelta a la vista de facturas
  });
});

// Manejar la respuesta después de actualizar la factura
ipcRenderer.on('invoice-updated', () => {
    alert('Factura actualizada con éxito');
    viewAllInvoices(); // Recargar la vista de facturas después de la actualización
    showSection('view-invoices'); // Volver a la sección de vista de facturas
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
  
    ipcRenderer.on('customer-updated', () => {
        showSection('view-clients');
    });
});

// Cargar clientes al iniciar
ipcRenderer.send('load-customers');
