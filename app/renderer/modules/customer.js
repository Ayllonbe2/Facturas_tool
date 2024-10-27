// customer.js

import { ipcRenderer } from './ipcRenderer.js';
import { showSection, showNotification } from './ui.js';


// Función para agregar un cliente
function addCustomer(event) {
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
        showNotification("Por favor, ingresa un CIF válido.");
        return;
    }
  
    ipcRenderer.send('add-customer', customerData);
    document.getElementById('customer-form').reset();
}

// Función para cargar clientes
function loadCustomers() {
    ipcRenderer.send('load-customers');
}

// Función para manejar la lista de clientes recibida
function handleCustomers(customers) {
    const customerSelect = document.getElementById('customer-select');

    customerSelect.innerHTML = '<option value="">Elige el cliente</option>';
  
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name;
        customerSelect.appendChild(option);
    });
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

// Función para ver todos los clientes
function viewAllCustomers() {
    ipcRenderer.send('load-all-customers');
    ipcRenderer.once('all-customers', (customers) => {
        const clientsTableBody = document.getElementById('clients-table').querySelector('tbody');
        clientsTableBody.innerHTML = '';

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

// Función para manejar la actualización del cliente
function handleCustomerFormSubmit(event) {
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
}

export {
    addCustomer,
    loadCustomers,
    handleCustomers,
    editCustomer,
    viewAllCustomers,
    handleCustomerFormSubmit
};
