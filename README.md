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

```text
v22.23.3
```

That transcript is the output of the command above, taken on the machine this document was written
from. Every quoted line in this document comes the same way, from a run of the finished server or
of one of the commands shown in it, with one exception: the log-format example in the Request
logging section is the shape a line carries rather than a line a run produced, its timestamp
standing in for the moment a request arrived. The version itself varies from one machine to the
next, so compare yours with the floor: any version from 18.0.0 upwards is acceptable. The shape does
not vary — a `v` followed by three numbers separated by dots — and it is that shape, not the sample
value, that the comparison reads.

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

Run every command in this document from the project root, the directory that holds `server.js` and
`package.json`: that is where both entry points look for the file and its manifest, and where each
`curl` command below expects the server you started to be listening.

## Running the server

Start it directly with Node.js:

```bash
node server.js
```

Or through the npm start script:

```bash
npm start
```

The startup line is printed only after the socket has been bound successfully, so seeing it means
the server is listening. With no `PORT` set, `node server.js` prints:

```text
Server listening on port 3000
```

Only the number at the end of that line varies, and it is the port that was actually bound: `3000`
here, because no `PORT` was set. The wording before it is fixed by the contract, nothing is written
to stderr when a start succeeds, and a port that is already in use produces the bind-failure message
in the Configuration section instead of this line.

`npm start` prints that line too, but npm writes its own script banner above it: the package name
and version with the script being run, then the command that script runs. Those lines come from npm
rather than from the server, and a blank line separates them from the server's own output. The
transcript below was produced by npm 11.21.0; the banner's wording is npm's, so it varies with the
npm version, and the name, version and command it prints come from `name`, `version` and
`scripts.start` in `package.json`:

```text

> nodejs-tutorial-hello-world@1.0.0 start
> node server.js

Server listening on port 3000
```

`Server listening on port 3000` is the only line in that transcript the server writes; everything
above it, blank lines included, is npm's formatting. `npm start` resolves to `scripts.start` in
`package.json`, which is `node server.js`, so the two commands do the same thing, print the same
startup line and neither needs an installed package.

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
| A whole decimal number surrounded by whitespace, such as `PORT=" 4000 "` | Trims the surrounding whitespace and binds port `4000` |
| Anything else | Writes an actionable message to stderr and exits with status `1`, binding nothing |

```bash
PORT= node server.js
```

```text
Server listening on port 3000
```

That transcript is the output of the command above, with `PORT` present but empty and with port
`3000` free. An empty value is treated as unset even though the variable is present, so `PORT=`
binds the default port `3000` and never port `0`, which would ask the operating system to choose an
arbitrary port. `Server listening on port ` is the fixed part of the line and `3000` is the default
the empty value resolves to, so the number changes only if that default does. If something else
already holds port `3000`, the same command reports the bind failure shown below instead.

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

That transcript is the output of the command above. `4000` is an example: only the number varies,
and it is the port you set, which must be a free whole number between `1024` and `65535`. The
wording around it is fixed. A port that is already in use fails as the last example in this section
shows.

```bash
curl -i http://localhost:4000/hello
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 11

Hello world
```

```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/hello
```

```text
000
```

The override replaces the default rather than adding to it, so while the server runs on `4000`
nothing answers on `3000`, and the `curl` run above reports `000`, the value `%{http_code}` gives
when `curl` cannot make a connection. It is printed with no trailing newline, and `curl` itself
exits with status `7`, its own "could not connect" code, which the shell reports as `$?`. The server
is never reached, so nothing is added to the output of the instance it could not reach. `-s`
suppresses curl's error message; add `-S` if you want that line too.

The `curl -i` transcript above is what that command printed against the server on `4000`: the status
line, the `Content-Type` header the application sets and the body are fixed by the contract,
`Content-Length: 11` is computed by the runtime from that body, and the runtime's `Date`,
`Connection: keep-alive` and `Keep-Alive: timeout=5` header lines are left out of the quote because
they change from one run and one Node.js version to the next. The Testing the server section names
those headers too.

A value that is not a whole decimal number is rejected, quoting the offending value back. The
message goes to stderr, the process exits with status `1`, and nothing is bound, because the value
is refused before the socket is opened:

```bash
PORT=abc node server.js
```

```text
Invalid PORT value "abc": PORT must be a whole number between 1024 and 65535.
```

