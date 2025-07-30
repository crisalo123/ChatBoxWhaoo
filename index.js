// index.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*", // asegúrate de cambiar esto si tienes dominio específico
    methods: ["GET", "POST"],
  },
});

const baseUrl = process.env.PRODUCT_API_URL;

const resPuestaProducto = async (id) => {
  const response = await axios.get(`${baseUrl}=${id}`);
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

    if (text.includes("hola") || text.includes("buenos días")) {
      response = "¡Hola! ¿Cómo estás hoy?";
    } else if (text.includes("ayuda") || text.includes("asistencia")) {
      response = "Claro, dime en qué necesitas ayuda.";
    } else if (text.includes("precio") || text.includes("costo")) {
      response =
        "Puedes preguntarme por el precio de un producto usando su ID.";
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
    } else if (text.includes("disponible") || text.includes("stock")) {
      response = "Para saber si un producto está disponible, indícame su ID.";
    } else if (
      text.includes("contacto") ||
      text.includes("hablar con alguien")
    ) {
      response =
        "Puedes escribirnos al WhatsApp 320-123-4567 o llamar al 018000-XXX-XXX.";
    } else if (text.includes("horario") || text.includes("abren")) {
      response =
        "Nuestro horario es de lunes a viernes de 8:00 a.m. a 6:00 p.m.";
    } else if (text.includes("envío") || text.includes("domicilio")) {
      response =
        "Hacemos envíos a todo el país. El costo varía según la ubicación.";
    } else if (text.includes("forma de pago") || text.includes("pago")) {
      response =
        "Aceptamos pagos con tarjeta de crédito, débito, PSE y contra entrega.";
    } else if (text.includes("devolución") || text.includes("reembolso")) {
      response =
        "Puedes solicitar una devolución dentro de los 5 días hábiles posteriores a la compra.";
    } else if (text.includes("gracias") || text.includes("muchas gracias")) {
      response = "¡Con gusto! Estoy aquí para ayudarte.";
    } else if (text.includes("adiós") || text.includes("chau")) {
      response = "¡Hasta luego! Que tengas un buen día.";
    } else {
      response = "No entendí tu mensaje. ¿Podrías reformularlo?";
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

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor Socket.io escuchando en el puerto ${PORT}`);
});
