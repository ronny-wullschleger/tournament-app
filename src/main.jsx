import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import TournamentApp from "./tournament.jsx";

// Mock window.storage using localStorage (mirrors the host environment API)
window.storage = {
  get: async (key) => {
    const value = localStorage.getItem(key);
    return value ? { value } : null;
  },
  set: async (key, value) => {
    localStorage.setItem(key, value);
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TournamentApp />
  </StrictMode>
);
