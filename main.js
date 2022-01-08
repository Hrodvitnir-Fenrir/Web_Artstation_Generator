const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = 3000;

app.use(cors());
app.use("/", express.static(__dirname + "/public"));

app.use("/random_project.json", async (req, res) => {
	try {
		const result = await axios.get("https://www.artstation.com/random_project.json");
		res.json(result.data);
		return;
	} catch (err) {
		console.log(err);
		res.status(500);
		return;
	}
});

app.listen(PORT, () => {
	console.log("I'm live at http://localhost:" + PORT + "/");
});
