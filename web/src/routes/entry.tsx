import React from "react";
import ReactDOM from "react-dom/client";

import {HomePage} from "./page";

ReactDOM.createRoot(document.getElementById(`react-root`)!).render(
	<React.StrictMode>
		<HomePage />
	</React.StrictMode>,
);
