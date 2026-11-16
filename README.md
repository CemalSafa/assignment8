## Routes

| Method and path | Behaviour |
|---|---|
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
1. **Global Middleware (Logger, Counter, Parsers):** Registered first so they can process, log, or count the request before it reaches any route.
2. **Specific Routes (`/hello`, `/api/...`):** Registered next. If a request matches the route path, it is processed here, and the response is sent (ending the request-response cycle).
3. **Catch-all (404 Not Found):** Registered at the very bottom. If a request trickles down past all defined routes without finding a match, this final middleware catches it and returns the appropriate 404 error.

## Testing evidence (curl)

**1. GET /api/courses**
```bash
$ curl -i http://localhost:3000/api/courses
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 79

[{"id":1,"name":"Control Engineering"},{"id":2,"name":"Software Engineering"}]
```

**2. POST /api/subscribe**
```bash
$ curl -i -X POST http://localhost:3000/api/subscribe
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Content-Length: 21

{"subscribed":true}
```

**3. GET /api/admin**
```bash
$ curl -i http://localhost:3000/api/admin
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Content-Length: 21

{"error":"Forbidden"}
```

**4. 404 Handling (API vs Web)**
```bash
$ curl -i http://localhost:3000/api/unknown-endpoint
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":"Not Found"}

$ curl -i http://localhost:3000/random-page
HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8

404 - Page Not Found
```

## Reasoning questions

### 1. Route order

**(Experiment):** If a catch-all route like `app.get('*', ...)` is placed before `app.get('/hello', ...)`, the generic `*` route will intercept the request first and end the cycle. The `/hello` route will become unreachable. Routes must always be ordered from most specific to least specific.

### 2. Middleware

**(Experiment):** If the request logger middleware is placed *after* the `GET /hello` route, any request to `/hello` will be fulfilled and terminated by `res.send()` before the execution flow ever reaches the logger. The logger will only fire for requests that fail to match the routes above it.

### 3. Status codes

Using correct HTTP status codes is crucial for API predictability. `201 Created` specifically tells the client that the POST request successfully resulted in a new resource (subscription). `403 Forbidden` clearly communicates an authorization failure for the admin route, whereas a `404` simply means the endpoint doesn't exist.

### 4. Configuration

Environment variables (like `process.env.PORT`) are used so the application can be configured dynamically by the host environment (like Heroku or a Docker container) without modifying the source code. Hardcoding `const PORT = 3000` makes deployment inflexible.

### 5. Dependencies

Dependencies are managed in `package.json`. Standard `dependencies` (like `express`) are required for the application to run in a production environment. `devDependencies` (like `nodemon`) are only used for local development convenience and aren't installed on production servers to save space and improve security.

### 6. Same origin

The Same-Origin Policy is a browser security feature. If a frontend application is hosted on a different domain or port (e.g., `localhost:5173`) than this Express API (`localhost:3000`), the browser will block the frontend from reading the API's responses. To fix this, we would need to implement CORS (Cross-Origin Resource Sharing) middleware in Express.

## Self-study notes

### Node version and running time of the process

Express can access the global Node.js `process` object. I used `process.version` to retrieve the current Node version string, and `process.uptime()` to get the number of seconds the server process has been running since it started.

### Sending a specific content type (robots.txt)

When serving raw text for routes like `/robots.txt`, we can use `res.type('text/plain')` or explicitly set the header with `res.setHeader('Content-Type', 'text/plain')` before using `res.send()`. This ensures browsers and bots interpret it as a plain text file rather than HTML.

### Showing JSON neatly in the page

Using `res.json(data)` is highly efficient. It not only converts a JavaScript object into a JSON string using `JSON.stringify()`, but it also automatically sets the `Content-Type: application/json` HTTP header. This prompts browsers and tools like Postman to neatly format and syntax-highlight the response.

### Challenges I faced

Differentiating the 404 response type based on the requested URL path. Since API clients expect JSON errors but web users expect text/HTML, I had to implement logic inside the final 404 middleware. I used `req.path.startsWith('/api/')` to check the URL and conditionally return `res.status(404).json(...)` for API endpoints, while falling back to `res.status(404).send(...)` for everything else.