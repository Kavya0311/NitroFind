/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from '@google/genai';

import './index.css';

// Type definitions
interface HealthySwap {
  originalIngredient: string;
  suggestedSwap: string;
}

interface Recipe {
  recipeName: string;
  description: string;
  ingredients: string[];
  instructions: string;
  protein: string;
  carbohydrates: string;
  fat: string;
  diabeticFriendly: boolean;
  healthCoachNotes: string;
  healthySwaps: HealthySwap[];
  healthBenefits: string[];
}

// Filter constants
const dietFilters = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'non-veg', label: 'Non-Veg' },
  { id: 'chaat', label: 'Chaat' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'keto', label: 'Keto' },
];

const healthFilters = [
    { id: 'diabetic-friendly', label: 'Diabetic Friendly' },
    { id: 'low-carb', label: 'Low-Carb' },
    { id: 'low-fat', label: 'Low-Fat' },
    { id: 'high-protein', label: 'High-Protein' },
    { id: 'heart-healthy', label: 'Heart-Healthy' },
    { id: 'low-sodium', label: 'Low-Sodium' },
    { id: 'dairy-free', label: 'Dairy-Free' },
];

// Speech Recognition API setup
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

// --- Cooking Assistant Component ---
interface ConversationTurn {
  speaker: 'user' | 'ai';
  text: string;
}

