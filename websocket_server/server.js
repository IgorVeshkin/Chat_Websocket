const http = require("http");

const websocket = require('ws');

const url = require("url");

const ws_port = 8000;


const httpServer = http.Server((req, res) => {

    res.end("HTTP server is running....")

})

httpServer.listen(ws_port, () => {
    
    console.log("Websocket Server is running....");
    console.log(`Websocket server address: ws://localhost:${ws_port}`);


})


const websocket_server = new websocket.Server({
    server: httpServer,
    cors: {
    origin: "*",
  }
});


// Клиент подключился к серверу
websocket_server.on("connection", (connection, request) => {

    console.log("New client has been connected....");

    // Демо вызов url (потребуется для будущей разработки)
    // console.log(request.url);
    //console.log(url.parse(request.url, true).query);


    // Клиент отправил сообщение
    connection.on("message", (message) => {

        console.log(`Server received the message: ${message}`);
        
        // Отправляю сообщение всем клиентам
        websocket_server.clients.forEach((client) => {
        if (client !== connection && client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
        }})   

    });

    // Клиент отключился от сервера
    connection.on("close", () => {
        console.log("Client has been disconnected from server");

    });

});

