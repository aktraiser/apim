import express from "express";
import axios from "axios";

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

        // force realistic browser headers
        headers["Host"] = "cloud.feedly.com";
        headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        headers["Accept"] = "application/json, text/plain, */*";
        headers["Accept-Language"] = "en-US,en;q=0.9,fr;q=0.8";
        headers["Accept-Encoding"] = "gzip, deflate, br";
        headers["Cache-Control"] = "no-cache";
        headers["Pragma"] = "no-cache";
        headers["Origin"] = "https://feedly.com";
        headers["Referer"] = "https://feedly.com/";
        headers["Sec-Ch-Ua"] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
        headers["Sec-Ch-Ua-Mobile"] = "?0";
        headers["Sec-Ch-Ua-Platform"] = '"Windows"';
        headers["Sec-Fetch-Dest"] = "empty";
        headers["Sec-Fetch-Mode"] = "cors";
        headers["Sec-Fetch-Site"] = "same-site";

        // Configuration proxy Oxylabs
        const response = await axios({
            method: req.method,
            url: targetUrl,
            headers,
            data: req.method !== "GET" ? req.body : undefined,
            proxy: {
                protocol: 'http', // Force HTTP proxy
                host: 'pr.oxylabs.io',
                port: 7777,
                auth: {
                    username: 'customer-acoustics_8n8VE-cc-US',
                    password: 'ELsoleil1234_'
                }
            },
            httpsAgent: new (await import('https')).Agent({ 
                rejectUnauthorized: false // Ignore SSL certificate errors
            }),
            validateStatus: () => true // Accept all status codes
        });

        res.status(response.status).send(response.data);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

app.listen(3000, () => console.log("Proxy Feedly OK sur port 3000"));