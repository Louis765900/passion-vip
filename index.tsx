import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// On s'assure de ne pas importer de CSS ici !
// Tout le style est dans index.html ou Tailwind

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Impossible de trouver l'élément racine 'root'");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Erreur au montage de l'application:", error);
  document.body.innerHTML = `
    <div style="color:red; padding:20px; font-family:monospace;">
      <h1>Erreur Critique</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
    </div>
  `;
}