import express from "express";
import { exec } from "child_process";
import { promisify } from "util";

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.all("*", async (req, res) => {
    console.log("AUTH HEADER =", req.headers.authorization);
    console.log("RAW BODY =", req.body.toString());
    
    // Parse JSON manually
    let body;
    try {
        body = JSON.parse(req.body.toString());
    } catch (e) {
        console.log("JSON Parse Error:", e.message);
        return res.status(400).json({ error: "Invalid JSON", raw: req.body.toString() });
    }

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

        // Build curl command with Oxylabs proxy
        const execAsync = promisify(exec);
        const headerArgs = Object.entries(headers)
            .map(([key, value]) => `-H "${key}: ${value}"`)
            .join(' ');
        
        let curlCmd;
        if (req.method !== "GET") {
            // Write body to temp file to avoid shell escaping issues
            const bodyData = JSON.stringify(body);
            const fs = await import('fs');
            const tmpFile = '/tmp/body.json';
            fs.writeFileSync(tmpFile, bodyData);
            curlCmd = `curl -x pr.oxylabs.io:7777 -U "customer-acoustics_8n8VE-cc-US:ELsoleil1234_" -H "Authorization: ${headers.authorization}" -H "Content-Type: application/json" -d @${tmpFile} "${targetUrl}" -s -i --compressed`;
        } else {
            curlCmd = `curl -x pr.oxylabs.io:7777 -U "customer-acoustics_8n8VE-cc-US:ELsoleil1234_" -H "Authorization: ${headers.authorization}" "${targetUrl}" -s -i --compressed`;
        }
        
        console.log("CURL Command:", curlCmd);
        
        const { stdout, stderr } = await execAsync(curlCmd);
        
        console.log("CURL stdout:", stdout.substring(0, 500));
        if (stderr) console.log("CURL stderr:", stderr);
        
        // Parse HTTP response - take the LAST HTTP response (skip proxy response)
        const lines = stdout.split('\n');
        
        // Find all HTTP status lines
        const httpStatusLines = lines.map((line, index) => ({ line, index }))
            .filter(({ line }) => line.match(/HTTP\/[\d\.]+\s+\d+/));
        
        // Take the last HTTP status (the real response from Feedly)
        const lastHttpStatus = httpStatusLines[httpStatusLines.length - 1];
        const statusMatch = lastHttpStatus.line.match(/HTTP\/[\d\.]+ (\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 200;
        
        // Find body after the last HTTP response headers
        const startFromLine = lastHttpStatus.index;
        const remainingLines = lines.slice(startFromLine);
        const emptyLineIndex = remainingLines.findIndex(line => line.trim() === '');
        const body = remainingLines.slice(emptyLineIndex + 1).join('\n');
        
        res.status(status).send(body);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

app.listen(3000, () => console.log("Proxy Feedly OK sur port 3000"));