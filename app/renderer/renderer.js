// renderer.js

import { ipcRenderer } from './modules/ipcRenderer.js';
import { showSection } from './modules/ui.js';
import { addCustomer, loadCustomers, handleCustomers, editCustomer, viewAllCustomers, handleCustomerFormSubmit } from './modules/customer.js';
import { handleInvoiceFormSubmit, viewAllInvoices, regenerateInvoice, editInvoice, handleInvoiceEditFormSubmit, toggleInvoicePaid } from './modules/invoice.js';
import { addServiceRow, addEditServiceRow } from './modules/services.js';
import { showNotification, showConfirmDialog } from './modules/ui.js';
import { updateTotalAmount } from './modules/utils.js';

// Mostrar la sección de inicio al cargar
document.addEventListener('DOMContentLoaded', function() {
    showSection('home');
});

// Event listeners para formularios y botones
document.getElementById('customer-form').addEventListener('submit', addCustomer);
document.getElementById('customer-select').addEventListener('change', (event) => {
    const customerId = parseInt(event.target.value, 10);
    ipcRenderer.send('get-customer', customerId);
});
ipcRenderer.receive('customer-data', (customer) => {
    console.log("Recibido cliente:", customer);
});
document.getElementById('invoice-form').addEventListener('submit', handleInvoiceFormSubmit);
ipcRenderer.receive('customers', handleCustomers);
document.getElementById('add-service-btn').addEventListener('click', addServiceRow);
document.getElementById('edit-add-service-btn').addEventListener('click', addEditServiceRow);

// Manejo de eventos para eliminar servicios y actualizar montos
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-service-btn')) {
        event.target.closest('.service-row').remove();
        updateTotalAmount();
    }
});
document.addEventListener('input', (event) => {
    if (event.target.classList.contains('service-price') || event.target.classList.contains('service-quantity')) {
        updateTotalAmount();
    }
});
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-remove-service-btn')) {
        event.target.closest('.edit-service-row').remove();
        updateTotalAmount();
    }
});
document.getElementById('edit-invoice-form').addEventListener('submit', handleInvoiceEditFormSubmit);
document.getElementById('edit-customer-form').addEventListener('submit', handleCustomerFormSubmit);

// Cargar clientes al iniciar
ipcRenderer.send('load-customers');

// Exponer funciones globales necesarias
window.showSection = showSection;
window.editCustomer = editCustomer;
window.editInvoice = editInvoice;
window.toggleInvoicePaid = toggleInvoicePaid;
window.regenerateInvoice = regenerateInvoice;
