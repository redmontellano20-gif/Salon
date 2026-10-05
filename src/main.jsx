import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import SiteContent from "./site/SiteContent";

import "./index.css";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>

    <SiteContent>

      <App />

    </SiteContent>

  </StrictMode>
);