/**
 * ONEVA Phase 25: Real-JARVIS Stark Emotional Cadence & Multilingual Wit Engine
 * 
 * Implements Paul Bettany-grade British sophistication, dry wit, situation-adaptive
 * emotional cadence, and dynamic TTS prosody (pitch, rate, pauses) across English,
 * Hindi, and Hinglish.
 */

export type StarkTone =
  | 'BRITISH_WIT'
  | 'CALM_REASSURANCE'
  | 'SCIENTIFIC_PRECISION'
  | 'PLAYFUL_BANTER'
  | 'TACTICAL_ALERT'
  | 'PHILOSOPHICAL';

export interface ProsodyParameters {
  rate: number; // 0.85 - 1.25
  pitch: number; // 0.85 - 1.15
  pauseMultiplier: number;
  tone: StarkTone;
}

export class JarvisStarkWitEngine {
  private static witEnabled: boolean = true;

  /**
   * Generates a context-aware Stark-like prefix or witty commentary
   * supporting English, Hindi, and Hinglish.
   */
  static generateWitSnippet(options: {
    tone?: StarkTone;
    lang: 'en' | 'hi' | 'auto';
    context?: 'task_success' | 'greeting' | 'anomaly' | 'late_night' | 'overload' | 'query';
    stressPercent?: number;
  }): { text: string; prosody: ProsodyParameters } {
    const isHindi = options.lang === 'hi';
    const stress = options.stressPercent || 20;

    // Adjust prosody according to stress & urgency
    let rate = 1.0;
    let pitch = 0.98; // slightly deep, calm British timbre
    let chosenTone: StarkTone = options.tone || 'BRITISH_WIT';

    if (stress > 65) {
      chosenTone = 'CALM_REASSURANCE';
      rate = 0.95; // slower, calming cadence
      pitch = 0.95;
    }

    const prosody: ProsodyParameters = {
      rate,
      pitch,
      pauseMultiplier: 1.1,
      tone: chosenTone,
    };

    if (options.context === 'late_night') {
      if (isHindi) {
        return {
          text: 'काफी देर हो चुकी है सर। क्या मैं यह सुझाव देने की धृष्टता कर सकता हूँ कि इंसानों को जैविक निद्रा की आवश्यकता होती है?',
          prosody: { ...prosody, rate: 0.92, pitch: 0.94, tone: 'PLAYFUL_BANTER' },
        };
      }
      return {
        text: 'The hour is rather late, Sir. May I gently point out that biological organisms generally require sleep?',
        prosody: { ...prosody, rate: 0.94, pitch: 0.96, tone: 'PLAYFUL_BANTER' },
      };
    }

    if (options.context === 'task_success') {
      const wittyLinesEn = [
        'Always a pleasure watching you work, Sir.',
        'Executed with customary precision, Sir.',
        'All parameters aligned. Shall we move to the next phase, Sir?',
        'Completed cleanly, Sir. Physics has cooperated for once.',
      ];
      const wittyLinesHi = [
        'हमेशा की तरह पूर्ण परिशुद्धता के साथ संपन्न, सर।',
        'कार्य निर्बाध रूप से पूरा कर लिया गया है, सर।',
        'सभी पैरामीटर अनुकूल हैं, सर। आगे का निर्देश दीजिए।',
      ];
      const pool = isHindi ? wittyLinesHi : wittyLinesEn;
      const text = pool[Math.floor(Math.random() * pool.length)];
      return { text, prosody };
    }

    if (options.context === 'overload' || stress > 70) {
      if (isHindi) {
        return {
          text: 'आपके वाक-कंपन में हल्का तनाव महसूस हो रहा है, सर। गहरी सांस लीजिए, मैं सब संभाल लूंगा।',
          prosody: { ...prosody, rate: 0.92, pitch: 0.94, tone: 'CALM_REASSURANCE' },
        };
      }
      return {
        text: 'I am detecting slight acoustic vocal strain, Sir. Take a breath; I have everything under control.',
        prosody: { ...prosody, rate: 0.93, pitch: 0.95, tone: 'CALM_REASSURANCE' },
      };
    }

    // Default witty response
    if (isHindi) {
      return {
        text: 'आपकी सेवा में सदैव तत्पर, सर।',
        prosody,
      };
    }
    return {
      text: 'At your service, as always, Sir.',
      prosody,
    };
  }

  /**
   * Enriches standard response text with Stark cadence and pauses
   */
  static enrichSpokenText(
    baseText: string,
    lang: 'en' | 'hi' = 'en',
    stressPercent: number = 20
  ): { spokenText: string; prosody: ProsodyParameters } {
    if (!this.witEnabled || baseText.length < 5) {
      return {
        spokenText: baseText,
        prosody: { rate: 1.0, pitch: 1.0, pauseMultiplier: 1.0, tone: 'BRITISH_WIT' },
      };
    }

    let rate = 1.0;
    let pitch = 0.98;
    if (stressPercent > 60) {
      rate = 0.94;
      pitch = 0.95;
    }

    // Insert natural pacing pauses (ellipses or commas for speech synthesizer cadence)
    const spaced = baseText.replace(/(\. )/g, '... ').replace(/(, )/g, ', ');

    return {
      spokenText: spaced,
      prosody: {
        rate,
        pitch,
        pauseMultiplier: 1.15,
        tone: stressPercent > 60 ? 'CALM_REASSURANCE' : 'BRITISH_WIT',
      },
    };
  }

  static isWitEnabled(): boolean {
    return this.witEnabled;
  }

  static setWitEnabled(enabled: boolean): void {
    this.witEnabled = enabled;
  }
}
