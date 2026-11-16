# Study Programme Information Server

## Setup and Execution
1. Clone this repository to your local machine: `git clone https://github.com/CemalSafa/assignment8.git`, then go into the folder with `cd assignment8`.
2. Run `npm install` to download and install the required dependencies.
3. Start the development server by running `npm run dev` (or `npm start` for standard execution).
4. Open your web browser and navigate to `http://localhost:3000`.

## File Organization
- `server.js`: The main Express server application containing the route definitions and middleware.
- `package.json`: Contains project metadata, scripts, and list of dependencies.
- `package-lock.json`: Records the exact versions of the installed packages.
- `.gitignore`: Keeps `node_modules/` and `.env` out of the repository.
- `README.md`: This file.
- `public/`: Directory containing all static frontend assets.
  - `index.html`: The main web page structure.
  - `styles.css`: Stylesheet for the web page.
  - `app.js`: Frontend JavaScript responsible for fetching and displaying data from the API.

## Routes

| Method and path | Behaviour | 
| ----- | ----- | 
| GET / | the page, public/index.html | 
| GET /hello | plain text | 
| GET /robots.txt | plain text file body | 
| GET /old-page | redirects to /hello | 
| GET /api/courses | JSON array of courses | 
| GET /api/status | status, nodeVersion and uptimeSeconds of the running process | 
| GET /api/headers | echoes the User-Agent and Accept headers | 
| POST /api/subscribe | 201 with `{ "subscribed": true }` | 
| GET /api/admin | 403 with `{ "error": "Forbidden" }` | 
| GET /api/stats | `{ "requestsServed": <number> }` | 
| anything else | 404 (JSON for paths starting with /api, text otherwise) | 

## Middleware

### Request logger and request counter

The request counter and logger middleware are placed at the very top of the application stack, before any specific routes or static file declarations. Because of this global placement, **every single incoming request** is counted and logged. This includes requests for static files (like `index.html`), requests that ultimately result in a 404 error, and even requests to the `/api/stats` endpoint itself. Counting everything provides a true metric of the total traffic load the server handles.

### Order of the middleware

Middleware functions in Express execute sequentially in the exact order they are defined.

1. **Global Middleware (Logger, Counter):** Registered first so they can process, log, or count the request before it reaches any route.
2. **Static Files (`express.static`):** Registered next to serve files from the `public` directory if the URL matches a filename.
3. **Specific Routes (`/hello`, `/api/...`):** Registered after. If a request matches the route path, it is processed here, and the response is sent.
4. **Catch-all (404 Not Found):** Registered at the very bottom. If a request trickles down past all defined routes and static files without finding a match, this final middleware catches it and returns the appropriate 404 error.

## Testing evidence (curl)

### Successful JSON response

```
$ curl --include -X GET http://localhost:3000/api/courses
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 190
ETag: W/"be-l2WtjrAzQmwTfP3R9Wx4Wz8LMKw"
Date: Mon, 16 Nov 2026 18:35:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":1,"title":"Introduction to Programming","credits":4},{"id":2,"title":"Object-Oriented Software Design","credits":4},{"id":3,"title":"Web Programming and Back-End Basics","credits":3}]
```

### 201 response

```
$ curl --include -X POST http://localhost:3000/api/subscribe
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 19
ETag: W/"13-oWAPIqDXuocNexKhPYW9ayyk98c"
Date: Mon, 16 Nov 2026 18:35:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"subscribed":true}
```

### 403 response

```
$ curl --include -X GET http://localhost:3000/api/admin
HTTP/1.1 403 Forbidden
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-TLNzmZqKxaTuFdX/dVWWPBu44/c"
Date: Mon, 16 Nov 2026 18:35:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Forbidden"}
```

### Redirect

```
$ curl --include -X GET http://localhost:3000/old-page
HTTP/1.1 302 Found
X-Powered-By: Express
Location: /hello
Vary: Accept
Content-Type: text/plain; charset=utf-8
Content-Length: 28
Date: Mon, 16 Nov 2026 18:35:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Found. Redirecting to /hello
```

