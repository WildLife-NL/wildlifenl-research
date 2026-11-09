import React from 'react';
import ReactDOM from 'react-dom/client';
// Self-hosted fonts, Fraunces keeps its optical size axis
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
// Design system, loaded before any page stylesheet
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import App from './App';
import reportWebVitals from './reportWebVitals';


const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