const CookingAssistant: React.FC<{
  instructions: string[];
  recipeName: string;
  onClose: () => void;
}> = ({ instructions, recipeName, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // --- Text-to-Speech Logic ---
  const speak = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel(); // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    speak(`Step ${currentStep + 1}. ${instructions[currentStep]}`);
  }, [currentStep]);
  
  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // --- Core Assistant Logic ---
  const askAssistant = async (question: string) => {
    if (!question.trim()) return;
    
    setConversation(prev => [...prev, { speaker: 'user', text: question }]);
    setAssistantLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const prompt = `You are a helpful AI cooking assistant. The user is currently making "${recipeName}".
      Here are the full recipe instructions:
      ---
      ${instructions.join('\n')}
      ---
      The user is on this step: "${instructions[currentStep]}"
      The user asks: "${question}"
      
      Please provide a concise and helpful answer to the user's question based on the recipe context.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      setConversation(prev => [...prev, { speaker: 'ai', text: response.text }]);
      speak(response.text);

    } catch (e) {
      console.error("Assistant failed:", e);
      const errorMsg = "Sorry, I couldn't process that question. Please try again.";
      setConversation(prev => [...prev, { speaker: 'ai', text: errorMsg }]);
      speak(errorMsg);
    } finally {
      setAssistantLoading(false);
    }
  };
  
  // --- Event Handlers ---
  const handleListen = () => {
    if (!recognition || isListening) return;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const currentTranscript = event.results[0][0].transcript;
      setUserInput(currentTranscript);
      askAssistant(currentTranscript);
    };
    recognition.onspeechend = () => recognition.stop();
    recognition.onend = () => {
        setIsListening(false);
        setUserInput('');
    };
    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
    };
    
    recognition.start();
  };

  const handleSendText = () => {
    askAssistant(userInput);
    setUserInput('');
  }

  return (
    <div className="assistant-modal">
        <div className="assistant-content">
            <header className="assistant-header">
                <h2>{recipeName}</h2>
                <div className="assistant-controls">
                    <button onClick={() => setIsMuted(m => !m)} className="mute-btn">{isMuted ? '🔊' : '🔇'}</button>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
            </header>
            
            <section className="current-step-display">
                <p className="step-label">Step {currentStep + 1} of {instructions.length}</p>
                <p className="step-text">{instructions[currentStep]}</p>
            </section>
            
            <div className="step-navigation">
                <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}>Previous Step</button>
                <button onClick={() => setCurrentStep(s => Math.min(instructions.length - 1, s + 1))} disabled={currentStep === instructions.length - 1}>Next Step</button>
            </div>

            <section className="conversation-log">
                {conversation.map((turn, index) => (
                    <div key={index} className={`message ${turn.speaker}-message`}>
                        <p>{turn.text}</p>
                    </div>
                ))}
                {assistantLoading && <div className="message ai-message"><div className="spinner-small"></div></div>}
                 <div ref={conversationEndRef} />
            </section>

            <footer className="assistant-input-area">
                <button onClick={handleListen} disabled={isListening || !recognition} className={`mic-btn ${isListening ? 'listening' : ''}`}>🎤</button>
                <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendText()} placeholder={isListening ? 'Listening...' : "Ask a question or type here..."} disabled={isListening}/>
                <button onClick={handleSendText} disabled={!userInput.trim()}>Send</button>
            </footer>
        </div>
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [ingredients, setIngredients] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [instructionSteps, setInstructionSteps] = useState<string[]>([]);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [assistantActive, setAssistantActive] = useState(false);

  const handleFilterChange = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const generateImage = async (recipeData: Recipe) => {
    setImageLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A professional, delicious, and highly detailed food photograph of "${recipeData.recipeName}". ${recipeData.description}`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      });
      const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
      setRecipeImage(imageUrl);
    } catch (e) {
      console.error('Image generation failed:', e);
    } finally {
      setImageLoading(false);
    }
  };

  const generateRecipe = async () => {
    if (!ingredients.trim()) {
      setError('Please enter some ingredients.');
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);
    setRecipeImage(null);
    setAssistantActive(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const recipeSchema = {
        type: Type.OBJECT,
        properties: {
          recipeName: { type: Type.STRING },
          description: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.STRING, description: "A string of markdown-formatted, numbered instructions." },
          protein: { type: Type.STRING },
          carbohydrates: { type: Type.STRING },
          fat: { type: Type.STRING },
          diabeticFriendly: { type: Type.BOOLEAN },
          healthCoachNotes: { type: Type.STRING, description: "A brief note explaining why the dish is or isn't suitable for diabetics, and other health insights." },
          healthySwaps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalIngredient: { type: Type.STRING },
                suggestedSwap: { type: Type.STRING },
              },
              required: ['originalIngredient', 'suggestedSwap'],
            },
            description: "An array of objects suggesting healthier ingredient swaps."
          },
          healthBenefits: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of key health benefits of consuming this dish."
          },
        },
        required: [
          'recipeName', 'description', 'ingredients', 'instructions', 'protein',
          'carbohydrates', 'fat', 'diabeticFriendly', 'healthCoachNotes', 'healthySwaps',
          'healthBenefits'
        ],
      };
      
      const filterText = selectedFilters.length > 0 ? selectedFilters.join(', ') : 'any';
      const prompt = `Generate a creative, delicious, and healthy recipe with the following characteristics:
      - Must use these ingredients: ${ingredients}.
      - Must adhere to these filters: ${filterText}.
      - Provide nutritional estimates (protein, carbs, fat).
      - Explicitly state if it's suitable for a diabetic person.
      - Provide health coach notes and suggestions for healthy ingredient swaps.
      - List the key health benefits of the dish.
      - Instructions should be a markdown formatted string with numbered steps.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: recipeSchema },
      });

      const recipeJson = JSON.parse(response.text);
      setRecipe(recipeJson);

      // Parse instructions for the assistant
      const steps = recipeJson.instructions.split('\n').filter((line: string) => /^\d+\./.test(line.trim()));
      setInstructionSteps(steps);
      
      generateImage(recipeJson);
    } catch (e) {
      console.error(e);
      setError('Sorry, something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderFilterGroup = (filters: {id: string, label: string}[], title: string) => (
    <fieldset className="filter-group">
        <legend>{title}</legend>
        <div className="filter-options">
            {filters.map(filter => (
                <div key={filter.id} className="filter-checkbox">
                    <input type="checkbox" id={filter.id} value={filter.id} checked={selectedFilters.includes(filter.id)} onChange={() => handleFilterChange(filter.id)} disabled={loading}/>
                    <label htmlFor={filter.id}>{filter.label}</label>
                </div>
            ))}
        </div>
    </fieldset>
  );

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>🍳 AI Recipe Health Coach</h1>
        <p>Get healthy recipes, nutritional info, and diet-specific advice!</p>
      </header>
      <div className="input-section">
        <div className="input-group">
          <label htmlFor="ingredients-input">Your Ingredients</label>
          <textarea id="ingredients-input" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="e.g., chicken breast, quinoa, broccoli, lemon" rows={3} aria-label="Ingredients" disabled={loading}/>
        </div>
        <div className="filters-container">
          {renderFilterGroup(dietFilters, "Dietary Preferences")}
          {renderFilterGroup(healthFilters, "Health Focus")}
        </div>
        <button onClick={generateRecipe} disabled={loading}>{loading ? 'Generating...' : 'Generate Healthy Recipe'}</button>
      </div>
      {loading && <div className="loading-container" aria-live="polite"><div className="spinner"></div><p>Finding the perfect healthy recipe...</p></div>}
      {error && <div className="error-message" role="alert">{error}</div>}
      {recipe && (
        <article className="recipe-card" aria-live="polite">
          {imageLoading && <div className="image-loading-container"><div className="spinner"></div><p>Plating your dish...</p></div>}
          {recipeImage && !imageLoading && <img src={recipeImage} alt={recipe.recipeName} className="recipe-image" />}
          <h2>{recipe.recipeName}</h2>
          <p className="description">{recipe.description}</p>
          <section className="nutrition-facts"><h3>Nutrition Facts (per serving)</h3><div className="nutrition-values"><div className="nutrition-item"><span className="value">{recipe.protein}</span><span className="label">Protein</span></div><div className="nutrition-item"><span className="value">{recipe.carbohydrates}</span><span className="label">Carbs</span></div><div className="nutrition-item"><span className="value">{recipe.fat}</span><span className="label">Fat</span></div></div></section>
          <section className={`health-coach-insights ${recipe.diabeticFriendly ? 'friendly' : 'caution'}`}><h3>Health Coach Insights</h3><p><strong>Diabetic Friendly:</strong> {recipe.diabeticFriendly ? 'Yes' : 'No'}</p><p>{recipe.healthCoachNotes}</p></section>
          {recipe.healthySwaps && recipe.healthySwaps.length > 0 && <section className="healthy-swaps"><h3>Healthy Swap Suggestions</h3><ul>{recipe.healthySwaps.map((swap, index) => (<li key={index}><strong>Instead of {swap.originalIngredient}:</strong> try {swap.suggestedSwap}</li>))}</ul></section>}
          {recipe.healthBenefits && recipe.healthBenefits.length > 0 && <section className="health-benefits"><h3>Health Benefits</h3><ul>{recipe.healthBenefits.map((benefit, index) => (<li key={index}>{benefit}</li>))}</ul></section>}
          <section><h3>Ingredients</h3><ul>{recipe.ingredients.map((ingredient, index) => (<li key={index}>{ingredient}</li>))}</ul></section>
          <section><h3>Instructions</h3><div className="instructions" dangerouslySetInnerHTML={{ __html: (window as any).marked.parse(recipe.instructions) }} /></section>
          
          {instructionSteps.length > 0 && (
            <div className="assistant-launcher">
              <button onClick={() => setAssistantActive(true)} className="assistant-btn">Start Cooking Assistant</button>
            </div>
          )}
        </article>
      )}
       {assistantActive && <CookingAssistant instructions={instructionSteps} recipeName={recipe!.recipeName} onClose={() => setAssistantActive(false)} />}
    </main>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);