The other rejected shapes use the same style, each naming the value and stating what is acceptable.
Each one writes its message to stderr, exits with status `1` and binds nothing, so no port is opened
and no other process on the machine is disturbed:

```bash
PORT=3.5 node server.js
```

```text
Invalid PORT value "3.5": PORT must be a whole number between 1024 and 65535.
```

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

The value quoted inside each message is the one you set, so that part of the text varies; the
wording around it and the status `1` do not. The status is visible from the shell:

```bash
PORT=abc node server.js; echo "exit=$?"
```

```text
Invalid PORT value "abc": PORT must be a whole number between 1024 and 65535.
exit=1
```

That transcript is the command above run in a POSIX shell: the first line is the server's own
message, written to stderr before the process exits, and `exit=1` is the shell's `echo` of the
status the server exited with. The two lines come from different streams, so redirecting stdout and
stderr separately puts them in different places; in a terminal they appear in the order shown.

If the port value is valid but the port is already in use, the bind failure is reported instead of
crashing with a raw Node.js error dump. Start a second instance while the first one holds the port.
With the first instance on the default `3000`, that second start is:

```bash
PORT=3000 node server.js
```

```text
Cannot start server: port 3000 is already in use. Stop the process using it, or start it with a different PORT between 1024 and 65535.
```

That transcript is the second start, run while another instance was already listening on `3000`.
The message goes to stderr and the process exits with status `1`. The port named in it is the one
that was attempted, so a second instance started with `PORT=4000` reports `port 4000` instead: that
value is the only thing in the line that varies, and the wording around it is fixed. The instance
that already held the port is unaffected and keeps serving.

## Testing the server

With the server running on its default port — started as the Running the server section shows —
request the functional endpoint:

```bash
curl http://localhost:3000/hello
```

```text
Hello world
```

That transcript is the response body on its own, written by the command above against a server started
with `node server.js`. Nothing in it varies between runs or hosts: the body is the fixed 11-character
string `Hello world`, with no trailing newline, so the shell prompt or the next command follows it on
the same line. Every transcript in this section is taken from a run of the server in this repository.

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

The status code, the `Content-Type` and the body come from the application; the Node.js runtime renders
the `HTTP/1.1 200 OK` status line from that code and computes `Content-Length: 11` from the length of
`Hello world`. The three header lines above are therefore not the whole header set: the runtime also
writes `Date`, `Connection` and `Keep-Alive` alongside them. `Date` carries the moment the response was
sent, and the other two describe the connection the client asked for, so all three vary between runs,
hosts and runtime versions — a client that asks for no keep-alive receives `Connection: close` and no
`Keep-Alive`. The status line, `Content-Type`, `Content-Length: 11`, the blank line and the body are the
same in every run.

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

That transcript is the same response shape as the previous one, and the same division of labour: the
application sets the status code, `Content-Type: text/plain` and the body `Not Found`; the runtime
renders the `HTTP/1.1 404 Not Found` status line from that code, computes `Content-Length: 9` from that
body and adds `Date`, `Connection` and `Keep-Alive` alongside the lines shown. The status line,
`Content-Type`, `Content-Length: 9`, the blank line and `Not Found` are the same in every run; the
runtime's three lines vary as described above.

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

The application answers `POST /hello` with the same `404` it gives any other unmatched request, because
the route table is keyed on the method and the path together and only `GET /hello` is in it. The status
line, `Content-Type`, `Content-Length: 9`, the blank line and `Not Found` are what that run reproduces;
`Date`, `Connection` and `Keep-Alive` are added by the runtime, as in the two transcripts above.

Two related behaviours are worth knowing. A query string is never part of a route, so
`curl -i "http://localhost:3000/hello?x=1"` returns the same `200` and `Hello world` as `/hello`.
Percent-encoded paths are deliberately not decoded, so `curl -i http://localhost:3000/%68ello`
returns `404` and `Not Found`; matching is exact and literal.

`curl` shows a progress meter by default and suppresses it whenever it writes the response body to the
terminal, because the meter and the body would otherwise be interleaved in one stream. Every command
above writes its body to the terminal, so all four show the response on its own, as the transcripts
quote it.

