// ui.js

// Función para mostrar una sección específica
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    if (sectionId === 'create-invoice') {
        import('./customer.js').then(module => {
            module.loadCustomers();
        });
    } else if (sectionId === 'view-clients') {
        import('./customer.js').then(module => {
            module.viewAllCustomers();
        });
    } else if (sectionId === 'view-invoices') {
        import('./invoice.js').then(module => {
            module.viewAllInvoices();
        });
    }
}

// Función para mostrar notificaciones
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    notificationMessage.textContent = message;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Función para mostrar un diálogo de confirmación
function showConfirmDialog(message, onConfirm, onCancel) {
    const confirmDialog = document.getElementById('confirm-dialog');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');

    confirmMessage.textContent = message;
    confirmDialog.style.display = 'block';

    confirmYesBtn.onclick = () => {
        confirmDialog.style.display = 'none';
        if (onConfirm) onConfirm();
    };

    confirmNoBtn.onclick = () => {
        confirmDialog.style.display = 'none';
        if (onCancel) onCancel();
    };
}

export {
    showSection,
    showNotification,
    showConfirmDialog
};
