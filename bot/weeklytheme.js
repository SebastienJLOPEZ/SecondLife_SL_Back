const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function generateWeeklyTheme(themes, currentTheme) {
    const prompt =
    `Voici une liste de thèmes d'articles avec leurs poids pour la semaine :
    ${themes.map(theme => `- ${theme.name} (poids: ${theme.weight})`).join('\n')}
    Le thème actuel est : ${currentTheme}

    Sélectionne un thème en tenant compte des poids (plus le poids est élevé = plus de chances d'être choisi) tout en excluant le thème actuel.
    Réponds uniquement par le nom du thème sélectionné, sans exception.`;
    
    const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 50,
    });

    return res.choices[0].message.content.trim();
}

module.exports = { generateWeeklyTheme };
        