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
  
  console.log('Sending customer data:', customerData);
  
  ipcRenderer.send('add-customer', customerData);
});

// Manejar el formulario para generar facturas
document.getElementById('invoice-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const customer_id = parseInt(document.getElementById('customer-select').value, 10);
  const amount = parseFloat(document.getElementById('amount').value);
  
  console.log('Sending invoice data:', { customer_id, amount });

  ipcRenderer.send('generate-invoice', { customer_id, amount });
});

// Recibir la lista de clientes y actualizar el select
ipcRenderer.on('customers', (event, customers) => {
  const customerSelect = document.getElementById('customer-select');
  customerSelect.innerHTML = '';
  customers.forEach(customer => {
    console.log(customer)
    const option = document.createElement('option');
    option.value = customer.id;
    option.textContent = customer.name;
    customerSelect.appendChild(option);
  });
  console.log('Loaded customers:', customers);
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

// Lógica para cargar clientes en el select (ejemplo)
function loadCustomers() {
    ipcRenderer.send('load-customers');
}

// Lógica para ver todos los clientes (ejemplo)
function viewAllCustomers() {
    ipcRenderer.send('load-all-customers');
    ipcRenderer.on('all-customers', (event, customers) => {
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
                <td><button onclick="editCustomer(${customer.id})">Editar</button></td>
            `;
            clientsTableBody.appendChild(row);
        });
        console.log('Loaded all customers:', customers);
    });
}

// Lógica para ver todas las facturas (ejemplo)
function viewAllInvoices() {
    ipcRenderer.send('load-all-invoices');
    ipcRenderer.on('all-invoices', (event, invoices) => {
        try {
            const invoicesTableBody = document.getElementById('invoices-table').querySelector('tbody');
            invoicesTableBody.innerHTML = ''; // Limpiar las filas actuales

            if (invoices.length === 0) {
                throw new Error("No invoices found");
            }

            invoices.forEach(invoice => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${invoice.customer}</td>
                    <td>${invoice.amount}</td>
                    <td>${invoice.date}</td>
                `;
                invoicesTableBody.appendChild(row);
            });
            console.log('Loaded all invoices:', invoices);
        } catch (error) {
            console.error('Error loading invoices:', error.message);
            const invoicesTableBody = document.getElementById('invoices-table').querySelector('tbody');
            invoicesTableBody.innerHTML = '<tr><td colspan="3">No invoices found</td></tr>';
        }
    });
}

// Función para editar un cliente
function editCustomer(customerId) {
  ipcRenderer.send('get-customer', customerId);
  ipcRenderer.on('customer-data', (event, customer) => {
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
  
  console.log('Sending updated customer data:', updatedCustomer);
  
  ipcRenderer.send('update-customer', updatedCustomer);
  
  ipcRenderer.on('customer-updated', () => {
    showSection('view-clients');
  });
});

// Cargar clientes al iniciar
ipcRenderer.send('load-customers');
