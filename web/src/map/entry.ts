import "./controls";
import {drawTriangle} from "./draw-triangle";
import {canvasContext, device} from "./webgpu";
import * as windowUtil from "./window";

// eslint-disable-next-line @typescript-eslint/require-await
const frameLoop = async () => {
	const hasResized = windowUtil.onFrame();
	if (hasResized) renderPassDescriptor.depthStencilAttachment.view = windowUtil.depthTextureView;

	render();

	requestAnimationFrame(() => {
		frameLoop().catch((err) => {
			throw err;
		});
	});
};
requestAnimationFrame(() => {
	frameLoop().catch((err) => {
		throw err;
	});
});

const renderPassDescriptor = {
	label: `render pass`,
	colorAttachments: [
		{
			view: canvasContext.getCurrentTexture().createView({label: `colour texture view`}),
			clearValue: [0, 1, 0, 1],
			loadOp: `clear`,
			storeOp: `store`,
		},
	],
	depthStencilAttachment: {
		view: windowUtil.depthTextureView,
		depthClearValue: 1,
		depthLoadOp: `clear`,
		depthStoreOp: `store`,
	},
} satisfies GPURenderPassDescriptor;

const render = () => {
	renderPassDescriptor.colorAttachments[0]!.view = canvasContext
		.getCurrentTexture()
		.createView({label: `colour texture view`});
	const encoder = device.createCommandEncoder({label: `command encoder`});
	const renderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);

	drawTriangle(renderPassEncoder);

	renderPassEncoder.end();
	device.queue.submit([encoder.finish()]);
	console.log(`Rendered`);
};
