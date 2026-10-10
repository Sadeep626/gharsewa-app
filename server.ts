import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Legal Counselor System Instruction
const LEGAL_COUNSEL_INSTRUCTION = `
You are the KinHome Certified Tenancy & Residential Housing Legal Advisor.
You advise landlords (houseowners) and renting families on residential tenancy statutes, mutual rights, utility sub-metering laws (water, electricity, waste collection), warranty of habitability, repairs, security deposit regulations, fair housing laws, and dispute mediation.

Provide balanced, objective, highly practical guidance. Clarify that while your advice is grounded in residential housing codes (e.g. Civil Code, Uniform Residential Landlord and Tenant Act, municipal sanitation bylaws), urgent disputes should be corroborated with local jurisdiction housing authorities or a qualified attorney.

Structure your response with:
1. Executive Summary & Statutory Principles
2. Rights and Obligations for both Landlord and Tenant
3. Actionable Checklist / Recommended Next Steps
4. Standard Statutory Notice Timelines (if applicable)
`;

// 1. Legal Consultation Endpoint
app.post('/api/legal/consult', async (req, res) => {
  try {
    const { prompt, userRole, unitContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (aiClient) {
      const systemMessage = `${LEGAL_COUNSEL_INSTRUCTION}\nContext: The querying user is a ${userRole || 'tenant'}. ${unitContext ? `Property Context: ${unitContext}` : ''}`;
      
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: systemMessage,
          temperature: 0.3,
        },
      });

      const responseText = response.text || 'No response generated.';
      return res.json({
        success: true,
        answer: responseText,
        source: 'ai_gemini',
      });
    }

    // Comprehensive expert fallback when GEMINI_API_KEY is not configured
    const fallbackAnswer = generateFallbackLegalAdvice(prompt, userRole);
    return res.json({
      success: true,
      answer: fallbackAnswer,
      source: 'expert_knowledge_base',
    });
  } catch (error: any) {
    console.error('Error in /api/legal/consult:', error);
    // Provide graceful legal resolution
    const fallback = generateFallbackLegalAdvice(req.body.prompt || '', req.body.userRole || 'tenant');
    return res.json({
      success: true,
      answer: fallback,
      source: 'expert_fallback',
      warning: error?.message || 'Consultation processed with tenancy knowledge base.',
    });
  }
});

