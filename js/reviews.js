
(function(){
  async function fetchReviews(urls){
    for(const url of urls){
      try{
        const res = await fetch(url, {cache: 'no-store'});
        if(!res.ok) continue;
        const data = await res.json();
        if(Array.isArray(data.reviews)) return data;
      }catch(e){ /* try next */ }
    }
    return null;
  }

  function stars(n){
    n = Math.max(0, Math.min(5, Math.round(n)));
    return "★★★★★".slice(0, n).padEnd(5, "☆");
  }

  function renderReviews(container, data){
    container.innerHTML = "";
    const grid = document.createElement('div');
    grid.className = "reviews-grid";
    (data.reviews || []).slice(0, 12).forEach(r => {
      const card = document.createElement('div');
      card.className = "review-card";
      card.innerHTML = `
        <div class="review-header">
          <div class="reviewer-info">
            <div class="reviewer-name">${r.name ?? "Patient"}</div>
            <div class="review-date">${r.date ?? ""}</div>
          </div>
          <div class="review-rating">
            <div class="stars">${stars(r.rating ?? 5)}</div>
            <div class="platform-badge ${String(r.platform||'').toLowerCase()}">${r.platform ?? ""}</div>
          </div>
        </div>
        <blockquote>${r.text ?? ""}</blockquote>
      `;
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector("#recent-reviews");
    if(!container) return;

    // ordered fallbacks: custom endpoint (data-endpoint), site JSON, and empty
    const endpoint = container.getAttribute("data-endpoint");
    const fallbacks = [endpoint, "/data/reviews.json", "data/reviews.json"].filter(Boolean);
    const data = await fetchReviews(fallbacks);
    if(data){
      renderReviews(container, data);
    }else{
      container.innerHTML = "<p>Reviews are temporarily unavailable.</p>";
    }
  });
})();
