
// Basic interaction, log when portfolio link is clicked
document.querySelectorAll('.developer-text a').forEach(link => {
    link.addEventListener('click', () => {
        console.log(`Portfolio link clicked: ${link.href}`);
    });
});
