import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "react-quill/dist/quill.bubble.css";

createRoot(document.getElementById("root")!).render(<App />);
