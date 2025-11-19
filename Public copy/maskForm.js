document.getElementById("maskForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const params = new URLSearchParams(formData).toString();

  try {
    const res = await fetch(`/recommend?${params}`);
    const data = await res.json();

    // save to localStorage
    let history = JSON.parse(localStorage.getItem("maskHistory")) || [];
    history.push({
      city: formData.get("city"),
      mask: data.recommendedMask.name,
      aqi: data.aqi,
      date: new Date().toLocaleString()
    });
    if(history.length > 10) history.shift(); // keep last 10
    localStorage.setItem("maskHistory", JSON.stringify(history));

    // redirect
    window.location.href = `result.html?name=${encodeURIComponent(data.recommendedMask.name)}`;

  } catch(err) {
    console.error(err);
    alert("Something went wrong!");
  }
});
