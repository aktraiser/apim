import express from "express";
import fetch from "node-fetch";
import https from "https";

const app = express();
app.use(express.json());

// Agent to ignore SSL certificate errors (needed for some upstream connections)
const sslAgent = new https.Agent({
    rejectUnauthorized: false
});

app.all("*", async (req, res) => {
    try {
        const targetUrl = "https://cloud.feedly.com" + req.originalUrl;

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                ...req.headers,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Host": "cloud.feedly.com"
            },
            body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
            agent: sslAgent
        });

        const data = await response.text();
        res.status(response.status).send(data);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

app.listen(3000, () => console.log("Proxy Feedly OK sur port 3000"));
