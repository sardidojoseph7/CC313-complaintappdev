// services/ai.ts – Hybrid with expanded mock patterns

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = 'gemini-3.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function analyzeComplaint(title: string, description: string) {
  if (API_KEY) {
    try {
      const result = await callGemini(title, description);
      if (result) {
        console.log('✅ Gemini analysis successful:', result);
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Gemini failed, falling back to mock:', getErrorMessage(error));
    }
  } else {
    console.warn('⚠️ No Gemini API key, using mock');
  }
  return mockAnalysis(title, description);
}

async function callGemini(title: string, description: string) {
  const prompt = `
    Analyze the following complaint and return a JSON object with exactly these keys:
    - "category": one of ["Peace & Order", "Infrastructure", "Health & Sanitation", "Disaster Response", "Social Services", "Other"]
    - "priority": one of ["Low", "Medium", "High"]
    - "summary": a concise 1‑sentence operational summary (max 15 words) that captures the core issue and impact

    Title: ${title}
    Description: ${description}

    IMPORTANT: Respond ONLY with valid JSON, no markdown, no extra text.
  `;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('No content from Gemini');

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Gemini response');

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.category || !parsed.priority || !parsed.summary) {
    throw new Error('Missing required fields');
  }

  return parsed;
}

function mockAnalysis(title: string, description: string) {
  console.log('🤖 Using mock analysis on:', description.substring(0, 50) + '…');
  const lower = description.toLowerCase();

  // --- Category detection (expanded) ---
  let category = 'Other';
  if (lower.includes('streetlight') || lower.includes('road') || lower.includes('drainage') || 
      lower.includes('pothole') || lower.includes('infrastructure') || lower.includes('bridge') ||
      lower.includes('sidewalk') || lower.includes('pavement') || lower.includes('crack') ||
      lower.includes('pipe') || lower.includes('water') && (lower.includes('burst') || lower.includes('leak'))) {
    category = 'Infrastructure';
  } else if (lower.includes('garbage') || lower.includes('trash') || lower.includes('waste') || 
             lower.includes('sanitation') || lower.includes('health') || lower.includes('hygiene') ||
             lower.includes('smell') || lower.includes('rodent') || lower.includes('uncollected') ||
             lower.includes('pile') || lower.includes('disease') || lower.includes('flies')) {
    category = 'Health & Sanitation';
  } else if (lower.includes('noise') || lower.includes('disturbance') || lower.includes('vandalism') ||
             lower.includes('peace') || lower.includes('order') || lower.includes('fight') ||
             lower.includes('argument') || lower.includes('threat') || lower.includes('quarrel') ||
             lower.includes('graffiti') || lower.includes('loud music')) {
    category = 'Peace & Order';
  } else if (lower.includes('flood') || lower.includes('typhoon') || lower.includes('disaster') ||
             lower.includes('emergency') || lower.includes('earthquake') || lower.includes('fire') ||
             lower.includes('evacuation') || lower.includes('fallen tree') || lower.includes('storm') ||
             lower.includes('landslide')) {
    category = 'Disaster Response';
  } else if (lower.includes('clearance') || lower.includes('permit') || lower.includes('service') ||
             lower.includes('delay') || lower.includes('request') || lower.includes('assistance') ||
             lower.includes('benefit') || lower.includes('application') || lower.includes('pension') ||
             lower.includes('senior') || lower.includes('id') || lower.includes('benefits') ||
             lower.includes('processing') || lower.includes('followed up')) {
    category = 'Social Services';
  }

  // --- Priority detection (expanded) ---
  let priority = 'Medium';
  const highKeywords = ['emergency', 'urgent', 'danger', 'hazard', 'critical', 'severe', 
                        'immediate', 'life-threatening', 'flood', 'broken', 'crash', 'fire',
                        'overflow', 'clogged', 'stagnant', 'disease', 'injury', 'uncollected',
                        'pile', 'smell', 'threat', 'evacuation', 'burst', 'stuck', 'muddy',
                        'sinkhole', 'collapse', 'fallen tree', 'blocking', 'accident'];
  const lowKeywords = ['minor', 'small', 'low', 'slight', 'negligible', 'cosmetic'];

  const hasHigh = highKeywords.some(kw => lower.includes(kw));
  const hasLow = lowKeywords.some(kw => lower.includes(kw));

  if (hasHigh) {
    priority = 'High';
  } else if (hasLow) {
    priority = 'Low';
  } else {
    if (category === 'Disaster Response') {
      priority = 'High';
    } else if (category === 'Health & Sanitation') {
      priority = (lower.includes('health') || lower.includes('disease') || lower.includes('smell') || lower.includes('rodent')) 
        ? 'High' : 'Medium';
    } else if (category === 'Infrastructure') {
      priority = (lower.includes('broken') || lower.includes('clogged') || lower.includes('flood') || lower.includes('burst')) 
        ? 'High' : 'Medium';
    } else if (category === 'Peace & Order') {
      priority = (lower.includes('threat') || lower.includes('fight') || lower.includes('danger')) 
        ? 'High' : 'Medium';
    } else if (category === 'Social Services') {
      priority = (lower.includes('delay') || lower.includes('urgent')) ? 'High' : 'Medium';
    } else {
      priority = 'Medium';
    }
  }

  // --- Summary generation (expanded patterns) ---
  // Extract location
  const locationMatch = description.match(/(?:in|at|on|from)\s+([Pp]urok\s+\d+|[Pp]urok\s+\w+|[Bb]arangay\s+\w+|[Ss]treet\s+\w+|[Ll]ocation\s+\w+)/);
  const location = locationMatch ? locationMatch[1] : '';

  // Define patterns with appropriate templates
  const issuePatterns = [
    // Infrastructure
    { 
      trigger: ['streetlight', 'road', 'pothole', 'sidewalk', 'pavement', 'crack'],
      template: (loc: string) => `Damaged infrastructure${loc ? ' in ' + loc : ''} requiring repair`
    },
    { 
      trigger: ['pipe', 'burst', 'water leak'],
      template: (loc: string) => `Burst water pipe${loc ? ' in ' + loc : ''} causing flooding and road damage`
    },
    // Health & Sanitation
    { 
      trigger: ['garbage', 'trash', 'waste', 'uncollected', 'pile'],
      template: (loc: string) => `Uncollected waste${loc ? ' in ' + loc : ''} creating health hazard`
    },
    { 
      trigger: ['smell', 'rodent', 'flies', 'disease'],
      template: (loc: string) => `Health hazard${loc ? ' in ' + loc : ''} due to waste accumulation`
    },
    // Peace & Order
    { 
      trigger: ['noise', 'loud music', 'disturbance'],
      template: (loc: string) => `Noise disturbance${loc ? ' in ' + loc : ''} affecting residents`
    },
    { 
      trigger: ['vandalism', 'graffiti'],
      template: (loc: string) => `Vandalism${loc ? ' in ' + loc : ''} causing property damage`
    },
    { 
      trigger: ['fight', 'threat', 'quarrel'],
      template: (loc: string) => `Security concern${loc ? ' in ' + loc : ''} requiring intervention`
    },
    // Disaster Response
    { 
      trigger: ['flood', 'flooding', 'drainage', 'clogged'],
      template: (loc: string) => `Flooding${loc ? ' in ' + loc : ''} due to clogged drainage`
    },
    { 
      trigger: ['fallen tree', 'storm', 'typhoon'],
      template: (loc: string) => `Storm damage${loc ? ' in ' + loc : ''} causing obstruction`
    },
    { 
      trigger: ['emergency', 'evacuation'],
      template: (loc: string) => `Emergency situation${loc ? ' in ' + loc : ''} requiring immediate response`
    },
    // Social Services
    { 
      trigger: ['clearance', 'permit', 'application', 'processing', 'delay'],
      template: (loc: string) => `Delayed document processing${loc ? ' for ' + loc : ''} affecting services`
    },
    { 
      trigger: ['senior', 'pension', 'benefits', 'id'],
      template: (loc: string) => `Delayed benefits processing${loc ? ' for ' + loc : ''} affecting senior/vulnerable`
    },
    // Fallback: if no pattern matches, use the first sentence but make it clean
    // We'll handle this later
  ];

  let summary = '';
  let matched = false;
  for (const pattern of issuePatterns) {
    if (pattern.trigger.some(word => lower.includes(word))) {
      summary = pattern.template(location);
      matched = true;
      break;
    }
  }

  // If no pattern matched, generate a generic but informative summary
  if (!matched) {
    // Try to extract key phrases: first 5-6 words or a noun phrase
    const words = description.split(' ');
    if (words.length > 5) {
      // Take a meaningful chunk: first 5 words plus "..."
      const phrase = words.slice(0, 5).join(' ');
      summary = `Complaint regarding ${phrase}...`;
    } else {
      summary = `Complaint: ${title}`;
    }
  }

  // Ensure summary is not too long
  if (summary.length > 80) {
    summary = summary.substring(0, 77) + '…';
  }
  if (!summary || summary.length < 5) {
    summary = `Complaint: ${category} issue reported.`;
  }

  console.log('📝 Generated summary:', summary);
  return { category, priority, summary };
}