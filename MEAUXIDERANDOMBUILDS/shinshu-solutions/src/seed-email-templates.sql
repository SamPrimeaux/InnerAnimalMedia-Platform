-- Default Email Templates for Shinshu Solutions
-- Professional email templates for automated responses

-- English Inquiry Auto-Response
INSERT INTO email_templates (id, template_type, language_code, subject, html_body, text_body, variables, is_active, created_at, updated_at)
VALUES (
  'template-inquiry-en',
  'inquiry',
  'en',
  'Thank you for contacting Shinshu Solutions - {{name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF8C42; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 0.9em; }
    .button { display: inline-block; background: #FF8C42; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Shinshu Solutions</h1>
      <p>Opening Nagano to the World</p>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      
      <p>Thank you for reaching out to Shinshu Solutions. We have received your inquiry and appreciate your interest in our services.</p>
      
      <p><strong>Your Message:</strong></p>
      <p style="background: white; padding: 15px; border-left: 4px solid #FF8C42; margin: 15px 0;">{{message}}</p>
      
      <p>Our team will review your inquiry and get back to you within 24-48 hours. We specialize in:</p>
      <ul>
        <li>Translation & Interpretation (Japanese-English)</li>
        <li>Client Liaison Services</li>
        <li>Project Coordination & Support</li>
        <li>Property Management</li>
        <li>Cultural Bridge Consulting</li>
      </ul>
      
      <p>If you have any urgent questions, please feel free to contact us directly:</p>
      <p>
        <strong>Email:</strong> {{contact_email}}<br>
        <strong>Phone:</strong> {{contact_phone}}
      </p>
      
      <p>We look forward to assisting you with your real estate needs in Nagano, Japan.</p>
      
      <p>Best regards,<br>
      <strong>Jake Waalk</strong><br>
      Shinshu Solutions</p>
    </div>
    <div class="footer">
      <p>Shinshu Solutions | Komoro, Nagano Prefecture, Japan</p>
      <p>長野県小諸市</p>
    </div>
  </div>
</body>
</html>',
  'Dear {{name}},

Thank you for reaching out to Shinshu Solutions. We have received your inquiry and appreciate your interest in our services.

Your Message:
{{message}}

Our team will review your inquiry and get back to you within 24-48 hours.

If you have any urgent questions, please contact us:
Email: {{contact_email}}
Phone: {{contact_phone}}

Best regards,
Jake Waalk
Shinshu Solutions',
  '["name", "email", "message", "subject", "company", "contact_email", "contact_phone"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Japanese Inquiry Auto-Response
INSERT INTO email_templates (id, template_type, language_code, subject, html_body, text_body, variables, is_active, created_at, updated_at)
VALUES (
  'template-inquiry-ja',
  'inquiry',
  'ja',
  '信州ソリューションズへのお問い合わせありがとうございます - {{name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF8C42; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>信州ソリューションズ</h1>
      <p>長野を世界に開く</p>
    </div>
    <div class="content">
      <p>{{name}}様</p>
      
      <p>この度は、信州ソリューションズにお問い合わせいただき、誠にありがとうございます。お問い合わせ内容を確認いたしました。</p>
      
      <p><strong>お問い合わせ内容：</strong></p>
      <p style="background: white; padding: 15px; border-left: 4px solid #FF8C42; margin: 15px 0;">{{message}}</p>
      
      <p>担当者が内容を確認し、24-48時間以内にご返信いたします。</p>
      
      <p>ご質問がございましたら、お気軽にお問い合わせください：</p>
      <p>
        <strong>メール：</strong> {{contact_email}}<br>
        <strong>電話：</strong> {{contact_phone}}
      </p>
      
      <p>どうぞよろしくお願いいたします。</p>
      
      <p>敬具<br>
      <strong>ジェイク・ワーク</strong><br>
      信州ソリューションズ</p>
    </div>
    <div class="footer">
      <p>信州ソリューションズ | 長野県小諸市</p>
    </div>
  </div>
</body>
</html>',
  '{{name}}様

この度は、信州ソリューションズにお問い合わせいただき、誠にありがとうございます。

お問い合わせ内容：
{{message}}

担当者が内容を確認し、24-48時間以内にご返信いたします。

お問い合わせ：
メール：{{contact_email}}
電話：{{contact_phone}}

敬具
ジェイク・ワーク
信州ソリューションズ',
  '["name", "email", "message", "subject", "company", "contact_email", "contact_phone"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