// 2. Lease Clause Analysis Endpoint
app.post('/api/legal/analyze-clause', async (req, res) => {
  try {
    const { clauseText } = req.body;
    if (!clauseText) {
      return res.status(400).json({ error: 'Clause text is required' });
    }

    if (aiClient) {
      const prompt = `Analyze this residential rental lease clause for legal enforceability, common statutory red flags, balance of landlord/tenant fairness, and utility billing compliance (water, electric, waste management):\n\n"${clauseText}"\n\nProvide: 
1. Risk Assessment (Low / Medium / High / Void Under Law)
2. Legal Enforceability Review
3. Recommended Neutral Revision that protects both houseowner and renting family.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert residential lease contract auditor and tenancy rights attorney.',
          temperature: 0.2,
        },
      });

      return res.json({
        success: true,
        analysis: response.text,
      });
    }

    // Fallback clause review
    return res.json({
      success: true,
      analysis: `### Clause Assessment: Standard Residential Review
**Risk Level**: Moderate / Review Recommended
**Statutory Analysis**:
Residential tenancy laws strictly regulate utility pass-throughs, entry notices, and deposit deductions. Under standard Uniform Residential Landlord and Tenant Act (URLTA) provisions:
1. **Utility Sub-metering**: Landlords must provide transparent baseline meter readings and unit-specific rate formulas for water and electricity.
2. **Right of Entry**: Unannounced inspections violate tenant quiet enjoyment except in imminent peril (e.g. active burst water pipe or fire).
3. **Drafting Recommendation**: Include clear 24-hour advance written notice protocols and clear invoice dispute mediation windows (typically 14 business days).`,
    });
  } catch (err: any) {
    console.error('Error in /api/legal/analyze-clause:', err);
    return res.status(500).json({ error: 'Failed to analyze clause' });
  }
});

// 3. AI Nepali Kitchen Recipe Recommendation Endpoint
app.post('/api/recipes/recommend', async (req, res) => {
  try {
    const { availableItems = [], mealType = 'all', dietaryPreference = 'all', servings = 4 } = req.body;

    const itemsSummary = availableItems
      .map((item: any) => `${item.name} (${item.nepaliName || ''}) [ID: ${item.id}]`)
      .join(', ');

    if (aiClient && availableItems.length > 0) {
      const prompt = `Available Nepali Kitchen Pantry & Inventory Items:
${itemsSummary}

Meal Type Preference: ${mealType}
Dietary / Cooking Style Preference: ${dietaryPreference}
Servings: ${servings} people

Recommend 3 to 4 authentic Nepali meals that the family can prepare using these ingredients.
Output must be strictly valid JSON with this exact structure:
{
  "recipes": [
    {
      "id": "recipe-1",
      "title": "English Title",
      "nepaliTitle": "नेपाली नाम",
      "tagline": "Brief 1-sentence appetizing description",
      "mealCategory": "daal_bhat",
      "prepTime": "15 mins",
      "cookTime": "25 mins",
      "difficulty": "Easy",
      "cookwareRequired": "Hawkins Pressure Cooker",
      "matchedIngredients": ["Item 1", "Item 2"],
      "missingIngredients": [
        { "name": "Optional Missing Item", "nepaliName": "नेपाली नाम", "suggestedGroceryItemId": "gro-timur", "approxPrice": 160 }
      ],
      "steps": [
        "Step 1 description...",
        "Step 2 description..."
      ],
      "chefTip": "Pro tip on authentic Nepali taste or tempering technique",
      "culturalNote": "Cultural heritage or nutrition benefit"
    }
  ]
}`;

      const systemMessage = `You are the KinHome Executive Nepali Culinary Master Chef & Home Cook Advisor (नेपाली भान्सा मास्टर सेफ).
Your expertise is authentic, traditional, and everyday Nepali home cooking (दैनिक दाल-भात-तरकारी, खाजा, ढिँडो, अचार र चाडपर्वका परिकार).
Strict rule: Output ONLY pure, valid JSON with a "recipes" key. Do not output markdown code blocks or explanations outside JSON.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: systemMessage,
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.recipes && Array.isArray(parsed.recipes) && parsed.recipes.length > 0) {
          return res.json({
            success: true,
            recipes: parsed.recipes,
            source: 'ai_gemini',
          });
        }
      } catch (jsonErr) {
        console.warn('Failed to parse Gemini recipe JSON response, falling back to knowledge base:', jsonErr);
      }
    }

    // Comprehensive expert Nepali culinary knowledge base fallback
    const fallbackRecipes = generateFallbackRecipes(availableItems, mealType);
    return res.json({
      success: true,
      recipes: fallbackRecipes,
      source: 'culinary_knowledge_base',
    });
  } catch (error: any) {
    console.error('Error in /api/recipes/recommend:', error);
    const fallback = generateFallbackRecipes(req.body.availableItems || [], req.body.mealType || 'all');
    return res.json({
      success: true,
      recipes: fallback,
      source: 'culinary_fallback',
      warning: error?.message,
    });
  }
});

