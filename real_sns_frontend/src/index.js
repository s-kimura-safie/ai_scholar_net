import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthcontextProvider } from './states/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthcontextProvider>
      <App />
    </AuthcontextProvider>
  </React.StrictMode>
  // <>
  //   <App />
  // </>
);
