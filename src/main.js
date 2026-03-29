document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.project-card');
    const iframe = document.getElementById('project-frame');
    const container = document.getElementById('iframe-container');
    const splash = document.getElementById('splash');
    const currentTitle = document.getElementById('current-title');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');

    // Function to load a project
    function loadProject(card) {
        // Update Active States
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // Extract Title and URL
        const url = card.getAttribute('data-url');
        const title = card.querySelector('h3').innerText;

        // Apply
        currentTitle.innerText = title;
        iframe.src = url;

        // Visual Toggles
        splash.classList.remove('active');
        container.classList.add('active');

        // Close sidebar on mobile
        sidebar.classList.remove('open');
    }

    // Attach Click Events to Cards
    cards.forEach(card => {
        card.addEventListener('click', () => loadProject(card));
    });

    // Fullscreen API Logic
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            // Request fullscreen on the iframe container directly to hide the toolbar if desired, 
            // or explicitly on the iframe to just show WebGL
            iframe.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Mobile Menu Toggle
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
});
