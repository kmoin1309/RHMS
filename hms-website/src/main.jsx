import { StrictMode } from "react"; // Importing StrictMode from React for highlighting potential problems
import { createRoot } from "react-dom/client"; // Importing createRoot for rendering React components
import "./index.css"; // Importing global CSS styles
import App from "./App.jsx"; // Importing the main App component
import { ThemeProvider } from "@material-tailwind/react"; // Importing ThemeProvider for Material Tailwind theming

// Creating a root element to render the React application
createRoot(document.getElementById("root")).render(
  // Using StrictMode to help identify potential problems in an application
  <StrictMode>
    {/* Wrapping the App component with ThemeProvider for consistent theming */}
    <ThemeProvider>
      {/* Rendering the main App component */}
      <App />
    </ThemeProvider>
  </StrictMode>
);

