document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('shorten-form');
    const urlInput = document.getElementById('url-input');
    const submitBtn = document.getElementById('submit-btn');
    const resultDiv = document.getElementById('result');
    const shortUrlInput = document.getElementById('short-url');
    const copyBtn = document.getElementById('copy-btn');
    const errorDiv = document.getElementById('error');
    const copyIcon = copyBtn.querySelector('.copy-icon');
    const checkIcon = copyBtn.querySelector('.check-icon');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        if (!url) return;

        // Reset state
        resultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
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

        } catch (error) {
            errorDiv.textContent = error.message;
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
