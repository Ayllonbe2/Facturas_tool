# Facturas_tool

Herramienta de código abierto para generar facturas de forma fácil y eficiente. Esta aplicación permite gestionar clientes, crear y visualizar facturas, y realizar un seguimiento de los pagos. Desarrollada con **Python** usando **FastAPI**, **JavaScript** con **Node.js**, y **SQLite3** como base de datos.

## Características

- **Gestión de Clientes**: Agrega, edita y elimina información de clientes.
- **Generación de Facturas**: Crea facturas detalladas, agrega servicios, y guarda las facturas en formato PDF.
- **Visualización de Facturas**: Consulta facturas generadas previamente, filtra por estado de pago y edita facturas no pagadas.
- **Seguimiento de Pagos**: Marca facturas como pagadas y mantén un registro de las mismas.

## Tecnologías Utilizadas

- **Frontend**: HTML, CSS, JavaScript (con Bootstrap)
- **Backend**: Python (FastAPI)
- **Base de Datos**: SQLite3
- **Empaquetado**: Electron y PyInstaller

## Instalación y Configuración

### Prerrequisitos

- Node.js y npm
- Python 3.x
- SQLite3
- Instalar las dependencias de Python y Node.js

### Instalación

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/Ayllonbe/Facturas_tool.git
   cd Facturas_tool
   ```

2. **Instala las dependencias de Python:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Instala las dependencias de Node.js:**

   ```bash
   npm install
   ```

### Ejecución en Modo de Desarrollo

1. **Inicia el servidor backend:**

   ```bash
   uvicorn app.main.main:app --reload --port 8520
   ```

2. **Inicia la aplicación con Electron:**

   ```bash
   npm run start
   ```

### Creación de Ejecutable

#### Backend (Python)

Para empaquetar el backend en un ejecutable independiente:

```bash
pyinstaller --name main --onefile app/main/main.py
```

#### Frontend (Electron)

Para crear un instalador ejecutable para Windows:

```bash
npm run build
```

El instalador se generará en el directorio `dist/`.

## Estructura del Proyecto

- **app/**: Contiene el código fuente del frontend y backend.
  - **main/**: Lógica del backend y API en Python (FastAPI).
  - **renderer/**: Código HTML, CSS, y JavaScript del frontend.
  - **assets/**: Recursos como imágenes y logotipos.
- **dist/**: Directorio para los ejecutables generados.
- **node_modules/**: Dependencias de Node.js.
- **main.js**: Archivo principal de Electron.
- **package.json**: Configuración del proyecto y dependencias de Node.js.
- **requirements.txt**: Dependencias de Python.

## Uso

1. **Agregar Clientes**: Navega a "Agregar Cliente" y completa el formulario.
2. **Generar Factura**: Selecciona un cliente y agrega servicios a la factura.
3. **Ver Facturas**: Revisa las facturas generadas, filtra por estado de pago, edita o elimina facturas.
4. **Editar Información**: Edita los datos de clientes o facturas según sea necesario.

## Contribuir

Si deseas contribuir, por favor sigue los siguientes pasos:

1. Haz un fork del proyecto.
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`).
3. Haz commit de tus cambios (`git commit -m 'Añadir nueva característica'`).
4. Haz push a la rama (`git push origin feature/nueva-caracteristica`).
5. Abre un Pull Request.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## Contacto

Desarrollado por **Aarón Ayllón Benítez**. Puedes contactarme a través de [ayllonbenitez.aaron@gmail.com](mailto:ayllonbenitez.aaron@gmail.com).
