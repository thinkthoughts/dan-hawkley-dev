(async () => {
  try {
    const response = await fetch('./data/periods/leo-a.json');
    if (!response.ok) return;
    const period = await response.json();
    document.querySelector('.deadline').textContent = period.visible_deadline;
  } catch (error) {
    console.warn('Lifestyle period data unavailable:', error);
  }
})();
