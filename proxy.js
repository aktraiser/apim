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
                "Host": "cloud.feedly.com",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Cache-Control": "max-age=0"
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
