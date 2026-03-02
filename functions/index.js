const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Región us-central1 (default, más estable para Firestore triggers)
setGlobalOptions({ region: "us-central1" });

// ──────────────────────────────────────────────────────────────
// Helper: crear transporter de Nodemailer usando env vars
// Configura las variables con:
//   firebase functions:secrets:set EMAIL_USER
//   firebase functions:secrets:set EMAIL_PASS
// ──────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password de Gmail (no la contraseña normal)
    },
  });
}

// ──────────────────────────────────────────────────────────────
// Helper: nombres bonitos de clínicas
// ──────────────────────────────────────────────────────────────
function getClinicaLabel(clinica) {
  const labels = {
    "santa-tecla": "Santa Tecla",
    soyapango: "Soyapango",
    "san-martin": "San Martín",
    escalon: "Escalón",
    usulutan: "Usulután",
  };
  return labels[clinica] || clinica;
}

// ──────────────────────────────────────────────────────────────
// Helper: formatear fecha de YYYY-MM-DD a "Lunes, 3 de Marzo de 2025"
// ──────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return dateStr;
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-SV", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getChangedAppointmentFields(before, after) {
  const fieldsToWatch = ["date", "time", "clinica", "reason", "notas"];
  return fieldsToWatch.filter((field) => (before[field] || "") !== (after[field] || ""));
}

