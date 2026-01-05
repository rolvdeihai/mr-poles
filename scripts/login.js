import { login } from '../scripts/api.js';

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');
    
    try {
        const result = await login(username, password);
        if (result.success) {
            // Redirect to main page
            window.location.href = '../index.html';
        } else {
            errorDiv.textContent = result.error || 'Login failed';
        }
    } catch (error) {
        errorDiv.textContent = error.message;
    }
});