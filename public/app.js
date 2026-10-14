const roundLabel = document.querySelector('#round-label');
const timer = document.querySelector('#timer');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const form = document.querySelector('#answer-form');
const answer = document.querySelector('#answer');
const submitButton = document.querySelector('#submit-button');
const replayButton = document.querySelector('#replay-button');
const startButton = document.querySelector('#start-button');
const minimumInput = document.querySelector('#minimum');
const maximumInput = document.querySelector('#maximum');
const durationInput = document.querySelector('#duration');

let correctNumber;
let minimumNumber;
let maximumNumber;
let timeLimit;
let timerId;
let roundInProgress = false;
let roundAudio;
let roundAudioUrl;

async function loadConfig() {
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error('Impossible de charger la configuration.');

  const config = await response.json();
  minimumNumber = Number(config.minNumber);
  maximumNumber = Number(config.maxNumber);
  timeLimit = Number(config.timeLimitSeconds);
  minimumInput.value = minimumNumber;
  maximumInput.value = maximumNumber;
  durationInput.value = timeLimit;
  if (!Number.isSafeInteger(minimumNumber) || !Number.isSafeInteger(maximumNumber)
    || minimumNumber >= maximumNumber || !Number.isFinite(timeLimit) || timeLimit <= 0) {
    throw new Error('La configuration reçue est invalide.');
  }
  timer.textContent = timeLimit.toFixed(1);
}

function readSettings() {
  const minimum = Number(minimumInput.value);
  const maximum = Number(maximumInput.value);
  const duration = Number(durationInput.value);
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum)
    || minimum >= maximum || !Number.isFinite(duration) || duration <= 0) {
    throw new Error('Vérifie les paramètres de la manche.');
  }
  minimumNumber = minimum;
  maximumNumber = maximum;
  timeLimit = duration;
}

function clearRoundAudio() {
  if (roundAudio) roundAudio.pause();
  if (roundAudioUrl) URL.revokeObjectURL(roundAudioUrl);
  roundAudio = undefined;
  roundAudioUrl = undefined;
  replayButton.disabled = true;
}

function replayAudio() {
  if (!roundAudio) return;
  roundAudio.currentTime = 0;
  roundAudio.play();
}

function setResult(message, success = false) {
  result.hidden = false;
  result.textContent = message;
  result.className = success ? 'result success' : 'result';
}

function finishRound(message, success) {
  clearInterval(timerId);
  roundInProgress = false;
  answer.disabled = true;
  submitButton.disabled = true;
  startButton.textContent = 'Manche suivante';
  startButton.disabled = false;
  roundLabel.textContent = 'Manche terminée';
  timer.textContent = '0.0';
  setResult(message, success);
  answer.blur();
}

function startTimer() {
  const deadline = performance.now() + timeLimit * 1000;
  timer.textContent = timeLimit.toFixed(1);
  timerId = setInterval(() => {
    const remaining = Math.max(0, (deadline - performance.now()) / 1000);
    timer.textContent = remaining.toFixed(1);
    if (remaining <= 0) checkAnswer(true);
  }, 50);
}

function checkAnswer(timedOut = false) {
  const guess = Number(answer.value.trim());
  if (Number.isInteger(guess) && guess === correctNumber) {
    finishRound(`Correct : ${correctNumber}.`, true);
  } else if (timedOut) {
    finishRound(`Le temps est écoulé. La réponse était ${correctNumber}.`, false);
  } else {
    finishRound(`Pas tout à fait. La réponse était ${correctNumber}.`, false);
  }
}

async function startRound() {
  try {
    await configPromise;
    readSettings();
    clearInterval(timerId);
    clearRoundAudio();
    answer.value = '';
    startButton.disabled = true;
    answer.disabled = true;
    submitButton.disabled = true;
    result.hidden = true;
    roundLabel.textContent = "Chargement de l'audio";
    status.textContent = 'Écoute attentivement...';
    timer.textContent = timeLimit.toFixed(1);

    const response = await fetch(`/api/round?min=${minimumNumber}&max=${maximumNumber}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Impossible de charger la manche.');
    }

    correctNumber = Number(response.headers.get('X-Correct-Number'));
    roundAudioUrl = URL.createObjectURL(await response.blob());
    const audio = new Audio(roundAudioUrl);
    roundAudio = audio;
    audio.addEventListener('ended', () => answer.focus(), { once: true });
    await audio.play();
    replayButton.disabled = false;
    roundInProgress = true;
    roundLabel.textContent = 'Manche en cours';
    status.textContent = 'Quel nombre as-tu entendu ?';
    answer.disabled = false;
    submitButton.disabled = false;
    startTimer();
    answer.focus();
  } catch (error) {
    roundLabel.textContent = 'Configuration nécessaire';
    status.textContent = error.message;
    startButton.textContent = 'Réessayer';
    startButton.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!roundInProgress) return;
  checkAnswer();
});

startButton.addEventListener('click', startRound);
replayButton.addEventListener('click', replayAudio);

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r' && roundAudio) {
    event.preventDefault();
    replayAudio();
    return;
  }
  if (event.key === 'Enter' && !roundInProgress && !startButton.disabled) {
    event.preventDefault();
    startRound();
  }
});

const configPromise = loadConfig().catch((error) => {
  roundLabel.textContent = 'Configuration nécessaire';
  status.textContent = error.message;
});
