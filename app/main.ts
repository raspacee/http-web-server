import * as net from "net";
import { exit } from "process";
import fs from "fs";

const parseUrl = (request: string): string => {
  const texts = request.split(" ");
  const url = texts[1];
  return url;
};

const parseHeader = (
  headerName: string,
  request: string
): string | undefined => {
  const indexOfHeader = request.toLowerCase().indexOf(headerName);
  const headers = request.slice(indexOfHeader).split("\r\n");
  const header = headers.find(
    (h) => h.split(":")[0].toLowerCase() == headerName.toLowerCase()
  );
  if (header) {
    return header.split(":")[1].trim();
  }
  return undefined;
};

const parseBody = (request: string): string => {
  const body = request.split("\r\n").slice(-1)[0];
  return body;
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

const handleGetRequest = async (
  url: string,
  decodedData: string,
  socket: net.Socket
) => {
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
};

const handlePostRequest = async (
  url: string,
  decodedData: string,
  socket: net.Socket
) => {
  const contentTypeHeader = parseHeader("content-type", decodedData);
  if (contentTypeHeader == "application/octet-stream") {
    const bodyContent = parseBody(decodedData);
    const filename = url.split("/").slice(-1)[0];
    try {
      await fs.promises.writeFile(filename, bodyContent);
      socket.write("HTTP/1.1 201 Created\r\n\r\n");
    } catch (err) {
      console.error(err);
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
    }
  } else {
    socket.write("HTTP/1.1 415 Unsupported Media Type\r\n\r\n");
  }
};

const server = net.createServer((socket: net.Socket) => {
  socket.on("data", async (data) => {
    const decodedData = data.toString();
    const url = parseUrl(decodedData);

    /* Check for request type */
    const requestType = decodedData.split(" ")[0].toLowerCase();
    if (requestType == "get") {
      await handleGetRequest(url, decodedData, socket);
    } else if (requestType == "post") {
      await handlePostRequest(url, decodedData, socket);
    } else {
      socket.write("HTTP/1.1 405 Method Not Allowed\r\n\r\n");
    }

    socket.end();
  });
});

server.listen(4221, "localhost");
