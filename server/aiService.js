const OpenAI = require('openai');
require('dotenv').config();

// OpenAI 설정
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 패션 추천 함수
async function getFashionRecommendation(userProfile, dailyInfo) {
    try {
        // OpenAI 프롬프트 생성
        const prompt = `
Please recommend today's fashion based on the following client information:

Client Profile:
- Age: ${userProfile.age} years old
- Gender: ${userProfile.gender}
- Profession: ${userProfile.job}
- Height: ${userProfile.height}cm
- Weight: ${userProfile.weight}kg
- Body type: ${userProfile.bodyType || '보통'}
- Today's mood/schedule: ${dailyInfo}

Please provide a styling recommendation in EXACTLY this format:

**한 줄 요약:** [Brief, catchy description of the recommended style concept]

**예시 조합:**
- 상의: [Specific top item with color, fabric, fit details]
- 하의: [Specific bottom item with color, fabric, fit details]
- 신발: [Specific footwear style and color]
- 액세서리: [2-3 specific accessories that complete the look]

CRITICAL REQUIREMENTS:
1. Use NATURAL Korean fashion terminology (캐주얼 NOT 카주얼, 실버 NOT 은 컬러, 베이직, 오버핏, 슬림핏, 와이드핏 etc.)
2. Consider body proportions for flattering silhouettes
3. Match style to profession and age appropriateness
4. Ensure outfit suits today's specific mood/activities
5. Reflect current Korean fashion trends (2024-2025)
6. Provide specific, realistic, purchasable items
7. Include modern Korean brand references when appropriate (무신사, 29CM style, etc.)
8. Use trendy Korean fashion vocabulary naturally
9. Focus on wearable, contemporary Korean street fashion

Respond ONLY in Korean using natural, modern Korean fashion language. Create a cohesive, stylish look that enhances the client's best features while being appropriate for their Korean lifestyle context.
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a professional Korean fashion stylist with expertise in contemporary Korean fashion trends, body type analysis, and lifestyle-appropriate styling. You understand both global fashion trends and Korean fashion culture deeply."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 800,
            temperature: 0.7,
        });

        const recommendation = completion.choices[0].message.content;
        const parsedRecommendation = parseRecommendation(recommendation);

        return {
            success: true,
            recommendation: {
                raw: recommendation,
                parsed: parsedRecommendation
            }
        };

    } catch (error) {
        console.error('패션 추천 오류:', error);

        if (error.status === 401) {
            return {
                success: false,
                error: 'INVALID_API_KEY',
                message: 'OpenAI API 키가 유효하지 않습니다.'
            };
        } else if (error.status === 429) {
            return {
                success: false,
                error: 'RATE_LIMIT',
                message: 'API 사용량이 초과되었습니다.'
            };
        } else {
            return {
                success: false,
                error: 'UNKNOWN_ERROR',
                message: '패션 추천 중 오류가 발생했습니다.'
            };
        }
    }
}

// 추천 결과를 구조화하는 함수
function parseRecommendation(text) {
    try {
        const sections = {};

        // 한 줄 요약 추출
        const summaryMatch = text.match(/\*\*한 줄 요약:\*\*\s*(.+)/);
        if (summaryMatch) {
            sections.summary = summaryMatch[1].trim();
        }

        // 예시 조합 추출
        const outfitMatch = text.match(/\*\*예시 조합:\*\*\s*([\s\S]*)/);
        if (outfitMatch) {
            const outfitText = outfitMatch[1];
            const outfit = {};

            const topMatch = outfitText.match(/상의:\s*(.+)/);
            const bottomMatch = outfitText.match(/하의:\s*(.+)/);
            const shoesMatch = outfitText.match(/신발:\s*(.+)/);
            const accessoryMatch = outfitText.match(/액세서리:\s*(.+)/);

            if (topMatch) outfit.top = topMatch[1].trim();
            if (bottomMatch) outfit.bottom = bottomMatch[1].trim();
            if (shoesMatch) outfit.shoes = shoesMatch[1].trim();
            if (accessoryMatch) outfit.accessories = accessoryMatch[1].trim();

            sections.outfit = outfit;
        }

        return sections;
    } catch (error) {
        console.error('추천 결과 파싱 오류:', error);
        return { raw: text };
    }
}

module.exports = {
    getFashionRecommendation
};