import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Target the actual 5S Portal app
    const db = base44.asServiceRole.forApp('69edd16e877d6e4391ad74bd');

    const documents = [
      { title: 'FundFluent Invoice FF-INV-0258 — HKD 35,000 (May 2026)', category: 'Finance', file_url: 'https://base44.app/api/apps/69ddc914cfcf229762ac123d/files/mp/public/69ddc914cfcf229762ac123d/af9621d72_047098ec3_InvoiceFF-INV-0258.pdf', file_name: 'InvoiceFF-INV-0258.pdf', file_type: 'PDF', notes: 'FundFluent Month 3. HKD 35,000. Pay to Hang Seng 239 778269 883 / FPS 161690177.', tags: ['fundfluent','invoice','finance'], version: '1' },
      { title: 'Simplex-ity x FundFluent Partnership Agreement V1 (Mar 2026)', category: 'Contract', file_url: 'https://base44.app/api/apps/69ddc914cfcf229762ac123d/files/mp/public/69ddc914cfcf229762ac123d/313daaba2_4782a880b_Simplex-ityPartnershipAgreementV1032126.pdf', file_name: 'PartnershipAgreementV1.pdf', file_type: 'PDF', notes: 'Signed. 3-month trial, 3% equity. Signed 21 Mar 2026.', tags: ['fundfluent','wilson','contract'], version: '1' },
      { title: 'BR Certificate — SIMPLEX-ITY Branch 001', category: 'Legal', file_url: 'https://base44.app/api/apps/69ddc914cfcf229762ac123d/files/mp/public/69ddc914cfcf229762ac123d/7190b9104_073b46d17_BR001SIMPLEX-ITY.pdf', file_name: 'BR001SIMPLEX-ITY.pdf', file_type: 'PDF', notes: 'No: 78459506-001-07-25-A. Expires 14 Jul 2026.', tags: ['br','legal','compliance'], version: '1' },
      { title: 'SIMPLEX-ITY Brand Deck', category: 'Brand', file_url: 'https://base44.app/api/apps/69ddc914cfcf229762ac123d/files/mp/public/69ddc914cfcf229762ac123d/cb6ef35e4_1e99e33ef_Simplex-ityBrand.pdf', file_name: 'Simplex-ityBrand.pdf', file_type: 'PDF', tags: ['brand','deck'], version: '1' },
      { title: 'SIMPLEX-ITY Influencer Deck V3', category: 'Brand', file_url: 'https://base44.app/api/apps/69ddc914cfcf229762ac123d/files/mp/public/69ddc914cfcf229762ac123d/9da7d7aa3_46a5a4fae_Simplex-ityInfluencer_V3.pdf', file_name: 'Simplex-ityInfluencer_V3.pdf', file_type: 'PDF', tags: ['influencer','deck'], version: '3' },
      { title: 'SIMPLEX-ITY Core Values', category: 'Brand', file_url: 'https://base44.app/api/apps/69ddc914cfcf229762ac123d/files/mp/public/69ddc914cfcf229762ac123d/8ac7e73ed_3cd3bd5cc_Simplex-ityCorevalue.pdf', file_name: 'Simplex-ityCorevalue.pdf', file_type: 'PDF', tags: ['brand','values'], version: '1' },
      { title: 'SIMPLEX-ITY Brand Guidelines v20260421', category: 'Brand', file_url: 'https://base44.app/api/apps/69ddc914cfcf229762ac123d/files/mp/public/69ddc914cfcf229762ac123d/4358a385d_a8d805137_-BX-01-Simplex-ityBrandGuidelines_Highlights_v20260421.pdf', file_name: 'BrandGuidelines_v20260421.pdf', file_type: 'PDF', tags: ['brand-guidelines','design'], version: '1' },
      { title: 'Looka Receipt #2716-2579 — USD $29.99 (May 2026)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/19ad90a2f_Receipt-2716-2579.pdf', file_name: 'Looka_Receipt_2716-2579.pdf', file_type: 'PDF', tags: ['looka','invoice'], version: '1' },
      { title: 'SiteGround Invoice #3799602 — USD $28.78 (Sep 2025)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/b2193e97b_invoice_3799602.pdf', file_name: 'SiteGround_Invoice_3799602.pdf', file_type: 'PDF', tags: ['siteground','invoice'], version: '1' },
      { title: 'SiteGround Invoice #3754959 — USD $199.87 (Aug 2025)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/5ebf882e1_invoice_3754959.pdf', file_name: 'SiteGround_Invoice_3754959.pdf', file_type: 'PDF', tags: ['siteground','invoice'], version: '1' },
      { title: 'SiteGround Invoice #3754715 — USD $89.87 (Aug 2025)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/fa30d5dff_invoice_3754715.pdf', file_name: 'SiteGround_Invoice_3754715.pdf', file_type: 'PDF', tags: ['siteground','invoice'], version: '1' },
      { title: 'Squarespace Invoice #205749805 — HKD 812 (Oct 2025)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/e7a1c8a62_SquarespaceReceipt.pdf', file_name: 'Squarespace_Invoice_205749805.pdf', file_type: 'PDF', tags: ['squarespace','invoice'], version: '1' },
      { title: 'Microsoft Invoice G110703616 — USD $446.71 (Aug 2025)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/ff7f2d9fd_G110703616_62ded3d98cb641a08b780249005b047b.pdf', file_name: 'Microsoft_Invoice_G110703616.pdf', file_type: 'PDF', tags: ['microsoft','m365','invoice'], version: '1' },
      { title: 'Microsoft Invoice G116524246 — USD $140.14 (Sep 2025)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/42672cc32_G116524246_5bf3c4a49ea14189a66371b21d084299.pdf', file_name: 'Microsoft_Invoice_G116524246.pdf', file_type: 'PDF', tags: ['microsoft','m365','invoice'], version: '1' },
      { title: 'Microsoft Invoice G107785093 (Aug 2025)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/370d1e3cb_G107785093_9021e380d50243048fd369e282c350d4.pdf', file_name: 'Microsoft_Invoice_G107785093.pdf', file_type: 'PDF', tags: ['microsoft','m365','invoice'], version: '1' },
      { title: 'Microsoft Invoice G107786449 (Aug 2025)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/0e15d8d21_G107786449_c051b27838c6416ba53cd44812fbd274.pdf', file_name: 'Microsoft_Invoice_G107786449.pdf', file_type: 'PDF', tags: ['microsoft','m365','invoice'], version: '1' },
      { title: 'BR Certificate — 5SENSESBEAUTY LIMITED Main', category: 'Legal', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/ad7d873f2_BRC_148077315.pdf', file_name: 'BRC_148077315.pdf', file_type: 'PDF', tags: ['br','legal','5sensesbeauty'], version: '1' },
      { title: 'Reap Business — Company Setup Invoice #214386 (HKD $7,850)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/1f23c1094_7850-5SENSESBEAUTYLIMITED.pdf', file_name: '7850-5SENSESBEAUTYLIMITED.pdf', file_type: 'PDF', tags: ['reap-business','invoice'], version: '1' },
      { title: 'Reap Business — Branch Registration Invoice #229460 (HKD $1,200)', category: 'Finance', file_url: 'https://media.base44.com/files/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/8425b666b_1200-5SENSESBEAUTYLIMITED.pdf', file_name: '1200-5SENSESBEAUTYLIMITED.pdf', file_type: 'PDF', tags: ['reap-business','invoice'], version: '1' },
      { title: 'Bank of China — BOC Business Letter (Proof of Address)', category: 'Legal', file_url: 'https://media.base44.com/images/public/whatsapp/69ddc914cfcf229762ac123d/your_agent/69ddc914cfcf229762ac123f/ba6be66fd_whatsapp_image_980511691102143.jpg', file_name: 'BOC_ProofOfAddress.jpg', file_type: 'Image', tags: ['boc','proof-of-address'], version: '1' },
      { title: 'SIMPLEX-ITY Investor Pitch Deck v2', category: 'Brand', file_url: 'https://base44.app/api/apps/69ddc914cfcf229762ac123d/files/mp/public/69ddc914cfcf229762ac123d/5a1af66d0_SIMPLEX-ITY_Investor_Pitch_v2.pptx', file_name: 'SIMPLEX-ITY_Investor_Pitch_v2.pptx', file_type: 'PPTX', tags: ['investor','pitch','deck'], version: '2' },
    ];

    const expenses = [
      { title: 'FundFluent — Fractional CPO Month 3 (FF-INV-0258)', amount: 35000, currency: 'HKD', category: 'Professional Fees', vendor: 'FundFluent Limited', date: '2026-05-11', status: 'paid', payment_method: 'Bank Transfer / FPS', notes: 'Final month. Hang Seng 239 778269 883 / FPS 161690177.' },
      { title: 'FundFluent — Fractional CPO Month 2 (Apr 2026)', amount: 35000, currency: 'HKD', category: 'Professional Fees', vendor: 'FundFluent Limited', date: '2026-04-27', status: 'paid', payment_method: 'Bank Transfer / FPS' },
      { title: 'FundFluent — Fractional CPO Month 1 (Mar 2026)', amount: 35000, currency: 'HKD', category: 'Professional Fees', vendor: 'FundFluent Limited', date: '2026-03-14', status: 'paid', payment_method: 'Bank Transfer / FPS' },
      { title: 'Looka — Brand Kit Subscription (May 2026)', amount: 233, currency: 'HKD', category: 'Branding & Design', vendor: 'Looka', date: '2026-05-07', status: 'paid', payment_method: 'Credit Card', notes: 'USD 29.99/mo. Invoice J8GNTFYO-0011.' },
      { title: 'Shopify — Monthly Subscription (May 2026)', amount: 256.74, currency: 'HKD', category: 'Software & Subscriptions', vendor: 'Shopify', date: '2026-05-08', status: 'paid', payment_method: 'PayPal' },
      { title: 'Shopify — Monthly Subscription (Apr 2026)', amount: 256.74, currency: 'HKD', category: 'Software & Subscriptions', vendor: 'Shopify', date: '2026-04-08', status: 'paid', payment_method: 'PayPal' },
      { title: 'Shopify — Monthly Subscription (Mar 2026)', amount: 256.74, currency: 'HKD', category: 'Software & Subscriptions', vendor: 'Shopify', date: '2026-03-09', status: 'paid', payment_method: 'PayPal' },
      { title: 'Shopify — Monthly Subscription (Feb 2026)', amount: 256.74, currency: 'HKD', category: 'Software & Subscriptions', vendor: 'Shopify', date: '2026-02-07', status: 'paid', payment_method: 'PayPal' },
      { title: 'Shopify — Monthly Subscription (Jan 2026)', amount: 256.74, currency: 'HKD', category: 'Software & Subscriptions', vendor: 'Shopify', date: '2026-01-08', status: 'paid', payment_method: 'PayPal' },
      { title: 'Shopify — Monthly Subscription (Dec 2025)', amount: 256.74, currency: 'HKD', category: 'Software & Subscriptions', vendor: 'Shopify', date: '2025-12-09', status: 'paid', payment_method: 'PayPal' },
      { title: 'Shopify — Monthly Subscription (Nov 2025)', amount: 256.74, currency: 'HKD', category: 'Software & Subscriptions', vendor: 'Shopify', date: '2025-11-09', status: 'paid', payment_method: 'PayPal' },
      { title: 'Shopify — Monthly Subscription (Oct 2025)', amount: 122.92, currency: 'HKD', category: 'Software & Subscriptions', vendor: 'Shopify', date: '2025-10-12', status: 'paid', payment_method: 'PayPal' },
      { title: 'Shopify — Monthly Subscription (Aug 2025)', amount: 124.48, currency: 'HKD', category: 'Software & Subscriptions', vendor: 'Shopify', date: '2025-08-03', status: 'paid', payment_method: 'PayPal' },
      { title: 'Shopify — Monthly Subscription (Jul 2025)', amount: 7.78, currency: 'HKD', category: 'Software & Subscriptions', vendor: 'Shopify', date: '2025-07-12', status: 'paid', payment_method: 'PayPal' },
      { title: 'Microsoft 365 — kieran@5senses.global (Monthly May 2026)', amount: 97, currency: 'HKD', category: 'Microsoft Licenses', vendor: 'Microsoft 365', date: '2026-05-01', status: 'paid', payment_method: 'Credit Card' },
      { title: 'Microsoft 365 — kieran.li@5sensesbeauty.com (Monthly May 2026)', amount: 97, currency: 'HKD', category: 'Microsoft Licenses', vendor: 'Microsoft 365', date: '2026-05-01', status: 'paid', payment_method: 'Credit Card' },
      { title: 'Microsoft 365 — Loreen@5senses.global (Monthly May 2026)', amount: 97, currency: 'HKD', category: 'Microsoft Licenses', vendor: 'Microsoft 365', date: '2026-05-01', status: 'pending', payment_method: 'Credit Card' },
      { title: 'Microsoft 365 — Wilson (Monthly May 2026)', amount: 97, currency: 'HKD', category: 'Microsoft Licenses', vendor: 'Microsoft 365', date: '2026-05-01', status: 'pending', payment_method: 'Credit Card' },
      { title: 'Microsoft 365 — Invoice G110703616 (Aug 2025, 3 licenses)', amount: 3553.28, currency: 'HKD', category: 'Microsoft Licenses', vendor: 'Microsoft Regional Sales Pte Ltd', date: '2025-09-05', status: 'paid', payment_method: 'Credit Card' },
      { title: 'Microsoft 365 — Invoice G116524246 (Sep 2025, 4 licenses)', amount: 1087.29, currency: 'HKD', category: 'Microsoft Licenses', vendor: 'Microsoft Regional Sales Pte Ltd', date: '2025-10-05', status: 'paid', payment_method: 'Credit Card' },
      { title: 'Microsoft 365 Email Essentials via GoDaddy (Aug 2025)', amount: 364.8, currency: 'HKD', category: 'Microsoft Licenses', vendor: 'GoDaddy', date: '2025-08-05', status: 'paid', payment_method: 'PayPal' },
      { title: 'GoDaddy — simplex-ity.com .COM registration (Aug 2025)', amount: 342.66, currency: 'HKD', category: 'Domain & Hosting', vendor: 'GoDaddy', date: '2025-08-05', status: 'paid', payment_method: 'PayPal', notes: 'KEEP and renew Aug 2026.' },
      { title: 'GoDaddy — simplex-ity.net/.club/.info/.shop domains (Aug 2025)', amount: 294.54, currency: 'HKD', category: 'Domain & Hosting', vendor: 'GoDaddy', date: '2025-08-10', status: 'paid', payment_method: 'PayPal', notes: 'Do NOT renew .club/.info/.shop. Keep .net only.' },
      { title: 'GoDaddy — Domain Protection simplex-ity.com (Aug 2025)', amount: 550.7, currency: 'HKD', category: 'Domain & Hosting', vendor: 'GoDaddy', date: '2025-08-08', status: 'paid', payment_method: 'PayPal', notes: 'Downgrade Ultimate to Full on renewal. Save ~HKD 350/yr.' },
      { title: 'GoDaddy — sentientby5senses.com + protection (Aug 2025)', amount: 1210.51, currency: 'HKD', category: 'Domain & Hosting', vendor: 'GoDaddy', date: '2025-08-02', status: 'paid', payment_method: 'PayPal', notes: 'DO NOT RENEW Aug 2026.' },
      { title: 'GoDaddy — Sentie Beauty domains + protection (Aug 2025)', amount: 1388.99, currency: 'HKD', category: 'Domain & Hosting', vendor: 'GoDaddy', date: '2025-08-01', status: 'paid', payment_method: 'PayPal', notes: 'DO NOT RENEW — Sentie Beauty brand inactive.' },
      { title: 'GoDaddy — Domain Registration 5senses.global (Jan 2026)', amount: 620, currency: 'HKD', category: 'Domain & Hosting', vendor: 'GoDaddy', date: '2026-01-01', status: 'paid', payment_method: 'PayPal' },
      { title: 'GoDaddy — Domain Registration simplex-ity.com (Jan 2026)', amount: 155, currency: 'HKD', category: 'Domain & Hosting', vendor: 'GoDaddy', date: '2026-01-01', status: 'paid', payment_method: 'PayPal' },
      { title: 'SiteGround — GrowBig Hosting + simplex-ity.co domain (Aug 2025)', amount: 696.5, currency: 'HKD', category: 'Domain & Hosting', vendor: 'SiteGround Hosting Ltd', date: '2025-08-12', status: 'paid', payment_method: 'Credit Card', notes: 'Invoice #3754715. Renewal Aug 2026.' },
      { title: 'SiteGround — simplex-ity.org domain + SSL + CDN (Aug 2025)', amount: 1549, currency: 'HKD', category: 'Domain & Hosting', vendor: 'SiteGround Hosting Ltd', date: '2025-08-12', status: 'paid', payment_method: 'Credit Card', notes: 'Invoice #3754959. Renewal Aug 2026.' },
      { title: 'SiteGround — Email Marketing 500 Contacts (Sep 2025)', amount: 223, currency: 'HKD', category: 'Domain & Hosting', vendor: 'SiteGround Hosting Ltd', date: '2025-09-07', status: 'paid', payment_method: 'Credit Card', notes: 'Invoice #3799602. Renewal Sep 2026.' },
      { title: 'SiteGround — Web Hosting Annual (Jan 2026)', amount: 930, currency: 'HKD', category: 'Domain & Hosting', vendor: 'Siteground', date: '2026-01-01', status: 'paid', payment_method: 'Credit Card' },
      { title: 'Squarespace — 5senses.global domain 2-year (Oct 2025)', amount: 812, currency: 'HKD', category: 'Domain & Hosting', vendor: 'Squarespace Ireland Limited', date: '2025-10-18', status: 'paid', payment_method: 'Credit Card', notes: 'Invoice #205749805. Expires Jul 2027. KEEP.' },
      { title: 'Squarespace — Website Hosting (May 2026)', amount: 1400, currency: 'HKD', category: 'Domain & Hosting', vendor: 'Squarespace', date: '2026-05-01', status: 'paid', payment_method: 'Credit Card' },
      { title: 'Business Registration — 5SENSESBEAUTY LIMITED (Jul 2025)', amount: 2200, currency: 'HKD', category: 'Government Fees', vendor: 'HK Companies Registry', date: '2025-07-15', status: 'paid', payment_method: 'Government Portal', notes: 'Cert No: 78459506-000-07-25-9. Renewal Jul 2026.' },
      { title: 'Business Registration — SIMPLEX-ITY Branch (Jan 2026)', amount: 80, currency: 'HKD', category: 'Government Fees', vendor: 'HK Companies Registry', date: '2026-01-12', status: 'paid', payment_method: 'Government Portal', notes: 'Cert No: 78459506-001-07-25-A. Expires 14 Jul 2026.' },
      { title: 'Reap Business — Company Secretary Service (Jul 2025)', amount: 900, currency: 'HKD', category: 'Professional Fees', vendor: 'Reap Business Limited', date: '2025-07-09', status: 'paid', payment_method: 'Bank Transfer', notes: 'Annual Jul 2025–Jul 2026. Renewal Jul 8 2026. Contact Carrie (852) 3166 1298.' },
      { title: 'Reap Business — Virtual Office Plan A (Jul 2025)', amount: 1980, currency: 'HKD', category: 'Office & Admin', vendor: 'Reap Business Limited', date: '2025-07-09', status: 'paid', payment_method: 'Bank Transfer', notes: '18-month plan Jul 2025–Jan 2027. Room 1608, 16/F APEC Plaza.' },
      { title: 'Reap Business — Branch Registration Invoice #229460 (Jan 2026)', amount: 1200, currency: 'HKD', category: 'Government Fees', vendor: 'Reap Business Limited', date: '2026-01-12', status: 'paid', payment_method: 'Bank Transfer', notes: 'Branch 001 processing fee. Invoice #229460.' },
    ];

    const docResults = [];
    for (const d of documents) {
      try { docResults.push(await db.entities.Document.create(d)); } catch(e) { docResults.push({ error: e.message, title: d.title }); }
    }

    const expResults = [];
    for (const e of expenses) {
      try { expResults.push(await db.entities.Expense.create(e)); } catch(err) { expResults.push({ error: err.message, title: e.title }); }
    }

    const docOk = docResults.filter(r => !r.error).length;
    const expOk = expResults.filter(r => !r.error).length;

    return Response.json({
      ok: true,
      message: `Synced to 5S Portal: ${docOk} documents + ${expOk} expenses`,
      documents_created: docOk,
      expenses_created: expOk,
      errors: [...docResults, ...expResults].filter(r => r.error),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
