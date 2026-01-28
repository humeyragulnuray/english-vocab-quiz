let questions = [];
let currentIndex = 0;
let score = 0;

// status: "NA" | "OK" | "NO"
let statuses = [];

fetch("words.json")
  .then(res => {
    if (!res.ok) throw new Error("words.json okunamadı: " + res.status);
    return res.json();
  })
  .then(data => {
    questions = data;
    statuses = Array(questions.length).fill("NA");
    renderStatusTable();
    updateScoreText();
    loadQuestion();
  })
  .catch(err => {
    console.error(err);
    document.getElementById("question").innerText =
      "HATA: words.json yüklenmedi. Live Server ile aç ve JSON'un yorum içermediğine bak.";
  });

function updateScoreText() {
  document.getElementById("scoreText").innerText = `Score: ${score}/${questions.length}`;
}

function renderStatusTable() {
  const tbody = document.getElementById("statusBody");
  tbody.innerHTML = "";

  for (let i = 0; i < questions.length; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td id="st-${i}">${statusBadge("NA")}</td>
    `;
    tbody.appendChild(tr);
  }
}

function statusBadge(st) {
  if (st === "OK") return `<span class="badge ok">Correct</span>`;
  if (st === "NO") return `<span class="badge no">Wrong</span>`;
  return `<span class="badge na">Not Answered</span>`;
}

function loadQuestion() {
  const q = questions[currentIndex];

  document.getElementById("qTitle").innerText = `${currentIndex + 1}. Question`;
  document.getElementById("question").innerText = q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach(opt => {
    const label = document.createElement("label");
    label.className = "option";
    label.innerHTML = `
      <input type="radio" name="option" value="${opt}">
      ${opt}
    `;
    optionsDiv.appendChild(label);
  });
}

function submitAnswer() {
  const selected = document.querySelector('input[name="option"]:checked');
  if (!selected) return;

  const correct = questions[currentIndex].answer;

  if (selected.value === correct) {
    if (statuses[currentIndex] !== "OK") score++; // aynı soruyu tekrar doğru yapınca skor şişmesin
    statuses[currentIndex] = "OK";
  } else {
    statuses[currentIndex] = "NO";
  }

  // tabloyu güncelle
  document.getElementById(`st-${currentIndex}`).innerHTML = statusBadge(statuses[currentIndex]);

  updateScoreText();

  currentIndex++;
  if (currentIndex < questions.length) {
    loadQuestion();
  } else {
    alert(`Quiz Finished! Score: ${score}/${questions.length}`);
  }
}

function resetQuiz() {
  currentIndex = 0;
  score = 0;
  statuses = Array(questions.length).fill("NA");

  // tabloyu resetle
  for (let i = 0; i < questions.length; i++) {
    document.getElementById(`st-${i}`).innerHTML = statusBadge("NA");
  }

  updateScoreText();
  loadQuestion();
}

function randomizeQuestions() {
  // sorular + status beraber karışsın diye map'leyip karıştırıyoruz
  const combined = questions.map((q, i) => ({ q, st: statuses[i] }));
  combined.sort(() => Math.random() - 0.5);

  questions = combined.map(x => x.q);
  statuses = Array(questions.length).fill("NA"); // karıştırınca status sıfırlayalım

  currentIndex = 0;
  score = 0;

  renderStatusTable();
  updateScoreText();
  loadQuestion();
}
