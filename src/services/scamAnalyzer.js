const SCAM_ANALYSIS_PROMPT = `You are a scam detection expert. Analyze the provided content for scam indicators.

Respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks):
{
  "risk_level": "safe" | "suspicious" | "likely_scam" | "confirmed_scam",
  "confidence": <number 0-100>,
  "scam_type": "<type or null if safe>",
  "red_flags": [
    {
      "type": "<flag_type>",
      "description": "<brief description>",
      "evidence": "<quoted text or description>"
    }
  ],
  "recommendations": ["<action 1>", "<action 2>"],
  "explanation": "<2-3 sentence summary>"
}

Risk level criteria:
- safe: No scam indicators detected
- suspicious: Some concerning elements but not definitive
- likely_scam: Multiple strong scam indicators
- confirmed_scam: Matches known scam patterns exactly

Common scam types: phishing, advance_fee, romance_scam, tech_support, investment_fraud, employment_scam, lottery_scam, impersonation, fake_ecommerce

Be thorough but avoid false positives. Legitimate businesses can have urgent messaging.`

const DEFAULT_BASE_URL = 'https://api.anthropic.com'
const MODEL = 'claude-sonnet-4-20250514'

// Helper to safely parse JSON response
async function parseResponse(response) {
  const text = await response.text()

  if (!text) {
    throw new Error('Empty response from API')
  }

  try {
    return JSON.parse(text)
  } catch {
    if (text.includes('<html') || text.includes('<!DOCTYPE')) {
      throw new Error('API returned HTML instead of JSON. Check your configuration.')
    }
    throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`)
  }
}

// Extract text from API response
function extractContent(data) {
  // Anthropic native format
  const anthropicContent = data.content?.[0]?.text
  if (anthropicContent) return anthropicContent

  // OpenAI-compatible format (for proxies)
  const openaiContent = data.choices?.[0]?.message?.content
  if (openaiContent) return openaiContent

  return null
}

export async function analyzeText(text, config) {
  const { apiKey, baseUrl } = config
  const effectiveBaseUrl = baseUrl || DEFAULT_BASE_URL
  const url = `${effectiveBaseUrl.replace(/\/+$/, '')}/v1/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${SCAM_ANALYSIS_PROMPT}\n\nAnalyze this text for scam indicators:\n\n${text}`
        }
      ]
    })
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(data.error?.message || `API request failed with status ${response.status}`)
  }

  const content = extractContent(data)

  if (!content) {
    throw new Error('No content in API response')
  }

  try {
    // Handle markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanContent)
  } catch {
    throw new Error('Failed to parse analysis response')
  }
}

export async function analyzeImage(base64Image, mimeType, config) {
  const { apiKey, baseUrl } = config
  const effectiveBaseUrl = baseUrl || DEFAULT_BASE_URL
  const url = `${effectiveBaseUrl.replace(/\/+$/, '')}/v1/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image
              }
            },
            {
              type: 'text',
              text: `${SCAM_ANALYSIS_PROMPT}\n\nAnalyze this image for scam indicators. Look for fake logos, suspicious text, manipulated screenshots, QR codes to unknown destinations, or other red flags.`
            }
          ]
        }
      ]
    })
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(data.error?.message || `API request failed with status ${response.status}`)
  }

  const content = extractContent(data)

  if (!content) {
    throw new Error('No content in API response')
  }

  try {
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanContent)
  } catch {
    throw new Error('Failed to parse analysis response')
  }
}

export async function analyzeURL(targetUrl, config) {
  const { apiKey, baseUrl } = config
  const effectiveBaseUrl = baseUrl || DEFAULT_BASE_URL
  const url = `${effectiveBaseUrl.replace(/\/+$/, '')}/v1/messages`

  const urlAnalysis = analyzeURLStructure(targetUrl)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${SCAM_ANALYSIS_PROMPT}\n\nAnalyze this URL for scam indicators:\n\nURL: ${targetUrl}\n\nPreliminary URL analysis:\n${JSON.stringify(urlAnalysis, null, 2)}\n\nConsider: typosquatting, suspicious TLDs, unusual subdomains, known phishing patterns, impersonation of legitimate brands.`
        }
      ]
    })
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(data.error?.message || `API request failed with status ${response.status}`)
  }

  const content = extractContent(data)

  if (!content) {
    throw new Error('No content in API response')
  }

  try {
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanContent)
  } catch {
    throw new Error('Failed to parse analysis response')
  }
}

function analyzeURLStructure(url) {
  try {
    const parsed = new URL(url)
    const domain = parsed.hostname
    const tld = domain.split('.').pop()

    const suspiciousTLDs = ['xyz', 'top', 'click', 'link', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'work']
    const trustedDomains = ['google.com', 'microsoft.com', 'apple.com', 'amazon.com', 'paypal.com', 'facebook.com']

    return {
      domain,
      tld,
      hasHttps: parsed.protocol === 'https:',
      hasSubdomain: domain.split('.').length > 2,
      pathLength: parsed.pathname.length,
      hasQueryParams: parsed.search.length > 0,
      suspiciousTLD: suspiciousTLDs.includes(tld.toLowerCase()),
      isTrustedDomain: trustedDomains.some(d => domain.endsWith(d)),
      domainLength: domain.length,
      hasNumbers: /\d/.test(domain),
      hasHyphens: domain.includes('-')
    }
  } catch {
    return { error: 'Invalid URL format' }
  }
}
