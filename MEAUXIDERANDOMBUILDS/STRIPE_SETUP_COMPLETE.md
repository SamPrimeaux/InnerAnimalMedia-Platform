# 💳 Stripe Payment System - Setup Guide

## 🔑 **Your Stripe Credentials**

### **Secret Key** (NEW)
```
sk_live_... (stored securely in Cloudflare Workers secrets)
```
**Note**: Actual key stored in `STRIPE_SECRET_KEY` secret. Never commit API keys to Git.

### **Account Name**
```
INNERANIMALPLATFORM
```

---

## ⚠️ **Current Status**

### **Database** ✅
- ✅ `subscriptions` table exists (with Stripe fields)
- ✅ `invoices` table exists (with Stripe fields)
- ✅ Schema ready for Stripe integration

### **Worker API** ❌
- ❌ No Stripe payment endpoints yet
- ❌ No webhook handler for Stripe events
- ❌ Need to implement payment processing

### **Frontend** ⚠️
- ⚠️ Old Stripe publishable keys in HTML files
- ⚠️ Need to update to new account keys

---

## 🚀 **Setup Steps**

### **Step 1: Add Stripe Secret Key to Worker**

```bash
wrangler secret put STRIPE_SECRET_KEY --env production
# Paste your Stripe secret key when prompted (starts with sk_live_...)
# Never commit actual API keys to Git - they're stored securely in Cloudflare Workers secrets
```

### **Step 2: Get Your Publishable Key**

1. Go to: https://dashboard.stripe.com/apikeys
2. Find your **Publishable key** (starts with `pk_live_...`)
3. Save it - you'll need it for frontend

### **Step 3: Set Up Webhook**

1. Go to: https://dashboard.stripe.com/webhooks
2. Click: "Add endpoint"
3. **Endpoint URL**: `https://inneranimalmedia.com/api/webhooks/stripe`
4. **Events to listen to**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the **Webhook Signing Secret** (starts with `whsec_...`)
6. Add to Worker secrets:
   ```bash
   wrangler secret put STRIPE_WEBHOOK_SECRET --env production
   ```

---

## 📋 **What You Need from Stripe Dashboard**

### **API Keys** (https://dashboard.stripe.com/apikeys)
- ✅ **Secret Key**: Stored in `STRIPE_SECRET_KEY` secret ✅ (Configured)
- ⚠️ **Publishable Key**: `pk_live_...` (Get from Stripe Dashboard)

### **Webhook Secret** (https://dashboard.stripe.com/webhooks)
- ⚠️ **Webhook Secret**: `whsec_...` (Need to create webhook first)

---

## 🔧 **Next: Implement Payment Endpoints**

I can add Stripe payment endpoints to your worker:
- `/api/payment/create-intent` - Create payment intent
- `/api/payment/confirm` - Confirm payment
- `/api/subscription/create` - Create subscription
- `/api/subscription/update` - Update subscription
- `/api/subscription/cancel` - Cancel subscription
- `/api/webhooks/stripe` - Handle Stripe webhooks

**Should I implement these now?** 🚀

---

## ✅ **Quick Checklist**

- [x] Secret Key: Stored in `STRIPE_SECRET_KEY` secret ✅
- [ ] Add to Worker secrets: `wrangler secret put STRIPE_SECRET_KEY`
- [ ] Get Publishable Key from Stripe Dashboard
- [ ] Create Webhook in Stripe Dashboard
- [ ] Get Webhook Secret
- [ ] Add Webhook Secret to Worker: `wrangler secret put STRIPE_WEBHOOK_SECRET`
- [ ] Implement payment endpoints (I can do this)
- [ ] Update frontend with new publishable key

---

**Your database is ready! Just need to add the API endpoints and webhook handler.** 🎯
