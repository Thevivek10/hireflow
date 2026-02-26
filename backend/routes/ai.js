const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

async function getGeminiClient() {
  const { GoogleGenAI } = await import('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(apiKey)
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenAI({ apiKey });
}

// Generate CV using AI
router.post('/generate-cv', auth, async (req, res) => {
  const { jobTitle, jobDescription, jobRequirements, userInfo } = req.body;

  try {
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a professional, tailored CV for someone applying to the following job. Make it ATS-friendly and tailored to the job requirements.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}
REQUIREMENTS: ${jobRequirements}

USER PROVIDED INFO:
Name: ${userInfo.name}
Email: ${userInfo.email}
Phone: ${userInfo.phone || 'Not provided'}
Experience: ${userInfo.experience || 'Not provided'}
Education: ${userInfo.education || 'Not provided'}
Skills: ${userInfo.skills || 'Not provided'}
Additional Info: ${userInfo.additionalInfo || 'None'}

Return ONLY valid JSON in this exact format:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "summary": "Professional summary tailored to this job (3-4 sentences)",
  "experience": [
    { "company": "Company Name", "role": "Job Title", "duration": "2020-2023", "description": "Key achievements and responsibilities" }
  ],
  "education": [
    { "institution": "University Name", "degree": "Degree Title", "year": "2020" }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "cvText": "Full plain text version of the CV for AI analysis"
}`
    });

    const text = response.text;
    const clean = text.replace(/```json|```/g, '').trim();
    const cvData = JSON.parse(clean);
    res.json(cvData);
  } catch (err) {
    console.error('CV generation error:', err);
    res.status(500).json({ error: 'Failed to generate CV' });
  }
});

// Get career insights
router.post('/insights', auth, async (req, res) => {
  const { applications } = req.body;
  try {
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on these job applications data: ${JSON.stringify(applications)}
        
Provide 3 actionable career insights. Return JSON array:
[{"title": "Insight title", "description": "Detailed advice", "type": "strength|improvement|opportunity"}]`
    });

    const text = response.text;
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

module.exports = router;