// Helper for fallback Nepali recipe recommendations
function generateFallbackRecipes(availableItems: any[], mealType: string): any[] {
  const itemNames = availableItems.map((i) => (i.name || '').toLowerCase() + ' ' + (i.nepaliName || ''));
  const hasItem = (keyword: string) => itemNames.some((n) => n.includes(keyword.toLowerCase()));

  const allPossibleRecipes = [
    {
      id: 'rec-kalo-daal',
      title: 'Mustang Jimbu-Tempered Kalo Daal & Steaming Bhat',
      nepaliTitle: 'मुस्ताङको जिम्मुले झानेको मासको कालो दाल र भात',
      tagline: 'Rich, comforting split black lentil stew sizzled in pure DDC cow ghee and wild Mustang mountain jimbu.',
      mealCategory: 'daal_bhat',
      prepTime: '10 mins',
      cookTime: '30 mins',
      difficulty: 'Easy',
      cookwareRequired: 'Hawkins 5L Pressure Cooker & Iron Ladle for Jhaneko',
      targetKeywords: ['daal', 'mas', 'jimbu', 'ghee', 'ghyu', 'rice', 'besar'],
      matchedIngredients: [
        'Kalo Daal / Urad Black Lentil',
        'Mustang Wild Himalayan Jimbu',
        'DDC Shuddha Gaiko Ghyu',
        'Organic Stone-Ground Turmeric (Besar)',
        'Jeera Masino Basmati Rice',
      ],
      missingIngredients: hasItem('timur')
        ? []
        : [
            {
              name: 'Highland Wild Timur',
              nepaliName: 'मुस्ताङको टिमुर',
              suggestedGroceryItemId: 'gro-timur',
              approxPrice: 240,
            },
          ],
      steps: [
        'Wash 1 cup Kalo Daal thoroughly. Add to Hawkins pressure cooker with 4 cups water, 1 tsp pure besar, 1 tsp salt, and a pinch of hing.',
        'Seal cooker lid and cook for 4-5 whistles until black lentils soften to a creamy consistency.',
        'Simmer uncovered and use a wooden mathani or ladle to lightly mash the lentils against the pot side.',
        'In a heavy iron ladle, melt 2 tablespoons of DDC Shuddha Cow Ghee until hot. Drop in 1 pinch of Mustang Jimbu; let it crackle and turn dark brown and fragrant (2-3 seconds).',
        'Pour sizzling ghee and jimbu directly into the simmering daal and immediately cover with lid for 1 minute to lock the mountain aroma.',
        'Serve piping hot over fluffy Jeera Masino rice with a side of spicy aloo achar.',
      ],
      chefTip: 'Never burn the Jimbu — sizzle it for only 2 to 3 seconds in smoking ghee before immediately covering the pot to trap the volatile alpine essential oils.',
      culturalNote: 'Black lentils tempered with Jimbu and Ghee are the ultimate warming winter superfood of the Kathmandu valley and Thakali kitchens.',
    },
    {
      id: 'rec-aloo-tama-bodi',
      title: 'Traditional Aloo Tama Bodi with Fenugreek Tempering',
      nepaliTitle: 'परम्परागत आलु तामा बोडीको रसादार तरकारी',
      tagline: 'Iconic Kathmandu Newari feast curry featuring pungent bamboo shoot, tender black-eyed beans, and Sindhupalchok red potatoes.',
      mealCategory: 'dinner',
      prepTime: '15 mins',
      cookTime: '35 mins',
      difficulty: 'Medium',
      cookwareRequired: 'Hawkins Pressure Cooker & Cast Iron Karai',
      targetKeywords: ['tama', 'bodi', 'aloo', 'potato', 'methi', 'mustard oil'],
      matchedIngredients: [
        'Glass-Jar Fermented Bamboo Shoot (Tama)',
        'Suke-ko Bodi (Black-Eyed Beans)',
        'Local Red Potato (Mude Aloo)',
        'Khopasi Tori ko Tel / Mustard Oil',
        'Gota Methi (Fenugreek Seeds)',
      ],
      missingIngredients: hasItem('golbheda')
        ? []
        : [
            {
              name: 'Local Farm Ripe Tomatoes (Golbheda)',
              nepaliName: 'लोकल गोलभेडा',
              suggestedGroceryItemId: 'gro-golbheda',
              approxPrice: 170,
            },
          ],
      steps: [
        'Soak Bodi overnight and pressure cook for 3 whistles until tender.',
        'Boil and cube Mude red potatoes into bite-sized chunks.',
        'Heat 2 tablespoons pure Khopasi mustard oil in a karai until shimmering. Sputter 1 tsp Gota Methi seeds until dark brown.',
        'Sauté sliced onions, minced ginger-garlic, turmeric, and cumin-coriander powder.',
        'Add sliced fermented Tama and sauté for 4-5 minutes until the pungent sour bamboo aroma mellows.',
        'Add cooked Bodi, potatoes, and diced tomatoes with 2 cups broth. Simmer for 10 minutes until thick, sour, and fragrant.',
      ],
      chefTip: 'Sautéing the bamboo shoot in hot mustard oil before adding tomatoes and water cuts the raw sharpness and deepens the fermented tang.',
      culturalNote: 'A staple of Kathmandu festivals and Newari celebrations, beloved for its complex interplay of sour, earthy, and aromatic notes.',
    },
    {
      id: 'rec-phulko-roti-saag',
      title: 'Soft Phulko Roti with Mude Aloo & Rayo ko Saag',
      nepaliTitle: 'ताजा फुल्को रोटी, रायोको साग र मुडेको आलु',
      tagline: 'Homely evening comfort: balloon-soft whole wheat rotis served alongside wok-sautéed mustard greens and cumin spiced potatoes.',
      mealCategory: 'dinner',
      prepTime: '15 mins',
      cookTime: '20 mins',
      difficulty: 'Easy',
      cookwareRequired: 'Wooden Belna-Chauki, Cast Iron Roti Tawa & Karai',
      targetKeywords: ['atta', 'flour', 'roti', 'rayo', 'saag', 'potato', 'aloo', 'ghee'],
      matchedIngredients: [
        'Fresh Whole Wheat Chakki Atta',
        'Fresh Rayo ko Saag (Mustard Greens)',
        'Local Red Potato (Mude Aloo)',
        'DDC Shuddha Gaiko Ghyu',
        'Gota Methi (Fenugreek Seeds)',
      ],
      missingIngredients: hasItem('cooker-gasket')
        ? []
        : [
            {
              name: 'Pressure Cooker Gasket Set',
              nepaliName: 'प्रेशर कुकर रबर ग्यास्केट',
              suggestedGroceryItemId: 'gro-cooker-gasket',
              approxPrice: 185,
            },
          ],
      steps: [
        'Knead Chakki Atta with warm water into a soft, elastic dough; rest for 15 minutes under a damp cloth.',
        'Roll thin round discs on the wooden Belna-Chauki without using excessive dry flour.',
        'Bake on medium-hot iron Tawa, flip once, and place over direct flame using stainless steel Chimta to let it balloon into a soft Phulko Roti. Brush with DDC Ghee.',
        'Chop fresh Rayo ko Saag and cube Mude red potatoes.',
        'In a hot karai, heat mustard oil, add fenugreek seeds and dried red chillies, then toss potatoes and greens on high heat for 6-8 minutes until tender and crisp.',
      ],
      chefTip: 'Resting the kneaded dough for at least 15 minutes relaxes the wheat gluten, ensuring your rotis puff completely like balloons on the open flame.',
      culturalNote: 'Rayo ko saag paired with hot phulko rotis and cow ghee is the quintessential winter dinner across Nepalese households.',
    },
    {
      id: 'rec-dhindo-ghyu-gundruk',
      title: 'Highland Kodo ko Dhindo with Pure Cow Ghee & Gundruk Sandheko',
      nepaliTitle: 'तातो कोदोको ढिँडो, शुद्ध गाईको घ्यू र गुन्द्रुक साँधेको',
      tagline: 'Heritage mountain meal: slow-churned steaming millet dhindo with a pool of golden cow ghee and spicy fermented gundruk.',
      mealCategory: 'dhindo_roti',
      prepTime: '10 mins',
      cookTime: '20 mins',
      difficulty: 'Medium',
      cookwareRequired: 'Heavy Iron/Cast Aluminum Pot & Wooden Dabalo / Churning Spoon',
      targetKeywords: ['kodo', 'dhindo', 'millet', 'gundruk', 'ghee', 'ghyu', 'sinki'],
      matchedIngredients: [
        'Organic Kodo ko Pitho (Finger Millet Flour)',
        'DDC Shuddha Gaiko Ghyu',
        'Organic Sun-Dried Gundruk',
        'Mustang Wild Timur',
        'Khopasi Tori ko Tel',
      ],
      missingIngredients: hasItem('bhatmas')
        ? []
        : [
            {
              name: 'Crispy Roasted Bhatmas (Soybean)',
              nepaliName: 'भुटेको भटमास',
              suggestedGroceryItemId: 'gro-makai-bhatmas',
              approxPrice: 160,
            },
          ],
      steps: [
        'Bring 3 cups of water to a rolling boil in a heavy pot.',
        'Gradually rain in 1.5 cups Kodo flour with one hand while vigorously churning with a wooden spoon (Dabalo) to prevent lumps.',
        'Lower heat and continuously stir and fold the thickening paste against the pot walls until glossy, smooth, and aromatic (about 8-10 minutes).',
        'Reconstitute sun-dried Gundruk with warm water, drain, and crush lightly.',
        'Toss Gundruk with sliced onions, mustard oil, toasted timur, green chillies, and lemon juice for a zesty sandheko.',
        'Serve steaming dhindo immediately with a generous dip of melted DDC Cow Ghee.',
      ],
      chefTip: 'Dhindo is eaten by dipping small morsels into hot ghee or jhol and swallowing gently without chewing, allowing the earthy millet richness to coat the palate.',
      culturalNote: 'Finger millet (Kodo) has sustained Himalayan farming communities for centuries with slow-burning energy, calcium, and zero refined carbs.',
    },
    {
      id: 'rec-kwati-soup',
      title: 'Sprouted 9-Bean Kwati Soup with Jimbu & Ajwain',
      nepaliName: '९ थरी गेडागुडी क्वाँटीको तातो पौष्टिक झोल',
      tagline: 'Rich, warming festive soup packed with sprouted protein, tempered with fragrant jimbu, ginger, and wild mountain spices.',
      mealCategory: 'winter_jhol',
      prepTime: '20 mins',
      cookTime: '30 mins',
      difficulty: 'Easy',
      cookwareRequired: 'Hawkins 5L Pressure Cooker',
      targetKeywords: ['kwati', 'beans', 'jimbu', 'besar', 'ginger', 'lasun'],
      matchedIngredients: [
        'Traditional 9-Bean Sprouting Kwati Mix',
        'Mustang Wild Himalayan Jimbu',
        'Organic Stone-Ground Turmeric (Besar)',
        'Fresh Ginger-Garlic Cooking Duo',
        'DDC Shuddha Gaiko Ghyu',
      ],
      missingIngredients: hasItem('timur')
        ? []
        : [
            {
              name: 'Highland Wild Timur',
              nepaliName: 'मुस्ताङको टिमुर',
              suggestedGroceryItemId: 'gro-timur',
              approxPrice: 240,
            },
          ],
      steps: [
        'Rinse soaked sprouted Kwati beans. Place in pressure cooker with 5 cups water, turmeric, minced aduwa-lasun, and salt.',
        'Cook on medium heat for 5-6 whistles until all 9 varieties of beans are soft and creamy.',
        'In a tempering pan, heat 2 tablespoons cow ghee. Sputter whole cumin, ajwain seeds, and 1 generous pinch of Mustang Jimbu.',
        'Pour hot sizzling jhaneko over the beans, stir well, and add a pinch of fresh ground black pepper.',
        'Simmer for 5 minutes and serve hot as a soup or alongside steaming rice.',
      ],
      chefTip: 'Adding crushed ginger and ajwain during the pressure cook eases bean digestion and infuses deep warming comfort.',
      culturalNote: 'Traditionally savored during Janai Purnima (Kwati Puni) to revitalize bodily strength and immunity before winter sets in.',
    },
  ];

  // Filter or prioritize based on mealType
  let selected = allPossibleRecipes;
  if (mealType && mealType !== 'all') {
    selected = allPossibleRecipes.filter((r) => r.mealCategory === mealType);
    if (selected.length === 0) selected = allPossibleRecipes;
  }

  return selected.slice(0, 4);
}


