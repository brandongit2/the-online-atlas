import {depthTextureView} from "./window-utils";
import {canvasContext} from "@/map/webgpu";

export const renderPassDescriptor = {
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
		view: depthTextureView,
		depthClearValue: 0,
		depthLoadOp: `clear`,
		depthStoreOp: `store`,
	},
} satisfies GPURenderPassDescriptor;
