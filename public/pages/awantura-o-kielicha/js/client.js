let categories = [];

// Utility functions and constants
let tot = 0;
let arc = 0;
const rand = (m, M) => Math.random() * (M - m) + m;
const spinEl = document.querySelector("#spin");
const ctx = document.querySelector("#wheel").getContext("2d");
const dia = ctx.canvas.width;
const rad = dia / 2;
const TAU = 2 * Math.PI;

// Variables for spinning mechanics
let angVel = 0; // Angular velocity
let ang = 0; // Current angle in radians
const friction = 0.991; // Deceleration

// DOM element for questions
const wheelContainer = document.getElementById("wheel-container");
const questionsContainer = document.getElementById("questions-container");

// Get the current category index based on angle
const getIndex = () => Math.floor(tot - (ang / TAU) * tot) % tot;

// Draw each category on the wheel
function drawCategory(category, i) {
  const angStart = arc * i;
  ctx.beginPath();
  ctx.fillStyle = category.color;
  ctx.moveTo(rad, rad);
  ctx.arc(rad, rad, rad, angStart, angStart + arc);
  ctx.lineTo(rad, rad);
  ctx.fill();

  // Draw text
  ctx.save();
  ctx.translate(rad, rad);
  ctx.rotate(angStart + arc / 2);
  ctx.textAlign = "right";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(category.label, rad - 10, 10);
  ctx.restore();
}

// Rotate canvas and update the displayed category
function rotate() {
  const category = categories[getIndex()];
  ctx.canvas.style.transform = `rotate(${ang - Math.PI / 2}rad)`;
  spinEl.textContent = !angVel ? "Zakręć" : category.label;
  spinEl.style.background = category.color;
}

// Main animation loop for spinning
function frame() {
  if (!angVel) return;
  angVel *= friction;
  if (angVel < 0.002) {
    angVel = 0;
    displayQuestions();
  }
  ang += angVel;
  ang %= TAU;
  rotate();
}

// Start the animation
function engine() {
  frame();
  requestAnimationFrame(engine);
}

// Function to load questions from the JSON file
async function init() {
  try {
    const response = await fetch(
      "/pages/awantura-o-kielicha/js/questions.json"
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.status}`);
    }

    const data = await response.json();

    categories = data.map((category) => ({
      ...category,
      remainingQuestions: [...category.questions],
    }));

    tot = categories.length;
    arc = TAU / categories.length;

    startApp();
  } catch (error) {
    console.error("Failed to load questions:", error);
  }
}
// Function to display questions for the selected category
function displayQuestions() {
  const category = categories[getIndex()];

  questionsContainer.innerHTML = `<h3>Pytania z kategorii: ${category.label}</h3>`;
  // Check if there are any remaining questions
  if (category.remainingQuestions.length === 0) {
    // If no questions are left, show a "Back to Wheel" button
    const backButton = document.createElement("button");
    backButton.textContent = "Wróć do koła";
    backButton.className = "back-button";
    backButton.addEventListener("click", () => {
      wheelContainer.style.display = "block";
      questionsContainer.style.display = "none";
    });
    questionsContainer.appendChild(backButton);
  } else {
    // Add each question with a reveal button and a placeholder
    category.remainingQuestions.forEach((question, index) => {
      const questionContainer = document.createElement("div");
      questionContainer.className = "question-container";

      // Placeholder text initially displayed
      const placeholderEl = document.createElement("div");
      placeholderEl.className = "placeholder";
      placeholderEl.textContent = `Q${index + 1}: Pokaż pytanie`;

      // Button to reveal the question
      const revealButton = document.createElement("button");
      revealButton.textContent = "-----?-----";
      revealButton.className = "reveal-button";

      // Question element, initially hidden
      const questionEl = document.createElement("div");
      questionEl.className = "question";
      questionEl.textContent = question;
      questionEl.style.display = "none";

      // Append elements to the question container
      questionContainer.appendChild(placeholderEl);
      questionContainer.appendChild(revealButton);
      questionContainer.appendChild(questionEl);
      questionsContainer.appendChild(questionContainer);

      // Event listener for the reveal button to show only the selected question
      revealButton.addEventListener("click", () => {
        // Hide all placeholders, buttons, and questions except the current one
        Array.from(questionsContainer.children).forEach((child) => {
          const isCurrent = child === questionContainer;
          const placeholder = child.querySelector(".placeholder");
          const button = child.querySelector(".reveal-button");
          const question = child.querySelector(".question");

          if (placeholder) {
            placeholder.classList.toggle("disabled", !isCurrent);
          }

          if (button) {
            button.disabled = !isCurrent;
            button.classList.toggle("disabled", !isCurrent);
          }

          if (question) {
            question.style.display = isCurrent ? "block" : "none";
          }
        });
      });

      // Event listener for the question to return to the wheel and remove the question from the category's remaining questions
      questionEl.addEventListener("click", () => {
        // Remove the clicked question from the category's remaining questions
        category.remainingQuestions = category.remainingQuestions.filter(
          (q) => q !== question
        );

        questionContainer.remove();

        // If no questions remain after removing, show the "Back to Wheel" button
        if (category.remainingQuestions.length === 0) {
          const backButton = document.createElement("button");
          backButton.textContent = "Powrót do koła fortuny";
          backButton.className = "back-button";
          backButton.addEventListener("click", () => {
            wheelContainer.style.display = "block";
            questionsContainer.style.display = "none";
          });
          questionsContainer.appendChild(backButton);
        } else {
          wheelContainer.style.display = "block";
          questionsContainer.style.display = "none";
        }
      });
    });
  }

  // Hide the wheel and show the questions
  wheelContainer.style.display = "none";
  questionsContainer.style.display = "block";
}

// Initialize the wheel and event listeners
function startApp() {
  categories.forEach(drawCategory); // Draw initial wheel
  rotate(); // Initial position
  engine(); // Start animation loop

  // Spin the wheel on click
  spinEl.addEventListener("click", () => {
    if (!angVel) angVel = rand(0.25, 0.45); // Random initial velocity
  });
}

init();
