# Node.js HTTP Tutorial: A Minimal Hello World Server

## Purpose

This project is a minimal, dependency-free Node.js HTTP server written as a teaching reference for
the built-in `http` module. The entire application is one file, `server.js`.

It serves one functional endpoint: `GET /hello` answers `200` with `Content-Type: text/plain` and
the body `Hello world`. Every other method-and-path combination answers `404` with
`Content-Type: text/plain` and the body `Not Found`. It writes one log line per incoming request,
takes its listening port from the `PORT` environment variable with a default of `3000`, and stops
cleanly when you press `CTRL+C`, exiting with status `0`.

The point of the project is the code you read: how a server is created with `http.createServer()`,
how a request becomes a status, a content type and a body, and how the process shuts down. There is
no framework, no middleware, no router library and no other package involved.

## Prerequisites

Node.js 18.0.0 or newer is required. Check the version you have:

```bash
node --version
```

The floor is declared in `package.json` as `engines.node: ">=18.0.0"`. npm treats `engines` as
advisory, so that field documents the intended floor rather than enforcing it.

The source uses only API that exists in Node.js 18.0.0, so the same file runs unchanged on Node.js
22.x, 24.x and later release lines.

## Installation

No installation step is required beyond having Node.js available.

Do not run `npm install`. The project declares no dependency of any kind, so there is nothing to
resolve, no `node_modules` directory is needed, and `node server.js` starts on a host where
`npm install` has never been run for this project.

The repository is three files, `server.js`, `package.json` and this document, and they are the
complete deliverable. Nothing is downloaded, generated, transpiled or built before the server runs.

## Running the server

Start it directly with Node.js:

```bash
node server.js
```

Or through the npm start script:

```bash
npm start
```

`npm start` resolves to `scripts.start` in `package.json`, which is `node server.js`, so the two
commands do the same thing and neither needs an installed package.

The startup line is printed only after the socket has been bound successfully, so seeing it means
the server is listening. With no `PORT` set, the output is:

```text
Server listening on port 3000
```

The server stays in the foreground and writes its log lines to the terminal. Press `CTRL+C` to stop
it; the Stopping the server section below shows what that prints.

## Configuration

The server has exactly one configuration input: the `PORT` environment variable. It is read once at
startup, before the socket is bound, and never read again.

| Value of `PORT` | Result |
| --- | --- |
| Not set | Binds port `3000` |
| Empty or whitespace only, such as `PORT=` | Binds port `3000`; an empty value is treated as unset, so `PORT=` does not silently bind port `0` |
| A whole decimal number from `1024` to `65535` inclusive | Binds that port |
| Anything else | Writes an actionable message to stderr and exits with status `1`, binding nothing |

Ports below `1024` are privileged ports and are always refused. There is no override flag, no second
environment variable and no configuration file that can allow them; the refusal is behaviour you
can rely on.

To run on a different port, set `PORT` inline:

```bash
PORT=4000 node server.js
```

```text
Server listening on port 4000
```

A value that is not a whole decimal number is rejected, quoting the offending value back:

```bash
PORT=abc node server.js
```

```text
Invalid PORT value "abc": PORT must be a whole number between 1024 and 65535.
```

The other rejected shapes use the same style, each naming the value and stating what is acceptable:

```bash
PORT=0 node server.js
```

```text
Invalid PORT value "0": port 0 would let the operating system choose a port; choose a port between 1024 and 65535.
```

```bash
PORT=80 node server.js
```

```text
Invalid PORT value "80": ports below 1024 are privileged and cannot be bound; choose a port between 1024 and 65535.
```

```bash
PORT=65536 node server.js
```

```text
Invalid PORT value "65536": PORT must be between 1024 and 65535.
```

In every one of those cases the message goes to stderr, the process exits with status `1`, and
nothing is bound. The status is visible from the shell:

```bash
PORT=abc node server.js; echo "exit=$?"
```

```text
Invalid PORT value "abc": PORT must be a whole number between 1024 and 65535.
exit=1
```

If the port value is valid but the port is already in use, the bind failure is reported instead of
crashing with a raw Node.js error dump:

```text
Cannot start server: port 3000 is already in use. Stop the process using it, or start it with a different PORT between 1024 and 65535.
```

The port in that message is the one that was attempted, so a second instance started with
`PORT=4000` reports `port 4000`. The exit status is `1` here as well, and the instance that already
held the port keeps serving.

## Testing the server

With the server running on its default port, request the functional endpoint:

```bash
curl http://localhost:3000/hello
```

```text
Hello world
```

