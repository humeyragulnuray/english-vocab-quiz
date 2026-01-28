let questions = [];
let currentIndex = 0;
let score = 0;

// status: "NA" | "OK" | "NO"
let statuses = [];

// kullanıcı ne işaretledi (boşsa null)
let selectedAnswers = [];

// sınav bitince kilitle
let isFinished = false;

fetch("words.json")
  .then(res => {
    if (!res.ok) throw new Error("words.json okunamadı: " + res.status);
    return res.json();
  })
  .then(data => {
    questions = data;
    statuses = Array(questions.length).fill("NA");
    selectedAnswers = Array(questions.length).fill(null);

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

  // Eğer kullanıcı daha önce işaretlediyse geri göster
  if (selectedAnswers[currentIndex]) {
    const radios = document.querySelectorAll('input[name="option"]');
    radios.forEach(r => {
      if (r.value === selectedAnswers[currentIndex]) r.checked = true;
    });
  }

  // feedback temizle
  const fb = document.getElementById("feedback");
  fb.className = "feedback";
  fb.style.display = "none";
  fb.innerText = "";
}

function submitAnswer() {
  if (isFinished) return;

  const selected = document.querySelector('input[name="option"]:checked');
  if (!selected) return;

  const correct = questions[currentIndex].answer;

  // kaydet
  selectedAnswers[currentIndex] = selected.value;

  // status belirle
  if (selected.value === correct) {
    if (statuses[currentIndex] !== "OK") score++;
    statuses[currentIndex] = "OK";
  } else {
    // Eğer daha önce OK ise ve şimdi wrong yaptıysa skor düşsün (adil hesap)
    if (statuses[currentIndex] === "OK") score--;
    statuses[currentIndex] = "NO";
  }

  // feedback
  const fb = document.getElementById("feedback");
  if (selected.value === correct) {
    fb.className = "feedback ok";
    fb.innerText = "✅ Doğru!";
  } else {
    fb.className = "feedback no";
    fb.innerText = `❌ Yanlış. Doğru cevap: ${correct}`;
  }

  // tablo
  document.getElementById(`st-${currentIndex}`).innerHTML = statusBadge(statuses[currentIndex]);
  updateScoreText();

  // sonraki soru
  currentIndex++;
  if (currentIndex < questions.length) {
    loadQuestion();
  } else {
    finishExam(); // son sorudan sonra otomatik bitir
  }
}

function resetQuiz() {
  isFinished = false;
  currentIndex = 0;
  score = 0;

  statuses = Array(questions.length).fill("NA");
  selectedAnswers = Array(questions.length).fill(null);

  // tablo reset
  for (let i = 0; i < questions.length; i++) {
    document.getElementById(`st-${i}`).innerHTML = statusBadge("NA");
  }

  // sonuç gizle
  document.getElementById("results").style.display = "none";
  document.getElementById("wrongList").innerHTML = "";
  document.getElementById("naList").innerHTML = "";

  // butonları aç
  toggleButtons(true);

  updateScoreText();
  loadQuestion();
}

function randomizeQuestions() {
  if (isFinished) return;

  // soruları karıştırırken kullanıcının işaretleri/status sıfırlansın
  questions.sort(() => Math.random() - 0.5);

  currentIndex = 0;
  score = 0;
  statuses = Array(questions.length).fill("NA");
  selectedAnswers = Array(questions.length).fill(null);

  renderStatusTable();
  updateScoreText();
  loadQuestion();
}

function finishExam() {
  if (isFinished) return;
  isFinished = true;

  // doğru/yanlış/boş say
  const correctCount = statuses.filter(s => s === "OK").length;
  const wrongCount = statuses.filter(s => s === "NO").length;
  const naCount = statuses.filter(s => s === "NA").length;

  // yüzde (boşlar yanlış sayılmaz; yüzde = correct / total)
  const total = questions.length;
  const percent = total > 0 ? ((correctCount / total) * 100).toFixed(2) : "0.00";

  // summary yaz
  document.getElementById("resultSummary").innerHTML = `
    <b>Total:</b> ${total} <br>
    <b>Correct:</b> ${correctCount} <br>
    <b>Wrong:</b> ${wrongCount} <br>
    <b>Not Answered:</b> ${naCount} <br>
    <b>Success:</b> %${percent}
  `;

  // yanlış listesi
  const wrongList = document.getElementById("wrongList");
  wrongList.innerHTML = "";
  for (let i = 0; i < total; i++) {
    if (statuses[i] === "NO") {
      const li = document.createElement("li");
      li.innerText = `${i + 1}) ${questions[i].question} | Your: ${selectedAnswers[i]} | Correct: ${questions[i].answer}`;
      wrongList.appendChild(li);
    }
  }
  if (wrongList.childElementCount === 0) {
    wrongList.innerHTML = "<li>No wrong answers 🎉</li>";
  }

  // boş listesi
  const naList = document.getElementById("naList");
  naList.innerHTML = "";
  for (let i = 0; i < total; i++) {
    if (statuses[i] === "NA") {
      const li = document.createElement("li");
      li.innerText = `${i + 1}) ${questions[i].question} | Correct: ${questions[i].answer}`;
      naList.appendChild(li);
    }
  }
  if (naList.childElementCount === 0) {
    naList.innerHTML = "<li>No unanswered questions ✅</li>";
  }

  // paneli göster
  document.getElementById("results").style.display = "block";

  // butonları kilitle (reset hariç)
  toggleButtons(false);
}

function toggleButtons(enabled) {
  document.getElementById("btnSubmit").disabled = !enabled;
  document.getElementById("btnRandom").disabled = !enabled;
  document.getElementById("btnFinish").disabled = !enabled;
}
