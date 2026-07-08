let currentLanguage = localStorage.getItem("siteLanguage") || "ru";

(function(){
  const markReady = () => {
    if (document.body) document.body.classList.add("hb-loaded");
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markReady, { once: true });
  } else {
    markReady();
  }
})();

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
const openLabList = document.querySelector("#openLabList");
const labListModal = document.querySelector("#labListModal");
const closeLabControls = document.querySelectorAll("[data-close-lab-modal]");

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
  if (selectedFormatPrice && selectedInput) {
    selectedFormatPrice.textContent = (typeof currentLanguage !== "undefined" && currentLanguage === "et") ? selectedInput.dataset.priceEt : (typeof currentLanguage !== "undefined" && currentLanguage === "en") ? selectedInput.dataset.priceEn : selectedInput.dataset.price;
  }
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

function setLabListModal(open) {
  if (!labListModal) return;
  labListModal.classList.toggle("is-open", open);
  labListModal.setAttribute("aria-hidden", open ? "false" : "true");
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
openLabList?.addEventListener("click", () => setLabListModal(true));
closeModalControls.forEach((control) => control.addEventListener("click", () => setQuestionnaireModal(false)));
closeLabControls.forEach((control) => control.addEventListener("click", () => setLabListModal(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setQuestionnaireModal(false);
    setFormatModal(false);
    setLabListModal(false);
  }
});

bookingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  const date = getLocalDate(data.get("date"));
  const friendlyDate = formatter.format(date);
  const submitButton = bookingForm.querySelector(".submit-button");
  const selectedInput = Array.from(formatInputs).find((input) => input.checked);
  const payload = {
    type: "booking",
    clientName: data.get("clientName"),
    phone: data.get("phone"),
    email: data.get("email"),
    contactChannels: data.getAll("contactChannel"),
    service: data.get("service"),
    price: selectedInput ? selectedInput.dataset.price : selectedFormatPrice?.textContent,
    questionnaireFormat: data.get("questionnaireFormat"),
    date: friendlyDate,
    slot: data.get("slot"),
    message: data.get("message")
  };

  if (formStatus) formStatus.textContent = "Отправляем заявку...";
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "Не удалось отправить заявку");
    if (formStatus) formStatus.textContent = "Заявка отправлена. На вашу почту придет подтверждение, а Дарья свяжется с вами по указанным контактам.";
    bookingForm.reset();
    setupDates();
    setSelectedService("Разбор состояния");
    renderSlots();
  } catch (error) {
    if (formStatus) formStatus.textContent = "Не удалось отправить заявку. Причина: " + (error.message || "попробуйте позже.");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

setupDates();
setSelectedService("Разбор состояния");
renderSlots();
renderTimeline();
updateFormatCarousel();



const fallbackBodyMap = [
  { key: "brain", name: { ru: "Мозг и нервная система", en: "Brain and nervous system", et: "Aju ja närvisüsteem" }, x: 50, y: 17, likes: { ru: ["регулярный сон", "стабильная глюкоза", "магний и белок в рационе"], en: ["regular sleep", "stable glucose", "magnesium and protein"], et: ["regulaarne uni", "stabiilne glükoos", "magneesium ja valk"] }, dislikes: { ru: ["хронический стресс", "голодные интервалы", "переизбыток стимуляторов"], en: ["chronic stress", "long fasting gaps", "too many stimulants"], et: ["krooniline stress", "pikad näljapausid", "liiga palju stimulante"] } },
  { key: "thyroid", name: { ru: "Щитовидная железа", en: "Thyroid", et: "Kilpnääre" }, x: 50, y: 27, likes: { ru: ["достаточный белок", "железо, селен и йод по показаниям", "спокойный режим восстановления"], en: ["enough protein", "iron, selenium and iodine when indicated", "a calm recovery rhythm"], et: ["piisav valk", "raud, seleen ja jood vajadusel", "rahulik taastumisrütm"] }, dislikes: { ru: ["дефицит ферритина", "жесткие диеты", "тканевое воспаление"], en: ["low ferritin", "strict dieting", "tissue inflammation"], et: ["madal ferritiin", "range dieet", "koepõletik"] } },
  { key: "gut", name: { ru: "ЖКТ", en: "Gut", et: "Seedetrakt" }, x: 50, y: 54, likes: { ru: ["регулярное питание", "клетчатку по переносимости", "желчь, ферменты и спокойствие"], en: ["regular meals", "fiber as tolerated", "bile flow, enzymes and calm"], et: ["regulaarne söömine", "kiudained taluvuse järgi", "sapp, ensüümid ja rahu"] }, dislikes: { ru: ["еда на бегу", "хаотичные перекусы", "подавление симптомов без причины"], en: ["rushed meals", "chaotic snacking", "suppressing symptoms without finding causes"], et: ["kiirustades söömine", "kaootilised snäkid", "sümptomite mahasurumine põhjuseta"] } },
  { key: "liver", name: { ru: "Печень", en: "Liver", et: "Maks" }, x: 43, y: 45, likes: { ru: ["белок и холин", "нормальный отток желчи", "ритм сна и питания"], en: ["protein and choline", "healthy bile flow", "sleep and meal rhythm"], et: ["valk ja koliin", "hea sapivool", "une ja toidu rütm"] }, dislikes: { ru: ["алкоголь и избыток сахара", "дефицит белка", "постоянное воспаление"], en: ["alcohol and excess sugar", "low protein", "constant inflammation"], et: ["alkohol ja liigne suhkur", "valgu puudus", "pidev põletik"] } },
  { key: "adrenals", name: { ru: "Надпочечники", en: "Adrenals", et: "Neerupealised" }, x: 58, y: 46, likes: { ru: ["предсказуемый режим", "соль и минералы по потребности", "мягкую нагрузку"], en: ["predictable rhythm", "salt and minerals when needed", "gentle movement"], et: ["etteaimatav rütm", "sool ja mineraalid vajadusel", "pehme koormus"] }, dislikes: { ru: ["жизнь на кофе", "недосып", "тренировки через истощение"], en: ["living on coffee", "sleep deprivation", "training through exhaustion"], et: ["kohvi peal elamine", "unepuudus", "treening läbi kurnatuse"] } },
  { key: "hormones", name: { ru: "Репродуктивная система", en: "Reproductive system", et: "Reproduktiivsüsteem" }, x: 50, y: 66, likes: { ru: ["достаточную энергию", "жиры и белок", "стабильный цикл восстановления"], en: ["enough energy", "fats and protein", "stable recovery cycle"], et: ["piisav energia", "rasvad ja valk", "stabiilne taastumine"] }, dislikes: { ru: ["низкую калорийность", "хроническую тревогу", "дефициты железа и витамина D"], en: ["low calories", "chronic anxiety", "iron and vitamin D deficiencies"], et: ["liiga vähe kaloreid", "krooniline ärevus", "raua ja D-vitamiini puudus"] } },
  { key: "mitochondria", name: { ru: "Мышцы и митохондрии", en: "Muscles and mitochondria", et: "Lihased ja mitokondrid" }, x: 42, y: 78, likes: { ru: ["движение без перегруза", "железо и B-витамины", "достаток кислорода и сна"], en: ["movement without overload", "iron and B vitamins", "enough oxygen and sleep"], et: ["liikumine ilma ülekoormuseta", "raud ja B-vitamiinid", "piisav hapnik ja uni"] }, dislikes: { ru: ["сидячий режим", "анемию", "перетренированность"], en: ["sedentary routine", "anemia", "overtraining"], et: ["istuv eluviis", "aneemia", "ületreening"] } }
];

function bodyPick(value, lang) {
  if (!value) return undefined;
  if (Object.prototype.hasOwnProperty.call(value, lang)) return value[lang];
  return value.ru || value.en || value.et;
}

function renderBodyMap(items, lang) {
  const points = document.querySelector("#bodyMapPoints");
  const card = document.querySelector("#bodyMapCard");
  if (!points || !card) return;
  const organs = Array.isArray(items) && items.length ? items : fallbackBodyMap;
  let activeIndex = 0;

  function renderCard(index) {
    const item = organs[index] || organs[0];
    const likes = bodyPick(item.likes, lang) || [];
    const dislikes = bodyPick(item.dislikes, lang) || [];
    card.innerHTML = '<p class="eyebrow">' + (lang === 'en' ? 'Body map' : lang === 'et' ? 'Keha kaart' : 'Карта тела') + '</p>' +
      '<h3>' + (bodyPick(item.name, lang) || item.title || '') + '</h3>' +
      '<div class="body-map-lists"><div><strong>' + (lang === 'en' ? 'Likes' : lang === 'et' ? 'Meeldib' : 'Любит') + '</strong><ul>' + likes.map((text) => '<li>' + text + '</li>').join('') + '</ul></div>' +
      '<div><strong>' + (lang === 'en' ? 'Dislikes' : lang === 'et' ? 'Ei armasta' : 'Не любит') + '</strong><ul>' + dislikes.map((text) => '<li>' + text + '</li>').join('') + '</ul></div></div>';
    points.querySelectorAll('button').forEach((button, buttonIndex) => button.classList.toggle('is-active', buttonIndex === index));
  }

  points.innerHTML = organs.map((item, index) => {
    const name = bodyPick(item.name, lang) || item.title || '';
    return '<button type="button" class="body-point" style="left:' + (item.x || 50) + '%;top:' + (item.y || 50) + '%" aria-label="' + name + '"><span></span></button>';
  }).join('');
  points.querySelectorAll('button').forEach((button, index) => button.addEventListener('click', () => { activeIndex = index; renderCard(activeIndex); }));
  renderCard(activeIndex);
}

renderBodyMap(fallbackBodyMap, currentLanguage);

document.documentElement.classList.add("supports-reveal");
const revealTargets = document.querySelectorAll(".section, .system-note, .questionnaire, .method-band, .booking-band, .body-map-teaser, .patient-stories, .feedback-card, .request-columns article, .method-grid div");
if ("IntersectionObserver" in window) {
  revealTargets.forEach((element) => element.classList.add("reveal"));
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  revealTargets.forEach((element) => revealObserver.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
}

const progressBar = document.querySelector(".scroll-progress span");
function updateScrollProgress() {
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? (window.scrollY / max) * 100 : 0;
  progressBar.style.width = value + "%";
}
window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();
const tiltTargets = document.querySelectorAll(".request-columns article, .method-grid div, .feedback-card");
function resetTilt(element) { element.style.transform = ""; }
tiltTargets.forEach((element) => {
  element.classList.add("premium-tilt");
  element.addEventListener("mousemove", (event) => {
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    element.style.transform = "perspective(900px) rotateX(" + (-y * 3).toFixed(2) + "deg) rotateY(" + (x * 3).toFixed(2) + "deg) translateY(-4px)";
  });
  element.addEventListener("mouseleave", () => resetTilt(element));
});


const i18n = {
  et: {
    "Запросы":"Pöördumised","Подход":"Lähenemine","Кейсы":"Lood","Запись":"Broneeri","Анкета":"Ankeet","Тело первично":"Keha on esmane",
    "То, что мы чувствуем и думаем, опирается на биохимию: гормоны, обмен и уровень воспаления. Поэтому работа начинается с тела, питания, дефицитов и реального образа жизни.":"See, mida tunneme ja mõtleme, toetub biokeemiale: hormoonidele, ainevahetusele ja põletikutasemele. Seetõttu algab töö kehast, toitumisest, puudujääkidest ja päris elurütmist.",
    "С уважением к телу, психике и реальности":"Austusega keha, psüühika ja päriselu vastu","Дарья":"Darja","клинический нутрициолог":"kliiniline toitumisterapeut",
    "гормоны":"hormoonid","цикл":"tsükkel","мужское здоровье":"meeste tervis","беременность":"rasedus","ЖКТ":"seedetrakt","щитовидная железа":"kilpnääre","митохондрия":"mitokondrid","метаболизм":"ainevahetus","управление старением":"vananemise juhtimine","воспаление":"põletik","аутоиммунные заболевания":"autoimmuunhaigused","тревога":"ärevus","усталость":"väsimus","восстановление":"taastumine",
    "Когда стоит прийти на консультацию":"Millal tasub konsultatsioonile tulla","Состояние":"Enesetunne","Анализы красивые, но вы разваливаетесь":"Analüüsid on ilusad, aga sina laguned koost","Утром встал — уже устал":"Ärkad hommikul ja oled juba väsinud","Жизнь между тревогой и апатией":"Elu ärevuse ja apaatia vahel","Тело":"Keha","Некомфортно в собственном теле":"Oma kehas on ebamugav","Набор веса":"Kaalutõus","Вздутие и тяжесть":"Puhitus ja raskustunne","ПМС, приливы":"PMS, kuumahood","Отсутствие либидо":"Libiido puudumine","Биохимия":"Biokeemia","Скрытые дефициты и тканевое воспаление":"Varjatud puudujäägid ja kudede põletik","Сбои щитовидной железы (АИТ, узлы, кисты)":"Kilpnäärme häired (AIT, sõlmed, tsüstid)","Нарушение метаболизма":"Ainevahetushäired","Женское здоровье":"Naiste tervis","Мужское здоровье":"Meeste tervis",
    "Перед консультацией":"Enne konsultatsiooni","Анкета клиента":"Kliendi ankeet","Анкету можно выбрать при записи: онлайн для заполнения за один раз или документ, если удобнее возвращаться к вопросам в несколько заходов.":"Ankeedi formaadi saab valida broneerimisel: veebis korraga täitmiseks või dokumendina, kui soovid vastata mitmes etapis.","Получить анкету":"Saa ankeet",
    "Без жестких запретов и универсальных схем":"Ilma rangete keeldude ja universaalsete skeemideta","Разбираем запрос":"Selgitame eesmärgi","Фиксируем, что не устраивает вас сейчас, и четко определяем, к чему мы хотим прийти.":"Paneme kirja, mis sind praegu häirib, ja määratleme selgelt, kuhu tahame jõuda.","Ищем причины":"Otsime põhjuseid","Соединяем ваши симптомы с дефицитами, рационом, перенесенными операциями, приемом препаратов и биоритмами":"Seome sümptomid puudujääkide, toitumise, varasemate operatsioonide, ravimite ja biorütmidega","Собираем план":"Koostame plaani","План восстановления: питание, режим, движение, минимально необходимая нутритивная поддержка":"Taastumisplaan: toitumine, režiim, liikumine ja minimaalselt vajalik toitainepõhine tugi",
    "Форматы работы":"Tööformaadid","Запись на консультацию":"Konsultatsiooni broneerimine","Выберите формат, посмотрите, что входит в работу нутрициолога, затем укажите удобную дату и время.":"Vali formaat, vaata, mida töö sisaldab, ning märgi sobiv kuupäev ja kellaaeg.","После выбора формата форма ниже сохранит ваш вариант записи.":"Pärast formaadi valimist salvestab allolev vorm sinu valiku.","Выбранный формат":"Valitud formaat","Выбрать формат":"Vali formaat","Имя":"Nimi","Телефон":"Telefon","Email":"Email","Комфортная связь по номеру телефона":"Mugav suhtlus telefoninumbri kaudu","Формат анкеты":"Ankeedi formaat","Онлайн-анкета":"Veebiankeet","Если желаете заполнить за один раз. Всего 20 вопросов.":"Kui soovid täita korraga. Kokku 20 küsimust.","Документ-анкета":"Dokument-ankeet","Если хотите заполнять анкету в несколько заходов.":"Kui soovid ankeeti täita mitmes etapis.","Дата":"Kuupäev","Свободное время":"Vabad ajad","Запрос":"Pöördumise põhjus","Забронировать":"Broneeri",
    "Больше историй и разборов в Instagram и Telegram":"Rohkem lugusid ja analüüse Instagramis ja Telegramis","Истории пациентов":"Patsientide lood","Блог в Telegram":"Telegrami blogi","Обратная связь":"Tagasiside","Что меняется после системной работы?":"Mis muutub süsteemse töö järel?",
    "Разовая консультация":"Ühekordne konsultatsioon","6000 рублей":"60 eurot","60–75 минут по телефону или Google Meet. Разбор анкеты, анализов, ранее проведенных исследований, жалоб и ответы на вопросы.":"60–75 minutit telefoni või Google Meeti teel. Ankeedi, analüüside, varasemate uuringute ja kaebuste läbivaatus ning vastused küsimustele.","В ходе консультации формируется:":"Konsultatsiooni käigus kujuneb:","направление работы по вашей проблеме":"töö suund sinu probleemi järgi","рекомендации по питанию, физической нагрузке и образу жизни":"soovitused toitumise, liikumise ja elustiili kohta","схема нутрицевтической коррекции":"nutritsioloogilise korrektsiooni skeem","помощь в выборе препаратов":"abi toidulisandite valikul","Дистанционное ведение":"Kaugjälgimine","10000 рублей":"100 eurot","Повторная консультация":"Korduskonsultatsioon","5000 рублей":"50 eurot","Разбор анализов":"Analüüside läbivaatus","4000 рублей":"40 eurot","Выбрать":"Vali","Как вам удобнее заполнить анкету?":"Kuidas on sul mugavam ankeeti täita?","Анкета онлайн":"Veebiankeet","Откроется онлайн-анкета с вопросами по порядку и окном для ответа.":"Avaneb veebiankeet järjestikuste küsimuste ja vastuseväljaga.", "Откроется форма Notion. Можно заполнить сразу перед консультацией.":"Avaneb Notioni vorm. Seda saab täita enne konsultatsiooni.","Скачать документ":"Laadi dokument alla", "Сделать копию":"Tee koopia","Скачайте PDF-анкету и заполните в удобном темпе.":"Laadi PDF-ankeet alla ja täida see endale sobivas tempos.", "Скопируйте анкету и заполните онлайн в удобном для вас темпе.":"Kopeeri ankeet ja täida veebis endale sobivas tempos.","Дарья Повалихина, нутрициолог":"Darja Povalihhina, toitumisterapeut"
  },
  en: {
    "Запросы":"Concerns","Подход":"Approach","Кейсы":"Stories","Запись":"Book","Анкета":"Form","Тело первично":"The body comes first",
    "То, что мы чувствуем и думаем, опирается на биохимию: гормоны, обмен и уровень воспаления. Поэтому работа начинается с тела, питания, дефицитов и реального образа жизни.":"What we feel and think is grounded in biochemistry: hormones, metabolism and inflammation. That is why the work starts with the body, nutrition, deficiencies and real life.",
    "С уважением к телу, психике и реальности":"With respect for the body, mind and real life","Дарья":"Darya","клинический нутрициолог":"clinical nutritionist",
    "гормоны":"hormones","цикл":"cycle","мужское здоровье":"men's health","беременность":"pregnancy","ЖКТ":"gut health","щитовидная железа":"thyroid","митохондрия":"mitochondria","метаболизм":"metabolism","управление старением":"aging management","воспаление":"inflammation","аутоиммунные заболевания":"autoimmune conditions","тревога":"anxiety","усталость":"fatigue","восстановление":"recovery",
    "Когда стоит прийти на консультацию":"When to book a consultation","Состояние":"State","Анализы красивые, но вы разваливаетесь":"Your labs look fine, but you feel like you are falling apart","Утром встал — уже устал":"You wake up already tired","Жизнь между тревогой и апатией":"Life between anxiety and apathy","Тело":"Body","Некомфортно в собственном теле":"You feel uncomfortable in your body","Набор веса":"Weight gain","Вздутие и тяжесть":"Bloating and heaviness","ПМС, приливы":"PMS, hot flashes","Отсутствие либидо":"Low libido","Биохимия":"Biochemistry","Скрытые дефициты и тканевое воспаление":"Hidden deficiencies and tissue inflammation","Сбои щитовидной железы (АИТ, узлы, кисты)":"Thyroid issues (AIT, nodules, cysts)","Нарушение метаболизма":"Metabolic dysfunction","Женское здоровье":"Women's health","Мужское здоровье":"Men's health",
    "Перед консультацией":"Before consultation","Анкета клиента":"Client form","Анкету можно выбрать при записи: онлайн для заполнения за один раз или документ, если удобнее возвращаться к вопросам в несколько заходов.":"You can choose the form format while booking: online if you want to complete it in one sitting, or a document if you prefer to return to it later.","Получить анкету":"Get the form",
    "Без жестких запретов и универсальных схем":"No rigid bans or universal protocols","Разбираем запрос":"Clarify the request","Фиксируем, что не устраивает вас сейчас, и четко определяем, к чему мы хотим прийти.":"We define what does not work for you now and clearly set where we want to get.","Ищем причины":"Look for causes","Соединяем ваши симптомы с дефицитами, рационом, перенесенными операциями, приемом препаратов и биоритмами":"We connect your symptoms with deficiencies, diet, past surgeries, medication use and biorhythms","Собираем план":"Build the plan","План восстановления: питание, режим, движение, минимально необходимая нутритивная поддержка":"Recovery plan: nutrition, routine, movement and the minimum necessary nutrient support",
    "Форматы работы":"Work formats","Запись на консультацию":"Book a consultation","Выберите формат, посмотрите, что входит в работу нутрициолога, затем укажите удобную дату и время.":"Choose a format, see what is included, then select a convenient date and time.","После выбора формата форма ниже сохранит ваш вариант записи.":"After choosing a format, the form below will keep your selection.","Выбранный формат":"Selected format","Выбрать формат":"Choose format","Имя":"Name","Телефон":"Phone","Email":"Email","Комфортная связь по номеру телефона":"Preferred contact via phone number","Формат анкеты":"Form format","Онлайн-анкета":"Online form","Если желаете заполнить за один раз. Всего 20 вопросов.":"Choose this if you want to complete it in one sitting. 20 questions total.","Документ-анкета":"Document form","Если хотите заполнять анкету в несколько заходов.":"Choose this if you want to fill it out in several sittings.","Дата":"Date","Свободное время":"Available time","Запрос":"Request","Забронировать":"Book now",
    "Больше историй и разборов в Instagram и Telegram":"More stories and case notes on Instagram and Telegram","Истории пациентов":"Patient stories","Блог в Telegram":"Telegram blog","Обратная связь":"Feedback","Что меняется после системной работы?":"What changes after systematic work?",
    "Разовая консультация":"One-time consultation","6000 рублей":"60 euro","60–75 минут по телефону или Google Meet. Разбор анкеты, анализов, ранее проведенных исследований, жалоб и ответы на вопросы.":"60–75 minutes by phone or Google Meet. Review of the form, labs, previous tests, complaints and answers to questions.","В ходе консультации формируется:":"During the consultation you receive:","направление работы по вашей проблеме":"a direction for working with your issue","рекомендации по питанию, физической нагрузке и образу жизни":"recommendations on nutrition, movement and lifestyle","схема нутрицевтической коррекции":"a nutrient-support plan","помощь в выборе препаратов":"help choosing supplements","Дистанционное ведение":"Remote guidance","10000 рублей":"100 euro","Повторная консультация":"Follow-up consultation","5000 рублей":"50 euro","Разбор анализов":"Lab review","4000 рублей":"40 euro","Выбрать":"Select","Как вам удобнее заполнить анкету?":"How would you prefer to complete the form?","Анкета онлайн":"Online form","Откроется онлайн-анкета с вопросами по порядку и окном для ответа.":"An online questionnaire will open with questions one by one and an answer field.", "Откроется форма Notion. Можно заполнить сразу перед консультацией.":"A Notion form will open. You can complete it before the consultation.","Скачать документ":"Download document", "Сделать копию":"Make a copy","Скачайте PDF-анкету и заполните в удобном темпе.":"Download the PDF form and fill it out at your own pace.", "Скопируйте анкету и заполните онлайн в удобном для вас темпе.":"Copy the form and complete it online at your own pace.","Дарья Повалихина, нутрициолог":"Darya Povalikhina, nutritionist"
  }
};


const i18nExtra = {
  et: {
    "Выберите формат":"Vali formaat",
    "Консультация 60–75 минут и поддержка в течение месяца: вы пишете вопросы, я отвечаю в рабочее время с 8 до 18:00.":"60–75-minutiline konsultatsioon ja kuuajaline tugi: kirjutad oma küsimused ning vastan tööajal 8.00–18.00.",
    "Повторная консультация через 2 месяца для контроля текущего состояния и корректировки назначений.":"Korduskonsultatsioon 2 kuu pärast, et hinnata seisundit ja korrigeerida soovitusi.",
    "Разбираем результаты ваших анализов и интерпретацию с учетом симптомов, жалоб и анамнеза.":"Vaatame läbi sinu analüüside tulemused ja tõlgendame neid sümptomite, kaebuste ja anamneesi kontekstis.",
    "Пациентка два года принимала антидепрессанты: ежедневные головные боли, утренняя усталость, депрессивное настроение. Обратилась ко мне «с головой и энергией». На первой консультации отправила ее на анализы щитовидной железы — выявили гипертиреоз. После коррекции гормонов, питания и режима: головные боли ушли, обезболивающие больше не нужны, энергия и настроение выровнялись.":"Patsient kasutas kaks aastat antidepressante: igapäevased peavalud, hommikune väsimus ja depressiivne meeleolu. Ta pöördus minu poole energia ja peavalude pärast. Esimesel konsultatsioonil suunasin ta kilpnäärme analüüsidele — selgus hüpertüreoos. Pärast hormoonide, toitumise ja režiimi korrigeerimist peavalud kadusid, valuvaigisteid polnud enam vaja ning energia ja meeleolu stabiliseerusid.",
    "И., 28 лет":"I., 28 a","Перепады настроения, антидепрессанты и гипертиреоз":"Meeleolukõikumised, antidepressandid ja hüpertüreoos",
    "После отмены КОК — сбой цикла, гормональные «качели», узел в щитовидной железе, ферритин 5. Поэтапная работа: выравнивание гормонов, поддержка щитовидки, коррекция дефицитов, перестройка питания. Результат: восстановление цикла, стабилизация гормонов и щитовидки, закрытие дефицитов. На фоне восстановленного ресурса — естественная беременность без стимуляций.":"Pärast hormonaalsete kontratseptiivide lõpetamist tekkis tsüklihäire, hormonaalsed kõikumised, kilpnäärmesõlm ja ferritiin 5. Samm-sammuline töö: hormoonide tasakaalustamine, kilpnäärme toetamine, puudujääkide korrigeerimine ja toitumise ümberkorraldamine. Tulemus: tsükli taastumine, hormoonide ja kilpnäärme stabiliseerumine, puudujääkide korrigeerimine. Taastunud ressursi taustal saabus loomulik rasedus ilma stimulatsioonita.",
    "А., 36 лет":"A., 36 a","Отмена КОК, отсутствие месячных, ферритин 5, беременность":"KOK lõpetamine, menstruatsiooni puudumine, ferritiin 5, rasedus",
    "Обратилась к Дарье на фоне длительного бесплодия и подготовки к ЭКО. На разборе выявили выраженные проблемы с пищеварением, перегрузку ЖКТ и необходимость дообследования. Через 5 месяцев сопровождения — стабильный стул, комфорт в животе, ощущение ресурса. В октябре — естественная беременность, без ЭКО и стимуляций.":"Ta pöördus Darja poole pikaajalise viljatuse ja IVF-i ettevalmistuse taustal. Läbivaatuse käigus ilmnesid väljendunud seedeprobleemid, seedetrakti ülekoormus ja vajadus täiendavateks uuringuteks. Viie kuu jooksul: stabiilne seedimine, kõhumugavus ja rohkem ressurssi. Oktoobris saabus loomulik rasedus ilma IVF-i ja stimulatsioonita.",
    "И., 34 года":"I., 34 a","Бесплодие и гипотиреоз":"Viljatus ja hüpotüreoos",
    "Исходный запрос: кандидоз, жалобы со стороны кишечника, запрос на противокандидный протокол. Работа включала структурированный рацион, поиск скрытых источников сахара и воспаления, дообследования по крови. После внедрения протокола и лечения: улучшение по кишечнику, снижение воспалительной нагрузки, регресс кист в груди по динамике.":"Algne pöördumine: kandidiaas, soolekaebused ja soov saada kandidavastane protokoll. Töö hõlmas struktureeritud toitumist, varjatud suhkru- ja põletikuallikate otsimist ning vereanalüüse. Pärast protokolli ja ravi rakendamist: seedimise paranemine, põletikulise koormuse vähenemine ja rindade tsüstide taandumine dünaamikas.",
    "Н., 34":"N., 34","Вес, ЖКТ, кандидоз, риск гипотиреоза":"Kaal, seedetrakt, kandidiaas, hüpotüreoosi risk",
    "Год назад Александр весил 62 кг при росте 180 и выглядел как скелет. Были изжога, боли в желудке, проблемы со стулом. На разборе выяснилось, что дело не только в желудке: стеатоз печени и анемия. После поэтапной работы с питанием, печенью и железом набрал до 72 кг, ушли боли и изжога, нормализовались стул и сон.":"Aasta tagasi kaalus Aleksandr 180 cm pikkuse juures 62 kg ja nägi välja väga kõhn. Esines kõrvetisi, kõhuvalu ja probleeme väljaheitega. Läbivaatuse käigus selgus, et asi ei olnud ainult maos: maksa steatoos ja aneemia. Pärast etapiviisilist tööd toitumise, maksa ja rauaga tõusis kaal 72 kg-ni, valud ja kõrvetised kadusid ning uni ja seedimine normaliseerusid.",
    "А., 34 года":"A., 34 a","Изжога, стеатоз и синдром раздраженного кишечника":"Kõrvetised, steatoos ja ärritunud soole sündroom"
  },
  en: {
    "Выберите формат":"Choose a format",
    "Консультация 60–75 минут и поддержка в течение месяца: вы пишете вопросы, я отвечаю в рабочее время с 8 до 18:00.":"A 60–75 minute consultation plus one month of support: you send your questions and I reply during working hours from 8:00 to 18:00.",
    "Повторная консультация через 2 месяца для контроля текущего состояния и корректировки назначений.":"A follow-up consultation after 2 months to review your current state and adjust recommendations.",
    "Разбираем результаты ваших анализов и интерпретацию с учетом симптомов, жалоб и анамнеза.":"We review your lab results and interpret them in the context of symptoms, complaints and history.",
    "Пациентка два года принимала антидепрессанты: ежедневные головные боли, утренняя усталость, депрессивное настроение. Обратилась ко мне «с головой и энергией». На первой консультации отправила ее на анализы щитовидной железы — выявили гипертиреоз. После коррекции гормонов, питания и режима: головные боли ушли, обезболивающие больше не нужны, энергия и настроение выровнялись.":"The patient had been taking antidepressants for two years: daily headaches, morning fatigue and low mood. She came to me with concerns about energy and headaches. At the first consultation I referred her for thyroid testing, which revealed hyperthyroidism. After correcting hormones, nutrition and routine, the headaches disappeared, painkillers were no longer needed, and energy and mood stabilized.",
    "И., 28 лет":"I., 28","Перепады настроения, антидепрессанты и гипертиреоз":"Mood swings, antidepressants and hyperthyroidism",
    "После отмены КОК — сбой цикла, гормональные «качели», узел в щитовидной железе, ферритин 5. Поэтапная работа: выравнивание гормонов, поддержка щитовидки, коррекция дефицитов, перестройка питания. Результат: восстановление цикла, стабилизация гормонов и щитовидки, закрытие дефицитов. На фоне восстановленного ресурса — естественная беременность без стимуляций.":"After stopping combined oral contraceptives: cycle disruption, hormonal swings, a thyroid nodule and ferritin at 5. Step-by-step work: balancing hormones, supporting the thyroid, correcting deficiencies and rebuilding nutrition. Result: restored cycle, stabilized hormones and thyroid, deficiencies corrected. With restored resources, a natural pregnancy occurred without stimulation.",
    "А., 36 лет":"A., 36","Отмена КОК, отсутствие месячных, ферритин 5, беременность":"Stopping COCs, no period, ferritin 5, pregnancy",
    "Обратилась к Дарье на фоне длительного бесплодия и подготовки к ЭКО. На разборе выявили выраженные проблемы с пищеварением, перегрузку ЖКТ и необходимость дообследования. Через 5 месяцев сопровождения — стабильный стул, комфорт в животе, ощущение ресурса. В октябре — естественная беременность, без ЭКО и стимуляций.":"She came to Darya after long-term infertility and preparation for IVF. During the review we found significant digestive issues, gut overload and the need for further testing. After 5 months of support: stable stool, abdominal comfort and a restored sense of energy. In October, a natural pregnancy occurred without IVF or stimulation.",
    "И., 34 года":"I., 34","Бесплодие и гипотиреоз":"Infertility and hypothyroidism",
    "Исходный запрос: кандидоз, жалобы со стороны кишечника, запрос на противокандидный протокол. Работа включала структурированный рацион, поиск скрытых источников сахара и воспаления, дообследования по крови. После внедрения протокола и лечения: улучшение по кишечнику, снижение воспалительной нагрузки, регресс кист в груди по динамике.":"Initial request: candidiasis, gut complaints and a request for an anti-candida protocol. The work included a structured diet, finding hidden sources of sugar and inflammation, and additional blood testing. After implementing the protocol and treatment: improved gut symptoms, reduced inflammatory load and regression of breast cysts over time.",
    "Н., 34":"N., 34","Вес, ЖКТ, кандидоз, риск гипотиреоза":"Weight, gut health, candidiasis, hypothyroidism risk",
    "Год назад Александр весил 62 кг при росте 180 и выглядел как скелет. Были изжога, боли в желудке, проблемы со стулом. На разборе выяснилось, что дело не только в желудке: стеатоз печени и анемия. После поэтапной работы с питанием, печенью и железом набрал до 72 кг, ушли боли и изжога, нормализовались стул и сон.":"A year ago Alexander weighed 62 kg at 180 cm and looked extremely thin. He had heartburn, stomach pain and stool issues. During the review we found it was not only about the stomach: fatty liver and anemia were also involved. After step-by-step work with nutrition, liver support and iron, he gained up to 72 kg, pain and heartburn went away, and stool and sleep normalized.",
    "А., 34 года":"A., 34","Изжога, стеатоз и синдром раздраженного кишечника":"Heartburn, fatty liver and irritable bowel syndrome"
  }
};
Object.assign(i18n.et, i18nExtra.et);
Object.assign(i18n.en, i18nExtra.en);

const placeholderI18n = {
  et: { "+7 999 000-00-00":"+372 5555 0000", "name@example.com":"nimi@example.com", "Например: хочу разобрать питание, дефициты и усталость":"Näiteks: soovin üle vaadata toitumise, puudujäägid ja väsimuse" },
  en: { "+7 999 000-00-00":"+372 5555 0000", "name@example.com":"name@example.com", "Например: хочу разобрать питание, дефициты и усталость":"For example: I want to review nutrition, deficiencies and fatigue" }
};

function translateText(source, lang) { return lang === "ru" ? source : (i18n[lang] && i18n[lang][source]) || source; }
const i18nTextNodes = [];
function prepareI18nNodes() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement && ["SCRIPT", "STYLE"].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  while (walker.nextNode()) {
    i18nTextNodes.push({ node: walker.currentNode, source: walker.currentNode.nodeValue.trim() });
  }
}
function applyLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("siteLanguage", lang);
  document.documentElement.lang = lang === "ru" ? "ru" : lang;
  i18nTextNodes.forEach((item) => {
    item.node.nodeValue = translateText(item.source, lang);
  });
  document.querySelectorAll("[placeholder]").forEach((element) => {
    if (!element.dataset.placeholderSource) element.dataset.placeholderSource = element.getAttribute("placeholder");
    element.setAttribute("placeholder", lang === "ru" ? element.dataset.placeholderSource : (placeholderI18n[lang] && placeholderI18n[lang][element.dataset.placeholderSource]) || element.dataset.placeholderSource);
  });
  document.querySelectorAll(".language-switcher button").forEach((button) => button.classList.toggle("is-active", button.dataset.lang === lang));
  const selectedServiceInput = Array.from(formatInputs).find((input) => input.checked);
  if (selectedServiceInput && selectedFormatPrice) {
    selectedFormatPrice.textContent = lang === "et" ? selectedServiceInput.dataset.priceEt : lang === "en" ? selectedServiceInput.dataset.priceEn : selectedServiceInput.dataset.price;
  }
}
prepareI18nNodes();
document.querySelectorAll(".language-switcher button").forEach((button) => button.addEventListener("click", () => applyLanguage(button.dataset.lang)));
formatInputs.forEach((input) => input.addEventListener("change", () => setTimeout(() => applyLanguage(currentLanguage), 0)));
applyLanguage(currentLanguage);



