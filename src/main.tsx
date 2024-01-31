import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from "./components/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
     <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <App />
     </ThemeProvider>
  </BrowserRouter>
);
