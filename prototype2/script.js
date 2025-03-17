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

    const categoryWords = {
        'starters': ['I', 'You', 'We', 'They', 'He', 'She', 'It', 'Please', 'Today', 'Could', 'Would'],
        'questions': ['who', 'what', 'when', 'where', 'why', 'can I', 'could you', 'please', 'do you', 'Could', 'Would', 'is it' ],
        'responses': ['yes', 'no', 'maybe', 'sort of', 'I agree', 'I disagree', 'I understand', 'I dont understand', 'I need help', 'good idea', 'can you explain more', 'Ill let you know' ],
        'subjects': ['I', 'you', 'we', 'his', 'she', 'hers', 'they', 'them', 'their', 'it', 'the group' ],
        'verbs': ['am', 'is', 'are', 'was', 'were', 'have', 'need', 'want', 'like', 'think', 'know', 'understand', 'finished'],
        'common': ['and', 'or', 'but', 'because', 'with', 'without', 'to', 'from', 'in', 'on', 'at', 'by', 'for']
    };

    //language model for word predictions
    const languageModel = {
        'I': ['am', 'have', 'need', 'want', 'think', 'would', 'could', 'will', 'feel', 'don\'t'],
        'We': ['are', 'have', 'need', 'want', 'should', 'could', 'will', 'must', 'don\'t', 'can'],
        'The': ['teacher', 'class', 'book', 'assignment', 'question', 'answer', 'test', 'person', 'doctor'],
        'My': ['name', 'question', 'answer', 'book', 'pencil', 'notebook', 'desk', 'teacher', 'friend'],
        'Please': ['help', 'explain', 'show', 'tell', 'give', 'let', 'try', 'understand', 'know', 'see'],
        'am': ['feeling', 'going', 'trying', 'looking', 'thinking', 'working', 'studying', 'learning', 'asking'],
        'is': ['the', 'a', 'my', 'your', 'this', 'that', 'it', 'there', 'here', 'important'],
        'are': ['you', 'we', 'they', 'there', 'these', 'those', 'the', 'my', 'your', 'our'],
        'need': ['help', 'to', 'a', 'some', 'more', 'less', 'your', 'my', 'this', 'that'],
        'want': ['to', 'a', 'some', 'more', 'less', 'your', 'my', 'this', 'that', 'it'],
        'What': ['is', 'are', 'do', 'does', 'did', 'can', 'should', 'would', 'will', 'happened'],
        'Where': ['is', 'are', 'do', 'does', 'did', 'can', 'should', 'would', 'will', 'should'],
        'When': ['is', 'are', 'do', 'does', 'did', 'can', 'should', 'would', 'will', 'should'],
        'Why': ['is', 'are', 'do', 'does', 'did', 'can', 'should', 'would', 'will', 'not'],
        'How': ['is', 'are', 'do', 'does', 'did', 'can', 'should', 'would', 'will', 'much']
    };

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


