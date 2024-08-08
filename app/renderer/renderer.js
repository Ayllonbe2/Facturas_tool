const { ipcRenderer } = require('electron');

// Mostrar la sección de Agregar Cliente al cargar
document.addEventListener('DOMContentLoaded', function() {
    showSection('add-client');
});

// Manejar el formulario para agregar clientes
document.getElementById('customer-form').addEventListener('submit', (event) => {
  event.preventDefault();
  
  const name = document.getElementById('customer-name').value;
  const email = document.getElementById('customer-email').value;
  const phone = document.getElementById('customer-phone').value;

  console.log('Sending customer data:', { name, email, phone });
  
  ipcRenderer.send('add-customer', { name, email, phone });
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
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
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
        const invoicesTableBody = document.getElementById('invoices-table').querySelector('tbody');
        invoicesTableBody.innerHTML = ''; // Limpiar las filas actuales

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
    });
}

// Cargar clientes al iniciar
ipcRenderer.send('load-customers');
