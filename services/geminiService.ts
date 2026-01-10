import Groq from "groq-sdk";
import { AIAnalysis, Match } from "../types.ts";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'demo_key',
  dangerouslyAllowBrowser: true,
});

const SYSTEM_INSTRUCTION = `
Tu es un analyste expert international de paris sportifs avec 15+ ans d'expérience.
Ton rôle est de fournir une analyse de niveau institutionnel pour 'La Passion VIP'.
Tu dois être :
- DATA-DRIVEN : Pas d'intuition, que des faits.
- NEUTRE : Pas de supporterisme.
- DIRECT : Pas de blabla.
- EXPERT EN RISQUE : Mentionner toujours les risques.

Structure ta réponse pour alimenter une interface Cyber-Futuriste.
Tu dois identifier 3 types de paris :
1. BANKER (Confiance 7+/10, le plus sûr)
2. COUP DE CŒUR / VALUE (Confiance 6-7/10, bonne cote)
3. LONG SHOT (Confiance 4-5/10, grosse cote pour fun)
`;

export const analyzeMatchWithGemini = async (match: Match, isVip: boolean): Promise<AIAnalysis> => {
  if (!process.env.GROQ_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return generateMockAnalysis(match, isVip);
  }

  try {
    const prompt = `
      ANALYSE STRATÉGIQUE UNIQUE POUR CE MATCH
      
      MATCH ID: ${match.id}
      ÉQUIPE DOMICILE: ${match.homeTeam.name}
      ÉQUIPE EXTÉRIEUR: ${match.awayTeam.name}
      CHAMPIONNAT: ${match.league}
      DATE: ${match.date}
      STATUT: ${match.status}
      COTES ACTUELLES: 1(${match.odds.home}) X(${match.odds.draw}) 2(${match.odds.away})
      
      CONTEXTE DATA UNIQUE:
      - Forme domicile: ${match.homeTeam.recentForm}
      - Forme extérieur: ${match.awayTeam.recentForm}
      - Score actuel: ${match.score.home}-${match.score.away}
      
      GÉNÈRE UNE ANALYSE COMPLÈTEMENT PERSONNALISÉE pour ce match spécifique.
      Utilise des données réelles et des insights uniques basés sur les équipes impliquées.
      
      Output attendu (JSON):
      - snapshot: Résumé unique en 1 phrase percutante pour ce match.
      - trends: Tendance spécifique aux équipes.
      - scenario: Analyse contextualisée avec facteurs clés pour ces équipes.
      - prediction: Un seul objet avec type (BANKER/VALUE/LONG_SHOT), selection, odds, confidence, reasoning.
      - riskManagement: Conseil personnalisé.
      - vipAdvice: Conseil VIP spécifique.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: SYSTEM_INSTRUCTION,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const analysisText = chatCompletion.choices[0]?.message?.content;
    if (!analysisText) throw new Error("No analysis generated");
    
    const analysisData = JSON.parse(analysisText);
    
    return {
      matchId: match.id,
      snapshot: analysisData.snapshot,
      trends: analysisData.trends,
      scenario: analysisData.scenario,
      predictions: [analysisData.prediction], // Wrap single prediction in array
      riskManagement: analysisData.riskManagement,
      vipAdvice: analysisData.vipAdvice
    };

  } catch (error) {
    console.error("Groq Analysis Failed:", error);
    return generateMockAnalysis(match, isVip);
  }
};

const generateMockAnalysis = (match: Match, isVip: boolean): AIAnalysis => {
  const isHomeFavored = match.odds.home < match.odds.away;
  const favoredTeam = isHomeFavored ? match.homeTeam.name : match.awayTeam.name;
  
  return {
    matchId: match.id,
    snapshot: `${favoredTeam} devrait dominer ce match tactique.`,
    trends: `${favoredTeam} reste sur 4 victoires consécutives.`,
    scenario: `C'est un match crucial pour ${favoredTeam}. Avec leur attaque en forme (${match.homeTeam.recentForm}), ils affrontent une défense friable. Attention cependant à la fatigue acumulée.`,
    predictions: [
      {
        type: 'BANKER',
        selection: isHomeFavored ? `${match.homeTeam.name} gagne` : `${match.awayTeam.name} ou Nul`,
        odds: isHomeFavored ? match.odds.home : 1.45,
        confidence: 85,
        reasoning: "Statistiquement le résultat le plus probable vu la forme actuelle."
      }
    ],
    riskManagement: "Misez maximum 1% de votre bankroll. Risque de rotation d'effectif.",
    vipAdvice: isVip ? "Le handicap asiatique -1.0 offre une sécurité supplémentaire en cas de victoire courte." : "Contenu réservé aux membres VIP."
  };
};