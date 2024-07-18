import * as net from "net";
import { exit } from "process";
import fs from "fs";

const parseUrl = (request: string): string => {
  const texts = request.split(" ");
  const url = texts[1];
  return url;
};

const readFileContent = async (filename: string) => {
  return fs.promises.readFile(filename);
};

if (process.argv.includes("--directory")) {
  const indexOfParam = process.argv.indexOf("--directory");
  const directory = process.argv[indexOfParam + 1];
  if (!directory) {
    console.error("Incorrect use of syntax");
    exit(1);
  }
  process.chdir(directory);
}

const server = net.createServer((socket: net.Socket) => {
  socket.on("data", async (data) => {
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
    } else if (url.startsWith("/files/") && !url.endsWith("/files/")) {
      const split = url.split("/");
      const filename = split[split.length - 1];
      try {
        const fileContent = await readFileContent(filename);
        const response = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileContent.length}\r\n\r\n${fileContent}`;
        socket.write(response);
      } catch (err) {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
    socket.end();
  });
});

server.listen(4221, "localhost");
