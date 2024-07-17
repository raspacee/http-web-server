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
    } else if (url.startsWith("/echo/") && !url.endsWith("/echo/")) {
      const split = url.split("/");
      const userString = split[split.length - 1];
      const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userString.length}\r\n\r\n${userString}`;
      socket.write(response);
    } else if (url == "/user-agent" || url == "/user-agent/") {
      const lowerCaseDecodedData = decodedData.toLowerCase();
      const indexOfUserAgent = lowerCaseDecodedData.indexOf("user-agent:");
      const userAgent = decodedData
        .slice(indexOfUserAgent)
        .split("\r\n")[0]
        .split(":")[1]
        .trim();
      const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
      socket.write(response);
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
    socket.end();
  });
});

server.listen(4221, "localhost");