async function getUserEmailByUid(userId) {
  if (!userId) return null;

  try {
    const userRecord = await admin.auth().getUser(userId);
    return userRecord.email || null;
  } catch (err) {
    console.error("Error fetching user email:", err);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Cloud Function: se dispara al crear un documento en /appointments/{appointmentId}
// ──────────────────────────────────────────────────────────────
exports.sendAppointmentConfirmationEmail = onDocumentCreated(
  {
    document: "appointments/{appointmentId}",
    secrets: ["EMAIL_USER", "EMAIL_PASS"],
  },
  async (event) => {
    const appointment = event.data.data();
    const appointmentId = event.params.appointmentId;

    if (!appointment) {
      console.log("No appointment data found.");
      return null;
    }

    const {
      userId,
      patientName,
      date,
      time,
      reason,
      clinica,
      notas,
      status,
    } = appointment;

    // Solo enviar correo para citas nuevas con status "programada"
    if (status !== "programada") {
      console.log(`Appointment ${appointmentId} has status "${status}", skipping email.`);
      return null;
    }

    // Obtener el correo del usuario desde Firebase Auth
    let userEmail = null;
    try {
      const userRecord = await admin.auth().getUser(userId);
      userEmail = userRecord.email;
    } catch (err) {
      console.error("Error fetching user email:", err);
      return null;
    }

    if (!userEmail) {
      console.log(`User ${userId} has no email address, skipping.`);
      return null;
    }

    const clinicaLabel = getClinicaLabel(clinica);
    const formattedDate = formatDate(date);
    const patientFirstName = (patientName || "Paciente").split(" ")[0];

    // ── HTML del correo ──────────────────────────────────────────
    const htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirmación de Cita</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header (Más compacto y pequeño) -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a5276 0%, #2980b9 100%); padding: 30px 20px; text-align: center;">
              <div style="margin-bottom: 8px;">
                <span style="font-size: 32px; line-height: 1;">🦷</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2;">
                Clínica Dr. César Vásquez
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 400; letter-spacing: 0.3px;">
                Odontólogos forjando mejores sonrisas
              </p>
            </td>
          </tr>

          <!-- Saludo -->
          <tr>
            <td style="padding:40px 40px 0;">
              <h2 style="margin:0 0 12px;font-size:22px;color:#1a5276;font-weight:700;">
                Hola, ${patientFirstName}
              </h2>
              <p style="margin:0;font-size:16px;color:#4a5568;line-height:1.6;">
                Tu cita ha sido <strong>agendada exitosamente</strong>. 
                A continuación los detalles de la misma:
              </p>
            </td>
          </tr>

          <!-- Tarjeta de detalles -->
          <tr>
            <td style="padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
                
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:24px;vertical-align:top;padding-top:2px;">
                          <div style="width:4px;height:16px;background:#2980b9;border-radius:2px;"></div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:12px;color:#a0aec0;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Fecha</p>
                          <p style="margin:2px 0 0;font-size:16px;color:#1a202c;font-weight:600;">${formattedDate}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:24px;vertical-align:top;padding-top:2px;">
                          <div style="width:4px;height:16px;background:#2980b9;border-radius:2px;"></div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:12px;color:#a0aec0;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Hora</p>
                          <p style="margin:2px 0 0;font-size:16px;color:#1a202c;font-weight:600;">${time}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:24px;vertical-align:top;padding-top:2px;">
                          <div style="width:4px;height:16px;background:#2980b9;border-radius:2px;"></div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:12px;color:#a0aec0;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Clínica</p>
                          <p style="margin:2px 0 0;font-size:16px;color:#1a202c;font-weight:600;">${clinicaLabel}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 20px;${notas ? "border-bottom:1px solid #e2e8f0;" : ""}">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:24px;vertical-align:top;padding-top:2px;">
                          <div style="width:4px;height:16px;background:#2980b9;border-radius:2px;"></div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:12px;color:#a0aec0;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Motivo</p>
                          <p style="margin:2px 0 0;font-size:16px;color:#1a202c;font-weight:600;">${reason || "No especificado"}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${notas ? `
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:24px;vertical-align:top;padding-top:2px;">
                          <div style="width:4px;height:16px;background:#2980b9;border-radius:2px;"></div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:12px;color:#a0aec0;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Notas</p>
                          <p style="margin:2px 0 0;font-size:15px;color:#4a5568;">${notas}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ""}

              </table>
            </td>
          </tr>

          <!-- Recordatorio -->
          <tr>
            <td style="padding:0 40px 28px;">
              <div style="background:#fdf2f2;border-left:4px solid #ef4444;padding:12px 16px;">
                <p style="margin:0;font-size:14px;color:#9b1c1c;line-height:1.5;">
                  <strong>Recordatorio:</strong> Si necesitas cancelar o modificar tu cita, 
                  por favor hazlo con al menos 24 horas de anticipación desde 
                  nuestra plataforma o comunícate con nosotros directamente.
                </p>
              </div>
            </td>
          </tr>

          <!-- Botón CTA -->
          <tr>
            <td style="padding:0 40px 48px;text-align:center;">
              <a href="https://coi-dr-cv.web.app/mis-citas"
                 style="display:inline-block;background:#2980b9;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 30px;border-radius:4px;">
                Ver Mis Citas
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:30px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#718096;line-height:1.6;text-transform:uppercase;letter-spacing:1px;">
                Clínica Dental Dr. César Vásquez
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#a0aec0;">
                Este correo fue enviado automáticamente por nuestro sistema de gestión. 
                Por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `;

    // ── Texto plano (fallback) ───────────────────────────────────
    const textBody = `
Hola ${patientFirstName},

Tu cita ha sido agendada exitosamente en la Clínica Dental Dr. César Vásquez.

DETALLES DE TU CITA:
- Fecha: ${formattedDate}
- Hora: ${time}
- Clínica: ${clinicaLabel}
- Motivo: ${reason || "No especificado"}
${notas ? `- Notas: ${notas}` : ""}

Si necesitas cancelar o modificar tu cita, hazlo con al menos 24 horas de anticipación en: https://coi-dr-cv.web.app/mis-citas

Clínica Dental Dr. César Vásquez
(Este correo fue enviado automáticamente por el sistema.)
    `.trim();

    // ── Enviar el correo ─────────────────────────────────────────
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Clínica Dr. César Vásquez" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Confirmación de Cita - ${formattedDate} a las ${time}`,
      text: textBody,
      html: htmlBody,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Confirmation email sent to ${userEmail} for appointment ${appointmentId}`);
    } catch (emailErr) {
      console.error("Error sending confirmation email:", emailErr);
    }

    return null;
  }
);

exports.sendAppointmentUpdateEmail = onDocumentUpdated(
  {
    document: "appointments/{appointmentId}",
    secrets: ["EMAIL_USER", "EMAIL_PASS"],
  },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const appointmentId = event.params.appointmentId;

    if (!before || !after) {
      console.log("Missing appointment data in update event.");
      return null;
    }

    const statusChanged = before.status !== after.status;
    const changedFields = getChangedAppointmentFields(before, after);
    const isCancellation = statusChanged && after.status === "cancelada";
    const isEditedAppointment = changedFields.length > 0 && !isCancellation;

    if (!isCancellation && !isEditedAppointment) {
      console.log(`Appointment ${appointmentId} updated without relevant changes, skipping email.`);
      return null;
    }

    const userEmail = await getUserEmailByUid(after.userId || before.userId);
    if (!userEmail) {
      console.log(`User ${(after.userId || before.userId)} has no email address, skipping.`);
      return null;
    }

    const clinicaLabel = getClinicaLabel(after.clinica);
    const formattedDate = formatDate(after.date);
    const patientFirstName = (after.patientName || before.patientName || "Paciente").split(" ")[0];
    const transporter = createTransporter();

    let subject = "";
    let textBody = "";
    let htmlBody = "";

    if (isCancellation) {
      subject = `Cita Cancelada - ${formattedDate} a las ${after.time}`;
      textBody = `
Hola ${patientFirstName},

Tu cita del ${formattedDate} a las ${after.time} en la clínica ${clinicaLabel} ha sido cancelada.

Si deseas, puedes agendar una nueva cita desde: https://coi-dr-cv.web.app/cita

Clínica Dental Dr. César Vásquez
(Este correo fue enviado automáticamente por el sistema.)
      `.trim();

      htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Cita Cancelada</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:#b91c1c;padding:24px 20px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;">Clínica Dr. César Vásquez</h1>
              <p style="margin:8px 0 0;color:#fee2e2;font-size:14px;">Notificación de cita cancelada</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 12px;color:#1f2937;">
              <p style="margin:0 0 12px;font-size:16px;">Hola, <strong>${patientFirstName}</strong>.</p>
              <p style="margin:0;font-size:15px;line-height:1.6;">Tu cita del <strong>${formattedDate}</strong> a las <strong>${after.time}</strong> en <strong>${clinicaLabel}</strong> ha sido cancelada.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 30px;text-align:center;">
              <a href="https://coi-dr-cv.web.app/cita" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:14px;font-weight:600;">Agendar Nueva Cita</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    } else {
      const fieldLabels = {
        date: "fecha",
        time: "hora",
        clinica: "clínica",
        reason: "motivo",
        notas: "notas",
      };

      const changedFieldsText = changedFields.map((field) => fieldLabels[field] || field).join(", ");
      subject = `Cita Reprogramada/Actualizada - ${formattedDate} a las ${after.time}`;
      textBody = `
Hola ${patientFirstName},

Tu cita ha sido actualizada. Campos modificados: ${changedFieldsText}.

Nuevos detalles:
- Fecha: ${formattedDate}
- Hora: ${after.time}
- Clínica: ${clinicaLabel}
- Motivo: ${after.reason || "No especificado"}
${after.notas ? `- Notas: ${after.notas}` : ""}

Puedes revisar tus citas en: https://coi-dr-cv.web.app/mis-citas

Clínica Dental Dr. César Vásquez
(Este correo fue enviado automáticamente por el sistema.)
      `.trim();

      htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Cita Actualizada</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:#1d4ed8;padding:24px 20px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;">Clínica Dr. César Vásquez</h1>
              <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">Notificación de cambios en tu cita</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#1f2937;">
              <p style="margin:0 0 12px;font-size:16px;">Hola, <strong>${patientFirstName}</strong>.</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Tu cita fue actualizada. <strong>Cambios:</strong> ${changedFieldsText}.</p>
              <p style="margin:0;font-size:15px;line-height:1.7;">
                <strong>Fecha:</strong> ${formattedDate}<br/>
                <strong>Hora:</strong> ${after.time}<br/>
                <strong>Clínica:</strong> ${clinicaLabel}<br/>
                <strong>Motivo:</strong> ${after.reason || "No especificado"}
                ${after.notas ? `<br/><strong>Notas:</strong> ${after.notas}` : ""}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 30px;text-align:center;">
              <a href="https://coi-dr-cv.web.app/mis-citas" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:14px;font-weight:600;">Ver Mis Citas</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    }

    const mailOptions = {
      from: `"Clínica Dr. César Vásquez" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject,
      text: textBody,
      html: htmlBody,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Update email sent to ${userEmail} for appointment ${appointmentId}`);
    } catch (emailErr) {
      console.error("Error sending update email:", emailErr);
    }

    return null;
  }
);
