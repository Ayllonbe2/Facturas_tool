const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const request = require('request');
const express = require('express');
const fs = require('fs');

function setPythonInPath(pythonPath) {
  process.env.PATH = `${pythonPath};${process.env.PATH}`;
}


let mainWindow;

// Configurar la ruta del archivo de log
app.on('ready', () => {

  const logPath = path.join(app.getPath('userData'), 'app.log');
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  // Redirigir la salida de la consola al archivo de log
  console.log = function (message) {
      logStream.write(`${new Date().toISOString()} - ${message}\n`);
      process.stdout.write(message + '\n');
  };

  console.error = console.log;
  console.warn = console.log;
  console.info = console.log;

  // Establece el directorio de trabajo al directorio del ejecutable
  process.chdir(path.dirname(app.getPath('exe')));

  // Espera a que la aplicación esté lista
  app.whenReady().then(() => {
    const isPackaged = app.isPackaged;
    pythonExecutable = isPackaged
      ? path.join(process.resourcesPath, 'app', 'python','facturas', 'Scripts', 'python.exe')
      : path.join(__dirname, 'app', 'python','facturas', 'Scripts', 'python.exe');
    if (!pythonExecutable) {
        dialog.showErrorBox('Error', 'Python no se encontró en el sistema. Asegúrate de que Python esté instalado y en el PATH.');
        app.quit();
        return;
    } else{
      setPythonInPath(path.dirname(pythonExecutable));
    }

    const pythonScriptPath = isPackaged
      ? path.join(process.resourcesPath, 'app', 'main', 'main.py')
      : path.join(__dirname, 'app', 'main', 'main.py');

    const python = spawn(pythonExecutable, [pythonScriptPath]);

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
    
    setupIpcHandlers();
  });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
   // fullscreen: true, // Esto abrirá la ventana en pantalla completa directamente.
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true // Mantener la seguridad al aislar el contexto
    }
  });
  // Quitar la barra de menú
 // mainWindow.setMenu(null);

  // Maximiza la ventana para que ocupe todo el espacio visible de pantalla.
  mainWindow.maximize();
  // Cargar la pantalla de carga primero
  mainWindow.loadFile(path.join(__dirname, 'loading.html'));

  // Iniciar la carga de datos
  loadInitialData().then(() => {
    // Una vez que los datos estén listos, cargar la URL principal de la aplicación
    mainWindow.loadURL('http://localhost:3000');
  }).catch(err => {
    console.error('Error durante la carga inicial:', err);
    // Manejar el error, como mostrar un mensaje al usuario
  });
}

// Función para cargar los datos iniciales
function loadInitialData() {
  return new Promise((resolve, reject) => {
    // Simula una carga de datos o cualquier proceso de inicialización necesario
    setTimeout(() => {
      resolve();
    }, 3000); // Simula 3 segundos de carga de datos
  });
}

