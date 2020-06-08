"use strict";

(function () {
    var socket = io();
    var canvas = document.getElementsByClassName("whiteboard")[0];
    var colors = document.getElementsByClassName("color");
    var context = canvas.getContext("2d");
    localStorage.setItem("addingText", false);

    var current = {
        color: "black",
    };
    var drawing = false;

    canvas.addEventListener("mousedown", onMouseDown, false);
    canvas.addEventListener("mouseup", onMouseUp, false);
    canvas.addEventListener("mouseout", onMouseUp, false);
    canvas.addEventListener("mousemove", throttle(onMouseMove, 10), false);

    //Touch support for mobile devices
    canvas.addEventListener("touchstart", onMouseDown, false);
    canvas.addEventListener("touchend", onMouseUp, false);
    canvas.addEventListener("touchcancel", onMouseUp, false);
    canvas.addEventListener("touchmove", throttle(onMouseMove, 10), false);

    localStorage.setItem("lineWidth", $("#stroke-size").value);

    for (var i = 0; i < colors.length; i++) {
        colors[i].addEventListener("click", onColorUpdate, false);
    }

    socket.on("drawing", onDrawingEvent);
    socket.on("boardColor", changeBoardColor);
    socket.on("fontSize", changeFontSize);
    socket.on("clearingCanvas", clearingCanvas);
    socket.on("textAdded", textAdded);

    window.addEventListener("resize", onResize, false);
    onResize();
    setDots();
    function setDots() {
        for (var i = 0; i < 1551; i = i + 10) {
            for (var j = 0; j < 1000; j = j + 10) {
                context.fillRect(i, j, 2, 1);
            }
        }
    }

    function onMouseDown(e) {
        drawing = true;
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
    }

    function onMouseUp(e) {
        if (!drawing) {
            return;
        }
        drawing = false;
        drawLine(
            current.x,
            current.y,
            e.clientX || e.touches[0].clientX,
            e.clientY || e.touches[0].clientY,
            current.color,
            true
        );
    }

    function onMouseMove(e) {
        if (!drawing) {
            return;
        }
        drawLine(
            current.x,
            current.y,
            e.clientX || e.touches[0].clientX,
            e.clientY || e.touches[0].clientY,
            current.color,
            true
        );
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
    }

    function onColorUpdate(e) {
        current.color = e.target.className.split(" ")[1];
    }

    // limit the number of events per second
    function throttle(callback, delay) {
        var previousCall = new Date().getTime();
        return function () {
            var time = new Date().getTime();

            if (time - previousCall >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }

    function onDrawingEvent(data) {
        var w = canvas.width;
        var h = canvas.height;
        drawLine(
            data.x0 * w,
            data.y0 * h,
            data.x1 * w,
            data.y1 * h,
            data.color
        );
    }

    function changeBoardColor(boardColor) {
        console.log("boardColor", boardColor);
        $(".whiteboard").css("background-color", boardColor);
        $(".active-boardColor").removeClass("active-boardColor");
        $(".bgcolor." + boardColor).addClass("active-boardColor");
        // context.fillStyle = boardColor;
        // context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function changeFontSize(fontSize) {
        $("#stroke-size").val(fontSize);
        localStorage.setItem("lineWidth", fontSize);
    }

    function clearingCanvas() {
        console.log(11);
        context.clearRect(0, 0, canvas.width, canvas.height);
        $(".active-boardColor").removeClass("active-boardColor");
        setDots();
    }
    function textAdded(data) {
        context.fillStyle = current.color;
        context.font = "bold 16px Arial";
        context.fillText(data[0], data[1], data[2]);
        $(".addText").html("Change to pointer");
    }

    // make the canvas fill its parent
    function onResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        setDots();
    }
    function drawLine(x0, y0, x1, y1, color, emit) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = localStorage.getItem("lineWidth");
        context.stroke();
        context.closePath();

        if (!emit) {
            return;
        }
        var w = canvas.width;
        var h = canvas.height;

        socket.emit("drawing", {
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
            color: color,
        });
    }

    $("#stroke-size").on("change", function () {
        localStorage.setItem("lineWidth", this.value);
        socket.emit("fontSize", this.value);
    });

    $(".board-colors .bgcolor").on("click", function () {
        socket.emit("boardColor", this.id);
        $(".whiteboard").css("background-color", this.id);
        $(".active-boardColor").removeClass("active-boardColor");
        $(".bgcolor." + this.id).addClass("active-boardColor");
        // context.fillStyle = this.id;
        // context.fillRect(0, 0, canvas.width, canvas.height);
    });
    $(".clearCanvas").on("click", function () {
        socket.emit("clearingCanvas");
        context.clearRect(0, 0, canvas.width, canvas.height);
        setDots();
    });

    var textAdded = "";
    $(".addText").on("click", function () {
        if (
            localStorage.getItem("addingText") == false ||
            localStorage.getItem("addingText") == "false"
        ) {
            localStorage.setItem("addingText", true);
            addText();
        } else {
            textAdded = "";
            localStorage.setItem("addingText", false);
            $(".addText").html("Add Text");
        }
    });
    function addText() {
        textAdded = prompt("Enter your text here", "");
        canvas.addEventListener("mousedown", function (e) {
            getMousePosition(canvas, e);
        });
        function getMousePosition(canvas, event) {
            // console.log(event);
            if (localStorage.getItem("addingText") == "true") {
                drawing = false;
                let rect = canvas.getBoundingClientRect();
                let x = event.clientX - rect.left;
                let y = event.clientY - rect.top;
                context.fillStyle = current.color;
                context.font = "bold 16px Arial";
                context.fillText(textAdded, x, y);
                socket.emit("textAdded", [textAdded, x, y]);
            }
        }
        $(".addText").html("Change to pointer");
    }
})();
