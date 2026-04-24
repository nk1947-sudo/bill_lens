export const MOCK_RESULTS = {
  flaggedCharges: [
    {
      id: 1,
      name: 'Room & Board – ICU Level 4',
      code: 'Rev 0204',
      amount: '$4,200',
      risk: 'High',
      reason: 'Potential Upcoding',
      detail:
        'ICU Level 4 classification is rarely warranted. Your records indicate standard monitoring only. Level 2 billing ($1,400) is far more appropriate.',
    },
    {
      id: 2,
      name: 'Comprehensive Metabolic Panel × 3',
      code: 'CPT 80053',
      amount: '$870',
      risk: 'High',
      reason: 'Duplicate Charge',
      detail:
        'The same panel appears three times on the same date. Labs of this type are typically drawn once per encounter. Two charges appear redundant.',
    },
    {
      id: 3,
      name: 'Surgical Tray Setup',
      code: 'CPT 99070',
      amount: '$380',
      risk: 'Medium',
      reason: 'Possible Unbundling',
      detail:
        'Tray setup fees are generally bundled into the procedure code. Billing separately for this may constitute improper unbundling.',
    },
    {
      id: 4,
      name: 'Physical Therapy Evaluation',
      code: 'CPT 97161',
      amount: '$340',
      risk: 'Medium',
      reason: 'Unusual Price',
      detail:
        'This charge is 2.4× the Medicare rate for this procedure in your region ($142). Significant price disparity warrants review.',
    },
    {
      id: 5,
      name: 'Disposable Supplies Fee',
      code: 'Rev 0270',
      amount: '$95',
      risk: 'Low',
      reason: 'Vague Description',
      detail:
        'No itemized breakdown provided. Hospitals are required to itemize supply charges. Request a line-item detail.',
    },
  ],

  summary:
    'Your bill totals $12,847. Our audit found 5 items worth challenging — potential savings of $3,800–$5,200. The biggest red flags are a likely room classification upcoding and a lab panel billed three times in a single day. These are common hospital billing errors and are very commonly corrected on appeal.',

  actionPlan: [
    {
      step: 1,
      title: 'Request an Itemized Bill',
      detail:
        'Call the billing department and ask for a fully itemized bill (every CPT/revenue code). This is your legal right in all 50 states. Expect 3–5 business days.',
    },
    {
      step: 2,
      title: 'Pull Your Medical Records',
      detail:
        'Request your nursing notes and physician orders for the dates of service. This lets you cross-reference what was ordered vs. what was billed.',
    },
    {
      step: 3,
      title: 'File a Formal Billing Dispute',
      detail:
        'Submit a written dispute letter citing the specific codes and your grounds (duplicate charge, upcoding, etc.). Keep a copy. Send via certified mail.',
    },
    {
      step: 4,
      title: 'Contact Your Insurance',
      detail:
        "If insured, loop in your insurer's member advocacy line. They have contractual leverage hospitals respond to and may audit on your behalf.",
    },
    {
      step: 5,
      title: 'Escalate if Needed',
      detail:
        "If unresolved in 30 days, file a complaint with your state's Insurance Commissioner and consider a patient advocate or medical billing attorney (many work on contingency).",
    },
  ],

  phoneScript: `Hello, my name is [YOUR NAME] and my account number is [ACCOUNT NUMBER].

I'm calling to dispute several charges on my bill dated [DATE].

I've reviewed my itemized statement and I'd like to flag the following concerns:

1. DUPLICATE CHARGE — CPT 80053 (Comprehensive Metabolic Panel) appears three times on [DATE]. I'd like these reviewed and the duplicates removed.

2. BILLING CLASSIFICATION — I was billed for ICU Level 4 room & board (Rev 0204). My medical records indicate standard monitoring. I'm requesting a downgrade review to Level 2.

3. UNBUNDLED SUPPLY FEE — CPT 99070 (Surgical Tray Setup) appears to be billed separately from the associated procedure code. I'm requesting this be reviewed for proper bundling.

I'm happy to provide supporting documentation. Can you open a formal billing dispute and give me a reference number?

[PAUSE — write down the reference number and agent name]

Thank you. I'll follow up in writing within 5 business days. Can you also confirm the correct address for written disputes?`,
}
