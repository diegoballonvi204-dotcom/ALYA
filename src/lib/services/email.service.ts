/**
 * Servicio de Envío de Correos y Notificaciones de Activación - ALYA LegalTech
 */

interface SendLawyerApprovalEmailParams {
  toEmail: string;
  lawyerName: string;
  code: string;
}

export async function sendLawyerApprovalEmail({
  toEmail,
  lawyerName,
  code,
}: SendLawyerApprovalEmailParams) {
  const subject = `¡Documentación Aprobada en ALYA LegalTech! Tu Código de Activación: ${code}`;
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Aprobación de Colegiatura ALYA</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #070B14 0%, #0F172A 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .badge { display: inline-block; background-color: rgba(96, 165, 250, 0.15); border: 1px solid rgba(96, 165, 250, 0.3); color: #60a5fa; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; line-height: 1.6; font-size: 14px; color: #334155; }
    .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 14px; }
    .code-box { background: #f1f5f9; border: 2px dashed #93c5fd; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .code-title { font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a; }
    .note { font-size: 12px; color: #64748b; margin-top: 8px; }
    .btn { display: block; width: fit-content; margin: 28px auto 0; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Expediente Profesional Verificado</div>
      <h1>ALYA LegalTech</h1>
    </div>
    <div class="content">
      <div class="greeting">Estimado(a) Dr(a). ${lawyerName || "Colega Abogado(a)"},</div>
      <p>Nos complace informarle que la documentación remitida (DNI, Carné de Colegiatura y Habilitación Oficial) ha sido <strong>revisada y aprobada exitosamente</strong> por el equipo de verificación de ALYA.</p>
      
      <p>Para activar definitivamente su consola profesional y acceder de inmediato a los casos de clientes compatibles, introduzca el siguiente código de verificación en su cuenta:</p>

      <div class="code-box">
        <div class="code-title">Código de Activación Profesional</div>
        <div class="code">${code}</div>
        <div class="note">Este código de un solo uso activa el acceso a casos y configuración de perfil.</div>
      </div>

      <p>Una vez ingresado el código, su perfil obtendrá el distintivo de <strong>Abogado Colegiado Verificado</strong> y comenzará a recibir recomendaciones y consultas legales según sus especialidades.</p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/lawyer/dashboard" class="btn">
        Ingresar y Activar mi Cuenta
      </a>
    </div>
    <div class="footer">
      ALYA LegalTech Perú • Plataforma Segura bajo Ley N.° 29733 de Protección de Datos Personales.<br>
      Si no solicitó este registro, puede desestimar este mensaje.
    </div>
  </div>
</body>
</html>
  `.trim();

  // 1. Si existe API de Resend configurada en entorno, enviar correo real
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "ALYA LegalTech <notificaciones@alya.pe>",
          to: [toEmail],
          subject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.warn("[EmailService] Resend API error:", errorData);
      } else {
        console.log(`[EmailService] Correo enviado exitosamente a ${toEmail} con código ${code}`);
      }
    } catch (err) {
      console.error("[EmailService] Falló envío vía Resend:", err);
    }
  }

  // 2. Registro transparente en logs de auditoría / consola
  console.log(`\n======================================================`);
  console.log(`[ALYA EMAIL SERVICE] CORREO DE APROBACIÓN DE DOCUMENTOS`);
  console.log(`Destinatario: ${toEmail}`);
  console.log(`Abogado: ${lawyerName}`);
  console.log(`Código de Verificación: ${code}`);
  console.log(`Asunto: ${subject}`);
  console.log(`======================================================\n`);

  return { success: true, code, recipient: toEmail };
}