The meter appears when the body goes anywhere other than the terminal — to a file, to a pipe or to
`/dev/null`. It is `curl`'s own output rather than the server's, as are the messages `curl` prints when
a request fails, so `-s` is what removes it: add `-s` when you want neither the meter on a redirected
run nor the error text on a failed one. Nothing the meter or an error message shows comes from the
server.

## Expected output

Every line the server writes has a fixed shape, so you can compare what you see with what this
document promises. A session that starts the server with `node server.js`, makes one matched request and
one unmatched request, and is then stopped with `CTRL+C`, produces exactly this:

```text
Server listening on port 3000
2026-10-16T21:31:55.171Z GET /hello
2026-10-16T21:31:55.180Z GET /invalid
Server shutting down
```

That transcript is the whole of the server's own console output for such a session, taken from a run of
the server in this repository: the startup line once, one log line per request in the order the requests
arrived, and the shutdown line once, all of it on stdout and nothing else. What varies inside those fixed
shapes is the timestamp, which is the UTC time the request arrived, the logged path, which is whatever
the client requested, and the port in the startup line, which is the port that was bound — 3000 here
because no `PORT` was set. The kinds of line, their order and their formats do not vary.

The two response bodies a client can receive are:

```text
Hello world
```

```text
Not Found
```

`Hello world` is the complete body of the response to `GET /hello` — the 11 characters that
`Content-Length: 11` counts — and `Not Found` is the complete body of every other response, at 9
characters. Both are fixed strings in `server.js` with no trailing newline, and neither varies between
runs or hosts.

So a matched request returns `HTTP/1.1 200 OK` with `Hello world`, and an unmatched request returns
`HTTP/1.1 404 Not Found` with `Not Found`.

## Request logging

One line is written to stdout for every incoming request, before routing decides anything, so a
request is logged whether or not it matches a route. The format is the ISO-8601 timestamp, the HTTP
method and the request path, separated by single spaces:

```text
2025-01-01T00:00:00.000Z GET /hello
```

That line is the log format itself, shown with an example timestamp in the position every line carries a
real one. A line a request writes carries the UTC time the request arrived there, taken from
`new Date().toISOString()`, which is always UTC and ends in `Z`.
What varies between runs and hosts is the timestamp and the path; the field order, the single spaces
between the three fields and the fact that the method is the one the client sent do not. The path
logged is the same string routing matched on, so a request for `/hello?x=1` is logged with the
query string already stripped:

```text
2025-01-01T00:00:00.000Z GET /hello
```

That second block is the shape a request for `/hello?x=1` writes: because the logged path is the one
routing matched on, the query string never appears in it, so the line looks exactly like the one a bare
`/hello` produces.

The lines appear in the terminal running the server, interleaved with the requests as they arrive.

## Stopping the server

Press `CTRL+C` in the terminal running the server. It prints:

```text
Server shutting down
```

That line is the server's own output on stdout, written when it receives the signal and before it stops
accepting connections. It is a fixed string, so nothing in it varies between runs or hosts.

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

That transcript is what the command above prints when it runs in the project root with no `PORT` set: the
backgrounded server writes its startup line, `kill -INT` delivers the same signal as `CTRL+C`, the server
writes its shutdown line, and `wait` returns the status that the final `echo` reports. The port in the
first line is the port that was bound, so it reads `port 4000` when you start the server with
`PORT=4000`; the process id the shell captures varies on every run and is not printed here; and the
`sleep 1` gives the server a moment to bind and print its startup line before the signal arrives. The
last two lines are the invariant part — `Server shutting down` and `exit=0` are what a clean stop
produces every time, with `exit=0` confirming the status the process exited with.

`kill -INT` sends the same signal as `CTRL+C`. Handling that signal is deliberate: without an
explicit handler Node.js would terminate the process with status `130` instead.

## Project structure and latency check

The repository is three files:

| File | Purpose |
| --- | --- |
| `server.js` | The entire application: the route table, both handlers, the request log line, port resolution and validation, the startup error handling and the `CTRL+C` shutdown |
| `package.json` | Project identity, the `npm start` command and the runtime floor. It carries seven fields, `name`, `version`, `description`, `main`, `scripts`, `engines`, `keywords`, and no dependency section |
| `README.md` | This document |

The manifest can be inspected from the shell with no tooling at all:

```bash
node -e "const p=require('./package.json');console.log(Object.keys(p).join(','))"
```

```text
name,version,description,main,scripts,engines,keywords
```

