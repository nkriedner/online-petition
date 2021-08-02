// Define and select the context for the canvas and the canvas itself:
const context = $("canvas")[0].getContext("2d");
const canvas = $("canvas");

// Define a boolean for the drawing process:
let startToDraw = false;

// Define a variable for the data of the signature:
let signatureData;

// Add the mousedown event:
canvas.on("mousedown", function (event) {
    // Initiate the drawing process:
    startToDraw = true;
    context.beginPath();
    // Move the starting position of the drawing to the mouse position:
    context.moveTo(event.offsetX, event.offsetY);
});

// Add the mousemove event:
canvas.on("mousemove", function (event) {
    // If the mouse is down and ready to draw:
    if (startToDraw) {
        console.log("mousemove", event.offsetX, event.offsetY);
        // Draw to wherever the mouse moves:
        context.lineTo(event.offsetX, event.offsetY);
        context.stroke();
    }
});

// Add the mouseup event:
canvas.on("mouseup", function (event) {
    // End the drawing process:
    startToDraw = false;
    context.closePath();
    // Store the data of the signature:
    signatureData = event.target.toDataURL();
    console.log(signatureData);
    // Set the value of the hidden input field to the data of the signature:
    $("input[name='signature']").val(signatureData);
});
