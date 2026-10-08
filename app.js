// ===================================
// BIRTHDAY APP — app.js
// ===================================

// ---- QUIZ DATA ----
// No matter what she picks, she always gets a personalized "correct" response ❤️
const questions = [
  {
    q: "What is Vaishu's superpower? 🌟",
    options: ["Her smile 😊", "Her kindness 💕", "Her vibe ✨", "All of the above 🥰"],
    correctIndex: 3, // all of the above — but all choices lead to "correct"
    feedbacks: [
      "Her smile could light up the whole world! ✅ 100% correct! 😊",
      "That's so true! Her heart is pure gold! ✅ Perfectly right! 💕",
      "Yes!! Nobody walks into a room like Vaishu does! ✅ Absolutely! ✨",
      "Of course it's all of the above! Because she's *everything* 🥰✅",
    ]
  },
  {
    q: "What's the best thing about Vaishu? 💖",
    options: ["Her laugh 😂", "Her eyes 👁️", "Her personality 🌸", "Honestly... everything 💫"],
    correctIndex: 3,
    feedbacks: [
      "Her laugh is contagious and the best sound ever! ✅ Spot on! 😂",
      "Those eyes? Absolutely correct! They tell a whole story! ✅ 👁️",
      "Yes!! Her personality is one of a kind! ✅ So right! 🌸",
      "Yep, that's the only correct answer — everything about her is perfect! ✅ 💫",
    ]
  },
  {
    q: "What does Vaishu deserve on her birthday? 🎂",
    options: ["All the love 💕", "All the gifts 🎁", "All the happiness 🎉", "All of the above x10 💖"],
    correctIndex: 3,
    feedbacks: [
      "She deserves every drop of love the universe has! ✅ Correct! 💕",
      "Yes! Every gift in the world for her! ✅ Right answer! 🎁",
      "She 100% deserves all the happiness! ✅ Great pick! 🎉",
      "Multiplied by infinity! That's the only right answer! ✅ 💖",
    ]
  },
  {
    q: "How rare is someone like Vaishu? 🌹",
    options: ["1 in a million 💎", "1 in a billion 🌟", "One of a kind 🦋", "The universe made only her like this 🌌"],
    correctIndex: 3,
    feedbacks: [
      "At minimum! She's absolutely 1 in a million! ✅ 💎",
      "Closer! But honestly even that's too many! ✅ 🌟",
      "Yes! Completely one of a kind! ✅ 🦋",
      "Exactly right! The universe broke the mould after making her! ✅ 🌌",
    ]
  },
  {
    q: "What's today? 🎊",
    options: ["Just another Monday 😒", "The most important day of the year 🎂", "A day someone amazing was born 🌟", "The best day ever, obviously! 💃"],
    correctIndex: 1,
    feedbacks: [
      "WRONG— well actually that's wrong but we'll say right! ✅ Because Vaishu was born today! 🎂",
      "YES! The most important day because Vaishu was born! ✅ 🎂",
      "Absolutely! The world got its best person today! ✅ 🌟",
      "THE BEST DAY! Because it's Vaishu's birthday! ✅ 💃",
    ]
  }
];

let currentQuestion = 0;
let lastGiftOpened = null;
let openedBday = false;
let openedGame = false;

// ---- PAGE NAVIGATION ----
function showPage(id) {
  // Stop cake scene if we're navigating away from it
  if (typeof window.stopCakePage === 'function') window.stopCakePage();

  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'flex';
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Start cake scene when arriving at cake page
  if (id === 'page-cake' && typeof window.initCakePage === 'function') {
    // Small delay to let layout paint first
    setTimeout(window.initCakePage, 80);
  }
}

function goBack() {
  showPage('page-win');
}

// ---- PETALS ----
function spawnPetals() {
  const container = document.getElementById('petal-container');
  const emojis = ['🌹', '🌸', '🌷', '🌺', '✨', '💖', '🌸'];
  for (let i = 0; i < 18; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.animationDuration = (5 + Math.random() * 7) + 's';
    petal.style.animationDelay = (Math.random() * 8) + 's';
    petal.style.fontSize = (0.9 + Math.random() * 1.2) + 'rem';
    container.appendChild(petal);
  }
}

