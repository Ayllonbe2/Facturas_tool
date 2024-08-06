const { ipcRenderer } = require('electron');

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
    option.value = customer.id
    option.textContent = customer.name;
    customerSelect.appendChild(option);
  });
  console.log('Loaded customers:', customers);
});

// Cargar clientes al iniciar
ipcRenderer.send('load-customers');
