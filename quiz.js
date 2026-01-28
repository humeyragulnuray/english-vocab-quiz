let questions = [];
let currentIndex = 0;
let score = 0;

// status: "NA" | "OK" | "NO"
let statuses = [];
let selectedAnswers = [];

// sınav bitince kilit
let isFinished = false;

/* ======================
   DATA LOAD
====================== */
fetch("words.json")
  .then(res => {
    if (!res.ok) throw new Error("words.json okunamadı");
    return res.json();
  })
  .then(data => {
    questions = data;

    loadProgress();

    if (statuses.length !== questions.length) {
      statuses = Array(questions.length).fill("NA");
      selectedAnswers = Array(questions.length).fill(null);
      score = 0;
      currentIndex = 0;
    }

    renderStatusTable();
    updateScoreText();
    loadQuestion();
  })
  .catch(err => {
    console.error(err);
    document.getElementById("question").innerText =
      "HATA: words.json yüklenemedi. Live Server ile aç.";
  });

/* ======================
   UI HELPERS
====================== */
function updateScoreText() {
  document.getElementById("scoreText").innerText =
    `Score: ${score}/${questions.length}`;
}

function statusBadge(st) {
  if (st === "OK") return `<span class="badge ok">Correct</span>`;
  if (st === "NO") return `<span class="badge no">Wrong</span>`;
  return `<span class="badge na">Not Answered</span>`;
}

/* ======================
   STATUS TABLE
====================== */
function renderStatusTable() {
  const tbody = document.getElementById("statusBody");
  tbody.innerHTML = "";

  for (let i = 0; i < questions.length; i++) {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.onclick = () => {
      currentIndex = i;
      loadQuestion();
      saveProgress();
    };

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td id="st-${i}">${statusBadge(statuses[i])}</td>
    `;

    tbody.appendChild(tr);
  }
}

/* ======================
   LOAD QUESTION
====================== */
function loadQuestion() {
  const q = questions[currentIndex];

  document.getElementById("qTitle").innerText =
    `${currentIndex + 1}. Question`;

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

  // Önceki seçim
  if (selectedAnswers[currentIndex]) {
    document.querySelectorAll('input[name="option"]').forEach(r => {
      if (r.value === selectedAnswers[currentIndex]) r.checked = true;
    });
  }

  // feedback temizle
  const fb = document.getElementById("feedback");
  fb.className = "feedback";
  fb.style.display = "none";
  fb.innerText = "";
}

/* ======================
   SUBMIT ANSWER
====================== */
function submitAnswer() {
  if (isFinished) return;

  const selected = document.querySelector('input[name="option"]:checked');
  if (!selected) return;

  const correct = questions[currentIndex].answer;
  selectedAnswers[currentIndex] = selected.value;

  if (selected.value === correct) {
    if (statuses[currentIndex] !== "OK") score++;
    statuses[currentIndex] = "OK";
  } else {
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
  fb.style.display = "block";

  document.getElementById(`st-${currentIndex}`).innerHTML =
    statusBadge(statuses[currentIndex]);

  updateScoreText();
  saveProgress();
}

/* ======================
   NAVIGATION
====================== */
function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    loadQuestion();
    saveProgress();
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    loadQuestion();
    saveProgress();
  }
}

/* ======================
   SAVE / LOAD
====================== */
function saveProgress() {
  localStorage.setItem("quizData", JSON.stringify({
    currentIndex,
    score,
    statuses,
    selectedAnswers,
    isFinished
  }));
}

function loadProgress() {
  const saved = localStorage.getItem("quizData");
  if (!saved) return;

  const data = JSON.parse(saved);
  currentIndex = data.currentIndex ?? 0;
  score = data.score ?? 0;
  statuses = data.statuses ?? [];
  selectedAnswers = data.selectedAnswers ?? [];
  isFinished = data.isFinished ?? false;
}

/* ======================
   RESET
====================== */
function resetQuiz() {
  if (!confirm("Reset quiz?")) return;

  localStorage.removeItem("quizData");

  currentIndex = 0;
  score = 0;
  isFinished = false;

  statuses = Array(questions.length).fill("NA");
  selectedAnswers = Array(questions.length).fill(null);

  renderStatusTable();
  updateScoreText();
  loadQuestion();

  document.getElementById("results").style.display = "none";
}

/* ======================
   RANDOMIZE
====================== */
function randomizeQuestions() {
  if (isFinished) return;

  questions.sort(() => Math.random() - 0.5);

  currentIndex = 0;
  score = 0;
  statuses = Array(questions.length).fill("NA");
  selectedAnswers = Array(questions.length).fill(null);

  renderStatusTable();
  updateScoreText();
  loadQuestion();
}

/* ======================
   FINISH EXAM (FIXED)
====================== */
function finishExam() {
  if (isFinished) return;
  isFinished = true;

  let correctCount = 0;
  let wrongCount = 0;
  let naCount = 0;

  for (let i = 0; i < statuses.length; i++) {
    if (statuses[i] === "OK") correctCount++;
    else if (statuses[i] === "NO") wrongCount++;
    else naCount++;
  }

  const total = questions.length;
  const percent =
    total > 0 ? ((correctCount / total) * 100).toFixed(2) : "0.00";

  document.getElementById("resultSummary").innerHTML = `
    <b>Total:</b> ${total}<br>
    <b>Correct:</b> ${correctCount}<br>
    <b>Wrong:</b> ${wrongCount}<br>
    <b>Not Answered:</b> ${naCount}<br>
    <b>Success:</b> %${percent}
  `;

  // WRONG LIST
  const wrongList = document.getElementById("wrongList");
  wrongList.innerHTML = "";
  for (let i = 0; i < total; i++) {
    if (statuses[i] === "NO") {
      const li = document.createElement("li");
      li.innerText =
        `${i + 1}) ${questions[i].question} | ` +
        `Your: ${selectedAnswers[i]} | Correct: ${questions[i].answer}`;
      wrongList.appendChild(li);
    }
  }
  if (wrongList.children.length === 0) {
    wrongList.innerHTML = "<li>No wrong answers 🎉</li>";
  }

  // NOT ANSWERED LIST
  const naList = document.getElementById("naList");
  naList.innerHTML = "";
  for (let i = 0; i < total; i++) {
    if (statuses[i] === "NA") {
      const li = document.createElement("li");
      li.innerText =
        `${i + 1}) ${questions[i].question} | Correct: ${questions[i].answer}`;
      naList.appendChild(li);
    }
  }
  if (naList.children.length === 0) {
    naList.innerHTML = "<li>No unanswered questions ✅</li>";
  }

  document.getElementById("results").style.display = "block";
  saveProgress();
}
