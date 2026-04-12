import { GoogleGenerativeAI } from '@google/generative-ai';
import { t } from '@/constants/i18n';

/**
 * BEST PRACTICES IMPLEMENTATION (2025/2026 Standards)
 * - Uses centralized SDK initialization.
 * - Separates identity from data via systemInstruction.
 * - Implements strict generation configurations for consistency.
 */

const getApiKey = () => process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

/**
 * Internal factory for the Generative Model.
 * Centralizing this ensures consistent safety settings and generation configs.
 */
const createModel = (systemInstruction: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 200,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
      { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
    ],
  });
};

/**
 * Generates a hyper-personalized motivational message.
 */
export async function generateMotivationalMessage(
  username: string,
  mode: string,
  stats: {
    savedHoursWeek: number;
    streakDays: number;
    usageHours24h: number;
    goalHours: number;
    topPercentage: number;
  },
  appUsages: { name: string; minutes: number }[]
): Promise<string> {
  const systemInstruction = t('ai.systemInstructionMotivational');

  const model = createModel(systemInstruction);
  if (!model) {
    return t('ai.fallbackMotivational', { 
      pct: stats.topPercentage, 
      saved: stats.savedHoursWeek.toFixed(1) 
    });
  }

  try {
    const appsXml = appUsages
      .map((app) => `<app name="${app.name}" minutes="${app.minutes}" />`)
      .join('\n');

    const prompt = t('ai.promptMotivational', {
      username,
      mode: t(`onboarding.${mode}.name`),
      streak: stats.streakDays,
      usage24h: stats.usageHours24h.toFixed(1),
      goal: stats.goalHours,
      savedWeek: stats.savedHoursWeek.toFixed(1),
      ranking: stats.topPercentage,
      appsXml,
    });

    const timeoutMs = 20000;
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), timeoutMs)
    );

    const generationPromise = (async () => {
      const result = await model.generateContent(prompt);
      return result.response.text().trim().replace(/^"|"$/g, '');
    })();

    return await Promise.race([generationPromise, timeoutPromise]);
  } catch (error: any) {
    return t('ai.fallbackSocial'); 
  }
}

/**
 * Generates a supportive message for friends.
 */
export async function generateFriendSupportMessage(
  friendName: string,
  achievementType: 'STREAK' | 'USAGE_REDUCTION' | 'TOP_RANK',
  value: number
): Promise<string> {
  const systemInstruction = t('ai.systemInstructionSocial');

  const model = createModel(systemInstruction);
  if (!model) return t('ai.fallbackSocial');

  try {
    const prompt = t('ai.promptSocial', {
      friendName,
      type: achievementType,
      value,
    });

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 12000)
    );

    const generationPromise = (async () => {
      const result = await model.generateContent(prompt);
      return result.response.text().trim().replace(/^"|"$/g, '');
    })();

    return await Promise.race([generationPromise, timeoutPromise]);
  } catch (error) {
    return t('ai.fallbackSocial');
  }
}
