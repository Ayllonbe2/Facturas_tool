const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const request = require('request');
const express = require('express');
const fs = require('fs');

let mainWindow;
let python;
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
    const pythonExecutable = isPackaged
      ? path.join(process.resourcesPath, 'dist','main.exe') // Ruta al ejecutable de Python empaquetado
      : path.join(__dirname, 'app', 'python', 'facturas', 'Scripts', 'python.exe'); // Ruta al intérprete de Python en desarrollo

    // Imprime la ruta que se va a intentar ejecutar
    console.log(`Attempting to execute Python at: ${pythonExecutable}`);

    // Si está empaquetado, solo ejecuta el ejecutable, si no, ejecuta Python con el script
    python = isPackaged
      ? spawn(pythonExecutable)
      : spawn(pythonExecutable, [path.join(__dirname, 'app', 'main', 'main.py')]);

    // Capturar stdout (salida estándar) para obtener los prints
python.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

// Capturar stderr (salida de error) para obtener errores
python.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});


    python.on('exit', (code, signal) => {
      if (code !== null) {
        console.log(`Child process exited with code ${code}`);
      } else {
        console.log(`Child process exited due to signal ${signal}`);
      }
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true, // Mantener la seguridad al aislar el contexto
    },
  });

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
  });
}

// Función para cargar los datos iniciales
function loadInitialData() {
  return new Promise((resolve) => {
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
      json: arg,
    }, (error, res, body) => {
      if (error) {
        console.error('Error adding customer:', error);
        return;
      }
      console.log(`Add customer statusCode: ${res.statusCode}`);
      console.log('Response:', body);
      dialog.showMessageBoxSync({
        type: 'info',
        title: 'Cliente agregado',
        message: `El cliente ${arg.name} ha sido creado con éxito.`,
        buttons: ['OK'],
      });
      // After adding a customer, reload the customers
      loadCustomers();

    });
  });

  ipcMain.on('generate-invoice', (event, arg) => {
    // Primera llamada: Crear la factura en la base de datos
    request.post('http://127.0.0.1:8520/generate_invoice', {
        json: {
            customer_id: arg.customer_id,
            services: arg.services,
            date: arg.date,
            vat: arg.vat
        }
    }, (error, res, body) => {
        if (error) {
            console.error('Error generating invoice:', error);
            return;
        }

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
          { name: 'PDF Files', extensions: ['pdf'] },
        ],
      });

      if (savePath) {
        console.log('Saving regenerated invoice to:', savePath);
        request.post(`http://127.0.0.1:8520/regenerate_invoice/${invoiceId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ save_path: savePath }),
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
              buttons: ['OK'],
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

  ipcMain.on('load-customers', () => {
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

  ipcMain.on('load-all-customers', () => {
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

  ipcMain.on('load-all-invoices', () => {
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
      json: customer,
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
    console.log('Invoice data being sent for update:', invoice);
    request.put(`http://127.0.0.1:8520/update_invoice/${invoice.id}`, {
        json: invoice,
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

    request.put(`http://127.0.0.1:8520/update_invoice_payment/${invoiceId}`, {}, (error, res, body) => {
      if (error) {
        console.error('Error updating invoice payment status:', error);
        return;
      }
      console.log(`Update payment status response: ${res.statusCode}`);
      mainWindow.webContents.send('invoice-payment-updated', invoiceId);
    });
  });

  ipcMain.on('regenerate-invoice', (event, invoiceId) => {
    console.log(`Regenerate invoice: ${invoiceId}`);
    // Abrir cuadro de diálogo para seleccionar la ubicación de guardado
    const savePath = dialog.showSaveDialogSync(mainWindow, {
      title: 'Guardar Factura',
      defaultPath: path.join(app.getPath('documents'), `Factura-${invoiceId}.pdf`),
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
      ],
    });

    if (savePath) {
      console.log(`Saving regenerated invoice to: ${savePath}`);
      request.post(`http://127.0.0.1:8520/regenerate_invoice/${invoiceId}`, {
        json: { save_path: savePath },
    }, (error, res, body) => {
        if (error) {
            console.error('Error regenerating invoice:', error);
            return;
        }
        console.log(`Regenerate invoice statusCode: ${res.statusCode}`);
        console.log(`Response: ${body}`);
    
        if (res.statusCode === 200) {
            dialog.showMessageBoxSync({
                type: 'info',
                title: 'Factura Regenerada',
                message: `La factura con ID: ${invoiceId} ha sido regenerada con éxito.`,
                buttons: ['OK'],
            });
        } else {
            dialog.showErrorBox('Error', `No se pudo regenerar la factura. Respuesta del servidor: ${body}`);
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
    // Envía una solicitud POST al servidor FastAPI para iniciar el apagado
    request.post('http://127.0.0.1:8520/shutdown', (error, response, body) => {
      if (error) {
        console.error('Failed to shutdown the backend:', error);
      } else {
        console.log(`Backend shutdown initiated: ${body}`);
      }
      app.quit(); // Cierra la aplicación después de intentar apagar el backend
    });
  }
});



app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
