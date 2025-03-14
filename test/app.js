// app.js

// Initialize NGram model
const corpus = "this is some sample text for training text prediction purposes";
const ngramModel = new NGram(corpus, { n: 2 }); // Bigram model

// Input and suggestions UI
const inputText = document.getElementById("inputText");
const suggestionsDiv = document.getElementById("suggestions");

// Function to generate word suggestions
function getSuggestions(input) {
  if (!input.trim()) {
    suggestionsDiv.innerHTML = '';
    return; // If input is empty, clear suggestions
  }

  // Process the input text using Compromise NLP library
  const doc = nlp(input);
  const inputWords = doc.terms().out('array'); // Get array of words
  
  const lastWord = inputWords[inputWords.length - 1]?.toLowerCase();
  const previousWord = inputWords[inputWords.length - 2]?.toLowerCase();

  // Start with NGram model suggestions
  let ngramSuggestions = [];
  if (lastWord) {
    const ngramResults = ngramModel.suggest(lastWord, 5); // Get top 5 predictions for the last word
    ngramSuggestions = ngramResults.map(result => result.word);
  }

  // Use Compromise to match words from the corpus based on the input's last word
  const matches = nlp(corpus).match(`${lastWord}*`).out("array");
  const compromiseSuggestions = matches.filter(word => word !== lastWord);

  // Combine NGram and Compromise suggestions
  const allSuggestions = [...new Set([...ngramSuggestions, ...compromiseSuggestions])];

  // Show suggestions in the UI
  showSuggestions(allSuggestions);
}

// Function to display the suggestions
function showSuggestions(suggestions) {
  suggestionsDiv.innerHTML = '';
  suggestions.forEach(suggestion => {
    const suggestionDiv = document.createElement('div');
    suggestionDiv.textContent = suggestion;
    suggestionDiv.addEventListener('click', () => {
      inputText.value += suggestion + " ";
      getSuggestions(inputText.value); // Refresh suggestions
    });
    suggestionsDiv.appendChild(suggestionDiv);
  });
}

// Listen for user input and update suggestions
inputText.addEventListener('input', (event) => {
  getSuggestions(event.target.value);
});
