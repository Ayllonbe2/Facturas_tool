// utils.js

// Función para actualizar el monto total
function updateTotalAmount() {
    let totalAmount = 0;
    document.querySelectorAll('.edit-service-row').forEach(row => {
        const quantity = parseInt(row.querySelector('.service-quantity').value, 10);
        const price = parseFloat(row.querySelector('.service-price').value);
        const total = quantity * price;
        row.querySelector('.service-total').value = total.toFixed(2);
        totalAmount += total;
    });
    document.getElementById('edit-invoice-amount').value = totalAmount.toFixed(2);
}

export {
    updateTotalAmount
};
