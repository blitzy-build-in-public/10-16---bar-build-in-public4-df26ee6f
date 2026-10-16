/*
 * A single-file HTTP server that demonstrates the Node.js built-in `http`
 * module: it answers GET /hello with "Hello world" and every other
 * method-and-path combination with 404 "Not Found".
 *
 * Start it with `node server.js` or `npm start`. The PORT environment variable
 * sets the listening port and defaults to 3000.
 */

const http = require('node:http');

const DEFAULT_PORT = 3000;
const MIN_PORT = 1024;
const MAX_PORT = 65535;

// The status and the headers are set before a single end(body), so Node
// computes Content-Length from the whole body. writeHead() would store the
// headers before the body is known and frame the response with chunked
// transfer encoding instead.
function sendPlainText(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/plain');
  res.end(body);
}

function logRequest(method, path) {
  console.log(`${new Date().toISOString()} ${method} ${path}`);
}

function handleHello(req, res) {
  sendPlainText(res, 200, 'Hello world');
}

function handleNotFound(req, res) {
  sendPlainText(res, 404, 'Not Found');
}

const ROUTES = Object.freeze({
  'GET /hello': handleHello,
});

function handleRequest(req, res) {
  // A query string is never part of a route, so /hello?x=1 matches /hello.
  // Percent-encoded paths are deliberately left undecoded and so do not match.
  const path = req.url.split('?')[0];

  // Logging sits between path derivation and the route lookup, so a request is
  // recorded whether or not it matches a route.
  logRequest(req.method, path);

  const handler = ROUTES[`${req.method} ${path}`] || handleNotFound;
  handler(req, res);
}

function resolvePortFromEnv(rawValue) {
  if (rawValue === undefined) {
    return DEFAULT_PORT;
  }

  const trimmedValue = rawValue.trim();

  if (trimmedValue === '') {
    return DEFAULT_PORT;
  }

  // A digits-only test rather than Number() alone: Number('') is 0, and a port
  // of 0 asks the operating system to choose an arbitrary port.
  if (!/^[0-9]+$/.test(trimmedValue)) {
    throw new Error(
      `Invalid PORT value "${rawValue}": PORT must be a whole number between 1024 and 65535.`
    );
  }

  const port = Number(trimmedValue);

  if (port === 0) {
    throw new Error(
      `Invalid PORT value "${rawValue}": port 0 would let the operating system choose a port; choose a port between 1024 and 65535.`
    );
  }

  if (port < MIN_PORT) {
    throw new Error(
      `Invalid PORT value "${rawValue}": ports below 1024 are privileged and cannot be bound; choose a port between 1024 and 65535.`
    );
  }

  if (port > MAX_PORT) {
    throw new Error(
      `Invalid PORT value "${rawValue}": PORT must be between 1024 and 65535.`
    );
  }

  return port;
}

function registerShutdown(server, sockets) {
  process.on('SIGINT', () => {
    console.log('Server shutting down');

    server.close(() => {
      process.exit(0);
    });

    // close() waits for existing connections, so every tracked socket is
    // released here to let it complete. The runtime helpers that close idle
    // connections arrive after Node 18.0.0, the floor this file targets, so the
    // release is done here instead.
    for (const socket of sockets) {
      socket.destroy();
    }
  });
}

function startServer(port) {
  const sockets = new Set();

  const server = http.createServer(handleRequest);

  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Cannot start server: port ${port} is already in use. Stop the process using it, or start it with a different PORT between 1024 and 65535.`
      );
    } else {
      console.error(`Cannot start server: ${error.message}`);
    }

    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  registerShutdown(server, sockets);
}

try {
  const port = resolvePortFromEnv(process.env.PORT);
  startServer(port);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
