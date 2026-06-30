const slotsByDay = {
  0: ["10:00", "12:30", "17:00"],
  1: ["09:30", "13:00", "18:30"],
  2: ["11:00", "15:30"],
  3: ["10:30", "14:00", "19:00"],
  4: ["09:00", "12:00", "16:30"],
  5: ["11:30", "14:30"],
  6: ["12:00", "16:00"],
};

const serviceSelect = document.querySelector("#service");
const formatInputs = document.querySelectorAll(".format-card input[name=\"formatChoice\"]");
const openFormatModal = document.querySelector("#openFormatModal");
const formatModal = document.querySelector("#formatModal");
const closeFormatControls = document.querySelectorAll("[data-close-format-modal]");
const applyFormatChoice = document.querySelector("#applyFormatChoice");
const selectedFormatTitle = document.querySelector("#selectedFormatTitle");
const selectedFormatPrice = document.querySelector("#selectedFormatPrice");
const formatTrack = document.querySelector("#formatTrack");
const formatCards = document.querySelectorAll(".format-card");
const prevFormat = document.querySelector("#prevFormat");
const nextFormat = document.querySelector("#nextFormat");
let formatPage = 0;
const feedbackTrack = document.querySelector("#feedbackTrack");
const feedbackCards = document.querySelectorAll(".feedback-card");
const prevFeedback = document.querySelector("#prevFeedback");
const nextFeedback = document.querySelector("#nextFeedback");
let feedbackPage = 0;
const dateInput = document.querySelector("#date");
const slotGrid = document.querySelector("#slotGrid");
const bookingForm = document.querySelector("#bookingForm");
const formStatus = document.querySelector("#formStatus");
const timeline = document.querySelector("#timeline");
const serviceCards = document.querySelectorAll("[data-service-card]");
const openQuestionnaire = document.querySelector("#openQuestionnaire");
const questionnaireModal = document.querySelector("#questionnaireModal");
const closeModalControls = document.querySelectorAll("[data-close-modal]");

const formatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long" });
const toDateValue = (date) => date.toISOString().slice(0, 10);

function getLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function renderSlots() {
  if (!dateInput || !slotGrid) return;
  const selectedDate = getLocalDate(dateInput.value);
  const slots = slotsByDay[selectedDate.getDay()] || [];
  slotGrid.innerHTML = slots.map((slot, index) => {
    const checked = index === 0 ? "checked" : "";
    return `<label><input type="radio" name="slot" value="${slot}" ${checked} required />${slot}</label>`;
  }).join("");
}

function renderTimeline() {
  if (!timeline || !dateInput) return;
  const today = getLocalDate(dateInput.min);
  timeline.innerHTML = Array.from({ length: 4 }, (_, index) => {
    const day = addDays(today, index);
    const slots = slotsByDay[day.getDay()] || [];
    const items = slots.map((slot) => `<li>${slot}</li>`).join("");
    return `<article class="timeline-day"><h3>${formatter.format(day)}</h3><ul>${items}</ul></article>`;
  }).join("");
}

function setSelectedService(service) {
  if (serviceSelect) serviceSelect.value = service;
  formatInputs.forEach((input) => { input.checked = input.value === service; });
  const selectedInput = Array.from(formatInputs).find((input) => input.value === service);
  if (selectedFormatTitle) selectedFormatTitle.textContent = service;
  if (selectedFormatPrice && selectedInput) selectedFormatPrice.textContent = selectedInput.dataset.price;
  serviceCards.forEach((card) => card.classList.toggle("is-selected", card.dataset.serviceCard === service));
}

function setupDates() {
  if (!dateInput) return;
  const today = new Date();
  dateInput.min = toDateValue(today);
  dateInput.max = toDateValue(addDays(today, 21));
  dateInput.value = dateInput.min;
}

function setQuestionnaireModal(open) {
  if (!questionnaireModal) return;
  questionnaireModal.classList.toggle("is-open", open);
  questionnaireModal.setAttribute("aria-hidden", open ? "false" : "true");
}

function updateFormatCarousel() {
  if (!formatTrack) return;
  const isNarrow = window.matchMedia("(max-width: 900px)").matches;
  const cardsPerPage = isNarrow ? 1 : 2;
  const maxPage = Math.max(0, Math.ceil(formatCards.length / cardsPerPage) - 1);
  formatPage = Math.min(Math.max(formatPage, 0), maxPage);
  formatCards.forEach((card, index) => {
    const start = formatPage * cardsPerPage;
    const end = start + cardsPerPage;
    card.classList.toggle("is-visible", index >= start && index < end);
  });
  if (prevFormat) prevFormat.disabled = formatPage === 0;
  if (nextFormat) nextFormat.disabled = formatPage === maxPage;
}

function updateFeedbackCarousel() {
  if (!feedbackTrack) return;
  const isNarrow = window.matchMedia("(max-width: 760px)").matches;
  const cardsPerPage = isNarrow ? 1 : 2;
  const maxPage = Math.max(0, Math.ceil(feedbackCards.length / cardsPerPage) - 1);
  feedbackPage = Math.min(feedbackPage, maxPage);
  feedbackTrack.style.transform = `translateX(-${feedbackPage * 100}%)`;
  if (prevFeedback) prevFeedback.disabled = feedbackPage === 0;
  if (nextFeedback) nextFeedback.disabled = feedbackPage === maxPage;
}

function setFormatModal(open) {
  if (!formatModal) return;
  formatModal.classList.toggle("is-open", open);
  formatModal.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) updateFormatCarousel();
updateFeedbackCarousel();
}

serviceCards.forEach((card) => {
  card.addEventListener("click", () => {
    setSelectedService(card.dataset.serviceCard);
    document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

serviceSelect?.addEventListener("change", () => setSelectedService(serviceSelect.value));
formatInputs.forEach((input) => input.addEventListener("change", () => setSelectedService(input.value)));
openFormatModal?.addEventListener("click", () => setFormatModal(true));
closeFormatControls.forEach((control) => control.addEventListener("click", () => setFormatModal(false)));
applyFormatChoice?.addEventListener("click", () => setFormatModal(false));
prevFormat?.addEventListener("click", () => { formatPage = Math.max(0, formatPage - 1); updateFormatCarousel(); });
nextFormat?.addEventListener("click", () => { formatPage += 1; updateFormatCarousel(); });
window.addEventListener("resize", () => { updateFormatCarousel(); updateFeedbackCarousel(); });
prevFeedback?.addEventListener("click", () => { feedbackPage = Math.max(0, feedbackPage - 1); updateFeedbackCarousel(); });
nextFeedback?.addEventListener("click", () => { feedbackPage += 1; updateFeedbackCarousel(); });
dateInput?.addEventListener("change", renderSlots);
openQuestionnaire?.addEventListener("click", () => setQuestionnaireModal(true));
closeModalControls.forEach((control) => control.addEventListener("click", () => setQuestionnaireModal(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setQuestionnaireModal(false);
    setFormatModal(false);
  }
});

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  const date = getLocalDate(data.get("date"));
  const friendlyDate = formatter.format(date);
  formStatus.textContent = `${data.get("clientName")}, запись на ${data.get("service")} ${friendlyDate} в ${data.get("slot")} создана. Формат анкеты: ${data.get("questionnaireFormat")}.`;
  bookingForm.reset();
  setupDates();
  setSelectedService("Разовая консультация");
  renderSlots();
});

setupDates();
setSelectedService("Разовая консультация");
renderSlots();
renderTimeline();
updateFormatCarousel();
