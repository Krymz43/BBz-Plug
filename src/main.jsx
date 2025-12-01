import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Mock storage for browser environment
const storage = {
  get: async (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (error) {
      console.log('Storage get error:', error);
      return null;
    }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  delete: async (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      return false;
    }
  }
};

// Make storage available globally
window.storage = storage;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