function revealCmsPage() {
  document.body?.classList.remove("cms-loading");
  document.documentElement.classList.add("cms-ready");
}

// Notion CMS bridge. The static page stays usable if the API is unavailable.
(function () {
  const langFromPage = () => document.documentElement.lang || localStorage.getItem("siteLanguage") || "ru";
  const pick = (value, lang) => {
    if (!value) return undefined;
    if (Object.prototype.hasOwnProperty.call(value, lang)) return value[lang];
    if (Object.prototype.hasOwnProperty.call(value, "ru")) return value.ru;
    if (Object.prototype.hasOwnProperty.call(value, "en")) return value.en;
    if (Object.prototype.hasOwnProperty.call(value, "et")) return value.et;
    return undefined;
  };
  const price = (format, lang) => {
    if (!format) return "";
    if (lang === "ru") return format.priceRub ? format.priceRub + " рублей" : "";
    return format.priceEur ? format.priceEur + " euro" : "";
  };

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element && value !== undefined) element.textContent = value;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setHeroTitle(value) {
    const element = document.querySelector("#hero-title");
    if (!element || value === undefined) return;
    const normalized = String(value || "")
      .replace("Я смотрю систему", "Я смотрю на систему")
      .trim();
    if (!normalized) {
      element.textContent = "";
      return;
    }
    const lines = normalized.includes("\n")
      ? normalized.split(/\n+/)
      : normalized.split(/(?=Я смотрю)/);
    element.innerHTML = lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => '<span class="hero-title-line">' + escapeHtml(line) + '</span>')
      .join("");
  }

  function setLabelText(selector, value) {
    const element = document.querySelector(selector);
    if (!element || value === undefined) return;
    const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
    if (textNode) textNode.nodeValue = value;
    else element.insertBefore(document.createTextNode(value), element.firstChild);
  }

  function setPlaceholder(selector, value) {
    const element = document.querySelector(selector);
    if (element && value !== undefined) element.setAttribute("placeholder", value);
  }

  function setAttributeValue(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element && value !== undefined) element.setAttribute(attribute, value);
  }

  function setFormatSelectedBadge(value, lang) {
    const label = value !== undefined ? value : lang === "en" ? "Selected" : lang === "et" ? "Valitud" : "Выбрано";
    document.querySelectorAll(".format-title").forEach((element) => {
      element.dataset.selectedLabel = label;
    });
  }

  function renderMarquee(value) {
    const marquee = document.querySelector(".marquee div");
    if (!marquee || value === undefined) return;
    if (value === "") { marquee.innerHTML = ""; return; }
    const topics = value.split(/[\u2022|]/).map((item) => item.trim()).filter(Boolean);
    if (!topics.length) return;
    const doubled = topics.concat(topics);
    marquee.innerHTML = doubled.map((topic) => '<span>' + topic + '</span>').join("");
    requestAnimationFrame(syncMarqueeTrack);
  }

  function syncMarqueeTrack() {
    const track = document.querySelector(".marquee div");
    if (!track) return;
    const distance = Math.max(track.scrollWidth / 2, window.innerWidth);
    track.style.setProperty("--marquee-distance", "-" + distance + "px");
  }

  window.addEventListener("load", syncMarqueeTrack);
  window.addEventListener("resize", syncMarqueeTrack);

  function applyTexts(data, lang) {
    const texts = data.texts || {};
    const topbarBooking = pick(texts.topbar_booking, lang);
    const textTargets = {
      brand_name: ".brand span",
      nav_requests: ".nav a:nth-child(1)",
      nav_approach: ".nav a:nth-child(2)",
      nav_cases: ".nav a:nth-child(3)",
      topbar_questionnaire: ".topbar-actions .topbar-action:nth-of-type(2)",
      hero_subtitle: ".hero-copy",
      hero_note: ".hero-signature",
      profile_name: ".profile-caption strong",
      profile_role: ".profile-caption span",
      booking_eyebrow: "#booking .booking-copy .eyebrow",
      booking_title: "#booking-title",
      booking_intro: ".booking-copy > p:not(.eyebrow)",
      booking_note: ".booking-note p",
      selected_format_label: ".selected-format span",
      choose_format_button: "#openFormatModal",
      format_apply_button: "#applyFormatChoice",
      format_modal_title: "#formatModalTitle",
      format_modal_eyebrow: "#formatModal .eyebrow",
      contact_choice_title: ".contact-choice p",
      questionnaire_format_legend: ".questionnaire-choice legend",
      questionnaire_online_option_title: ".questionnaire-choice label:nth-of-type(1) strong",
      questionnaire_online_option_text: ".questionnaire-choice label:nth-of-type(1) small",
      questionnaire_document_option_title: ".questionnaire-choice label:nth-of-type(2) strong",
      questionnaire_document_option_text: ".questionnaire-choice label:nth-of-type(2) small",
      time_slots_legend: "#bookingForm fieldset:not(.questionnaire-choice) legend",
      booking_submit_button: "#bookingForm .submit-button",
      questionnaire_eyebrow: "#questionnaire .eyebrow",
      questionnaire_title: "#questionnaire-title",
      questionnaire_description: "#questionnaire p:not(.eyebrow)",
      questionnaire_button: "#openQuestionnaire",
      questionnaire_modal_eyebrow: "#questionnaireModal .eyebrow",
      questionnaire_modal_title: "#questionnaireModalTitle",
      questionnaire_online_title: "#questionnaireModal .modal-option:nth-child(1) strong",
      questionnaire_online_text: "#questionnaireModal .modal-option:nth-child(1) span",
      questionnaire_download_title: "#questionnaireModal .modal-option:nth-child(2) strong",
      questionnaire_download_text: "#questionnaireModal .modal-option:nth-child(2) span",
      analyses_button: "#openLabList",
      lab_modal_eyebrow: "#labListModal .eyebrow",
      lab_modal_title: "#labListTitle",
      lab_modal_note: "#labListModal .lab-note",
      lab_modal_deadline: "#labListModal .lab-deadline",
      feedback_title: "#feedback-title",
      contact_eyebrow: "#contact .eyebrow",
      contact_title: "#contact-title",
      contact_description: "#contact .contact-description",
      footer_text: ".footer p",
      footer_link_label: ".footer a"
    };
    Object.entries(textTargets).forEach(([key, selector]) => setText(selector, pick(texts[key], lang)));
    setText(".topbar-actions .topbar-action:nth-of-type(1)", topbarBooking === "Запись" ? "Запись на разбор" : topbarBooking);
    setHeroTitle(pick(texts.hero_title, lang));
    setFormatSelectedBadge(pick(texts.format_selected_badge, lang), lang);
    setAttributeValue('#prevFormat', 'aria-label', pick(texts.format_prev_label, lang));
    setAttributeValue('#nextFormat', 'aria-label', pick(texts.format_next_label, lang));
    setAttributeValue('#formatModal .modal-close', 'aria-label', pick(texts.format_close_label, lang));
    setAttributeValue('#labListModal .modal-close', 'aria-label', pick(texts.lab_modal_close_label, lang));
    const bookingLabels = {
      booking_name_label: '#bookingForm .form-row label:nth-child(1)',
      booking_phone_label: '#bookingForm .form-row label:nth-child(2)',
      booking_email_label: '#bookingForm > label:nth-of-type(1)',
      booking_date_label: '#bookingForm > label:nth-of-type(2)',
      booking_request_label: '#bookingForm > label:nth-of-type(3)',
      contact_whatsapp_label: '.contact-choice label:nth-of-type(1)',
      contact_telegram_label: '.contact-choice label:nth-of-type(2)'
    };
    Object.entries(bookingLabels).forEach(([key, selector]) => setLabelText(selector, pick(texts[key], lang)));
    setPlaceholder('#phone', pick(texts.booking_phone_placeholder, lang));
    setPlaceholder('#email', pick(texts.booking_email_placeholder, lang));
    setPlaceholder('#message', pick(texts.booking_request_placeholder, lang));
    renderMarquee(pick(texts.marquee_topics, lang));
  }

  function applyLinks(data, lang) {
    const links = data.links || {};
    const storyButtons = document.querySelectorAll(".stories-actions a");
    if (links.telegram_blog && storyButtons[0]) {
      storyButtons[0].href = links.telegram_blog.url || storyButtons[0].href;
      storyButtons[0].textContent = pick(links.telegram_blog.label, lang) || storyButtons[0].textContent;
    }
    if (links.instagram && storyButtons[1]) {
      storyButtons[1].href = links.instagram.url || storyButtons[1].href;
      storyButtons[1].textContent = pick(links.instagram.label, lang) || storyButtons[1].textContent;
    }
    const contactButtons = {
      whatsapp_contact: document.querySelector('[data-contact-whatsapp]'),
      telegram_contact: document.querySelector('[data-contact-telegram]'),
      email_contact: document.querySelector('[data-contact-email]')
    };
    Object.entries(contactButtons).forEach(([key, button]) => {
      if (links[key] && button) {
        button.href = links[key].url || button.href;
        button.textContent = pick(links[key].label, lang) || button.textContent;
      }
    });
    const online = document.querySelector('.modal-option[href$="questionnaire.html"]');
    const pdf = document.querySelector('.modal-option[download]');
    if (links.questionnaire_online && online) online.href = links.questionnaire_online.url || online.href;
    if (links.questionnaire_pdf && pdf) pdf.href = links.questionnaire_pdf.url || pdf.href;
  }

  function applyFormats(data, lang) {
    if (!Array.isArray(data.formats) || !data.formats.length) return;
    const cards = document.querySelectorAll(".format-card");
    data.formats.forEach((format, index) => {
      const card = cards[index];
      if (!card) return;
      const input = card.querySelector('input[name="formatChoice"]');
      const title = card.querySelector(".format-title");
      const description = card.querySelector(".format-text");
      const list = card.querySelector(".format-list");
      const strong = card.querySelector("strong:last-child");
      const name = pick(format.name, lang);
      if (input) {
        input.value = name;
        input.dataset.price = price(format, "ru");
        input.dataset.priceEn = price(format, "en");
        input.dataset.priceEt = price(format, "et");
      }
      if (title) title.textContent = name;
      if (description) description.textContent = pick(format.description, lang);
      if (list && Array.isArray(format.includes?.[lang]) && format.includes[lang].length) {
        list.innerHTML = format.includes[lang].map((item) => '<span>' + item + '</span>').join("");
      }
      if (strong) strong.textContent = price(format, lang);
    });

    const first = data.formats[0];
    if (first) {
      const selectedName = pick(first.name, lang);
      const input = document.querySelector('.format-card input[name="formatChoice"]:checked') || document.querySelector('.format-card input[name="formatChoice"]');
      if (input) {
        document.querySelector("#selectedFormatTitle").textContent = input.value || selectedName;
        document.querySelector("#selectedFormatPrice").textContent = lang === "ru" ? input.dataset.price : lang === "et" ? input.dataset.priceEt : input.dataset.priceEn;
        const service = document.querySelector("#service");
        if (service) service.value = input.value || selectedName;
      }
    }
  }

  function applyReviews(data, lang) {
    if (!Array.isArray(data.reviews) || !data.reviews.length) return;
    const track = document.querySelector("#feedbackTrack");
    if (!track) return;
    track.innerHTML = data.reviews.map((review) => {
      return '<article class="feedback-card">' +
        '<p>' + (pick(review.text, lang) || "") + '</p>' +
        '<footer><strong>' + (review.client || "") + '</strong><span>' + (pick(review.caption, lang) || "") + '</span></footer>' +
        '</article>';
    }).join("");
  }

  function applyApproach(data, lang) {
    if (!Array.isArray(data.approach) || !data.approach.length) return;
    const container = document.querySelector("#method .method-grid");
    if (!container) return;
    const cards = data.approach.slice();
    const hasStrategy = cards.some((card) => {
      const title = pick(card.title, "ru") || pick(card.title, lang) || "";
      return title.trim().toLowerCase() === "стратегия";
    });
    if (!hasStrategy) {
      cards.push({
        number: "4",
        title: {
          ru: "Стратегия",
          en: "Strategy",
          et: "Strateegia"
        },
        text: {
          ru: "Не список рекомендаций, а выстроенные условия, в которых организм начинает возвращать баланс.",
          en: "Not a list of recommendations, but structured conditions in which the body begins to return to balance.",
          et: "Mitte soovituste nimekiri, vaid tingimused, milles keha hakkab tasakaalu tagasi liikuma."
        }
      });
    }
    container.innerHTML = cards.map((card) => {
      return '<div><span>' + (card.number || '') + '</span><h3>' + (pick(card.title, lang) || '') + '</h3><p>' + (pick(card.text, lang) || '') + '</p></div>';
    }).join("");
  }

  function applyRequests(data, lang) {
    if (!Array.isArray(data.requests) || !data.requests.length) return;
    const container = document.querySelector("#requests .request-columns");
    if (!container) return;
    container.innerHTML = data.requests.map((column) => {
      const items = Array.isArray(column.items?.[lang]) ? column.items[lang] : [];
      return '<article><h3>' + (pick(column.title, lang) || "") + '</h3><ul>' +
        items.map((item) => '<li>' + item + '</li>').join("") +
        '</ul></article>';
    }).join("");
  }


  function applyBodyMap(data, lang) {
    renderBodyMap(data.bodyMap, lang);
  }

  function applyAnalyses(data, lang) {
    if (!Array.isArray(data.analyses) || !data.analyses.length) return;
    const list = document.querySelector(".lab-list");
    if (!list) return;
    list.innerHTML = data.analyses
      .filter((item) => item.group !== "history")
      .map((item) => '<li>' + pick(item.title, lang) + '</li>')
      .join("");
  }

  function applyCmsData() {
    const data = window.__HOLISTICBITE_CMS__;
    if (!data || !data.ok) return;
    const lang = langFromPage();
    applyTexts(data, lang);
    applyLinks(data, lang);
    applyFormats(data, lang);
    applyReviews(data, lang);
    applyRequests(data, lang);
    applyApproach(data, lang);
    applyAnalyses(data, lang);
    applyBodyMap(data, lang);
    if (typeof updateFeedbackCarousel === "function") updateFeedbackCarousel();
    if (typeof updateFormatCarousel === "function") updateFormatCarousel();
  }

  async function loadCmsData() {
    try {
      const response = await fetch("/api/cms?ts=" + Date.now(), { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("CMS request failed");
      window.__HOLISTICBITE_CMS__ = await response.json();
      applyCmsData();
      revealCmsPage();
    } catch (error) {
      console.info("Notion CMS is unavailable; using static content.", error);
      revealCmsPage();
    }
  }

  document.querySelectorAll(".language-switcher button").forEach((button) => {
    button.addEventListener("click", () => window.setTimeout(applyCmsData, 0));
  });
  document.addEventListener("change", (event) => {
    if (event.target && event.target.matches('.format-card input[name="formatChoice"]')) window.setTimeout(applyCmsData, 0);
  });
  loadCmsData();
})();

