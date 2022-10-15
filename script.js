var obj = null;
var stage;
var layer;
var clicked = null;
var zIndex = 1;
var background;
var textarea = document.createElement("textarea");
var defaultTextPx = "50px";
var defaultWidth = 300;
var defaultHeight = 75;

var control = false;
var shift = false;
var alt = false;
var test;
var tr = new Konva.Transformer();

function onChange(event) {
	var reader = new FileReader();
	reader.onload = onReaderLoad;
	reader.readAsText(event.target.files[0]);
}

function onReaderLoad(event) {
	obj = event.target.result;
	start(obj);
}
document.getElementById("stageJsonFile").addEventListener("input", onChange);

var textUpdate = function (eventElement) {
	textNode = eventElement.target;
	textNode.hide();
	tr.hide();

	var textPosition = textNode.absolutePosition();

	var areaPosition = {
		x: stage.container().offsetLeft + textPosition.x,
		y: stage.container().offsetTop + textPosition.y,
	};

	document.body.appendChild(textarea);

	textarea.value = textNode.text();
	textarea.style.position = "absolute";
	textarea.style.top = areaPosition.y + "px";
	textarea.style.left = areaPosition.x + "px";
	textarea.style.width = textNode.width() - textNode.padding() * 2 + "px";
	if (textarea.style.width == "0px") {
		textarea.style.width = defaultTextPx;
	}
	textarea.style.height =
		textNode.height() - textNode.padding() * 2 + 5 + "px";
	textarea.style.fontSize = textNode.fontSize() + "px";
	textarea.style.border = "none";
	textarea.style.padding = "0px";
	textarea.style.margin = "0px";
	textarea.style.overflow = "hidden";
	textarea.style.background = "none";
	textarea.style.outline = "none";
	textarea.style.resize = "none";
	textarea.style.lineHeight = textNode.lineHeight();
	textarea.style.fontFamily = textNode.fontFamily();
	textarea.style.transformOrigin = "left top";
	textarea.style.textAlign = textNode.align();
	textarea.style.color = textNode.fill();
	rotation = textNode.rotation();
	var transform = "";
	if (rotation) {
		transform += "rotateZ(" + rotation + "deg)";
	}

	var px = 0;
	var isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
	if (isFirefox) {
		px += 2 + Math.round(textNode.fontSize() / 20);
	}
	transform += "translateY(-" + px + "px)";

	textarea.style.transform = transform;

	textarea.style.height = "auto";
	textarea.style.height = textarea.scrollHeight + 3 + "px";

	textarea.focus();

	function removeTextarea() {
		textarea.parentNode.removeChild(textarea);
		window.removeEventListener("click", handleOutsideClick);
		textNode.show();
		tr.show();
		tr.forceUpdate();
	}

	function setTextareaWidth(newWidth) {
		if (!newWidth) {
			// set width for placeholder
			newWidth = textNode.placeholder.length * textNode.fontSize();
		}
		// some extra fixes on different browsers
		var isSafari = /^((?!chrome|android).)*safari/i.test(
			navigator.userAgent
		);
		var isFirefox =
			navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
		if (isSafari || isFirefox) {
			newWidth = Math.ceil(newWidth);
		}

		var isEdge = document.documentMode || /Edge/.test(navigator.userAgent);
		if (isEdge) {
			newWidth += 1;
		}
		textarea.style.width = newWidth + "px";
	}

	textarea.addEventListener("keydown", function (e) {
		// hide on enter
		// but don't hide on shift + enter
		if (e.keyCode === 13 && !e.shiftKey) {
			textNode.text(textarea.value);
			removeTextarea();
		}
		// on esc do not set value back to node
		if (e.keyCode === 27) {
			removeTextarea();
		}
	});

	textarea.addEventListener("keydown", function (e) {
		scale = textNode.getAbsoluteScale().x;
		setTextareaWidth(textNode.width() * scale);
		textarea.style.height = "auto";
		textarea.style.height =
			textarea.scrollHeight + textNode.fontSize() + "px";
	});

	function handleOutsideClick(e) {
		if (e.target !== textarea) {
			textNode.text(textarea.value);
			removeTextarea();
		}
	}
	setTimeout(() => {
		window.addEventListener("click", handleOutsideClick);
	});
};
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
		var images = stage.find(".image");
		for (i = 0; i < images.length; i++) {
			var konvaImage = images[i];
			var originalImage = images[i].image();
			var imageObj = new Image();
			imageObj.onload = function () {
				konvaImage.image(imageObj);
			};
			imageObj.src = "/images/" + konvaImage.id() + ".png";
		}
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
	layer.add(tr);

	var isPaint = false;
	var mode = "pointer";
	var lastLine;
	var actionHistory = [];
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
		if (e.key == "Shift") {
			shift = true;
		}
		if (e.key == "Alt") {
			alt = true;
		}
	});

	window.addEventListener("keyup", (e) => {
		if (e.key == "Control") {
			control = false;
		}
		if (e.key == "Shift") {
			shift = false;
		}
		if (e.key == "Alt") {
			alt = false;
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

				img.onload = function (e) {
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
						id: "id" + new Date().getTime(),
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
					text.on("dblclick dbltap", textUpdate);
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
		if (mode === "brush" || shift || mode == "line") {
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
		} else if (alt) {
			// mode == "text"
			defaultText = "";
			var text = new Konva.Text({
				x:
					stage.getRelativePointerPosition().x -
					ctx.measureText(defaultText).width,
				y: stage.getRelativePointerPosition().y - size,
				text: defaultText,
				fontSize: size,
				fontFamily: "Calibri",
				fill: color,
				draggable: true,
				width: defaultWidth,
			});
			layer.add(text);
			text.on("dblclick dbltap", textUpdate);
			setTimeout(() => {
				text.fire("dblclick");
			}, 80); //idk why but less than 50 causes problem
			tr.nodes([text]);
		}
	});

	stage.on("mouseup touchend", function () {
		isPaint = false;
		if (shift || mode == "line") {
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
		if (shift || mode == "line") {
			//mode == "line"
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
	});

	var zip = new JSZip();
	document.getElementById("save").addEventListener("click", function () {
		var imgFolder = zip.folder("images");
		var images = stage.find(".image");

		for (i = 0; i < images.length; i++) {
			let konvaImage = images[i];
			var imageDownload = konvaImage.image();
			ctx.drawImage(imageDownload, 0, 0);
			canvas.toBlob(function (blob) {
				imgFolder.file(konvaImage.id() + ".png", blob);
				// saveAs(blob, konvaImage.id() + ".png");
			});
		}
		zip.file("workshop.json", stage.toJSON());
		zip.generateAsync({ type: "blob" }).then(function (content) {
			// see FileSaver.js
			saveAs(content, "example.zip");
		});
	});

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
