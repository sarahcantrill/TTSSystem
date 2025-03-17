document.addEventListener("DOMContentLoaded", () => {
    const wordboxes = document.querySelectorAll(".word-box");
    const textOutput = document.getElementById("text-output");
    const resetButton = document.querySelector(".reset-btn");
    const undoButton = document.querySelector(".undo-btn");
    const predictionsButton = document.querySelector(".button-container");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    //undo functionality
    let textHistory = [''];
    let currentHistoryIndex = 0;

    //tensor flow vars
    let wordIndex = {};
    let reverseWordIndex = {};
    let model = null;
    let tfLoaded = false;
    let tf = window.tf; //declare tensorflow var 

    


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

    //tab switching 
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            //get rid of active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            //add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    //useless js
    //event listener for input fiels to generate suggestions
    // document.getElementById('text-output').addEventListener('input', function () {
    //     const userInput = this.value;
    //     generateButtons(userInput);
    // })

    // //function for word suggestion buttons generation
    // function generateButtons(input) {
    //     predictionsButton.innerHTML ='';
    //     const suggestions = getSuggestions(input);

    //     suggestions.forEach(word => {
    //         const button = document.createElement('button');
    //         button.textContent = word;
    //         button.onclick = () => insertWord(word);
    //         predictionsButton.appendChild(button);

    //     });
    // }

    // //function to input predicitice button text into text input box 
    // function insertWord(word) {
    //     textOutput.value += word + " ";
    //     generateButtons(textOutput.value);
    // }

    // generateButtons('');

});


