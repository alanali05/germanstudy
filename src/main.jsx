import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LangProvider } from "./context/LangContext";
import { AuthProvider } from "./context/AuthContext";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
      <LangProvider>
      <ConfirmProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConfirmProvider>
      </LangProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
