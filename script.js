document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');

    // --- 🚨🚨🚨 CRITICAL SECURITY WARNING! 🚨🚨🚨 ---
    //
    //      THE API KEY BELOW IS DIRECTLY EMBEDDED IN THE CLIENT-SIDE CODE.
    //      THIS IS EXTREMELY INSECURE FOR ANY PUBLICLY ACCESSIBLE WEBSITE.
    //      ANYONE VISITING THE PAGE CAN VIEW THE SOURCE AND STEAL YOUR API KEY.
    //      THIS CAN LEAD TO UNAUTHORIZED USE AND POTENTIAL HIGH COSTS ON YOUR ACCOUNT.
    //
    //      THIS CODE IS PROVIDED *ONLY* FOR YOUR PERSONAL, LOCAL TESTING
    //      ON YOUR OWN COMPUTER.
    //
    //      DO NOT DEPLOY THIS CODE WITH THE API KEY EMBEDDED TO A PUBLIC SERVER.
    //      FOR PRODUCTION, USE A BACKEND SERVER TO HANDLE API REQUESTS SECURELY.
    //
    // --- 🚨🚨🚨 CRITICAL SECURITY WARNING! 🚨🚨🚨 ---
    const GEMINI_API_KEY = "AIzaSyDhjiUhx-GxdALe-PWgY2cb5tJwXBrGgok"; // <<< YOUR API KEY IS HERE! INSECURE!

    // The model from your curl example was gemini-2.0-flash.
    // Using gemini-1.5-flash-latest as a good general default.
    // You can change this to 'gemini-pro' or 'models/gemini-2.0-flash'
    const MODEL_NAME = "gemini-1.5-flash-latest"; // Or "gemini-pro", or "models/gemini-2.0-flash" from your curl
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;


    function addMessage(text, sender, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');

        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('avatar', sender === 'user' ? 'user-avatar' : 'ai-avatar');
        avatarDiv.textContent = sender === 'user' ? 'U' : 'AI';

        const textDiv = document.createElement('div');
        textDiv.classList.add('text');

        if (isLoading) {
            textDiv.innerHTML = `<div class="loading-dots"><span></span><span></span><span></span></div>`;
        } else {
            textDiv.innerHTML = text.replace(/\n/g, '<br>'); // Basic Markdown for newlines
        }
        
        messageDiv.appendChild(sender === 'user' ? textDiv : avatarDiv);
        messageDiv.appendChild(sender === 'user' ? avatarDiv : textDiv);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }

    async function getAiResponse(prompt) {
        if (!GEMINI_API_KEY) { // This check is a bit redundant now but good practice
            addMessage("API Key not configured.", "ai");
            console.error("API Key not configured.");
            return;
        }

        const loadingMessageDiv = addMessage("", "ai", true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    // Optional: Add safety settings or generation config if needed
                    // "safetySettings": [
                    //   { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
                    // ],
                    // "generationConfig": {
                    //   "temperature": 0.7, "maxOutputTokens": 2048
                    // }
                })
            });

            loadingMessageDiv.remove();

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: "Unknown API error when parsing error response" } }));
                console.error("API Error Response:", errorData);
                addMessage(`Error: ${response.status} - ${errorData.error?.message || response.statusText || 'Failed to fetch response'}`, "ai");
                return;
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0 &&
                data.candidates[0].content && data.candidates[0].content.parts &&
                data.candidates[0].content.parts.length > 0) {
                const aiText = data.candidates[0].content.parts[0].text;
                addMessage(aiText, "ai");
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                const reason = data.promptFeedback.blockReason;
                const safetyRatingsInfo = data.promptFeedback.safetyRatings ? data.promptFeedback.safetyRatings.map(r => `${r.category}: ${r.probability}`).join(', ') : 'No safety ratings info.';
                addMessage(`Your prompt was blocked. Reason: ${reason}. Ratings: ${safetyRatingsInfo}`, "ai");
                console.warn("Prompt blocked by API:", data.promptFeedback);
            } else {
                console.error("Unexpected API response structure:", data);
                addMessage("Sorry, I received an unexpected response from the AI.", "ai");
            }

        } catch (error) {
            if (loadingMessageDiv && loadingMessageDiv.parentNode) {
                loadingMessageDiv.remove();
            }
            console.error("Error sending message (network or other):", error);
            addMessage(`An error occurred: ${error.message}. Please check the console.`, "ai");
        }
    }

    sendButton.addEventListener('click', () => {
        const prompt = userInput.value.trim();
        if (prompt) {
            addMessage(prompt, "user");
            getAiResponse(prompt);
            userInput.value = '';
        }
    });

    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });
});