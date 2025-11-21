import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.all("*", async (req, res) => {
  console.log("AUTH HEADER =", req.headers.authorization);

  try {
    const targetUrl = "https://cloud.feedly.com" + req.originalUrl;

    // ✅ clone + clean headers
    const headers = { ...req.headers };

    // remove hop-by-hop / bad headers
    delete headers.host;
    delete headers.connection;
    delete headers["content-length"];
    delete headers["accept-encoding"];

    // force good host + UA
    headers["Host"] = "cloud.feedly.com";
    headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(3000, () => console.log("Proxy Feedly OK sur port 3000"));
