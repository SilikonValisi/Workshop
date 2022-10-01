var obj = null;
var stage;
var layer;
var clicked = null;
var zIndex = 1;
var background;
function onChange(event) {
	var reader = new FileReader();
	reader.onload = onReaderLoad;
	reader.readAsText(event.target.files[0]);
}

function onReaderLoad(event) {
	// console.log(event.target.result);
	// obj = JSON.parse(event.target.result);
	// console.log(obj);
	// console.log(typeof obj);
	obj = event.target.result;
	start(obj);
}
document.getElementById("stageJsonFile").addEventListener("input", onChange);

start(obj);

function start(stageJSON) {
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");

	if (stageJSON == null) {
		stage = new Konva.Stage({
			container: "space", // id of container <div>
			width: window.innerWidth,
			height: window.innerHeight,
			draggable: true,
		});
	} else {
		stage = Konva.Node.create(stageJSON, "space");
	}

	var color = "#000000";
	size = 30;
	var isPaint = false;

	stage.on("click", function (e) {
		// e.target is a clicked Konva.Shape or current stage if you clicked on empty space
		clicked = e.target;
		// console.log("clicked on", e.target);
		if (e.target.parent != null) {
			tr.nodes([e.target]);
			zIndex++;
			clicked.setZIndex(zIndex);
		}
	});

	// var group = new Konva.Group({});

	// then create layer
	layer = new Konva.Layer();
	// layer.add(group);
	stage.add(layer);
	var tr = new Konva.Transformer();
	layer.add(tr);

	var isPaint = false;
	var mode = "Pointer";
	var lastLine;
	var actionHistory = [];
	var control = false;
	stage.on("dragmove", (e) => {
		if (isPaint) {
			stage.stopDrag();
		}
	});

	window.addEventListener("keydown", (e) => {
		if (e.key == "Delete") {
			clicked.destroy();
			tr.nodes([]);
		}
		if (e.key == "Control") {
			control = true;
		}
		if (e.key == "z" && control) {
			var pop = actionHistory.pop();
			pop.remove();
			tr.nodes([]);
		}
	});

	window.addEventListener("keyup", (e) => {
		if (e.key == "Control") {
			control = false;
		}
	});

	window.addEventListener("paste", (e) => {
		var items = (e.clipboardData || e.originalEvent.clipboardData).items;

		var item = items[0];

		if (item.kind === "file") {
			var blob = item.getAsFile();
			var reader = new FileReader();
			reader.onload = function (event) {
				var img = new Image();

				img.onload = function () {
					const width = img.width; //for some reason it changes after append so we do this.
					const height = img.height;

					var img2 = new Konva.Image({
						x: stage.getRelativePointerPosition().x,
						y: stage.getRelativePointerPosition().y,
						image: img,
						width: width,
						height: height,
						name: "image",
						draggable: true,
					});
					layer.add(img2);
					img.style.width = width + "px";
					img.style.height = height + "px";
					tr.nodes([img2]);
					actionHistory.push(img2);
				};
				img.src = event.target.result;
			};
			reader.readAsDataURL(blob);
		} else if (item.kind == "string") {
			navigator.clipboard
				.readText()
				.then((text) => {
					var text = new Konva.Text({
						x:
							stage.getRelativePointerPosition().x -
							ctx.measureText(text).width,
						y: stage.getRelativePointerPosition().y - size,
						text: text,
						fontSize: size,
						fontFamily: "Calibri",
						fill: color,
						draggable: true,
					});
					layer.add(text);
					// var tr = new Konva.Transformer();
					// layer.add(tr);
					tr.nodes([text]);
					actionHistory.push(text);
				})
				.catch((err) => {
					console.error("Failed to read clipboard contents: ", err);
				});
		}
	});

	function drawText(text, x, y, size, font) {
		ctx.font = `${size}px ${font}`;
		ctx.fillText(text, x, y);
	}

	function getStage() {
		return stage;
	}
	function getStageJson() {
		return stage.toJSON();
	}

	stage.on("mousedown touchstart", function (e) {
		if (mode === "brush" || mode == "line") {
			// || mode === "eraser"
			stage.stopDrag();
			isPaint = true;
			var pos = {};
			pos.x = stage.getRelativePointerPosition().x;
			pos.y = stage.getRelativePointerPosition().y;
			lastLine = new Konva.Line({
				stroke: color,
				strokeWidth: size,
				globalCompositeOperation: "source-over",
				// round cap for smoother lines
				lineCap: "round",
				lineJoin: "round",
				// add point twice, so we have some drawings even on a simple click
				points: [pos.x, pos.y, pos.x, pos.y],
				draggable: true,
			});
			layer.add(lastLine);
		} else if (mode == "line") {
			stage.stopDrag();
			isPaint = true;
			var pos = {};
			pos.x = stage.getRelativePointerPosition().x;
			pos.y = stage.getRelativePointerPosition().y;
			lastLine = new Konva.Line({
				stroke: color,
				strokeWidth: 5,
				globalCompositeOperation: "source-over",
				// round cap for smoother lines
				lineCap: "round",
				lineJoin: "round",
				points: [pos.x, pos.y],
			});
			layer.add(lastLine);
		}
	});

	stage.on("mouseup touchend", function () {
		isPaint = false;
		if (mode === "line") {
			var pos = {};
			pos.x = stage.getRelativePointerPosition().x;
			pos.y = stage.getRelativePointerPosition().y;
			var newPoints = lastLine.points().concat([pos.x, pos.y]);
			lastLine.points(newPoints);
		}
		actionHistory.push(lastLine);
		// console.log(stage.getPosition().x + "," + stage.getPosition().y);
	});

	// and core function - drawing
	stage.on("mousemove touchmove", function (e) {
		e.evt.preventDefault();

		if (!isPaint) {
			return;
		}
		if (mode == "line") {
			lastLine.points().pop();
			lastLine.points().pop();
			var pos = {};
			pos.x = stage.getRelativePointerPosition().x;
			pos.y = stage.getRelativePointerPosition().y;
			var newPoints = lastLine.points().concat([pos.x, pos.y]);
			lastLine.points(newPoints);
		} else {
			var pos = {};
			pos.x = stage.getRelativePointerPosition().x;
			pos.y = stage.getRelativePointerPosition().y;
			var newPoints = lastLine.points().concat([pos.x, pos.y]);
			lastLine.points(newPoints);
		}
		// prevent scrolling on touch devices
	});

	var select = document.getElementById("tool");
	select.addEventListener("change", function () {
		mode = select.value;
	});

	document.getElementById("color").addEventListener("input", (e) => {
		color = document.getElementById("color").value;
	});

	document.getElementById("size").addEventListener("input", (e) => {
		size = document.getElementById("size").value;
	});

	var scaleBy = 1.1;
	stage.on("wheel", (e) => {
		// stop default scrolling
		e.evt.preventDefault();

		var oldScale = stage.scaleX();
		var pointer = stage.getPointerPosition();

		var mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale,
		};

		// how to scale? Zoom in? Or zoom out?
		let direction = e.evt.deltaY < 0 ? 1 : -1;

		var newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

		stage.scale({ x: newScale, y: newScale });

		var newPos = {
			x: pointer.x - mousePointTo.x * newScale,
			y: pointer.y - mousePointTo.y * newScale,
		};
		stage.position(newPos);
		// console.log(
		// 	"pos:" + stage.getPosition().x + "," + stage.getPosition().y
		// );
		// console.log("scale:" + stage.width() + "," + stage.height());
	});

	var s = true;
	document.getElementById("save").addEventListener(
		"click",
		function () {
			var blob = new Blob([stage.toJSON()], {
				type: "text/plain;charset=utf-8",
			});
			saveAs(blob, "workshop.json");
			var s = stage.find(".image");
			for (i = 0; i < s.length; i++) {
				var imageDownload = s[i].image();
				ctx.drawImage(imageDownload, 0, 0);
				canvas.toBlob(function (blob) {
					saveAs(
						blob,
						imageDownload.src.split(",")[1].slice(0, 12) + ".png"
					);
				});
			}
		},
		false
	);

	function downloadURI(uri, name) {
		var link = document.createElement("a");
		link.download = name;
		link.href = uri;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		delete link;
	}

	document.getElementById("saveImage").addEventListener(
		"click",
		function () {
			if (background != null) background.destroy();

			background = createBackgroundRect();
			layer.add(background);
			background.setZIndex(0);
			var dataURL = stage.toDataURL({ pixelRatio: 3 });
			downloadURI(dataURL, "stage.png");
		},
		false
	);
}

function createBackgroundRect() {
	var rect1 = new Konva.Rect({
		x: -stage.getPosition().x / stage.getScale().x,
		y: -stage.getPosition().y / stage.getScale().y,
		width: stage.width() / stage.scale().x,
		height: stage.height() / stage.scale().y,
		fill: "white",
		zIndex: 0,
	});
	return rect1;
}
