var zIndex = 1;
var mouseX = 0;
var mouseY = 0;
var fontSize = 30;
var shiftedX = 0; //STAGE SHIFT AMOUNT
var shiftedY = 0;
var color = "#000000";
// let canvas = document.getElementById("spaceCanvas");
// let ctx = canvas.getContext("2d");
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var stage = new Konva.Stage({
	container: "space", // id of container <div>
	width: window.innerWidth,
	height: window.innerHeight,
	draggable: true,
});
// stage.on("click", function (e) {
// 	// e.target is a clicked Konva.Shape or current stage if you clicked on empty space
// 	console.log("clicked on", e.target);
// });

var group = new Konva.Group({
	x: 120,
	y: 40,
	rotation: 20,
});

// then create layer
var layer = new Konva.Layer();
layer.add(group);
stage.add(layer);
shiftedX = stage.getX();
shiftedY = stage.getY();

var isPaint = false;
var mode = "brush";
var lastLine;

stage.on("dragmove", (e) => {
	if (isPaint) {
		stage.stopDrag();
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
					x: mouseX - shiftedX,
					y: mouseY - shiftedY,
					image: img,
					width: width,
					height: height,
					draggable: true,
				});
				layer.add(img2);
				img.style.width = width + "px";
				img.style.height = height + "px";
				var tr = new Konva.Transformer();
				layer.add(tr);
				tr.nodes([img2]);
			};
			img.src = event.target.result;
			// console.log(`w X: ${mouseX}, w Y: ${mouseY}`);
		};
		reader.readAsDataURL(blob);
	} else if (item.kind == "string") {
		navigator.clipboard
			.readText()
			.then((text) => {
				var text = new Konva.Text({
					x: mouseX - shiftedX - ctx.measureText(text).width,
					y: mouseY - shiftedY - fontSize,
					text: text,
					fontSize: fontSize,
					fontFamily: "Calibri",
					fill: color,
					draggable: true,
				});
				layer.add(text);
				var tr = new Konva.Transformer();
				layer.add(tr);
				tr.nodes([text]);
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

stage.on("mousemove", () => {
	mouseX = stage.getPointerPosition().x;
	mouseY = stage.getPointerPosition().y;
	// console.log("dragged:" + mouseX + "," + mouseY);
});

stage.on("dragend", () => {
	shiftedX = stage.getAbsolutePosition().x;
	shiftedY = stage.getAbsolutePosition().y;
	// console.log("dragged:" + shiftedX + "," + shiftedY);
});

function getStage() {
	return stage;
}

var isPaint = false;
var mode = "pointer";
var lastLine;

stage.on("mousedown touchstart", function (e) {
	if (mode === "brush" || mode == "line" || mode === "eraser") {
		stage.stopDrag();
		isPaint = true;
		var pos = stage.getPointerPosition();
		pos.x = pos.x - shiftedX;
		pos.y = pos.y - shiftedY;
		lastLine = new Konva.Line({
			stroke: color,
			strokeWidth: 5,
			globalCompositeOperation:
				mode === "brush" || mode === "line"
					? "source-over"
					: "destination-out",
			// round cap for smoother lines
			lineCap: "round",
			lineJoin: "round",
			// add point twice, so we have some drawings even on a simple click
			points: [pos.x, pos.y, pos.x, pos.y],
		});
		layer.add(lastLine);
	} else if (mode == "line") {
		stage.stopDrag();
		isPaint = true;
		var pos = stage.getPointerPosition();
		pos.x = pos.x - shiftedX;
		pos.y = pos.y - shiftedY;
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
		const pos = stage.getPointerPosition();
		pos.x = pos.x - shiftedX;
		pos.y = pos.y - shiftedY;
		var newPoints = lastLine.points().concat([pos.x, pos.y]);
		lastLine.points(newPoints);
	}
});

// and core function - drawing
stage.on("mousemove touchmove", function (e) {
	if (!isPaint || mode === "line") {
		return;
	}

	// prevent scrolling on touch devices
	e.evt.preventDefault();

	const pos = stage.getPointerPosition();
	pos.x = pos.x - shiftedX;
	pos.y = pos.y - shiftedY;
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
