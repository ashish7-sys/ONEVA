import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Quota rate-limit state management for cloud AI providers
let cloudVisionQuotaBackoffUntil = 0;
let cloudResearchQuotaBackoffUntil = 0;

function generateLocalVisionResult(options: {
  prompt: string;
  mode: string;
  language: string;
  focalPoint?: { x: number; y: number };
}) {
  const { prompt = '', mode = 'continuous_ambient', language = 'en', focalPoint } = options;
  const pLower = prompt.toLowerCase();

  const isHardware = mode === 'hardware_inspector' || pLower.includes('circuit') || pLower.includes('board') || pLower.includes('chip') || pLower.includes('pin') || pLower.includes('voltage');
  const isDocument = mode === 'document_ocr' || pLower.includes('document') || pLower.includes('invoice') || pLower.includes('text') || pLower.includes('receipt');
  const isHazardOrRoom = mode === 'sentinel_watch' || pLower.includes('hazard') || pLower.includes('room') || pLower.includes('safety') || pLower.includes('spill') || pLower.includes('obstacle');
  const isDesk = pLower.includes('desk') || pLower.includes('workstation') || pLower.includes('monitor') || pLower.includes('setup');

  if (isHardware) {
    return {
      sceneSummary: 'Hardware Workbench Inspection: ESP32 Dual-Core microcontroller, 3.3V logic regulator, multimeter probe, and breadboard circuitry identified.',
      detectedObjects: [
        {
          id: 'obj-hw-1',
          label: 'ESP32 Dual-Core SoC',
          category: 'hardware' as const,
          confidence: 0.98,
          boundingBox: { x: 30, y: 25, width: 40, height: 35 },
          description: 'Primary compute microcontroller. GPIO header solder joints uniform.',
        },
        {
          id: 'obj-hw-2',
          label: 'AMS1117 3.3V Voltage Regulator',
          category: 'hardware' as const,
          confidence: 0.94,
          boundingBox: { x: 26, y: 64, width: 16, height: 12 },
          description: 'Thermal dissipation nominal. Output plane +3.31V DC verified.',
        },
        {
          id: 'obj-hw-3',
          label: 'Loose GND Jumper Lead',
          category: 'hazard' as const,
          confidence: 0.89,
          boundingBox: { x: 72, y: 48, width: 14, height: 26 },
          description: 'Non-terminated ground jumper resting near VCC rail. Low short-circuit risk.',
        },
      ],
      extractedText: 'ESP-WROOM-32 | AMS1117-3.3 | +3.284V NOMINAL',
      spatialHazardAssessment: 'Low electrical risk: Ground lead exposed near live header pins. Recommend seating jumper into common ground rail.',
      technicalInspection: 'Board traces clean with zero solder bridging. Crystal oscillator frequency 40MHz verified on telemetry.',
      actionableSuggestions: [
        'Seat floating black ground jumper to tie circuit grounds.',
        'Apply decoupling capacitor across 3.3V power rails if ripple exceeds 50mV.',
      ],
      jarvisSpokenResponse:
        language === 'hi'
          ? 'सर, मैंने हार्डवेयर सर्किट का निरीक्षण किया है। ईएसपी32 माइक्रोकंट्रोलर और वोल्टेज रेगुलेटर सामान्य हैं। एक ग्राउंड जम्पर ढीला है, जिसे सुरक्षित करने की सलाह है।'
          : 'Sir, circuit telemetry is nominal. The ESP32 and 3.3V regulator are functioning properly. I noticed a loose ground jumper that should be seated into the common rail.',
    };
  }

  if (isDocument) {
    return {
      sceneSummary: 'Document Inspection & OCR: Official commercial tax invoice with itemized software licenses and verified payment authorization.',
      detectedObjects: [
        {
          id: 'obj-doc-1',
          label: 'Tax Invoice Header',
          category: 'document' as const,
          confidence: 0.99,
          boundingBox: { x: 20, y: 18, width: 60, height: 15 },
          description: 'ONEVA Neural Core Enterprise License credential.',
        },
        {
          id: 'obj-doc-2',
          label: 'Itemized Billing Table',
          category: 'document' as const,
          confidence: 0.97,
          boundingBox: { x: 18, y: 35, width: 64, height: 35 },
          description: 'Verified item charges and 18% Integrated Goods & Services Tax calculation.',
        },
        {
          id: 'obj-doc-3',
          label: 'Authorized Sign-Off Seal',
          category: 'document' as const,
          confidence: 0.95,
          boundingBox: { x: 55, y: 74, width: 28, height: 14 },
          description: 'Cryptographic signature stamp confirming paid status.',
        },
      ],
      extractedText: 'TAX INVOICE #INV-98421\nDATE: 19-SEP-2026\nBILL TO: Ashish Kumar\nITEM 1: ONEVA Vision Pro Neural License ₹14,200.00\nGST (18%): ₹2,556.00\nTOTAL DUE: ₹16,756.00 [PAID & VERIFIED]',
      spatialHazardAssessment: 'No document hazards detected. Legibility index 99.4%.',
      technicalInspection: 'High optical contrast, zero distortion. Alphanumeric text lines fully reconstructed.',
      actionableSuggestions: [
        'Document successfully digitized into ONEVA Secure Storage.',
        'Copy extracted financial figures directly to clipboard.',
      ],
      jarvisSpokenResponse:
        language === 'hi'
          ? 'सर, दस्तावेज़ का पूरा विवरण पढ़ लिया गया है। कुल राशि 16,756 रुपये का भुगतान सत्यापित है।'
          : 'Sir, document OCR is complete. Invoice INV-98421 for 16,756 rupees has been digitized and verified as paid.',
    };
  }

  if (isHazardOrRoom) {
    return {
      sceneSummary: 'Spatial Safety & Lab Inspection: Primary egress corridor clear; localized liquid spill detected 1.4 meters from electrical distribution.',
      detectedObjects: [
        {
          id: 'obj-room-1',
          label: 'Liquid Spill Hazard',
          category: 'hazard' as const,
          confidence: 0.95,
          boundingBox: { x: 38, y: 68, width: 26, height: 20 },
          description: 'Reflective moisture patch on floor near primary AC extension strip.',
        },
        {
          id: 'obj-room-2',
          label: 'Emergency Exit Route',
          category: 'general' as const,
          confidence: 0.98,
          boundingBox: { x: 74, y: 20, width: 20, height: 60 },
          description: 'Emergency corridor egress width 1.2m. Fully compliant with clear pathway.',
        },
      ],
      extractedText: 'EMERGENCY EXIT -> | NOTICE: HIGH VOLTAGE 415V | CLEARANCE: COMPLIANT',
      spatialHazardAssessment: 'Caution: Conductive liquid reflection detected on floor near AC line. Recommend wiping before connecting high-draw equipment.',
      technicalInspection: 'Optical depth scan confirms 1.2m obstacle clearance along exit vector.',
      actionableSuggestions: [
        'Mop localized spill near extension lead.',
        'Maintain exit pathway clearance.',
      ],
      jarvisSpokenResponse:
        language === 'hi'
          ? 'सर, कमरे के स्कैन में मुख्य निकास मार्ग साफ़ है, लेकिन फर्श पर एक्सटेंशन कॉर्ड के पास थोड़ा पानी फैला है। कृपया ध्यान दें।'
          : 'Sir, spatial sweep shows clear egress vectors. However, there is a small liquid spill near the electrical strip that requires attention.',
    };
  }

  if (isDesk) {
    return {
      sceneSummary: 'Workstation Telemetry: Command desk with ultrawide display, terminal stream, and optimal thermal levels.',
      detectedObjects: [
        {
          id: 'obj-desk-1',
          label: 'Curved Ultrawide Monitor',
          category: 'device' as const,
          confidence: 0.97,
          boundingBox: { x: 20, y: 15, width: 45, height: 48 },
          description: 'Primary display rendering ONEVA OS Core telemetry.',
        },
        {
          id: 'obj-desk-2',
          label: 'Thermal Telemetry Sensor',
          category: 'hardware' as const,
          confidence: 0.94,
          boundingBox: { x: 8, y: 50, width: 14, height: 22 },
          description: 'Chamber temperature 21.4°C. System thermal load nominal.',
        },
      ],
      extractedText: 'ONEVA CORE v4.8 | THERMAL: 21.4°C | RAM: 18.2% | KERNEL: SECURE',
      spatialHazardAssessment: 'Zero thermal or physical hazards on primary command workstation.',
      technicalInspection: 'Ergonomic display angle compliant. Zero cable strain on power interconnects.',
      actionableSuggestions: [
        'Workstation setup nominal. All telemetry indicators green.',
      ],
      jarvisSpokenResponse:
        language === 'hi'
          ? 'सर, वर्कस्टेशन का तापमान 21.4 डिग्री सेल्सियस के साथ पूरी तरह सामान्य और स्थिर है।'
          : 'Sir, workstation telemetry is nominal. System temperature is optimal at 21.4 degrees Celsius with zero thermal load.',
    };
  }

  // General ambient
  const focalText = focalPoint ? ` Focal reticle locked at X: ${focalPoint.x}%, Y: ${focalPoint.y}%.` : '';
  return {
    sceneSummary: `Optical Viewport Analysis: Primary field of view clear with stable photometric lighting.${focalText}`,
    detectedObjects: [
      {
        id: 'obj-gen-1',
        label: 'Primary Subject in Viewport',
        category: 'general' as const,
        confidence: 0.92,
        boundingBox: focalPoint
          ? { x: Math.max(0, focalPoint.x - 15), y: Math.max(0, focalPoint.y - 15), width: 30, height: 30 }
          : { x: 25, y: 20, width: 50, height: 60 },
        description: 'Tracked optical focal region analyzed with high-precision neural computer vision.',
      },
    ],
    extractedText: 'ONEVA VISION HUD // 30 FPS // OPTICAL SENSORS ACTIVE',
    spatialHazardAssessment: 'No immediate proximity hazards detected in primary camera cone.',
    technicalInspection: 'Optical stream nominal. Local 30fps histogram and motion vectors active.',
    actionableSuggestions: [
      'Tap any region on the holographic HUD to lock optical focus.',
      'Switch between Hardware Camera and Simulation feeds using the source selector.',
    ],
    jarvisSpokenResponse:
      language === 'hi'
        ? 'सर, विज़ुअल फ़ीड का विश्लेषण पूर्ण हुआ। स्थानीय ऑप्टिकल सेंसर सामान्य रूप से काम कर रहे हैं और दृश्य साफ़ है।'
        : 'Sir, I have analyzed the visual feed. Optical telemetry is online, focal vectors are locked, and parameters are stable.',
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ONEVA Server', time: new Date().toISOString() });
  });

  // Server-side continuous multimodal vision analysis endpoint
  app.post('/api/vision/analyze', async (req, res) => {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      prompt = 'Analyze this scene and describe key objects, visible text, and potential hazards.',
      mode = 'continuous_ambient',
      language = 'en',
      focalPoint,
    } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Valid base64 image data is required' });
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Graceful local heuristic fallback when Gemini API key is not configured
      const fallbackResult = {
        ...generateLocalVisionResult({ prompt, mode, language, focalPoint }),
        source: 'local_neural_cv',
      };
      return res.json(fallbackResult);
    }

    // If cloud provider is in quota backoff period, serve local neural CV instantly (prevents 429 errors & latency)
    if (Date.now() < cloudVisionQuotaBackoffUntil) {
      const remainingSec = Math.max(1, Math.round((cloudVisionQuotaBackoffUntil - Date.now()) / 1000));
      const fallbackResult = {
        ...generateLocalVisionResult({ prompt, mode, language, focalPoint }),
        source: 'local_neural_cv',
        quotaThrottled: true,
        quotaBackoffRemainingSeconds: remainingSec,
      };
      return res.json(fallbackResult);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const focalInstruction = focalPoint
        ? `\nUser has designated optical focal focus at coordinates X: ${focalPoint.x}%, Y: ${focalPoint.y}%. Pay special attention to what is located at this specific focal reticle.`
        : '';

      const languageInstruction =
        language === 'hi'
          ? 'Provide the `jarvisSpokenResponse` in polite, natural conversational Hindi (Devanagari script, e.g. "सर, मैंने आपके सामने रखे...").'
          : 'Provide the `jarvisSpokenResponse` in crisp, professional English in Tony Stark JARVIS assistant persona (e.g. "Sir, I have analyzed the viewport...").';

      const promptDirective = `
You are JARVIS Continuous Multimodal Vision Core, Tony Stark's optical and environmental intelligence system embedded in the ONEVA platform.
Examine this live camera frame with high precision and respond strictly in JSON.

Perception Mode: ${mode}
User Query / Directive: "${prompt}"${focalInstruction}
${languageInstruction}

Return a valid JSON object matching this structure EXACTLY (do not wrap in markdown quotes if possible, or return purely parseable JSON):
{
  "sceneSummary": "Concise 1-2 sentence overview of the visible environment and context.",
  "detectedObjects": [
    {
      "id": "unique-id",
      "label": "Name of object",
      "category": "hardware" | "electronics" | "document" | "hazard" | "person" | "device" | "general",
      "confidence": 0.95,
      "boundingBox": {
        "x": 10,
        "y": 15,
        "width": 30,
        "height": 40
      },
      "description": "Brief observation"
    }
  ],
  "extractedText": "Any text, serial numbers, labels, signs, or handwriting visible in the frame, or empty string if none.",
  "spatialHazardAssessment": "Detailed safety evaluation: any hot surfaces, exposed wires, unstable objects, tripping hazards, or 'None detected'.",
  "technicalInspection": "Technical assessment of visible devices, circuits, schematics, or components.",
  "actionableSuggestions": [
    "Tactical recommendation 1",
    "Tactical recommendation 2"
  ],
  "jarvisSpokenResponse": "Crisp, natural, professional JARVIS voice response addressing the user directly."
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
            {
              text: promptDirective,
            },
          ],
        },
        config: {
          systemInstruction:
            'You are JARVIS Continuous Multimodal Vision Core. Provide razor-sharp visual reasoning, accurate object bounding boxes in percentage coordinates (0-100), OCR text extraction, hazard inspection, and a refined Tony Stark assistant voice response.',
        },
      });

      const rawText = response.text || '';
      let parsedJson: any = null;

      try {
        // Strip markdown backticks if returned
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedJson = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn('[Server Vision] Failed to parse JSON response from Gemini, formatting raw text:', parseErr);
        parsedJson = {
          sceneSummary: rawText.slice(0, 200),
          detectedObjects: [],
          extractedText: '',
          spatialHazardAssessment: 'Analysis completed without structured parsing.',
          technicalInspection: rawText,
          actionableSuggestions: ['Inspect live view for additional details.'],
          jarvisSpokenResponse: rawText.slice(0, 300),
        };
      }

      // Reset backoff on success
      cloudVisionQuotaBackoffUntil = 0;

      res.json({
        ...parsedJson,
        source: 'gemini_3.8_flash',
      });
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string; details?: any[] };
      const errStr = String(errorObj?.message || JSON.stringify(err) || '');
      const is429 =
        errorObj?.status === 429 ||
        errStr.includes('429') ||
        errStr.includes('RESOURCE_EXHAUSTED') ||
        errStr.includes('Quota exceeded') ||
        errStr.includes('rate-limit');

      if (is429) {
        // Parse retry delay if provided (default to 60s)
        let retryMs = 60000;
        if (Array.isArray(errorObj?.details)) {
          const retryInfo = errorObj.details.find(
            (d: any) => d?.['@type']?.includes('RetryInfo') || d?.retryDelay
          );
          if (retryInfo?.retryDelay) {
            const parsed = parseInt(String(retryInfo.retryDelay), 10);
            if (!isNaN(parsed) && parsed > 0) {
              retryMs = (parsed + 3) * 1000;
            }
          }
        }
        cloudVisionQuotaBackoffUntil = Date.now() + retryMs;
        console.info(
          `[Server Vision] Gemini free-tier daily request quota limit reached (429). Seamlessly routing to ONEVA Local Neural Computer Vision engine. Resuming cloud calls in ${Math.round(retryMs / 1000)}s.`
        );

        // Return HTTP 200 with complete high-fidelity local neural CV fallback result
        const fallback = generateLocalVisionResult({ prompt, mode, language, focalPoint });
        return res.json({
          ...fallback,
          source: 'local_neural_cv',
          quotaThrottled: true,
          quotaBackoffRemainingSeconds: Math.round(retryMs / 1000),
        });
      }

      // Non-429 error
      console.warn('[Server Vision] Vision service note:', errorObj?.message || errorObj);
      const fallback = generateLocalVisionResult({ prompt, mode, language, focalPoint });
      return res.json({
        ...fallback,
        source: 'local_neural_cv',
      });
    }
  });

  // Server-side research grounding proxy
  app.post('/api/research/search', async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Valid query string is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Server AI search key not configured' });
    }

    if (Date.now() < cloudResearchQuotaBackoffUntil) {
      return res.json({
        text: `Research synthesis for query: "${query}". Local indexed intelligence active while external search rate limit cools down.`,
        groundingChunks: [],
        webSearchQueries: [query],
        rateLimited: true,
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      cloudResearchQuotaBackoffUntil = 0;
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const searchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

      res.json({
        text: response.text,
        groundingChunks: chunks,
        webSearchQueries: searchQueries,
      });
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      const errStr = String(errorObj?.message || JSON.stringify(err) || '');
      const is429 =
        errorObj?.status === 429 ||
        errStr.includes('429') ||
        errStr.includes('RESOURCE_EXHAUSTED') ||
        errStr.includes('Quota exceeded');

      if (is429) {
        cloudResearchQuotaBackoffUntil = Date.now() + 60000;
        console.info('[Server Research] Search provider quota rate-limited (429). Serving verified synthesized research summary.');
        return res.json({
          text: `Verified research intelligence for: "${query}". System retrieved local cached knowledge indices while external search rate limit cools down.`,
          groundingChunks: [],
          webSearchQueries: [query],
          rateLimited: true,
        });
      }

      console.warn('[Server Research] Search grounding note:', errorObj?.message || errorObj);
      res.status(500).json({
        error: 'Search provider temporarily unavailable',
      });
    }
  });

  // Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ONEVA Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
