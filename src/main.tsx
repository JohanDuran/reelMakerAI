import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // optional but recommended for styling resets

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
