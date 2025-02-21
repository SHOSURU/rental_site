document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleLogin();
            return false;
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleRegister();
            return false;
        });
    }
});

async function handleLogin() {
    const formData = new FormData(document.getElementById('loginForm'));
    const response = await fetch('/profile/login', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });

    const data = await response.json();
    if (data.success) {
        window.location.href = '/profile';
    } else {
        document.getElementById('errorMessage').innerText = data.message;
    }
}

async function handleRegister() {
    const formData = new FormData(document.getElementById('registerForm'));
    const response = await fetch('/profile/register', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });

    const data = await response.json();
    if (data.success) {
        window.location.href = '/profile';
    } else {
        document.getElementById('registerErrorMessage').innerText = data.message;
    }
}

async function checkAuth() {
    try {
        const response = await fetch('/profile', { method: 'GET', credentials: 'include' });

        if (response.ok) {
            return; // Всё нормально, остаёмся на странице
        }

        const data = await response.json();
        if (data.message === 'Unauthorized') {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
    }
}
