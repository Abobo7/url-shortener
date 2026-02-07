document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const form = document.getElementById('shorten-form');
    const urlInput = document.getElementById('url-input');
    const customIdContainer = document.getElementById('custom-id-container');
    const customIdInput = document.getElementById('custom-id-input');
    const submitBtn = document.getElementById('submit-btn');
    const resultDiv = document.getElementById('result');
    const shortUrlInput = document.getElementById('short-url');
    const copyBtn = document.getElementById('copy-btn');
    const errorDiv = document.getElementById('error');
    const errorText = errorDiv.querySelector('.error-text');
    const copyIcon = copyBtn.querySelector('.copy-icon');
    const checkIcon = copyBtn.querySelector('.check-icon');

    // Auth elements
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userEmail = document.getElementById('user-email');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Modal elements
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalClose = document.getElementById('modal-close');
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authError = document.getElementById('auth-error');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authSubmitText = document.getElementById('auth-submit-text');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchBtn = document.getElementById('auth-switch-btn');

    // State
    let currentUser = null;
    let isLoginMode = true;

    // Check current user on load
    checkAuth();

    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();
            if (data.user) {
                currentUser = data.user;
                showUserMenu();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }

    function showUserMenu() {
        authButtons.classList.add('hidden');
        userMenu.classList.remove('hidden');
        userEmail.textContent = currentUser.email;
        customIdContainer.classList.remove('hidden');
    }

    function showAuthButtons() {
        authButtons.classList.remove('hidden');
        userMenu.classList.add('hidden');
        customIdContainer.classList.add('hidden');
        currentUser = null;
    }

    function openModal(isLogin) {
        isLoginMode = isLogin;
        modalTitle.textContent = isLogin ? '登录' : '注册';
        authSubmitText.textContent = isLogin ? '登录' : '注册';
        authSwitchText.textContent = isLogin ? '还没有账号？' : '已有账号？';
        authSwitchBtn.textContent = isLogin ? '注册' : '登录';
        authError.classList.add('hidden');
        authForm.reset();
        modalBackdrop.classList.remove('hidden');
    }

    function closeModal() {
        modalBackdrop.classList.add('hidden');
    }

    // Auth event listeners
    loginBtn.addEventListener('click', () => openModal(true));
    registerBtn.addEventListener('click', () => openModal(false));
    modalClose.addEventListener('click', closeModal);
    authSwitchBtn.addEventListener('click', () => openModal(!isLoginMode));

    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            showAuthButtons();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = authEmail.value.trim();
        const password = authPassword.value;

        authError.classList.add('hidden');
        authSubmitBtn.classList.add('loading');
        authSubmitBtn.disabled = true;

        try {
            const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '操作失败');
            }

            currentUser = data.user;
            showUserMenu();
            closeModal();

        } catch (error) {
            authError.textContent = error.message;
            authError.classList.remove('hidden');
        } finally {
            authSubmitBtn.classList.remove('loading');
            authSubmitBtn.disabled = false;
        }
    });

    // Shorten form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const url = urlInput.value.trim();
        if (!url) return;

        const customId = customIdInput.value.trim();

        // Reset state
        resultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const body = { url };
            if (customId && currentUser) {
                body.customId = customId;
            }

            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '生成短链接失败');
            }

            shortUrlInput.value = data.shortUrl;
            resultDiv.classList.remove('hidden');

            // Reset copy button state
            copyBtn.classList.remove('copied');
            copyIcon.classList.remove('hidden');
            checkIcon.classList.add('hidden');

            // Clear custom ID input
            customIdInput.value = '';

        } catch (error) {
            errorText.textContent = error.message;
            errorDiv.classList.remove('hidden');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(shortUrlInput.value);

            // Show success state
            copyBtn.classList.add('copied');
            copyIcon.classList.add('hidden');
            checkIcon.classList.remove('hidden');

            // Reset after 2 seconds
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyIcon.classList.remove('hidden');
                checkIcon.classList.add('hidden');
            }, 2000);

        } catch (error) {
            // Fallback for older browsers
            shortUrlInput.select();
            document.execCommand('copy');
        }
    });

    // Allow Enter key to submit
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            form.dispatchEvent(new Event('submit'));
        }
    });
});
