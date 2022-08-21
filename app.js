const http = require("http");
const fs = require("fs");
const port = 3000;

const server = http.createServer(function (req, res) {
	if (req.url == "/") {
		fs.readFile("./workshop.html", function (err, html) {
			if (err) {
				res.send(500, { error: err });
			}
			res.writeHeader(200, { "Content-Type": "text/html" });
			res.write(html);
			res.end();
		});
	} else if (req.url == "/script.js") {
		fs.readFile("./script.js", function (err, jsFile) {
			if (err) {
				res.send(500, { error: err });
			}
			res.writeHeader(200, { "Content-Type": "text/javascript" });
			res.write(jsFile);
			res.end();
		});
	} else if (req.url == "/styles.css") {
		fs.readFile("./styles.css", function (err, jsFile) {
			if (err) {
				res.send(500, { error: err });
			}
			res.writeHeader(200, { "Content-Type": "text/css" });
			res.write(jsFile);
			res.end();
		});
	}

	// res.writeHead(200, { "Content-Type": "text/html" });
	// fs.readFile("workshop.html", function (error, data) {
	// 	if (error) {
	// 		res.writeHead(404);
	// 		res.write("Error:File Not Found");
	// 	} else {
	// 		res.write(data);
	// 	}
	// 	res.end();
	// });
});

server.listen(port, function (error) {
	if (error) {
		console.log("Something went wrong", error);
	} else {
		console.log("Server is listening on port" + port);
	}
});
