import nodemailer from 'nodemailer';

const SMTP_CONFIG = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY
  }
};

const testHtmlTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lookitry - Prueba de Plantilla</title>
  <style>
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0a0a0a;
      color: #ffffff;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #141414;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #FF5C3A 0%, #ff8f6b 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: white;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #ffffff;
      margin: 0 0 20px 0;
      font-size: 22px;
    }
    .content p {
      color: #999;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .feature-box {
      background-color: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .feature-box h3 {
      color: #FF5C3A;
      margin: 0 0 10px 0;
      font-size: 16px;
    }
    .feature-box p {
      margin: 0;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background-color: #FF5C3A;
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .footer {
      background-color: #0a0a0a;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #333;
    }
    .footer p {
      color: #666;
      font-size: 12px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Look<span>itry</span></h1>
    </div>
    
    <div class="content">
      <h2>Hola Samuel!</h2>
      
      <p>
        Tenemos algo especial para ti. Imagina poder mostrar a tus clientas cómo les queda cada ropa <strong>antes</strong> de que compren.
      </p>
      
      <div class="feature-box">
        <h3>✨ Try-On Virtual con IA</h3>
        <p>Sube una foto de tu cliente y cualquier prenda. Nuestra IA genera cómo le queda perfectamente.</p>
      </div>
      
      <div class="feature-box">
        <h3>📱 Widget para tu tienda online</h3>
        <p>Intégralo en minutos en tu Shopify, WooCommerce o cualquier plataforma.</p>
      </div>
      
      <div class="feature-box">
        <h3>📈 Aumenta tus conversiones</h3>
        <p>Reduce devoluciones hasta un 40% y aumenta la satisfacción de tus clientas.</p>
      </div>
      
      <center>
        <a href="https://lookitry.com/demo" class="cta-button">Ver Demo Gratuita</a>
      </center>
    </div>
    
    <div class="footer">
      <p>
        © 2026 Lookitry. Todos los derechos reservados.<br>
        Este email fue enviado a samu.wilkie@gmail.com
      </p>
    </div>
  </div>
</body>
</html>
`;

async function sendEmail() {
  console.log('📧 Creando transporter...');
  
  const transporter = nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: {
      user: SMTP_CONFIG.auth.user,
      pass: SMTP_CONFIG.auth.pass
    }
  });

  console.log('📤 Enviando email...');

  try {
    const info = await transporter.sendMail({
      from: 'Lookitry <info@lookitry.com>',
      to: 'samu.wilkie@gmail.com',
      subject: '🧪 Test - Cómo Lookitry puede transformar tu tienda de moda',
      html: testHtmlTemplate
    });

    console.log('✅ Email enviado!');
    console.log('   Message ID:', info.messageId);
    console.log('   Accepted:', info.accepted);
    console.log('   Rejected:', info.rejected);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

sendEmail();