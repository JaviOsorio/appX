const express = require("express");
const http = require("http");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const socketIo = require("socket.io");
const cors = require("cors");

// Configuración del servidor Express y Socket.IO
const app = express();
const server = http.createServer(app);

// Habilitar CORS para todos los orígenes o definir específicamente tu origen
app.use(
  cors({
    origin: "*", // Permitir este origen
    methods: ["GET", "POST"], // Métodos permitidos
    // credentials: true // Si necesitas enviar cookies o autenticación
  })
);

// Configuración de Socket.IO con CORS
const io = socketIo(server, {
  cors: {
    origin: "*", // Permitir el origen del cliente
    methods: ["GET", "POST"], // Métodos permitidos
    // credentials: true // Si estás usando cookies o autenticación
  },
});

io.on("connection", (socket) => {
  console.log("Cliente conectado");
  let receiverPort; // Almacena el puerto serial para este cliente
  let parser; // Almacena el parser de datos

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");

    // Si el puerto está abierto, cerrarlo cuando el cliente se desconecte
    if (receiverPort && receiverPort.isOpen) {
      receiverPort.close((err) => {
        if (err) {
          return console.error("Error al cerrar el puerto de recepción:", err.message);
        }
        console.log("Puerto de recepción cerrado al desconectar el cliente.");
      });
    }
  });

  socket.on("port", (data) => {
    console.log("Puerto solicitado:", data);

    // Si ya existe un puerto y está abierto, cerrarlo antes de abrir uno nuevo
    if (receiverPort && receiverPort.isOpen) {
      receiverPort.close((err) => {
        if (err) {
          return console.error("Error al cerrar el puerto de recepción:", err.message);
        }
        console.log("Puerto de recepción cerrado, listo para abrir uno nuevo.");
        openSerialPort(data); // Abrir el nuevo puerto después de cerrar el anterior
      });
    } else {
      openSerialPort(data); // Abrir el puerto si no hay uno previamente abierto
    }
  });

  // Función para abrir el puerto serial
  function openSerialPort(portPath) {
    receiverPort = new SerialPort({
      path: portPath, // Cambia esto al puerto que estás utilizando para recibir
      baudRate: 2400, // 9600,
      autoOpen: false,
    });

    parser = receiverPort.pipe(new ReadlineParser({ delimiter: "\n" }));

    receiverPort.open((err) => {
      if (err) {
        return console.log("Error al abrir el puerto de recepción:", err.message);
      }
      console.log(`Puerto de recepción (${portPath}) abierto`);
      // Limita las lecturas para evitar saturar el servidor
      let lastReceivedTime = 0;
      const readingInterval = 1000; // Tiempo mínimo entre lecturas en milisegundos

      // Escucha los datos recibidos en el puerto de recepción
      parser.on("data", (data) => {
        console.log(`Datos recibidos en ${portPath}`, data);
        const currentTime = Date.now();
        // Solo procesa si ha pasado el tiempo necesario entre lecturas
        if (currentTime - lastReceivedTime >= readingInterval) {
          console.log("Datos recibidos de la báscula:", data);
          // Emitir los datos al cliente inmediatamente
          socket.emit("serialData", data); // Emitir solo al cliente específico
          console.log("Datos emitidos al cliente:", data);
          lastReceivedTime = currentTime;
        } else {
          console.log("Datos recibidos demasiado rápido, descartando...");
        }
      });

      parser.on("error", (err) => {
        console.error("Error en el parser:", err.message);
      });
    });
  }
});

// // Configuración del puerto de recepción (COM1)
// const receiverPort = new SerialPort({
//   path: "COM1", // Cambia esto al puerto que estás utilizando para recibir
//   baudRate: 9600,
//   autoOpen: false,
// });

// // Parser para interpretar datos del puerto de recepción
// const parser = receiverPort.pipe(new ReadlineParser({ delimiter: "\n" }));

// // Abre el puerto de recepción
// receiverPort.open((err) => {
//   if (err) {
//     return console.log("Error al abrir el puerto de recepción: ", err.message);
//   }

//   console.log("Puerto de recepción (COM1) abierto");

//   // Escucha los datos recibidos en el puerto de recepción
//   parser.on("data", (data) => {
//     console.log("Datos recibidos en COM1:", data);

//     // Emitir los datos al cliente inmediatamente
//     io.emit("serialData", data);
//     console.log("Datos emitidos al front-end:", data);
//   });

//   parser.on("error", (err) => {
//     console.error("Error en el parser:", err.message);
//   });
// });

// Cuando un cliente se conecta al servidor Socket.io
// io.on("connection", (socket) => {
//   console.log("Cliente conectado");
//   socket.on("disconnect", () => {
//     console.log("Cliente desconectado");
//   });
//   socket.on("port", (data) => {
//     console.log(data);
//     // Configuración del puerto de recepción (COM1)
//     const receiverPort = new SerialPort({
//       path: data, // Cambia esto al puerto que estás utilizando para recibir
//       baudRate: 9600,
//       autoOpen: false,
//     });

//     // Parser para interpretar datos del puerto de recepción
//     const parser = receiverPort.pipe(new ReadlineParser({ delimiter: "\n" }));

//     // Abre el puerto de recepción
//     receiverPort.open((err) => {
//       if (err) {
//         return console.log(
//           "Error al abrir el puerto de recepción: ",
//           err.message
//         );
//       }

//       console.log("Puerto de recepción (COM1) abierto");

//       // Escucha los datos recibidos en el puerto de recepción
//       parser.on("data", (data) => {
//         console.log("Datos recibidos en COM1: " + data);

//         // Emitir los datos al cliente inmediatamente
//         io.emit("serialData", data);
//         console.log("Datos emitidos al front-end:", data);
//       });

//       parser.on("error", (err) => {
//         console.error("Error en el parser:", err.message);
//       });
//     });
//   });
// });

// Servidor escuchando en el puerto 3000
server.listen(3004, () => {
  console.log("Servidor corriendo en http://localhost:3004");
});
