//alert("script.js loaded");
import { getSuggestions } from "/src/models/ngramModel.js";

document.addEventListener("DOMContentLoaded", () => {
    const wordboxes = document.querySelectorAll(".word-box");
    const textOutput = document.getElementById("text-output");
    const resetButton = document.querySelector(".reset-btn");
    const undoButton = document.querySelector(".undo-btn");
    const predictionsButton = document.querySelector(".button-container");

    //words clicked means they are added to the container
    wordboxes.forEach(button => {
        button.addEventListener("click", function () {
           // addWord(this.text)
           textOutput.value += this.textContent + " ";
        });
    });

    //reset button
    resetButton.addEventListener("click", () => {
        textOutput.value = "";
    });

    //undo button
    undoButton.addEventListener("click", () => {
        let wordLength = textOutput.value.trim().split(" ");
        wordLength.pop(); //remove the last word 
        textOutput.value = wordLength.join(" ") + " ";
    });

    //event listener for input fiels to generate suggestions
    document.getElementById('text-output').addEventListener('input', function () {
        const userInput = this.value;
        generateButtons(userInput);
    })

    //function for word suggestion buttons generation
    function generateButtons(input) {
        predictionsButton.innerHTML ='';
        const suggestions = getSuggestions(input);

        suggestions.forEach(word => {
            const button = document.createElement('button');
            button.textContent = word;
            button.onclick = () => insertWord(word);
            predictionsButton.appendChild(button);

        });
    }

    //function to input predicitice button text into text input box 
    function insertWord(word) {
        textOutput.value += word + " ";
        generateButtons(textOutput.value);
    }

    generateButtons('');

});


