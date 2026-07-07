const TARGET_EMAIL = process.env.CONTACT_TO_EMAIL || "darja.nutritsioloog@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "HolisticBite <onboarding@resend.dev>";
const SITE_URL = process.env.SITE_URL || "https://holisticbite.vercel.app";

function clean(value) {
  return String(value || "").trim();
}

function listLine(label, value) {
  const text = Array.isArray(value) ? value.filter(Boolean).join(", ") : clean(value);
  return text ? label + ": " + text : label + ": -";
}

function bookingEmail(data) {
  const name = clean(data.clientName);
  const subject = "Запись на разбор" + (name ? " - " + name : "");
  const lines = [
    "Новая запись на разбор HolisticBite",
    "",
    listLine("Имя", data.clientName),
    listLine("Телефон", data.phone),
    listLine("Email", data.email),
    listLine("Комфортная связь", data.contactChannels),
    listLine("Формат", data.service),
    listLine("Цена", data.price),
    listLine("Формат анкеты", data.questionnaireFormat),
    listLine("Дата", data.date),
    listLine("Время", data.slot),
    "",
    "Запрос:",
    clean(data.message) || "-"
  ];
  return { subject, text: lines.join("\n"), replyTo: clean(data.email) };
}

function clientBookingEmail(data) {
  const date = clean(data.date);
  const slot = clean(data.slot);
  const subject = "Вы записаны на разбор к Дарье";
  const lines = [
    "Здравствуйте,",
    "",
    "Вы записаны на разбор к нутрициологу Дарье" + (date || slot ? " на " + [date, slot].filter(Boolean).join(" в ") : "") + ".",
    "Ссылка на онлайн-встречу будет прислана Вам на почту за сутки до встречи.",
    "",
    "Если у вас есть анализы, УЗИ или данные об операциях — пришлите их за последние 1–3 года. Лучше прислать всё, что есть, даже если кажется, что это не связано. Это позволит собрать более точную картину.",
    "",
    "После ознакомления с результатами Вашей анкеты я предоставлю Вам перечень анализов, которые нужно сдать до встречи.",
    "",
    "Онлайн-анкета: " + SITE_URL.replace(/\/$/, "") + "/questionnaire.html",
    "",
    "С уважением,",
    "Дарья, HolisticBite"
  ];
  return { subject, text: lines.join("\n") };
}

function questionnaireEmail(data) {
  const name = clean(data.clientName);
  const subject = "Анкета клиента" + (name ? " - " + name : "");
  const lines = [
    "Анкета клиента HolisticBite",
    "",
    listLine("Email клиента", data.email),
    listLine("Имя клиента", data.clientName)
  ];
  (Array.isArray(data.answers) ? data.answers : []).forEach((item, index) => {
    lines.push("", String(index + 1) + ". " + clean(item.question), clean(item.answer) || "-");
  });
  return { subject, text: lines.join("\n"), replyTo: clean(data.email) };
}

async function sendViaResend(message) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(message)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || result.error || result.name || JSON.stringify(result) || "Email sending failed");
  }
  return result;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    res.status(500).json({ ok: false, error: "RESEND_API_KEY is not configured" });
    return;
  }

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const email = data.type === "questionnaire" ? questionnaireEmail(data) : bookingEmail(data);

    const result = await sendViaResend({
      from: FROM_EMAIL,
      to: [TARGET_EMAIL],
      reply_to: email.replyTo || undefined,
      subject: email.subject,
      text: email.text
    });

    if (data.type !== "questionnaire" && clean(data.email)) {
      const clientEmail = clientBookingEmail(data);
      await sendViaResend({
        from: FROM_EMAIL,
        to: [clean(data.email)],
        subject: clientEmail.subject,
        text: clientEmail.text
      });
    }

    res.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
