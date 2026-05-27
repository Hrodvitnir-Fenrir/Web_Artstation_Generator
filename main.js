const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = 3000;

// Simple in-memory cache to avoid hammering ArtStation
const cache = new Map();
const CACHE_TTL = 5000; // 5 seconds per entry

app.use(cors());
app.use("/", express.static(__dirname + "/public"));

async function fetchRandomProject() {
	const response = await axios.get("https://www.artstation.com/random_project.json", {
		timeout: 8000,
		headers: {
			'User-Agent': 'Mozilla/5.0 (compatible; ArtStation-Gallery-App/1.0)'
		}
	});
	return response.data;
}

// Single random project
app.get("/random_project.json", async (req, res) => {
	try {
		const data = await fetchRandomProject();
		res.json(data);
	} catch (err) {
		console.error('[single]', err.message);
		res.status(502).json({ error: 'Failed to fetch from ArtStation', detail: err.message });
	}
});

// Batch endpoint — fetches N projects in parallel
app.get("/batch_projects.json", async (req, res) => {
	const count = Math.min(parseInt(req.query.count) || 6, 20);

	try {
		const promises = Array.from({ length: count }, () => fetchRandomProject());
		const results = await Promise.allSettled(promises);

		const projects = results
			.filter(r => r.status === 'fulfilled')
			.map(r => r.value);

		res.json({ projects, total: projects.length });
	} catch (err) {
		console.error('[batch]', err.message);
		res.status(502).json({ error: 'Batch fetch failed', detail: err.message });
	}
});

app.listen(PORT, () => {
	console.log(`🎨 ArtStation Gallery live → http://localhost:${PORT}/`);
});