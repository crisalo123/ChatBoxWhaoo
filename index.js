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
    origin: "*", // cambia esto a tu dominio en producción
    methods: ["GET", "POST"],
  },
});

const baseUrl = process.env.PRODUCT_API_URL;

const resPuestaProducto = async (id) => {
  const response = await axios.get(`${baseUrl}=${id}`);
  const data = response.data;
  if (data && data.length > 0) {
    return data[0];
  } else {
    throw new Error("Producto no encontrado");
  }
};

app.use(cors());

io.on("connection", (socket) => {
  console.log(`✅ Usuario conectado: ${socket.id}`);

  // Unirse a la sala privada usando el token
  socket.on("join_room", (token) => {
    socket.join(token);
    console.log(`📌 Usuario ${socket.id} se unió a su sala privada: ${token}`);
  });

  socket.on("send_message", async (data) => {
    const { room: token, message } = data;
    console.log(`📨 Mensaje recibido de ${token}: ${message}`);

    // Emitimos el mensaje del usuario
    io.to(token).emit("receive_message", {
      message,
      sender: socket.id,
      timestamp: new Date(),
    });

    // Analizar mensaje del usuario
    const text = message.toLowerCase();
    let response = "";

    try {
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
          const producto = await resPuestaProducto(id);
          response = `El producto con ID ${id} es: ${producto.descripcionProducto}, precio: ${producto.valorProducto}`;
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
        io.to(token).emit("receive_message", {
          message: response,
          sender: "bot",
          timestamp: new Date(),
        });
      }, 1000);
    } catch (error) {
      console.error("⚠️ Error al procesar el mensaje:", error);
      io.to(token).emit("receive_message", {
        message: "Ocurrió un error procesando tu mensaje.",
        sender: "bot",
        timestamp: new Date(),
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Usuario desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor Socket.io escuchando en el puerto ${PORT}`);
});