// Premium hero depth: lightweight 3D projection, no external runtime.
(function(){
  const canvas = document.querySelector("#heroDepthCanvas");
  const scene = document.querySelector(".hero-depth-scene");
  const hero = document.querySelector(".hero");
  if (!canvas || !scene || !hero) return;
  if (window.getComputedStyle && window.getComputedStyle(scene).display === "none") return;

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const particles = [];
  const particleCount = 132;
  const ribbons = Array.from({ length: 3 }, (_, index) => ({ index, phase: index * 2.1 }));
  let width = 0;
  let height = 0;
  let dpr = 1;
  let targetX = 0;
  let targetY = 0;
  let driftX = 0;
  let driftY = 0;
  let frameId = 0;

  for (let i = 0; i < particleCount; i += 1) {
    const t = i / particleCount;
    const angle = t * Math.PI * 2;
    const band = (i % 11) / 11;
    const radius = 0.42 + Math.sin(i * 1.7) * 0.12;
    particles.push({
      angle,
      band,
      radius,
      speed: 0.00065 + (i % 7) * 0.00007,
      size: 1.2 + (i % 5) * 0.35
    });
  }

  function resizeDepthCanvas() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function projectParticle(particle, time) {
    const spin = particle.angle + time * particle.speed;
    const tilt = -0.82 + particle.band * 1.64 + driftY * 0.0009;
    const yaw = spin + driftX * 0.0012;
    const x3 = Math.cos(yaw) * particle.radius;
    const y3 = Math.sin(tilt) * 0.52 + Math.sin(yaw * 2.0 + time * .00035) * 0.09;
    const z3 = Math.sin(yaw) * particle.radius + Math.cos(tilt) * 0.18;
    const perspective = 1.18 / (1.55 - z3 * 0.48);
    return {
      x: width * 0.5 + x3 * width * 0.42 * perspective,
      y: height * 0.5 + y3 * height * 0.42 * perspective,
      z: z3,
      scale: perspective
    };
  }

  function drawRibbon(time, ribbon) {
    const points = [];
    for (let i = 0; i <= 84; i += 1) {
      const t = i / 84;
      const angle = t * Math.PI * 2 + time * (0.00042 + ribbon.index * 0.00007) + ribbon.phase;
      const tilt = -0.72 + Math.sin(t * Math.PI * 2 + ribbon.phase) * 0.18 + driftY * 0.0007;
      const radius = 0.30 + ribbon.index * 0.075 + Math.sin(angle * 2.0) * 0.025;
      const x3 = Math.cos(angle) * radius;
      const y3 = Math.sin(tilt) * 0.34 + Math.sin(angle * 3.0 + ribbon.phase) * 0.035;
      const z3 = Math.sin(angle) * radius;
      const perspective = 1.14 / (1.48 - z3 * 0.52);
      points.push({
        x: width * 0.5 + x3 * width * 0.48 * perspective,
        y: height * 0.5 + y3 * height * 0.48 * perspective,
        z: z3
      });
    }

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    const gradient = ctx.createLinearGradient(width * .18, height * .42, width * .82, height * .58);
    gradient.addColorStop(0, "rgba(169,141,102,0)");
    gradient.addColorStop(.38, "rgba(246,241,234," + (0.16 + ribbon.index * 0.03).toFixed(3) + ")");
    gradient.addColorStop(.62, "rgba(169,141,102," + (0.28 - ribbon.index * 0.04).toFixed(3) + ")");
    gradient.addColorStop(1, "rgba(169,141,102,0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.2 + ribbon.index * .55;
    ctx.stroke();
  }

  function drawDepth(time) {
    driftX += (targetX - driftX) * 0.055;
    driftY += (targetY - driftY) * 0.055;
    hero.style.setProperty("--depth-x", (driftX * 0.026).toFixed(2) + "px");
    hero.style.setProperty("--depth-y", (driftY * 0.020).toFixed(2) + "px");

    ctx.clearRect(0, 0, width, height);
    const projected = particles.map((particle) => ({ particle, point: projectParticle(particle, time) }))
      .sort((a, b) => a.point.z - b.point.z);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ribbons.forEach((ribbon) => drawRibbon(time, ribbon));
    ctx.lineWidth = 1;
    for (let i = 0; i < projected.length; i += 1) {
      const a = projected[i].point;
      if (i % 2 === 0 && projected[i + 3]) {
        const b = projected[i + 3].point;
        const alpha = Math.max(0.04, Math.min(0.22, (a.z + 1.2) * 0.12));
        ctx.strokeStyle = "rgba(169,141,102," + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    projected.forEach(({ particle, point }) => {
      const depth = Math.max(0, Math.min(1, (point.z + 1) * 0.5));
      const size = particle.size * point.scale * (0.72 + depth * 0.9);
      const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size * 5.5);
      glow.addColorStop(0, "rgba(246,241,234," + (0.22 + depth * 0.38).toFixed(3) + ")");
      glow.addColorStop(0.32, "rgba(169,141,102," + (0.16 + depth * 0.22).toFixed(3) + ")");
      glow.addColorStop(1, "rgba(70,16,34,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size * 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = depth > 0.58 ? "rgba(246,241,234,.86)" : "rgba(169,141,102,.70)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(1, size), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    if (!reduceMotion) frameId = window.requestAnimationFrame(drawDepth);
  }

  function updatePointer(event) {
    const rect = hero.getBoundingClientRect();
    targetX = event.clientX - rect.left - rect.width / 2;
    targetY = event.clientY - rect.top - rect.height / 2;
    hero.style.setProperty("--tilt-x", ((targetX / rect.width) * 8).toFixed(2) + "deg");
    hero.style.setProperty("--tilt-y", ((targetY / rect.height) * 8).toFixed(2) + "deg");
  }

  resizeDepthCanvas();
  window.addEventListener("resize", resizeDepthCanvas);
  hero.addEventListener("pointermove", updatePointer);
  hero.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    hero.style.setProperty("--tilt-x", "0deg");
    hero.style.setProperty("--tilt-y", "0deg");
  });
  drawDepth(0);
})();

(function(){
  const booking = document.querySelector(".booking-band");
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!booking || reduceMotion) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frameId = 0;

  function animateBookingDepth() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    booking.style.setProperty("--booking-x", currentX.toFixed(2) + "px");
    booking.style.setProperty("--booking-y", currentY.toFixed(2) + "px");
    frameId = window.requestAnimationFrame(animateBookingDepth);
  }

  booking.addEventListener("pointermove", (event) => {
    const rect = booking.getBoundingClientRect();
    targetX = event.clientX - rect.left - rect.width / 2;
    targetY = event.clientY - rect.top - rect.height / 2;
    if (!frameId) animateBookingDepth();
  });

  booking.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
  });
})();


// Body map front/back art switch
(function(){
  const visual = document.querySelector('.body-map-visual');
  const buttons = document.querySelectorAll('[data-body-view]');
  if (!visual || !buttons.length) return;
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-body-view');
      visual.classList.toggle('is-back', view === 'back');
      buttons.forEach((item) => item.classList.toggle('is-active', item === button));
    });
  });
})();
