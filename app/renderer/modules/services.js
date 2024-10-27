// services.js

import { updateTotalAmount } from './utils.js';

// Función para agregar una nueva fila de servicio
function addServiceRow() {
    const servicesContainer = document.getElementById('services-container');
  
    const serviceRow = document.createElement('div');
    serviceRow.className = 'service-row';
  
    serviceRow.innerHTML = `
        <input type="text" class="service-description" placeholder="Descripción del servicio" required>
        <input type="number" class="service-quantity" value=1 placeholder="Cantidad" required disabled>
        <input type="number" class="service-price" placeholder="Precio (€)" step="0.01" required>
        <input type="number" class="service-vat" placeholder="IVA (%) - Default IVA Factura" step="0.1" min="0">
        <button type="button" class="remove-service-btn">Eliminar</button>
    `;
  
    servicesContainer.appendChild(serviceRow);
}

// Función para agregar una nueva fila de servicio en la edición
function addEditServiceRow() {
    const servicesContainer = document.getElementById('edit-services-container');

    const serviceRow = document.createElement('div');
    serviceRow.className = 'edit-service-row';

    serviceRow.innerHTML = `
        <input type="text" class="service-description" placeholder="Descripción del servicio" required>
        <input type="number" class="service-quantity" value=1 placeholder="Cantidad" required disabled>
        <input type="number" class="service-price" placeholder="Precio (€)" step="0.01" required>
        <input type="number" class="service-vat" placeholder="IVA (%)" step="0.1" min="0">
        <button type="button" class="edit-remove-service-btn">Eliminar</button>
    `;

    servicesContainer.appendChild(serviceRow);
}

export {
    addServiceRow,
    addEditServiceRow
};
