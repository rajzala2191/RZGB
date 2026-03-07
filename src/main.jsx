import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Unregister all old service workers and clear caches
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
            registration.unregister();
        }
    });
    if (window.caches) {
        caches.keys().then(function(names) {
            for (let name of names) caches.delete(name);
        });
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
        <App />
);