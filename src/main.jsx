import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Unregister any old service workers and wipe all caches on every fresh load
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
            registration.unregister();
        }
    });
}
if ('caches' in window) {
    caches.keys().then(function(keys) {
        keys.forEach(function(key) { caches.delete(key); });
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
        <App />
);