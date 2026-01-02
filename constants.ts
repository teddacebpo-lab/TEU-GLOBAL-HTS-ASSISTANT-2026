
// constants.ts
import { SubscriptionTier, UserFeatures } from './types';

export const FLEXIBLE_HTS_CODE_REGEX = /^(\d{4}|\d{6}|\d{8}|\d{10}|\d{4}\.\d{2}|\d{4}\.\d{2}\.\d{2}|\d{4}\.\d{2}\.\d{2}\.\d{2})$/;

export const ACTIVE_HTS_CODES = [
  { code: '9401.61.4011', description: 'Other seats, with wooden frames, upholstered' },
  { code: '9401.30.8000', description: 'Swivel seats with variable height adjustment' },
  { code: '6109.10.0040', description: 'T-shirts, singlets and other vests, of cotton' },
  { code: '8517.12.0050', description: 'Telephones for cellular networks' },
  { code: '9401.79.0020', description: 'Other seats, with metal frames, household' },
  { code: '9401.40.0010', description: 'Seats convertible into beds' },
  { code: '9401.61.1010', description: 'Seats of rattan' },
  { code: '9903.88.04', description: 'Section 301 Tariffs on products of China' },
  { code: '9903.80.01', description: 'Section 232 Tariffs on steel articles' },
  { code: '9903.88', description: 'Section 301 Subheading' },
  { code: '9903.80', description: 'Section 232 Subheading' },
  { code: '9903', description: 'Section 301/232 Chapter Heading' },
];

export const EXPIRED_HTS_CODES = [
    '9401.61.6010', 
    '9401.69.8011', 
];

export const INITIAL_SUBSCRIPTION_FEATURES: Record<SubscriptionTier, UserFeatures> = {
  'Free': { canUploadImage: true, canUseVoice: false, maxHistory: 20, queryLimits: { text: 10, image: 1 } },
  'Basic': { canUploadImage: true, canUseVoice: false, maxHistory: 100, queryLimits: { text: 50, image: 10 } },
  'Pro': { canUploadImage: true, canUseVoice: true, maxHistory: 500, queryLimits: { text: Infinity, image: Infinity } },
  'Enterprise': { canUploadImage: true, canUseVoice: true, maxHistory: Number.MAX_SAFE_INTEGER, queryLimits: { text:  Number.MAX_SAFE_INTEGER, image:  Number.MAX_SAFE_INTEGER } },
};

export const INITIAL_USERS = [
  {
    id: '1',
    email: 'admin@teuglobal.com',
    password: 'password',
    role: 'admin',
    subscription: 'Enterprise' as SubscriptionTier,
  },
  {
    id: '2',
    email: 'user@teuglobal.com',
    password: 'password',
    role: 'user',
    subscription: 'Pro' as SubscriptionTier,
    subscriptionExpires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  },
];

export const INITIAL_SUBSCRIPTION_REQUESTS = [
    {
        id: 'req1',
        email: 'new.customer@example.com',
        password: 'password123',
        requestedTier: 'Pro' as SubscriptionTier,
        status: 'pending' as const,
    },
];

const ANALYSIS_DATA_STRUCTURE = `The JSON object must not be in a markdown code block. It must start with '##ANALYSIS_DATA##' and end with '##/ANALYSIS_DATA##'.
{
  "recommendations": [
    {
      "scenario": "Scenario Title",
      "htsCode": "xxxx.xx.xxxx",
      "description": "Legal Description"
    }
  ],
  "quickStats": {
    "baseDuty": 3.2,
    "totalDuty": 48.2, 
    "additionalTariffs": [
      { "name": "Section 301 China (List X)", "rate": 25.0, "code": "9903.88.xx" },
      { "name": "Section 232 Steel/Alu", "rate": 25.0, "code": "9903.80.xx" },
      { "name": "Fentanyl (IEEPA List A)", "rate": 10.0, "code": "9903.01.24" },
      { "name": "Fentanyl Exclusion", "rate": 0.0, "code": "9903.01.33" }
    ],
    "agencies": ["FDA", "CPSC"]
  },
  "complianceAlerts": [
    {
      "title": "Alert Title",
      "description": "Detail",
      "type": "warning"
    }
  ]
}
IMPORTANT: 'totalDuty' MUST be the sum of 'baseDuty' and all rates in 'additionalTariffs'.
`;

export const INITIAL_CLASSIFICATION_PROMPT = `
You are the 'TEU GLOBAL AI assistant', an expert intelligence specialized in U.S. customs brokerage and high-stakes trade compliance.

**REAL-TIME SYNCHRONIZATION DIRECTIVES:**
1. **Federal Register (FR)**: You MUST cross-reference all recent Federal Register notices for new trade remedy investigations (AD/CVD), Section 301 exclusion extensions, and USTR tariff modifications.
2. **FDA Import Entry Dashboard**: For food, medical, or cosmetic products, identify potential FDA Product Code requirements and identify trends in FDA import entry refusals relevant to the commodity.
3. **FDA.gov Compliance**: Ensure all Affirmation of Compliance (AOC) codes mentioned are active according to the current FDA entry guidelines.

**ADDITIONAL TARIFF & TRADE REMEDY LOGIC (STRICT COMPLIANCE):**
For any product with Country of Origin: China, or any metal/steel product, you MUST apply the following high-stakes trade remedy logic in your report and the 'additionalTariffs' JSON array:

1. **Section 301/302 (China)**: Identify the list, specific 9903.88.xx code, and percentage rate.
2. **Section 232 (Steel/Aluminum)**: Apply 25% (Steel) or 10% (Alu) under 9903.80.xx if applicable.
3. **IEEPA/Fentanyl Rule (China Mandatory)**:
    - **Standard Case**: Apply BOTH [HTS:9903.01.24] (10%) AND [HTS:9903.01.25] (10%).
    - **IF Section 232 (9903.80.xx) applies**: Apply [HTS:9903.01.24] (10%) BUT you MUST REPLACE [HTS:9903.01.25] with the Exclusion [HTS:9903.01.33] (0%).

**Response Structure:**
**HTS**
**DUTIES**
**ADDITIONAL TARIFF**
**COMPLIANCE** (Mention FDA/PGA data)
**CLASSIFICATION RATIONALE**
**SUPPORTING NOTES/RULINGS**

${ANALYSIS_DATA_STRUCTURE}
`;

export const INITIAL_LOOKUP_PROMPT = `
You are "TEU-GLOBAL-AI-assistant", expert U.S. customs AI.

**HTS PROFILE**
- Detailed profile for [HTS:code] (2025).
- Include references to recent Federal Register notices affecting this heading.

**DUTIES**
- General, Special, and Column 2 rates.

**ADDITIONAL TARIFF & TRADE REMEDIES**
- Break down Section 301/302, 232, IEEPA, and Fentanyl tariffs.
- Apply strict China Exception Logic (9903.01.33 exclusion if Sec 232 applies).

**POTENTIAL COMPLIANCE FLAGS**
- Identify FDA Product Code requirements or CPSC safety standards based on the FDA Import Entry Dashboard data.

**CLASSIFICATION RATIONALE**

**SUPPORTING NOTES/RULINGS**

${ANALYSIS_DATA_STRUCTURE}
`;

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin",
  "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", "Costa Rica", "Cote d'Ivoire", "Croatia",
  "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribatis", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos",
  "Lotvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone",
  "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];
