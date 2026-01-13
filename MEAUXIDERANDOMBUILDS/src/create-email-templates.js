// Script to create professional email templates
// Run: node src/create-email-templates.js

const invoiceTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #{{invoice_number}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1f2e 100%);
      color: #f4f4f5;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .email-container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(23, 23, 23, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 107, 0, 0.2);
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 107, 0, 0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 2px solid rgba(255, 107, 0, 0.3);
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .logo-img {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      object-fit: contain;
      box-shadow: 0 8px 24px rgba(255, 107, 0, 0.3);
    }
    .brand-info h1 {
      font-size: 32px;
      font-weight: 700;
      color: #f4f4f5;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }
    .brand-info p {
      color: rgba(244, 244, 245, 0.6);
      font-size: 14px;
      font-weight: 500;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h2 {
      font-size: 36px;
      font-weight: 800;
      color: #ff6b00;
      margin-bottom: 8px;
      letter-spacing: -1px;
    }
    .invoice-meta .status {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 24px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 48px;
    }
    .detail-section h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: rgba(244, 244, 245, 0.5);
      margin-bottom: 12px;
      font-weight: 600;
    }
    .detail-section p {
      font-size: 16px;
      color: #f4f4f5;
      margin-bottom: 6px;
      line-height: 1.5;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
      overflow: hidden;
    }
    .items-table thead {
      background: rgba(255, 107, 0, 0.15);
    }
    .items-table th {
      padding: 18px 24px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: rgba(244, 244, 245, 0.8);
      font-weight: 600;
    }
    .items-table td {
      padding: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      color: #f4f4f5;
      font-size: 15px;
    }
    .items-table tbody tr:hover {
      background: rgba(255, 107, 0, 0.05);
    }
    .total-section {
      text-align: right;
      margin-top: 32px;
    }
    .total-row {
      display: flex;
      justify-content: flex-end;
      gap: 32px;
      padding: 18px 0;
      font-size: 16px;
    }
    .total-row.subtotal {
      color: rgba(244, 244, 245, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .total-row.grand-total {
      font-size: 28px;
      font-weight: 700;
      color: #ff6b00;
      margin-top: 12px;
      padding-top: 24px;
      border-top: 2px solid rgba(255, 107, 0, 0.3);
    }
    .total-label {
      min-width: 140px;
      text-align: right;
    }
    .total-amount {
      min-width: 160px;
      text-align: right;
      font-weight: 600;
    }
    .footer {
      margin-top: 56px;
      padding-top: 32px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      color: rgba(244, 244, 245, 0.5);
      font-size: 14px;
    }
    .footer a {
      color: #ff6b00;
      text-decoration: none;
      font-weight: 500;
    }
    @media (max-width: 600px) {
      .email-container { padding: 32px 24px; }
      .header { flex-direction: column; gap: 24px; }
      .invoice-meta { text-align: left; }
      .details-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo-section">
        <img src="https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/17535395-1501-490a-ff3d-e43d7c16a000/avatar" 
             alt="InnerAnimal Media" class="logo-img" />
        <div class="brand-info">
          <h1>InnerAnimal Media</h1>
          <p>Creative Digital Agency & SaaS Platform</p>
        </div>
      </div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <p style="color: rgba(244, 244, 245, 0.6); margin-bottom: 12px; font-size: 14px; font-weight: 500;">#{{invoice_number}}</p>
        <span class="status" style="background: {{status_color}}20; color: {{status_color}}; border: 1px solid {{status_color}}40;">{{status}}</span>
      </div>
    </div>

    <div class="details-grid">
      <div class="detail-section">
        <h3>Bill To</h3>
        <p style="font-weight: 600; margin-bottom: 8px; font-size: 18px;">{{client_name}}</p>
        <p style="color: rgba(244, 244, 245, 0.6); font-size: 14px;">{{client_email}}</p>
      </div>
      <div class="detail-section">
        <h3>Invoice Details</h3>
        <p><strong>Date:</strong> {{invoice_date}}</p>
        {{#if due_date}}<p><strong>Due Date:</strong> {{due_date}}</p>{{/if}}
        {{#if plan_name}}<p><strong>Plan:</strong> {{plan_name}}</p>{{/if}}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>{{item_description}}</strong>
            {{#if item_subtitle}}<br><span style="color: rgba(244, 244, 245, 0.6); font-size: 14px;">{{item_subtitle}}</span>{{/if}}
          </td>
          <td style="text-align: right; font-weight: 600; font-size: 18px;">{{currency}} {{amount}}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row subtotal">
        <span class="total-label">Subtotal:</span>
        <span class="total-amount">{{currency}} {{amount}}</span>
      </div>
      <div class="total-row subtotal">
        <span class="total-label">Tax:</span>
        <span class="total-amount">{{currency}} 0.00</span>
      </div>
      <div class="total-row grand-total">
        <span class="total-label">Total:</span>
        <span class="total-amount">{{currency}} {{amount}}</span>
      </div>
    </div>

    {{#if invoice_pdf_url}}
    <div style="text-align: center; margin-top: 40px;">
      <a href="{{invoice_pdf_url}}" 
         style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%); 
                color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;
                box-shadow: 0 6px 20px rgba(255, 107, 0, 0.4); transition: transform 0.2s;">
        Download PDF Invoice
      </a>
    </div>
    {{/if}}

    <div class="footer">
      <p style="font-size: 16px; margin-bottom: 12px; color: rgba(244, 244, 245, 0.8);">Thank you for your business!</p>
      <p style="margin-top: 8px;">
        Questions? Contact us at <a href="mailto:billing@inneranimalmedia.com">billing@inneranimalmedia.com</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: rgba(244, 244, 245, 0.4);">
        <a href="https://inneranimalmedia.com" style="color: #ff6b00;">inneranimalmedia.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

// Simple template renderer (replace {{variable}} with values)
function renderTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
    // Handle {{#if}} blocks
    const ifRegex = new RegExp(`\\{\\{#if ${key}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, 'g');
    result = result.replace(ifRegex, value ? '$1' : '');
  }
  // Remove any remaining {{#if}} blocks
  result = result.replace(/\{\{#if [^}]+\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  return result;
}

// Export for use in worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { invoiceTemplate, renderTemplate };
}
