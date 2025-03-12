import { NGram } from 'https://cdnjs.cloudflare.com/ajax/libs/ngram/2.0.0/ngram.min.js'; 

const corpus = "this is some ssample text for training"; //can be expanded for better predicitions

const ngramModel =  newNGram (corpus, {n:2}); //creates new ngram model

export function getSuggestions(input) {
    const predictions = ngramModel.predict(input); //predicition based on input 
    return predictions.slice(0, 10);
}