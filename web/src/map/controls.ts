import {canvas} from "./webgpu";

canvas.addEventListener(`pointermove`, (event) => {
	if (event.buttons !== 1) return;
});

canvas.addEventListener(`wheel`, (event) => {
	event.preventDefault();
});
