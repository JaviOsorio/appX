const { SerialPort } = require('serialport');

// Configuración del puerto de envío (COM2)
const senderPort = new SerialPort({
  path: 'COM2', // Cambia esto al puerto que estás utilizando para enviar
  baudRate: 9600,
  autoOpen: false // No abrir automáticamente el puerto al crear la instancia
});

// Abre el puerto de envío
senderPort.open((err) => {
  if (err) {
    return console.log('Error al abrir el puerto de envío: ', err.message);
  }

  console.log('Puerto de envío (COM2) abierto');

  // Envía datos a través del puerto de envío después de un pequeño retraso
  setTimeout(() => {
    senderPort.write('1900\n', (err) => {
      if (err) {
        return console.log('Error al enviar datos: ', err.message);
      }
      console.log('Datos enviados desde COM2');

      // Cierra el puerto de envío después de enviar
      senderPort.close((err) => {
        if (err) {
          return console.log('Error al cerrar el puerto de envío: ', err.message);
        }
        console.log('Puerto de envío (COM2) cerrado');
      });
    });
  }, 1000); // Espera 1 segundo antes de enviar
});