// Configura los manejadores de IPC
function setupIpcHandlers() {
  ipcMain.on('add-customer', (event, arg) => {
    console.log('Sending add-customer request:', arg);
    request.post('http://127.0.0.1:8520/add_customer', {
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
    // Primera llamada: Crear la factura en la base de datos
    request.post('http://127.0.0.1:8520/generate_invoice', {
        json: {
            customer_id: arg.customer_id,
            services: arg.services
        }
    }, (error, res, body) => {
        if (error) {
            console.error('Error generating invoice:', error);
            return;
        }

        // Aquí verificamos si la respuesta es JSON y la parseamos si es necesario
        let invoiceId;
        try {
            const response = typeof body === 'string' ? JSON.parse(body) : body;
            invoiceId = response.invoice_id;
            console.log(`Invoice created with ID: ${invoiceId}`);
        } catch (e) {
            console.error('Error parsing JSON response:', e);
            return;
        }
        
        // Segunda llamada: Solicitar la ubicación para guardar el PDF
        const savePath = dialog.showSaveDialogSync(mainWindow, {
            title: 'Guardar Factura',
            defaultPath: path.join(app.getPath('documents'), `Factura-${invoiceId}.pdf`),
            filters: [
                { name: 'PDF Files', extensions: ['pdf'] }
            ]
        });

        if (savePath) {
          console.log('Saving regenerated invoice to:', savePath);
          request.post(`http://127.0.0.1:8520/regenerate_invoice/${invoiceId}`, {
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  save_path: savePath  // Pasar la ruta de guardado al backend
              })
          }, (error, res, body) => {
              if (error) {
                  console.error('Error regenerating invoice:', error);
                  return;
              }
              console.log(`Regenerate invoice statusCode: ${res.statusCode}`);
              console.log('Response:', body);
    
              if (res.statusCode === 200) {
                  dialog.showMessageBoxSync({
                      type: 'info',
                      title: 'Factura Regenerada',
                      message: `La factura con ID: ${invoiceId} ha sido regenerada con éxito.`,
                      buttons: ['OK']
                  });
              } else {
                  dialog.showErrorBox('Error', 'No se pudo regenerar la factura.');
              }
          });
      } else {
          console.log('Save operation was canceled.');
      }
    });
  });

  ipcMain.on('load-customers', (event) => {
    console.log('Sending load-customers request');
    loadCustomers();
  });

  ipcMain.on('get-last-invoice-id', (event) => {
    request.get('http://127.0.0.1:8520/get_last_invoice_id', (error, res, body) => {
        if (error) {
            console.error('Error fetching last invoice ID:', error);
            return;
        }
        const lastInvoiceId = JSON.parse(body).last_invoice_id;
        event.reply('last-invoice-id', { last_invoice_id: lastInvoiceId });
    });
});

  ipcMain.on('load-all-customers', (event) => {
    console.log('Sending load-all-customers request');
    request.get('http://127.0.0.1:8520/get_customers', (error, res, body) => {
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
    request.get('http://127.0.0.1:8520/get_invoices', (error, res, body) => {
      if (error) {
        console.error('Error loading all invoices:', error);
        return;
      }
      const invoices = JSON.parse(body);
      mainWindow.webContents.send('all-invoices', invoices);
    });
  });

  ipcMain.on('get-customer', (event, customerId) => {
    console.log('Sending get-customer request:', customerId);
    request.get(`http://127.0.0.1:8520/get_customer/${customerId}`, (error, res, body) => {
      if (error) {
        console.error('Error getting customer:', error);
        return;
      }
      const customer = JSON.parse(body);
      mainWindow.webContents.send('customer-data', customer);
    });
  });

  ipcMain.on('delete-invoice', (event, invoiceId) => {
    request.delete(`http://127.0.0.1:8520/delete_invoice/${invoiceId}`, (error, res, body) => {
        if (error) {
            console.error('Error deleting invoice:', error);
            return;
        }
        mainWindow.webContents.send('invoice-deleted');
    });
});

  ipcMain.on('update-customer', (event, customer) => {
    console.log('Sending update-customer request:', customer);
    request.put('http://127.0.0.1:8520/update_customer', {
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

  ipcMain.on('get-invoice', (event, invoiceId) => {
    request.get(`http://127.0.0.1:8520/get_invoice/${invoiceId}`, (error, res, body) => {
      if (error) {
        console.error('Error fetching invoice:', error);
        return;
      }
      const invoice = JSON.parse(body);
      mainWindow.webContents.send('invoice-data', invoice);
    });
  });

  ipcMain.on('update-invoice', (event, invoice) => {
    console.log('Invoice data being sent for update:', invoice);  // Debugging line
    request.put(`http://127.0.0.1:8520/update_invoice/${invoice.id}`, {
      json: invoice
    }, (error, res, body) => {
      if (error) {
        console.error('Error updating invoice:', error);
        return;
      }
      mainWindow.webContents.send('invoice-updated');
    });
  });

  ipcMain.on('update-invoice-payment', (event, invoiceId) => {
    console.log(`Toggling payment status for invoice ID ${invoiceId}`);

    request.put(`http://127.0.0.1:8520/update_invoice_payment/${invoiceId}`, 
    {},  // No se envía un cuerpo JSON
    (error, res, body) => {
        if (error) {
            console.error('Error updating invoice payment status:', error);
            return;
        }
        console.log(`Update payment status response: ${res.statusCode}`);
        mainWindow.webContents.send('invoice-payment-updated', invoiceId);
    });
});

  ipcMain.on('regenerate-invoice', (event, invoiceId) => {
    // Abrir cuadro de diálogo para seleccionar la ubicación de guardado
    const savePath = dialog.showSaveDialogSync(mainWindow, {
        title: 'Guardar Factura',
        defaultPath: path.join(app.getPath('documents'), `Factura-${invoiceId}.pdf`),
        filters: [
            { name: 'PDF Files', extensions: ['pdf'] }
        ]
    });

    if (savePath) {
        console.log('Saving regenerated invoice to:', savePath);
        request.post(`http://127.0.0.1:8520/regenerate_invoice/${invoiceId}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                save_path: savePath  // Pasar la ruta de guardado al backend
            })
        }, (error, res, body) => {
            if (error) {
                console.error('Error regenerating invoice:', error);
                return;
            }
            console.log(`Regenerate invoice statusCode: ${res.statusCode}`);
            console.log('Response:', body);

            if (res.statusCode === 200) {
                dialog.showMessageBoxSync({
                    type: 'info',
                    title: 'Factura Regenerada',
                    message: `La factura con ID: ${invoiceId} ha sido regenerada con éxito.`,
                    buttons: ['OK']
                });
            } else {
                dialog.showErrorBox('Error', 'No se pudo regenerar la factura.');
            }
        });
    } else {
        console.log('Save operation was canceled.');
    }
  });

  function loadCustomers() {
    request.get('http://127.0.0.1:8520/get_customers', (error, res, body) => {
      if (error) {
        console.error('Error loading customers:', error);
        mainWindow.webContents.send('error', 'Cannot load customers. Server might be down.');
        return;
      }
      const customers = JSON.parse(body);
      mainWindow.webContents.send('customers', customers);
    });
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