### 404 response on an /api path

```
$ curl --include -X GET http://localhost:3000/api/nope
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-bm7tJgu8FHlq5QU+Y6gDxOGPfRc"
Date: Mon, 16 Nov 2026 18:35:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Not found"}
```

### 404 response on a non-API path

```
$ curl --include -X GET http://localhost:3000/nope
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Content-Length: 39
ETag: W/"27-pMQB9cj83kIjS/YnQJ3PWlAOj0g"
Date: Mon, 16 Nov 2026 18:35:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

404 Not Found: this page does not exist
```

## Reasoning questions

### 1. Route order

**(Experiment):** If I move the catch-all 404 middleware `app.use((req, res) => { ... })` to the very top of `server.js` (above all other routes), every single request I make (whether it's `/`, `/hello`, or `/api/courses`) immediately returns a 404 error. The execution stops at the top because the middleware ends the cycle, and the valid routes below it are never reached.

### 2. Middleware

**(Experiment):** If I remove the `next()` call from my logger middleware, the server terminal still prints the log message, but the browser just spins endlessly waiting for a response. When using `curl /hello`, the request hangs and eventually times out. Because there is no `next()` to pass control, and no `res.send()` to end the response, the request is left hanging in limbo.

### 3. Status codes

`201 Created` specifically tells the client that the POST request successfully resulted in a new resource (like a subscription), whereas 200 just means "OK". 
When handling missing pages, returning a `404` instead of a `200` with an error body is required by HTTP semantics. If we return `200`, browsers and search engine bots will think the page loaded successfully, which can lead to caching false data or indexing error pages. A `404` correctly communicates the absence of the resource at the protocol level.

### 4. Configuration

Environment variables (like `process.env.PORT`) are used so the application can be configured dynamically by the host environment (like Heroku or a Docker container) without modifying the source code. Hardcoding `const PORT = 3000` makes deployment inflexible.

### 5. Dependencies

The `node_modules` folder is not committed to Git because it is extremely large and contains thousands of files that can be easily regenerated. Committing it wastes repository space and can cause cross-platform issues (some native modules need to be built specifically for Windows/Mac/Linux). When someone clones this repository, they must run the `npm install` command in their terminal, which reads the `package.json` file and downloads the exact required dependencies fresh for their system.

### 6. Same origin

If I double-click `index.html` and open it directly from disk (using the `file:///...` protocol) instead of through the server, clicking the button to fetch courses will fail. The `fetch('/api/courses')` call tries to look for the API relative to the local file system (which doesn't exist). Even if we hardcode the URL to `http://localhost:3000`, the browser's Same-Origin Policy will block the request because a local `file://` script is not allowed to communicate with an `http://` server without explicit CORS permissions.

## Self-study notes

### Node version and running time of the process

Express can access the global Node.js `process` object. I used `process.version` to retrieve the current Node version string, and `process.uptime()` to get the number of seconds the server process has been running since it started.

### Sending a specific content type (robots.txt)

When serving raw text for routes like `/robots.txt`, we can use `res.type('text/plain')` before using `res.send()`. This sets the `Content-Type` header and ensures browsers and bots interpret it as a plain text file rather than HTML.

### Showing JSON neatly in the page

To show the JSON neatly formatted on the HTML page, I used `JSON.stringify(data, null, 2)` inside `app.js` before inserting it into the `<pre>` tag. The `null` is for the replacer function (which we don't need), and the `2` specifies the number of spaces for indentation, which formats the raw JavaScript object into a highly readable, multi-line JSON string.

### Challenges I faced

- Testing the API returned 403 and 404 errors in the console, which I initially thought were bugs in my code, until I realized it was just the browser logging the expected HTTP error codes from my fetch requests.
- At first I thought the port would change when I started the server from a different folder. I learned that these are two separate tests: starting the server from another folder checks the file paths, and the port only changes when the `PORT` environment variable is set, for example `PORT=4000 node server.js`.