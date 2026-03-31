const http = require("http");

const socketIo = require('socket.io');

const url = require("url");

const ws_port = 8000;


const httpServer = http.Server((req, res) => {

    res.end("HTTP server is running....")

})

httpServer.listen(ws_port, () => {
    
    console.log("Websocket Server is running....");
    console.log(`Websocket server address: ws://localhost:${ws_port}`);


})


const websocket_server = socketIo(httpServer, {
  cors: {
    origin: "*",
  }
});


// Клиент подключился к серверу
websocket_server.on("connection", (socket) => {

    console.log("New client has been connected....");

    // Демо вызов url (потребуется для будущей разработки)
    // console.log(request.url);
    //console.log(url.parse(request.url, true).query);


    // Клиент отправил сообщение
    socket.on("message", (message) => {

        console.log(`Server received the message: ${message}`);

        socket.broadcast.emit("message", message);        

    });

    // Клиент отключился от сервера
    socket.on("close", () => {
        console.log("Client has been disconnected from server");

    });

});

