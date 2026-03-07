import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Unregister any old service workers (kill-switch SW in dist/ handles cache clearing on deploy)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
            registration.unregister();
        }
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
        <App />
);