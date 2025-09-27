# 🍳 AI Recipe Health Coach

AI Recipe Health Coach is an intelligent web application that transforms your available ingredients into delicious, healthy recipes complete with nutritional information, health-conscious filters, AI-generated images, and a voice-powered cooking assistant to guide you every step of the way.

## ✨ Key Features

*   **Ingredient-Based Recipe Generation**: Simply list the ingredients you have, and the AI will create a unique recipe for you.
*   **Advanced Filtering**: Tailor your recipe search with a wide range of filters:
    *   **Dietary Preferences**: Vegetarian, Vegan, Non-Veg, Chaat, Gluten-Free, Keto.
    *   **Health Focus**: Diabetic Friendly, Low-Carb, Low-Fat, High-Protein, Heart-Healthy, Low-Sodium, Dairy-Free.
*   **AI-Generated Imagery**: Each recipe is paired with a stunning, AI-generated image of the final dish, created by the Imagen model.
*   **Comprehensive Health Insights**:
    *   **Nutrition Facts**: Get estimates for protein, carbohydrates, and fat content per serving.
    *   **Health Coach Notes**: Receive personalized advice, including whether a dish is diabetic-friendly.
    *   **Healthy Swaps**: Get intelligent suggestions for healthier ingredient substitutions.
    *   **Health Benefits**: Understand the specific benefits of consuming the dish based on its ingredients.
*   **Interactive AI Cooking Assistant**:
    *   **Step-by-Step Guidance**: Follow instructions one step at a time in a clean, focused interface.
    *   **Voice & Text Commands**: Ask questions about techniques, substitutions, or timing using your voice or by typing.
    *   **Text-to-Speech (TTS)**: The assistant reads instructions and answers aloud, offering a hands-free cooking experience.
    *   **Conversation History**: Keep track of your questions and the AI's answers.

## 🚀 Technologies Used

*   **Frontend**: React, TypeScript, HTML5, CSS3
*   **AI & Machine Learning**:
    *   **Google Gemini API (`gemini-2.5-flash`)**: For recipe generation, nutritional analysis, and assistant responses.
    *   **Google Gemini API (`imagen-4.0-generate-001`)**: For generating realistic recipe images.
*   **Browser APIs**:
    *   **Web Speech API (`SpeechRecognition`)**: For voice-to-text input.
    *   **Web Speech API (`SpeechSynthesis`)**: For text-to-speech output.
*   **Libraries**:
    *   **Marked.js**: To safely render recipe instructions formatted in Markdown.

## 🔧 Setup and Running the Project

This project is a self-contained web application that runs entirely in the browser.

### Prerequisites

You must have a valid Google Gemini API key to use this application.

### Configuration

The application is configured to use an API key from an environment variable (`process.env.API_KEY`). You need to ensure this variable is available in the environment where you deploy or run the application.

**Note**: Do not hardcode your API key directly into the source code.

### Running

Simply open the `index.html` file in a modern web browser that supports the Web Speech API (like Google Chrome, Firefox, or Edge).

## 📂 Project Structure

```
.
├── index.html       # The main HTML entry point
├── index.css        # All styling for the application and components
├── index.tsx        # The core React application logic, components, and API calls
├── metadata.json    # Application metadata
└── README.md        # This file
```

## 💡 How It Works

1.  **User Input**: The user enters ingredients and selects dietary/health filters.
2.  **API Request**: An API call is made to the Gemini API (`gemini-2.5-flash`) with a detailed prompt and a strict JSON schema defining the desired output (recipe, nutrition, health notes, etc.).
3.  **Process Response**: The application parses the structured JSON response from the API.
4.  **Image Generation**: A second API call is made to the Imagen model to generate a high-quality image based on the recipe's name and description.
5.  **Render UI**: The complete recipe, including the image and all health data, is displayed to the user.
6.  **Launch Assistant**: The user can optionally start the AI Cooking Assistant, which uses the recipe context and the Web Speech APIs to provide interactive, voice-guided cooking support.

## 🔮 Future Enhancements

*   **Save Favorite Recipes**: Allow users to save and view their favorite generated recipes.
*   **Shopping List Generation**: Automatically create a shopping list from a recipe's ingredients.
*   **Multi-Language Support**: Add support for multiple languages in the UI and the cooking assistant.
*   **Calorie Tracking**: Integrate with health apps to track calories and macros.