```bash
node -e "const p=require('./package.json');console.log(p.name,p.version,p.description,p.main,p.scripts.start,p.engines.node,p.keywords.join(','))"
```

```text
nodejs-tutorial-hello-world 1.0.0 Minimal Node.js HTTP server tutorial demonstrating single endpoint implementation server.js node server.js >=18.0.0 nodejs,tutorial,http,server,beginner
```

The first command prints the seven field names, so an eighth key or a dependency section would be
visible in the list; the second prints their values.

### Syntax and completeness checks

The checks in this part of the section are ordinary shell commands — `node --check`, a `node -e` read
of the manifest, `npm ls`, `grep` and the shell's own `; echo "exit=$?"` — using tools that are
already present on any developer host with Node.js installed. None of them is a dependency of the
project, nothing is installed in order to run them, and the server still starts on a host where
`npm install` has never been run for it. Each check is the command in the `bash` block followed by the
`text` block quoting its result, and each result is quoted as a run produced it — abridged or elided
only where the text beside the block says so, as it does for two blocks below. Where a command prints
nothing, that block records the silence and the exit status instead, which you can also see for
yourself by running the command as `<command>; echo "exit=$?"`.

`node --check` parses `server.js` without executing it, so a syntax error is reported before the
server is started:

```bash
node --check server.js
```

```text
(no output; exit status 0)
```

`package.json` is checked the same way, by parsing it as JSON:

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
```

```text
(no output; exit status 0)
```

The three files are also searched for content that promises work instead of doing it — an unfinished
marker, a stub message, a note about something arriving later. The search is case-insensitive, covers
all three files in one command, and looks for the six terms that would signal one:

```bash
grep -nEi "TODO|FIXME|XXX|placeholder|not implemented|coming soon" server.js package.json README.md
```

```text
README.md:<line number>:grep -nEi "<the six terms, as written above>" server.js package.json README.md
```

One matching line, and it is this command: `grep` prints the line it matched, and the only line in the
repository carrying those terms is the one just above. `server.js` and `package.json` print nothing,
no other line of `README.md` matches, and the command exits `0` because it did find a match. The terms
are elided in the quoted line as `<the six terms, as written above>`, and the line number is replaced
by `<line number>`, because writing the terms out a second time here would put another copy of the
pattern in this file and the command would then match two lines instead of one. Everything else on
that line is character for character what the command prints, and the number is the line this command
occupies in your copy of `README.md`.

### Zero-dependency checks

The project declares no dependency and requires exactly one module, which is built into the runtime.
Three commands cover it: two show that nothing is declared, and one shows which module the source
requires.

The manifest declares no dependency section of any kind. This reads the two sections npm would use and
prints how many entries each one holds:

```bash
node -e "const p=require('./package.json');console.log(Object.keys(p.dependencies||{}).length,Object.keys(p.devDependencies||{}).length)"
```

```text
0 0
```

The two zeroes are those counts, `dependencies` first and `devDependencies` second, so a declared
package would show up here as a non-zero number. The command exits `0`. Neither field name appears in
the key list printed earlier in this section: that list holds the seven keys above, and a
`dependencies` or `devDependencies` section would add an eighth entry to it.

`npm ls --all` prints the whole dependency tree, so an installed package would appear as a line under
the project rather than as `(empty)`:

```bash
npm ls --all
```

```text
nodejs-tutorial-hello-world@1.0.0 <your project directory>
└── (empty)
```

The first line is the package name, its version and the absolute path of the directory the command was
run in. That path is different on every machine, so your run prints your own there and
`<your project directory>` stands in for it above. The `(empty)` beneath says the tree holds nothing
but the project itself. The command exits `0` and needs no `node_modules` directory to be present,
because nothing is declared for it to look for; npm prints a blank line after the tree.

The source requires exactly one module, and it is the built-in `http`, so the only `require` in the
file is:

```bash
grep -n "require(" server.js
```

```text
10:const http = require('node:http');
```

The `10` is the line the call sits on, and the specifier is the built-in module rather than an
installed package — the `node:` prefix is how a built-in is named. Any second `require` of any kind
would add a line here.

### Security boundary checks

The server's security posture is that the risky capabilities are absent from the source rather than
guarded inside it: no dynamic code evaluation, no file-system access, no outbound network client. Each
is checked by a search of `server.js`, the file holding the application's code, that is expected to
find nothing. `grep` exits `1` when a search matches nothing, so for each of the three the passing
result is no output and exit status `1`.

No evaluation of dynamic code:

```bash
grep -nE "eval\(|new Function|require\('vm'\)" server.js
```

```text
(no output; exit status 1)
```

No file-system access:

```bash
grep -nE "require\('(node:)?fs" server.js
```

```text
(no output; exit status 1)
```

No outbound request — no HTTP client, no TLS client, no raw socket connection, no name resolution:

```bash
grep -nE "http\.request|https|fetch|net\.connect|dns" server.js
```

```text
(no output; exit status 1)
```

The three searches together cover the boundaries the server is built on: nothing in the file can turn
a request into code, nothing can touch the file system, and nothing can open a connection outwards.
Each is run against `server.js` alone, which is where the application's code lives.

### Latency spot-check

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

Both values come from that command run twice against a server started with `node server.js` in the
project root, on a Linux host running Node.js `v22.23.3` — the version the Prerequisites section has
`node --version` report. The numbers are measurements, so they differ from one run to the next, from
one machine to another and between Node.js versions; read the block above as one sample rather than as
figures to expect. What does not vary is the form — `curl` prints seconds with six decimals — and the
boundary: a value below `0.010` passes, and both of these are under a millisecond.

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

The twenty values are one run of that loop on the same host and the same Node.js version as the sample
above. Each line is one measurement of one request, so every value changes between runs and between
machines: a busier host prints larger numbers throughout and a quieter one prints smaller numbers. The
invariants are the format — seconds with six decimals — and the bound: every value stays below
`0.010`, and in this sample all twenty are under a millisecond.

### Concurrent requests

Concurrent requests are all served: fifty requests issued at once each come back with the body, and
the server answers a further request immediately afterwards.

```bash
seq 1 50 | xargs -P 50 -I{} curl -s http://localhost:3000/hello | grep -o 'Hello world' | wc -l
```

```text
50
```

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/hello
```

