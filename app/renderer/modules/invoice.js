// invoice.js

import { ipcRenderer } from './ipcRenderer.js';
import { showNotification, showConfirmDialog, showSection } from './ui.js';
import { loadCustomers } from './customer.js';

// Función para manejar el formulario de factura
function handleInvoiceFormSubmit(event) {
    event.preventDefault();
  
    const customer_id = parseInt(document.getElementById('customer-select').value, 10);
    let date = document.getElementById('invoice-date').value;
    date = new Date(date);
    const vat = parseFloat(document.getElementById('invoice-vat').value);
    const services = [];
    let amount = 0;
    document.querySelectorAll('.service-row').forEach(row => {
        const description = row.querySelector('.service-description').value;
        const quantity = parseInt(row.querySelector('.service-quantity').value, 10);
        const price = parseFloat(row.querySelector('.service-price').value);
        const total = quantity * price;
        const vatInput = row.querySelector('.service-vat').value;
        const serviceVat =  vatInput !== '' ? parseFloat(vatInput) : null;
        amount += total;
        services.push({ description, quantity, price, total, vat: serviceVat });
    });
    ipcRenderer.send('generate-invoice', { customer_id, services, date, vat });
    document.getElementById('invoice-form').reset();
}

// Función para ver todas las facturas
function viewAllInvoices() {
    ipcRenderer.send('load-all-invoices');
    ipcRenderer.once('all-invoices', (invoices) => {
        try {
            const invoicesTableBody = document.getElementById('invoices-table').querySelector('tbody');
            invoicesTableBody.innerHTML = '';

            if (invoices.length === 0) {
                throw new Error("No invoices found");
            }

            $('#invoices-table').bootstrapTable('load', invoices.map(invoice => ({
                pagado: `<input type="checkbox" id="invoice-checkbox-${parseInt(invoice.id.replace("FAC-", ""))}" onclick="toggleInvoicePaid(${invoice.id.replace("FAC-", "")})" ${invoice.paid ? 'checked disabled' : ''}>`,
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

// Función para regenerar una factura
function regenerateInvoice(invoiceId) {
    if (confirm(`¿Estás seguro de que deseas regenerar la factura con ID: ${invoiceId}?`)) {
        ipcRenderer.send('regenerate-invoice', invoiceId);
    }
}

// Función para editar una factura
function editInvoice(invoiceId) {
    ipcRenderer.send('get-invoice', invoiceId);

    ipcRenderer.once('invoice-data', (invoice) => {
        document.getElementById('edit-invoice-id').value = invoice.id;
        document.getElementById('edit-invoice-customer-id').value = invoice.customer_id;

        ipcRenderer.send('get-customer', invoice.customer_id);

        ipcRenderer.once('customer-data', (customer) => {
            document.getElementById('edit-invoice-customer').value = customer.name;
        });

        if (invoice.date) {
            const date = new Date(invoice.date);
            const formattedDate = [
                date.getFullYear(),
                ('0' + (date.getMonth() + 1)).slice(-2),
                ('0' + date.getDate()).slice(-2)
            ].join('-');
            document.getElementById('edit-invoice-date').value = formattedDate;
        }
        document.getElementById('edit-invoice-vat').value = (invoice.vat !== null && invoice.vat !== undefined) ? invoice.vat : '';

        const servicesContainer = document.getElementById('edit-services-container');
        servicesContainer.innerHTML = '';
        let totalAmount = 0;

        invoice.services.forEach(service => {
            totalAmount += service.total;

            const serviceRow = document.createElement('div');
            serviceRow.className = 'edit-service-row';

            serviceRow.innerHTML = `
                <input type="text" class="service-description" value="${service.description}" required>
                <input type="number" class="service-quantity" value="${service.quantity}" required disabled>
                <input type="number" class="service-price" value="${service.price}" step="0.01" required>
                <input type="number" class="service-vat" value="${service.vat}" placeholder="IVA (%)" step="0.1">
                <input type="number" class="service-total" value="${service.total}" readonly>
                <button type="button" class="edit-remove-service-btn">Eliminar</button>
            `;

            servicesContainer.appendChild(serviceRow);
        });

        document.getElementById('edit-invoice-amount').value = totalAmount.toFixed(2);

        ipcRenderer.send('get-last-invoice-id');
        
        ipcRenderer.once('last-invoice-id', (lastInvoiceId) => {
            const deleteButton = document.getElementById('delete-invoice-btn');
            if (parseInt(invoice.id) === parseInt(lastInvoiceId.last_invoice_id)) {
                deleteButton.style.display = 'block';
                deleteButton.onclick = () => {
                    showConfirmDialog(
                        `¿Estás seguro de que deseas eliminar la factura con ID: ${invoice.id}?`,
                        () => {
                            ipcRenderer.send('delete-invoice', invoice.id);
                        },
                        () => {
                            console.log('Eliminación cancelada');
                        }
                    );
                };
            } else {
                deleteButton.style.display = 'none';
            }
        });

        showSection('edit-invoice');
    });
}

// Función para manejar el formulario de edición de factura
function handleInvoiceEditFormSubmit(event) {
    event.preventDefault();
  
    const id = parseInt(document.getElementById('edit-invoice-id').value.replace('FAC-', ''), 10);
    const customer_id = parseInt(document.getElementById('edit-invoice-customer-id').value, 10);
    const date = new Date(document.getElementById('edit-invoice-date').value);
    const vat = parseFloat(document.getElementById('edit-invoice-vat').value) || null;
  
    const services = [];
    let amount = 0;
    document.querySelectorAll('.edit-service-row').forEach(row => {
        const description = row.querySelector('.service-description').value;
        const quantity = parseInt(row.querySelector('.service-quantity').value, 10);
        const price = parseFloat(row.querySelector('.service-price').value);
        const vatInput = row.querySelector('.service-vat').value;
        const serviceVat =  vatInput !== '' ? parseFloat(vatInput) : null;
        const total = quantity * price;
        amount += total;
        services.push({ description, quantity, price, total, vat: serviceVat });
    });
  
    const updatedInvoice = { id, customer_id, date, amount, vat, services };
  
    ipcRenderer.send('update-invoice', updatedInvoice);
  
    ipcRenderer.once('invoice-updated', () => {
        showSection('view-invoices');
    });
}

// Función para cambiar el estado de pago de la factura
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
            const checkbox = document.querySelector(`#invoice-checkbox-${invoiceId}`);
            if (checkbox) {
                checkbox.checked = data.new_paid_status;
            } else {
                console.error('Checkbox no encontrado en el DOM');
            }
        } else {
            console.error('Error en la respuesta del servidor:', data);
        }
    })
    .catch(error => console.error('Error updating invoice payment:', error));
}

export {
    handleInvoiceFormSubmit,
    viewAllInvoices,
    regenerateInvoice,
    editInvoice,
    handleInvoiceEditFormSubmit,
    toggleInvoicePaid
};
