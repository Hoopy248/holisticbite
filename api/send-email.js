const TARGET_EMAIL = process.env.CONTACT_TO_EMAIL || "darja.nutritsioloog@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "HolisticBite <onboarding@resend.dev>";

function clean(value) {
  return String(value || "").trim();
}

function listLine(label, value) {
  const text = Array.isArray(value) ? value.filter(Boolean).join(", ") : clean(value);
  return text ? label + ": " + text : label + ": -";
}

function bookingEmail(data) {
  const name = clean(data.clientName);
  const subject = "Запись на консультацию" + (name ? " - " + name : "");
  const lines = [
    "Новая запись на консультацию HolisticBite",
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

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TARGET_EMAIL],
        reply_to: email.replyTo || undefined,
        subject: email.subject,
        text: email.text
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      res.status(response.status).json({ ok: false, error: result.message || "Email sending failed" });
      return;
    }

    res.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
