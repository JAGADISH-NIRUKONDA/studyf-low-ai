(() => {
  const button = document.getElementById('themeToggle');
  const saved = localStorage.getItem('studyflow-theme');
  if (saved === 'dark') document.body.classList.add('dark-mode');
  if (button) {
    button.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('studyflow-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
  }
})();