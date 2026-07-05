// Tiny round-robin load balancer with failover — dependency-free (Node stdlib).
// Stands in for Nginx when you want to prove the multi-instance topology WITHOUT
// Docker. If a backend is down (ECONNREFUSED / reset / timeout) the request
// transparently retries the next one → zero-downtime rolling restarts.
//
//   BACKENDS=3041,3042 LB_PORT=3040 node lb.mjs
import http from "node:http";

const BACKENDS = (process.env.BACKENDS || "3041,3042")
  .split(",")
  .map((p) => parseInt(p, 10));
const LB_PORT = parseInt(process.env.LB_PORT || "3040", 10);
let rr = 0;

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const tried = new Set();
    const attempt = () => {
      if (tried.size >= BACKENDS.length) {
        res.writeHead(502);
        res.end("no backend");
        return;
      }
      let port;
      do {
        port = BACKENDS[rr++ % BACKENDS.length];
      } while (tried.has(port) && tried.size < BACKENDS.length);
      tried.add(port);
      const proxy = http.request(
        {
          host: "127.0.0.1",
          port,
          path: req.url,
          method: req.method,
          headers: req.headers,
          timeout: 2000,
        },
        (pres) => {
          res.writeHead(pres.statusCode, pres.headers);
          pres.pipe(res);
        },
      );
      proxy.on("error", () => attempt()); // failover
      proxy.on("timeout", () => proxy.destroy());
      proxy.end(body);
    };
    attempt();
  });
});

server.listen(LB_PORT, () =>
  console.log(`LB :${LB_PORT} -> ${BACKENDS.join(",")}`),
);
