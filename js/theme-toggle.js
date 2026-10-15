// Theme toggle
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const btn = document.getElementById('theme-btn');
    
    if (document.body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
        btn.textContent = '☀️';
    } else {
        localStorage.setItem('theme', 'light');
        btn.textContent = '🌙';
    }
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    const btn = document.getElementById('theme-btn');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (btn) btn.textContent = '☀️';
    }
});