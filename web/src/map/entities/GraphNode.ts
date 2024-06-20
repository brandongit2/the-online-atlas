export abstract class GraphNode {
	parent: GraphNode | null = null;
	children: GraphNode[] = [];

	addChild(child: GraphNode) {
		child.parent = this;
		this.children.push(child);
	}

	removeChild(child: GraphNode) {
		const index = this.children.indexOf(child);
		if (index !== -1) {
			child.parent = null;
			this.children.splice(index, 1);
		}
	}
}
