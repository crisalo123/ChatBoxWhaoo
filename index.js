// index.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*", // asegúrate de cambiar esto si tienes dominio específico
    methods: ["GET", "POST"],
  },
});

const resPuestaProducto = async (id) => {
  const response = await axios.get(
    `https://apiwahoo-hkc4bxhedscqgwh4.eastus2-01.azurewebsites.net/api/v1/Producto/ListProducto?IdProducto=${id}`
  );
  const data = response.data;
  if (data && data.length > 0) {
    return data[0]; // Retorna el primer producto encontrado
  } else {
    throw new Error("Producto no encontrado");
  }
};

app.use(cors());

io.on("connection", (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`Usuario ${socket.id} se unió a la sala ${room}`);
  });

  socket.on("send_message", (data) => {
    const { room, message } = data;

    console.log(`Mensaje recibido en la sala ${room}: ${message}`);

    io.to(room).emit("receive_message", {
      message,
      sender: socket.id,
      timestamp: new Date(),
    });

    let response = "";

    const text = message.toLowerCase();

    if (text.includes("hola")) {
      response = "¡Hola! ¿Cómo estás?";
    } else if (text.includes("ayuda")) {
      response = "En qué puedo ayudarte?";
    } else if (text.includes("precio") || text.includes("costo")) {
      response =
        "Claro para saber el costo de tu producto buscalo por id o nombre, por ejemplo producto con id:";
    } else if (text.includes("producto")) {
      const idMatch = text.match(/\b(\d+)\b/);
      if (idMatch) {
        const id = idMatch[1];
        resPuestaProducto(id)
          .then((producto) => {
            response = `El producto con ID ${id} es: ${producto.descripcionProducto}, precio: ${producto.valorProducto}`;
            io.to(room).emit("receive_message", {
              message: response,
              sender: "bot",
              timestamp: new Date(),
            });
          })
          .catch((error) => {
            console.error("Error al obtener el producto:", error);
            response = "No se pudo encontrar el producto con ese ID.";
            io.to(room).emit("receive_message", {
              message: response,
              sender: "bot",
              timestamp: new Date(),
            });
          });
        return; // Salimos de la función para esperar la respuesta del producto
      } else {
        response = "Por favor, proporciona un ID de producto válido.";
      }
    } else if (text.includes("adiós")) {
      response = "¡Adiós! Que tengas un buen día.";
    } else if (text.includes("gracias")) {
      response = "¡De nada! Estoy aquí para ayudarte.";
    } else {
      response = "Lo siento, no entendí tu mensaje.";
    }

    setTimeout(() => {
      console.log("Enviando mensaje del bot:", response);
      io.to(room).emit("receive_message", {
        message: response,
        sender: "bot",
        timestamp: new Date(),
      });
    }, 1000); // Respuesta del bot después de 1 segundo
  });

  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log("Servidor Socket.io escuchando en http://localhost:3000");
});