// ---- QUIZ ----
function renderQuestion() {
  const q = questions[currentQuestion];
  document.getElementById('question-text').textContent = q.q;
  document.getElementById('q-counter').textContent = `Question ${currentQuestion + 1} of ${questions.length}`;

  // Progress bar
  const pct = ((currentQuestion + 1) / questions.length) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';

  const container = document.getElementById('options-container');
  container.innerHTML = '';

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.id = `opt-${idx}`;
    btn.onclick = () => handleAnswer(idx);
    container.appendChild(btn);
  });

  // Hide feedback
  const fb = document.getElementById('answer-feedback');
  fb.classList.add('hidden');

  // Animate card
  const card = document.getElementById('question-card');
  card.style.animation = 'none';
  requestAnimationFrame(() => { card.style.animation = 'slideUp 0.4s ease'; });
}

function handleAnswer(selectedIdx) {
  const q = questions[currentQuestion];

  // Disable all buttons
  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.disabled = true;
    // Everyone who wasn't selected looks slightly faded
    if (i !== selectedIdx) btn.classList.add('wrong');
  });

  // Selected answer ALWAYS correct
  document.getElementById(`opt-${selectedIdx}`).classList.remove('wrong');
  document.getElementById(`opt-${selectedIdx}`).classList.add('correct');

  // Show feedback
  const fb = document.getElementById('answer-feedback');
  fb.classList.remove('hidden');
  document.getElementById('feedback-icon').textContent = '✅';
  document.getElementById('feedback-text').textContent = q.feedbacks[selectedIdx];
}

document.getElementById('btn-next-q').addEventListener('click', () => {
  currentQuestion++;
  if (currentQuestion >= questions.length) {
    showPage('page-reasons');
  } else {
    renderQuestion();
  }
});

document.getElementById('btn-to-win').addEventListener('click', () => {
  showPage('page-win');
  launchConfetti();
});

// ---- CONFETTI ----
function launchConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const colors = ['#e8637a', '#c9a84c', '#f0d98c', '#fce8ee', '#fff', '#c0395a', '#f9a8d4'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (8 + Math.random() * 10) + 'px';
    piece.style.height = (8 + Math.random() * 10) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = (2 + Math.random() * 3) + 's';
    piece.style.animationDelay = (Math.random() * 1.5) + 's';
    container.appendChild(piece);
  }
}

// ---- OPEN GIFT ----
function openGift(type) {
  lastGiftOpened = type;
  if (type === 'bday') openedBday = true;
  if (type === 'game') openedGame = true;

  if (openedBday && openedGame) {
    document.getElementById('btn-to-game').style.display = 'none';
    document.getElementById('bday-prompt-text').textContent = "Ready for one last thing?";
    document.getElementById('btn-final-surprise-1').style.display = 'inline-block';
    
    document.getElementById('btn-to-bday').style.display = 'none';
    document.getElementById('game-prompt-text').textContent = "Ready for one last thing?";
    document.getElementById('btn-final-surprise-2').style.display = 'inline-block';
  }

  if (type === 'bday') {
    showPage('page-gift-bday');
    // Trigger gallery animation
    document.querySelectorAll('#bday-gallery .gallery-item').forEach((el, i) => {
      el.style.animation = 'none';
      el.style.opacity = '0';
      setTimeout(() => {
        el.style.animation = `slideUp 0.5s ease ${i * 0.1}s both`;
        el.style.opacity = '1';
      }, 50);
    });
  } else {
    showPage('page-gift-game');
  }
}

// ---- CUT CAKE ----
function cutCake() {
  const center = document.getElementById('cake-center');
  const msg = document.getElementById('cake-message');
  const instruction = document.getElementById('cake-instruction');
  
  if (center.classList.contains('cut')) return; // Already cut
  
  // 1. Move knife down
  center.classList.add('cutting');
  
  // 2. Cut cake & drop knife
  setTimeout(() => {
    center.classList.add('cut');
    center.classList.remove('cutting');
    document.getElementById('knife').style.opacity = '0';
    document.getElementById('knife').style.transform = 'translateY(100px) rotate(-90deg)';
    
    // 3. Show message
    setTimeout(() => {
      instruction.style.opacity = '0';
      msg.classList.remove('hidden');
      msg.classList.add('show');
      launchConfetti(); // one last confetti pop!
    }, 800);
  }, 600);
}

// ---- INIT ----
document.getElementById('btn-start-game').addEventListener('click', () => {
  currentQuestion = 0;
  renderQuestion();
  showPage('page-quiz');
});

// Start petals and show landing page
spawnPetals();
showPage('page-landing');