// Helper for fallback legal advice
function generateFallbackLegalAdvice(prompt: string, role: string): string {
  const p = prompt.toLowerCase();
  
  if (p.includes('enter') || p.includes('notice of entry') || p.includes('inspect')) {
    return `### Right of Entry & Inspection Guidelines (Civil Code § 1954)
**1. Executive Summary & Principles**:
A landlord has the legal right to access a rented dwelling, but this right is strictly balanced against the renting family's covenant of quiet enjoyment. Except in bona fide emergencies, unannounced entry is prohibited.

**2. Mandatory Rules**:
- **Notice Window**: Landlord must furnish at least **24 hours written notice** (48 hours for initial move-out inspection).
- **Permitted Hours**: Entry must occur during normal business hours (typically Monday through Friday, 8:00 AM to 5:00 PM), unless tenant mutually consents to an evening/weekend time.
- **Valid Purposes**: Inspecting water leaks or electrical faults, performing contracted repairs, exhibiting to prospective mortgagees or buyers, or upon court order.
- **Emergency Exception**: Immediate entry is permissible ONLY in severe emergencies (e.g. active burst water main, smoke/fire, suspected gas leak).

**3. Actionable Checklist**:
- [ ] Landlord serves written 24-hour Notice of Intent to Enter stating date, 2-hour window, and repair scope.
- [ ] Tenant confirms receipt or proposes an alternate reasonable time within 48 hours.
- [ ] Both parties preserve written message records.`;
  }

  if (p.includes('water') || p.includes('leak') || p.includes('electric') || p.includes('pipe') || p.includes('repair')) {
    return `### Habitability & Utility Repair Obligations (Civil Code § 1941.1)
**1. Executive Summary & Principles**:
Under the universal **Implied Warranty of Habitability**, landlords are strictly legally obligated to maintain plumbing, potable running water, hot water systems, and electrical wiring in safe, operative condition.

**2. Rights & Allocations**:
- **Landlord Responsibility**: Structural plumbing, mainline pipe ruptures, sub-meter defects, water heater failures, circuit breaker panels, and municipal sanitation containers.
- **Tenant Responsibility**: Promptly reporting water leaks, avoiding putting grease or insoluble items down drains, replacing household light bulbs, and exercising reasonable care.

**3. Emergency Timelines**:
- **Immediate (24 to 48 Hours)**: Total loss of running water, sewage backup, dangerous electrical sparking.
- **Routine (14 to 30 Days)**: Minor drip under sink, cosmetic fixture adjustments.

**4. Utility Bill Spikes from Leaks**:
If a hidden underground pipe or faulty toilet flapper creates an abnormal surge in water consumption, customary tenancy mediation adjusts the billing to the 3-month baseline average once repair is verified by an invoice.`;
  }

  if (p.includes('rent increase') || p.includes('raise rent')) {
    return `### Rent Increase Statutory Standards & Notice Periods
**1. Executive Summary**:
Rent increases during an active fixed-term lease are legally prohibited unless expressly negotiated in the lease terms. For month-to-month tenancies or renewals, statutory notice and local rent stabilization caps govern.

**2. Notice Requirements**:
- **30-Day Notice**: Standard requirement for rent increases equal to or less than 10% in non-rent-controlled properties.
- **60 to 90-Day Notice**: Required in many jurisdictions if the increase exceeds 10% aggregate over a 12-month window.
- **Rent Caps**: In jurisdictions governed by Tenant Protection Acts (e.g., AB 1482 or municipal boards), annual increases are capped at 5% plus local CPI (typically max 8-10%).

**3. Retaliation Protection**:
A rent increase cannot be enacted within 180 days of a tenant lawfully complaining about water leaks, waste accumulation, or code violations.`;
  }

  if (p.includes('deposit') || p.includes('security deposit')) {
    return `### Security Deposit Return & Deductions (Civil Code § 1950.5)
**1. Statutory Deadline**:
The landlord must return the remaining security deposit within **21 calendar days** after the tenant surrenders possession and keys.

**2. Permissible Deductions**:
- Unpaid rent or outstanding verified utility charges (water, electric, waste fees).
- Cleaning necessary to restore the unit to the condition at move-in.
- Repairs for damage exceeding **normal wear and tear** (e.g., large drywall holes, broken tiles, burn marks).

**3. Non-Permissible Deductions**:
- Faded paint, minor pinholes, worn carpet in high-traffic pathways, age-related plumbing degradation.
- Landlord must provide an itemized statement with contractor receipts for any single deduction exceeding $125.`;
  }

  return `### Residential Tenancy & Utility Governance Advisory
**1. General Principles for ${role === 'landlord' ? 'Property Owners' : 'Renting Families'}**:
Residential leases create reciprocal statutory obligations. The landlord guarantees safe, habitable dwelling with reliable water, electricity, and sanitation access. The tenant family commits to timely rental payments and reasonable care of the premises.

**2. Key Utility Billing Guidelines**:
- **Water & Power Sub-metering**: Must reflect transparent certified meter differentials multiplied by actual municipal rates without hidden surcharges.
- **Waste & Sanitation**: Municipal garbage pickup fees must be expressly itemized in the tenancy agreement.
- **Dispute Resolution**: When utility consumption spikes unexpectedly, both parties should schedule a prompt joint meter reading check and leak inspection.

**3. Recommended Procedure**:
Submit formal requests through the KinHome Maintenance Bridge and preserve all electronic receipts and notices.`;
}

// Development or Production Vite serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KinHome Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