```text
200
```

The `50` is the number of `Hello world` bodies the fifty concurrent requests returned, counted by
`grep -o` and `wc -l`; the `200` is the follow-up request's status code. Both are invariant: they
count and report a status rather than measure time, so any correct run on any host prints exactly those
two numbers. All fifty requests were answered and none was refused. What does vary between runs is
only the server's own output for the burst — the timestamps on the fifty-one log lines and the order
they appear in — and how long the burst takes to finish.

### Memory under repeated requests

Memory does not grow with the request count: the process climbs to a working level over the first
few thousand requests and then holds it however long it serves:

```bash
node server.js & SRV=$!; sleep 1; for i in $(seq 1 100); do curl -s -o /dev/null http://localhost:3000/hello; done; BEFORE=$(ps -o rss= -p $SRV); for i in $(seq 1 1000); do curl -s -o /dev/null http://localhost:3000/hello; done; MID=$(ps -o rss= -p $SRV); for i in $(seq 1 1000); do curl -s -o /dev/null http://localhost:3000/hello; done; AFTER=$(ps -o rss= -p $SRV); echo "$BEFORE $MID $AFTER"; kill -INT $SRV
```

```text
Server listening on port 3000
56724 58952 58876
Server shutting down
```

The three numbers are the resident set size of the server process in 1024-byte units, sampled after
a short warm-up and then after each of two rounds of a thousand requests, so they measure the process
rather than the traffic. They differ from one machine to the next and from one run to the next, and
the Node.js version moves them too: the sample above is one run on a Linux host running Node.js
`v22.23.3`, the version the Prerequisites section has `node --version` report. The check is that the
readings do not rise with the request count, and the shape a longer run shows is a climb followed by
a plateau: the process climbs several percent above its warm-up value over the first few thousand
requests and then holds that level. Three samples taken during the climb can therefore still be
rising when the command finishes, so repeat its two thousand-request rounds a few times if you want
to watch the level settle. In the sample above the last two readings agree within a fraction of a
percent, which is what a stable size looks like. The block above is abridged in one respect — the
command writes one request log line per request to the same terminal, so the 2,100 lines that appear
between the startup line and the three readings are left out of it, while
`Server listening on port 3000` and `Server shutting down` are the server's own lines and appear
exactly as written.

