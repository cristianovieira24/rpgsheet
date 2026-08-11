import React from "react";
import { createRoot } from "react-dom/client";
import HomePage from "./app/page";
import "./app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("O ponto de montagem do Arcana não foi encontrado.");

createRoot(root).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>,
);
