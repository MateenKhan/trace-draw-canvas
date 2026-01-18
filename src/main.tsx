import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { patchFabricIText } from "./lib/fabric-utils";

// Apply global patches
patchFabricIText();

createRoot(document.getElementById("root")!).render(<App />);
