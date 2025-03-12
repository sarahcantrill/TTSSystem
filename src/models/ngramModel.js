//import { NGram } from 'https://cdnjs.cloudflare.com/ajax/libs/ngram/2.0.0/ngram.min.js'; 
import nlp from "compromise";

const corpus = "this is some ssample text for training"; //can be expanded for better predicitions

//const ngramModel =  newNGram (corpus, {n:2}); //creates new ngram model

export function getSuggestions(input) {
    if (!input.trim()) return [];

    const doc = nlp(corpus); //predicition based on input 
    const words = doc
        .terms()
        .filter(term => term.text.toLowerCase().startsWith(input.toLowerCase()))
        .out('array')

        return words.slice(0, 10);
}