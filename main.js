const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const request = require('request');
const express = require('express');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false // Importante para Electron 12+
    }
  });

  mainWindow.loadURL('http://localhost:3000');
}

app.on('ready', () => {
  const python = spawn('python', ['./app/main/main.py']);

  python.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  python.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  python.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  const expressApp = express();
  expressApp.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
  expressApp.use(express.static(path.join(__dirname, 'app/renderer')));

  expressApp.listen(3000, () => {
    console.log('Express server is running on http://localhost:3000');
    createWindow();
  });

  // Esperar un momento antes de enviar las solicitudes para asegurar que el servidor está listo
  setTimeout(() => {
    ipcMain.on('add-customer', (event, arg) => {
      console.log('Sending add-customer request:', arg);
      request.post('http://127.0.0.1:8000/add_customer', {
        json: {
          name: arg.name,
          address: arg.address,
          city: arg.city,
          postal_code: arg.postal_code,
          country: arg.country,
          cif: arg.cif,
          phone: arg.phone,
          email: arg.email
        }
      }, (error, res, body) => {
        if (error) {
          console.error('Error adding customer:', error);
          return;
        }
        console.log(`Add customer statusCode: ${res.statusCode}`);
        console.log('Response:', body);
        
        // After adding a customer, reload the customers
        loadCustomers();
      });
    });

    ipcMain.on('generate-invoice', (event, arg) => {
      console.log('Sending generate-invoice request:', arg);
      request.post('http://127.0.0.1:8000/generate_invoice', {
        json: {
          customer_id: arg.customer_id,
          amount: arg.amount
        }
      }, (error, res, body) => {
        if (error) {
          console.error('Error generating invoice:', error);
          return;
        }
        console.log(`Generate invoice statusCode: ${res.statusCode}`);
        console.log('Response:', body);
      });
    });

    ipcMain.on('load-customers', (event) => {
      console.log('Sending load-customers request');
      loadCustomers();
    });

    ipcMain.on('load-all-customers', (event) => {
      console.log('Sending load-all-customers request');
      request.get('http://127.0.0.1:8000/get_customers', (error, res, body) => {
        if (error) {
          console.error('Error loading all customers:', error);
          return;
        }
        const customers = JSON.parse(body);
        mainWindow.webContents.send('all-customers', customers);
      });
    });

    ipcMain.on('load-all-invoices', (event) => {
      console.log('Sending load-all-invoices request');
      request.get('http://127.0.0.1:8000/get_invoices', (error, res, body) => {
        if (error) {
          console.error('Error loading all invoices:', error);
          return;
        }
        const invoices = JSON.parse(body);
        mainWindow.webContents.send('all-invoices', invoices);
      });
    });

    // Handle the request to get customer data
ipcMain.on('get-customer', (event, customerId) => {
  console.log('Sending get-customer request:', customerId);
  request.get(`http://127.0.0.1:8000/get_customer/${customerId}`, (error, res, body) => {
    if (error) {
      console.error('Error getting customer:', error);
      return;
    }
    const customer = JSON.parse(body);
    mainWindow.webContents.send('customer-data', customer);
  });
});

// Handle the request to update customer data
ipcMain.on('update-customer', (event, customer) => {
  console.log('Sending update-customer request:', customer);
  request.put('http://127.0.0.1:8000/update_customer', {
    json: customer
  }, (error, res, body) => {
    if (error) {
      console.error('Error updating customer:', error);
      return;
    }
    console.log(`Update customer statusCode: ${res.statusCode}`);
    console.log('Response:', body);
    
    // After updating a customer, reload the customers
    loadCustomers();
    mainWindow.webContents.send('customer-updated');
  });
});

    function loadCustomers() {
      request.get('http://127.0.0.1:8000/get_customers', (error, res, body) => {
        if (error) {
          console.error('Error loading customers:', error);
          return;
        }
        const customers = JSON.parse(body);
        mainWindow.webContents.send('customers', customers);
      });
    }

    // Load customers on start
    loadCustomers();
  }, 5000); // Esperar 5 segundos antes de hacer las solicitudes
});
