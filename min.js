const express = require('express');
const http = require('http');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const socketIo = require('socket.io');
const cors = require('cors');

// Configuración del servidor Express y Socket.IO
const app = express();
const server = http.createServer(app);

// Habilitar CORS para todos los orígenes o definir específicamente tu origen
app.use(cors({
  origin: '*', // Permitir este origen
  methods: ['GET', 'POST'], // Métodos permitidos
  // credentials: true // Si necesitas enviar cookies o autenticación
}));

// Configuración de Socket.IO con CORS
const io = socketIo(server, {
  cors: {
    origin: '*', // Permitir el origen del cliente
    methods: ['GET', 'POST'], // Métodos permitidos
    // credentials: true // Si estás usando cookies o autenticación
  }
});

// Configuración del puerto de recepción (COM1)
const receiverPort = new SerialPort({
  path: 'COM1', // Cambia esto al puerto que estás utilizando para recibir
  baudRate: 9600,
  autoOpen: false
});

// Parser para interpretar datos del puerto de recepción
const parser = receiverPort.pipe(new ReadlineParser({ delimiter: '\n' }));

// Abre el puerto de recepción
receiverPort.open((err) => {
  if (err) {
    return console.log('Error al abrir el puerto de recepción: ', err.message);
  }

  console.log('Puerto de recepción (COM1) abierto');

  // Escucha los datos recibidos en el puerto de recepción
  parser.on('data', (data) => {
    console.log('Datos recibidos en COM1:', data);
    
    // Emitir los datos al cliente inmediatamente
    io.emit('serialData', data);
    console.log('Datos emitidos al front-end:', data);
  });

  parser.on('error', (err) => {
    console.error('Error en el parser:', err.message);
  });
});

// Cuando un cliente se conecta al servidor Socket.io
io.on('connection', (socket) => {
  console.log('Cliente conectado');
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Servidor escuchando en el puerto 3000
server.listen(3004, () => {
  console.log('Servidor corriendo en http://localhost:3004');
});
