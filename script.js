var obj = null;
console.log("WTF");
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

	var stage;
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

	var zIndex = 1;
	var color = "#000000";
	size = 30;
	var isPaint = false;

	var clicked = null;

	stage.on("click", function (e) {
		// e.target is a clicked Konva.Shape or current stage if you clicked on empty space
		clicked = e.target;
		// console.log("clicked on", e.target);
		if (e.target.parent != null) {
			tr.nodes([e.target]);
		}
	});

	// var group = new Konva.Group({});

	// then create layer
	var layer = new Konva.Layer();
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
	});

	// and core function - drawing
	stage.on("mousemove touchmove", function (e) {
		if (!isPaint || mode === "line") {
			return;
		}

		// prevent scrolling on touch devices
		e.evt.preventDefault();

		var pos = {};
		pos.x = stage.getRelativePointerPosition().x;
		pos.y = stage.getRelativePointerPosition().y;
		var newPoints = lastLine.points().concat([pos.x, pos.y]);
		lastLine.points(newPoints);
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
	});

	var s = true;
	document.getElementById("save").addEventListener(
		"click",
		function () {
			var blob = new Blob([stage.toJSON()], {
				type: "text/plain;charset=utf-8",
			});
			saveAs(blob, "workshop.json");
		},
		false
	);
}
