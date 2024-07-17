import * as net from "net";

const parseUrl = (request: string): string => {
  const texts = request.split(" ");
  const url = texts[1];
  return url;
};

const server = net.createServer((socket: net.Socket) => {
  socket.on("data", (data) => {
    const decodedData = data.toString();
    const url = parseUrl(decodedData);
    if (url == "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