Add `-i` to see the status line and the headers alongside the body. `curl -i` prints the status
line, the header fields, a blank line and then the body, all in one stream:

```bash
curl -i http://localhost:3000/hello
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 11

Hello world
```

The status line, `Content-Type` and the body come from the application. `Content-Length`, `Date`,
`Connection` and `Keep-Alive` are added by the Node.js runtime; `Content-Length: 11` is the length
of `Hello world`.

Any other path is a `404`:

```bash
curl -i http://localhost:3000/invalid
```

```text
HTTP/1.1 404 Not Found
Content-Type: text/plain
Content-Length: 9

Not Found
```

The HTTP method is part of the match, so the functional path with a different method is a miss
rather than a match:

```bash
curl -i -X POST http://localhost:3000/hello
```

```text
HTTP/1.1 404 Not Found
Content-Type: text/plain
Content-Length: 9

Not Found
```

Two related behaviours are worth knowing. A query string is never part of a route, so
`curl -i "http://localhost:3000/hello?x=1"` returns the same `200` and `Hello world` as `/hello`.
Percent-encoded paths are deliberately not decoded, so `curl -i http://localhost:3000/%68ello`
returns `404` and `Not Found`; matching is exact and literal.

## Expected output

Every line the server writes has a fixed shape, so you can compare what you see with what this
document promises. Timestamps and paths vary per request; the shapes do not. A session that starts
the server, makes one matched request and one unmatched request, and is then stopped with `CTRL+C`,
produces exactly this:

```text
Server listening on port 3000
2026-10-16T21:31:55.171Z GET /hello
2026-10-16T21:31:55.180Z GET /invalid
Server shutting down
```

The two response bodies a client can receive are:

```text
Hello world
```

```text
Not Found
```

So a matched request returns `HTTP/1.1 200 OK` with `Hello world`, and an unmatched request returns
`HTTP/1.1 404 Not Found` with `Not Found`.

## Request logging

One line is written to stdout for every incoming request, before routing decides anything, so a
request is logged whether or not it matches a route. The format is the ISO-8601 timestamp, the HTTP
method and the request path, separated by single spaces:

```text
2025-01-01T00:00:00.000Z GET /hello
```

The timestamp comes from `new Date().toISOString()`, which is always UTC and ends in `Z`. The path
logged is the same string routing matched on, so a request for `/hello?x=1` is logged with the
query string already stripped:

```text
2025-01-01T00:00:00.000Z GET /hello
```

The lines appear in the terminal running the server, interleaved with the requests as they arrive.

## Stopping the server

Press `CTRL+C` in the terminal running the server. It prints:

```text
Server shutting down
```

The process then stops accepting new connections, releases the connections it is holding, and exits
with status `0`, a clean stop rather than a crash. From a script you can confirm the status
immediately after the process ends:

```bash
node server.js & SRV=$!; sleep 1; kill -INT $SRV; wait $SRV; echo "exit=$?"
```

```text
Server listening on port 3000
Server shutting down
exit=0
```

`kill -INT` sends the same signal as `CTRL+C`. Handling that signal is deliberate: without an
explicit handler Node.js would terminate the process with status `130` instead.

## Project structure and latency check

The repository is three files:

| File | Purpose |
| --- | --- |
| `server.js` | The entire application: the route table, both handlers, the request log line, port resolution and validation, the startup error handling and the `CTRL+C` shutdown |
| `package.json` | Project identity, the `npm start` command and the runtime floor. It carries seven fields, `name`, `version`, `description`, `main`, `scripts`, `engines`, `keywords`, and no dependency section |
| `README.md` | This document |

The request path performs no disk, network or database work: it derives a string, looks up one table
entry and ends the response. `GET /hello` therefore answers in well under 10 ms. You can spot-check
it from the shell; `curl` prints the total time in seconds, so a passing value is below `0.010`:

```bash
curl -s -o /dev/null -w '%{time_total}\n' http://localhost:3000/hello
```

```text
0.000820
0.000341
```

Run it more than once: the first request on a fresh connection includes connection setup, so the
later values are the ones that represent the steady-state latency. A short loop shows the whole
series:

```bash
for i in $(seq 1 20); do curl -s -o /dev/null -w '%{time_total}\n' http://localhost:3000/hello; done
```

```text
0.000820
0.000866
0.000557
0.000584
0.000919
0.000577
0.000764
0.000874
0.000756
0.000512
0.000402
0.000341
0.000396
0.000340
0.000329
0.000316
0.000320
0.000306
0.000322
0.000341
```

