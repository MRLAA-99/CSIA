const historyContainer = document.getElementById("historyContainer");
const history = JSON.parse(localStorage.getItem("maskHistory")) || [];

if (history.length === 0) {
  historyContainer.innerHTML = "<p>No history yet.</p>";
} else {
  historyContainer.innerHTML = ""; 

  history.forEach(item => {
    const card = document.createElement("div");
    card.className = "history-card";

    card.innerHTML = `
      <h3>${item.mask}</h3>
      <p><strong>City:</strong> ${item.city}</p>
      <p><strong>AQI:</strong> ${item.aqi}</p>
      <p><strong>Date:</strong> ${item.date}</p>
    `;

    historyContainer.appendChild(card);
  });
}
