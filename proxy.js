import express from "express";
import cloudscraper from "cloudscraper";

const app = express();
app.use(express.json());

app.all("*", async (req, res) => {
    try {
        const targetUrl = "https://cloud.feedly.com" + req.originalUrl;

        const options = {
            uri: targetUrl,
            method: req.method,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
            resolveWithFullResponse: true,
            simple: false // Do not throw error for 4xx/5xx
        };

        // Cloudscraper uses Request-Promise API
        const response = await cloudscraper(options);

        res.status(response.statusCode).send(response.body);
    } catch (err) {
        console.error("Proxy Error:", err);
        res.status(500).send({ error: err.message || "Proxy Error" });
    }
});

app.listen(3000, () => console.log("Proxy Feedly OK sur port 3000"));
