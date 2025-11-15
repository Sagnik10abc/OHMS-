// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const user = await response.json();
            updateNavForAuth(true);
            return user;
        } else {
            updateNavForAuth(false);
            return null;
        }
    } catch (error) {
        updateNavForAuth(false);
        return null;
    }
}

function updateNavForAuth(isAuthenticated) {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const myBookingsLink = document.getElementById('myBookingsLink');

    if (isAuthenticated) {
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'block';
        if (myBookingsLink) myBookingsLink.style.display = 'block';
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'none';
        if (myBookingsLink) myBookingsLink.style.display = 'none';
    }
}

// Logout functionality
if (document.getElementById('logoutLink')) {
    document.getElementById('logoutLink').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
