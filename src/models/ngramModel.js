//import { NGram } from 'https://cdnjs.cloudflare.com/ajax/libs/ngram/2.0.0/ngram.min.js'; 
//import nlp from "compromise";

const corpus = "this is some ssample text for training"; //can be expanded for better predicitions

//const ngramModel =  newNGram (corpus, {n:2}); //creates new ngram model

//creating a biagram
const bigramModel = {}
const words = corpus.split(" ")
for (let i = 0; i < words.length - 1; i++) {
  const currentWord = words[i]
  const nextWord = words[i + 1]

  if (!bigramModel[currentWord]) {
    bigramModel[currentWord] = []
  }
  bigramModel[currentWord].push(nextWord)
}

export function getSuggestions(input) {
  const corpusWords = "this is some sample text for training the model to provide better word suggestions based on context and frequency of words in natural language".split(" ");
  if (!input.trim()) {
      // Return default suggestions when input is empty
      return corpusWords.slice(0, 10);
  }
    const doc = nlp(input); //predicition based on input 
   //  const words = doc.terms().out('array'); //MAY NEED TO IMPLEMENT BACK 
   // const suggestions = words.filter(term => term.text.toLowerCase().startsWith(input.toLowerCase())).out('array');

    const inputWords = input.trim().split(" ")
    const lastWord = words[words.length - 1].toLowerCase(); 
    const previousWord = inputWords.length > 1 ? inputWords[inputWords.length - 2].toLowerCase() : null
    const suggestions = corpusWords.filter(word => word.toLowerCase().startsWith(lastWord));


      if (!lastWord) {
        // Return default suggestions if no word is present
        return corpusWords.slice(0, 10);
    }

        console.log('Input received:', input);
        console.log('Suggestions:', words);

        return suggestions.slice(0, 10);
}