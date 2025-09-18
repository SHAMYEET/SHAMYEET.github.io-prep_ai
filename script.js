document.addEventListener('DOMContentLoaded', () => {
    // --- Core API and Model Configuration ---
    const apiKey = "AIzaSyBXSazwZSz4Bk1WaK4JhqkA8sQ20ZJEcGk";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // --- DOM Element References ---
    const startButton = document.getElementById('start-interview');
    const nextButton = document.getElementById('next-question');
    const skipButton = document.getElementById('skip-question');
    const submitButton = document.getElementById('submit-answer');
    const detailedFeedbackButton = document.getElementById('detailed-feedback-button');
    const themeToggleButton = document.getElementById('theme-toggle');
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
    
    const questionDisplay = document.getElementById('question-display');
    const userAnswer = document.getElementById('user-answer');
    const feedbackDisplay = document.getElementById('feedback-display');
    const loadingSpinner = document.getElementById('loading-spinner');

    // --- State Management ---
    let currentQuestion = '';
    let streamInterval; // To control the text streaming interval

    // --- Helper Functions ---
    
    function formatAIResponse(text) {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
        .replace(/### (.*?)(<br>|$)/g, '<strong class="block mt-3 mb-1 text-slate-800 dark:text-slate-100">$1</strong>')
        .replace(/^\s*\*/gm, '•')
        .replace(/\n/g, '<br>');
    }

    function streamText(element, text, onComplete) {
        element.innerHTML = '';
        const words = text.split(' ');
        let wordIndex = 0;
        const cursor = '<span class="blinking-cursor"></span>';
        element.innerHTML = cursor;

        clearInterval(streamInterval);

        streamInterval = setInterval(() => {
            if (wordIndex < words.length) {
                element.innerHTML = formatAIResponse(words.slice(0, wordIndex + 1).join(' ')) + ' ' + cursor;
                wordIndex++;
            } else {
                clearInterval(streamInterval);
                element.innerHTML = formatAIResponse(text);
                if(onComplete) onComplete();
            }
        }, 100);
    }

    function showLoading(isLoading) {
        loadingSpinner.classList.toggle('hidden', !isLoading);
    }
    
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function callGeminiApi(payload) {
        const MAX_RETRIES = 4;
        let lastError = null;

        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.candidates && result.candidates[0] && result.candidates[0].content.parts[0].text) {
                        return result.candidates[0].content.parts[0].text;
                    } else {
                       throw new Error("Invalid response structure from API.");
                    }
                }

                if (response.status === 503 || response.status === 429) {
                     lastError = new Error(`API Error (${response.status}): Model is overloaded or rate limited.`);
                     const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                     console.log(`Attempt ${i + 1} failed. Retrying in ${delay.toFixed(2)}ms...`);
                     await sleep(delay);
                     continue;
                }
                
                const errorBody = await response.text();
                throw new Error(`API Error (${response.status}): ${errorBody}`);

            } catch (error) {
                lastError = error;
                console.error(`Fetch attempt ${i + 1} failed:`, error);
            }
        }
        throw lastError;
    }


    // --- Core Application Logic ---

    async function getNewQuestion() {
        showLoading(true);
        nextButton.disabled = true;
        skipButton.disabled = true;
        feedbackDisplay.innerHTML = '';
        detailedFeedbackButton.classList.add('hidden');
        userAnswer.value = '';
        submitButton.disabled = true;
        questionDisplay.classList.add('dark:text-slate-400', 'text-slate-500');
        streamText(questionDisplay, "Generating new question...", null);

        try {
            const payload = {
                contents: [{
                    parts: [{
                        text: "You are an expert technical interviewer for a top tech company. Provide one common behavioral interview question. The question should be concise, a maximum of 5-6 lines long. IMPORTANT: Do not use any Markdown formatting like asterisks or bolding. Output only the plain text of the question."
                    }]
                }]
            };

            const question = await callGeminiApi(payload);
            
            currentQuestion = question.trim().replace(/[*_]/g, '');
            questionDisplay.classList.remove('dark:text-slate-400', 'text-slate-500');
            
            streamText(questionDisplay, currentQuestion, null);
            
            submitButton.disabled = false;
        } catch (error) {
            console.error("Error fetching question after multiple retries:", error);
            let errorMessage = `Sorry, an error occurred. Please try again.`;
            if (error.message.includes("overloaded") || error.message.includes("rate limited")) {
                errorMessage = "The AI model is currently busy. Please try again in a moment.";
            }
            streamText(questionDisplay, errorMessage, null);
        } finally {
            showLoading(false);
            nextButton.disabled = false;
            skipButton.disabled = false;
        }
    }

    async function getFeedback() {
        const answer = userAnswer.value;
        if (!answer.trim()) {
            feedbackDisplay.innerHTML = `<p class="text-red-400">Please provide an answer before submitting.</p>`;
            return;
        }

        showLoading(true);
        submitButton.disabled = true;
        skipButton.disabled = true; 
        nextButton.disabled = true;
        detailedFeedbackButton.classList.add('hidden');

        const systemPrompt = "You are an AI Interview Coach. Your goal is to provide **brief** and **concise** feedback on a user's answer. Provide a 2-3 bullet point summary of the most important feedback points. Do not use Markdown formatting.";
        const userPrompt = `Question: "${currentQuestion}". My Answer: "${answer}". Provide a short summary of feedback.`;

        try {
            const payload = {
                contents: [{ parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const feedback = await callGeminiApi(payload);
            
            streamText(feedbackDisplay, feedback, () => {
                 // This now runs AFTER the text has finished streaming
                 detailedFeedbackButton.classList.remove('hidden');
                 showLoading(false);
                 nextButton.disabled = false;
                 skipButton.disabled = false;
            });

        } catch (error) {
            console.error("Error getting feedback:", error);
            let errorMessage = `<p class="text-red-400">Sorry, there was an issue getting feedback. Please try again.</p>`;
            if (error.message.includes("overloaded")) {
                 errorMessage = `<p class="text-red-400">The AI model is busy. Please try again in a moment.</p>`;
            }
            feedbackDisplay.innerHTML = errorMessage;
            // Also re-enable on error
            showLoading(false);
            nextButton.disabled = false;
            skipButton.disabled = false;
        }
    }

    async function getDetailedFeedback() {
         const answer = userAnswer.value;
         if (!answer.trim()) return;

         showLoading(true);
         detailedFeedbackButton.disabled = true;
         detailedFeedbackButton.classList.add('hidden');
         
         const systemPrompt = "You are an AI Interview Coach. Your goal is to provide constructive, structured feedback. Analyze the user's answer based on the STAR method. For each component (Situation, Task, Action, Result), provide 1-2 concise bullet points of feedback. Use Markdown for bolding key terms and use ### for subheadings for each STAR component.";
         const userPrompt = `Question: "${currentQuestion}". My Answer: "${answer}". Provide detailed feedback.`;

         try {
            const payload = {
                contents: [{ parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const feedback = await callGeminiApi(payload);
            
            streamText(feedbackDisplay, feedback, null);

        } catch (error) {
            console.error("Error getting detailed feedback:", error);
            let errorMessage = `<p class="text-red-400">Sorry, there was an issue getting detailed feedback.</p>`;
            if (error.message.includes("overloaded")) {
                 errorMessage = `<p class="text-red-400">The AI model is busy. Please try again in a moment.</p>`;
            }
            feedbackDisplay.innerHTML = errorMessage;
        } finally {
             showLoading(false);
             detailedFeedbackButton.disabled = false;
         }
    }
    
    // --- Theme Switching Logic ---
    function applyTheme(theme) {
        const htmlEl = document.documentElement;
        if (theme === 'dark') {
            htmlEl.classList.add('dark');
            darkIcon.classList.remove('hidden');
            lightIcon.classList.add('hidden');
            localStorage.setItem('theme', 'dark');
        } else {
            htmlEl.classList.remove('dark');
            lightIcon.classList.remove('hidden');
            darkIcon.classList.add('hidden');
            localStorage.setItem('theme', 'light');
        }
    }

    function toggleTheme() {
        const currentTheme = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
    }

    themeToggleButton.addEventListener('click', toggleTheme);

    // --- Event Listeners ---
    startButton.addEventListener('click', () => {
        startButton.classList.add('hidden');
        nextButton.classList.remove('hidden');
        skipButton.classList.remove('hidden');
        getNewQuestion();
    });

    nextButton.addEventListener('click', getNewQuestion);
    skipButton.addEventListener('click', getNewQuestion);
    submitButton.addEventListener('click', getFeedback);
    detailedFeedbackButton.addEventListener('click', getDetailedFeedback);
    
    userAnswer.addEventListener('input', () => {
        submitButton.disabled = !(userAnswer.value.trim() && currentQuestion);
    });

    // --- Initialize Theme on Load ---
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (systemPrefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }
});

