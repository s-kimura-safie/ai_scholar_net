import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthcontextProvider } from './states/AuthContext';
import { HashRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthcontextProvider>
      <Router>
        <App />
      </Router>
    </AuthcontextProvider>
  </React.StrictMode>
);
