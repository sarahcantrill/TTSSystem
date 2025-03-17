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

    //all of the words for the model
    const allWords = Object.values(categoryWords).flat();

    //itialising tensor flow
    async function initTensorFLow() {
        try {
            allWords.forEach((word, index) => { //create word indices
                wordIndex[word] = index + 1; //potetially make lower case later
                reverseWordIndex[index + 1] = word; //potetially make lower case later
            });
            
            model = tf.sequential(); //imple sequential model

            model.add(tf.layers.embedding({ //layers
                inputDim: Object.keys(wordIndex).length + 1, //input dimension
                outputDim: 16, //output dimension
                inputLength: 3
            }));

            model.add(tf.layers.flatten());

            model.add(tf.layers.dense({
                units: 32,
                activation: 'relu'
            }));

            model.add(tf.layers.dense({
                units: Object.keys(wordIndex).length + 1,
                activation: 'softmax'
            }));

            model.compile({ //compile model
                optimizer: 'adam',
                loss: 'sparseCategoricalCrossentropy',
                metrics: ['accuracy']
            });

            await trainModel();//train model with basic patterns

            tfLoaded = true;
            statusMessage.textContent = "TensorFlow model loaded successfully!";
            setTimeout(() => {
                statusMessage.textContent = "";
            }, 3000);
        } catch (error) {
            console.error("Error initializing TensorFlow:", error);
            statusMessage.textContent = "Error loading TensorFlow model. Using fallback suggestions.";
        }
    }

    async function trainModel() { //train model with basic patterns
        const sequences = []; //create trainging data from langauge model
        const nextWords = [];

        for (const [word, predictions] of Object.entries(languageModel)) {
            const wordIdx = wordIndex[word.toLowerCase()] || 0;
            
            predictions.forEach(nextWord => {
                const nextWordIdx = wordIndex[nextWord.toLowerCase()] || 0;
                if (nextWordIdx > 0) {
                    sequences.push([0, 0, wordIdx]); //sewquence of 3 words w padding 
                    nextWords.push(nextWordIdx);
                }
            });
        }

        const xs = tf.tensor2d(sequences); //convert to tensors
        const ys = tf.tensor1d(nextWords, 'int32');

        await model.fit(xs, ys, { //train model
            epochs: 50,
            batchSize: 8,
            shuffle: true,
            verbose: 0
        });

        xs.dispose(); //clean tensors
        ys.dispose();

        function getWordSuggestions() { //suggestion based on input
            const text = textOutput.value.trim().split(' ');
            
            if (!text) { //if empty suggest starters
                return categoryWords.starters.slice(0, 5);
            }

                const words = text.split(/\s+/); //get last word
                const lastWord = words[words.length - 1].toLowerCase();
                const lastCompleteWord = words.length > 1 ? words[words.length - 2].toLowerCase() : '';
                
                if (lastWord && languageModel[lastWord]) { //if there is a specific prediciton from language model
                    return languageModel[lastWord].slice(0, 5);
                }

                if (lastCompleteWord && languageModel[lastCompleteWord]) { // if there is a specific predicition for the last complete word
                    return languageModel[lastCompleteWord].slice(0, 5);
                }

                if (tfLoaded && model) { //use tensorflow 
                    try {
                        const lastThreeWords = words.slice(-3).map(w => { //get the last 3 words or whatever is available if theres not enough 
                            return wordIndex[w.toLowerCase()] || 0;
                        });
                        
                        while (lastThreeWords.length < 3) { //ensure three inputs
                            lastThreeWords.unshift(0);
                        }
                        
                        const input = tf.tensor2d([lastThreeWords]); //make prediction
                        const prediction = model.predict(input);
                        const values = prediction.dataSync();
                        
                        const indices = Array.from(values) //get top 10 predicitions
                            .map((value, index) => ({ value, index }))
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 10)
                            .map(item => item.index)
                            .filter(index => index > 0);//filter padding
                        
                        const suggestions = indices.map(index => reverseWordIndex[index]) //convert indices to words 
                            .filter(word => word) //undefined filtered out
                         //   .map(word => word.charAt(0).toUpperCase() + word.slice(1)); // Capitalize
                        
                        input.dispose(); //clean tensors
                        prediction.dispose();
                        
                        if (suggestions.length > 0) {
                            return suggestions;
                        }
                    } catch (error) {
                        console.error("error making prediction:", error);
                    }
            }
        }

        async function updateSuggestions() { //next word suggestions updated
            nextWordSuggestions.innerHTML = '';
            const text = textOutput.value.trim();
            const predictions = await predictNextWords(text); //get predcitions from the tensor flow model
            
            if (predictions && predictions.length > 0) {
                addSuggestionButtons(predictions);//use tensor flow predicitions 
            } else {
                const words = text.toLowerCase().trim().split(/\s+/); //fallbck to rules based predicitions
                const lastWord = words[words.length - 1];
                
                if (commonFollowUps[lastWord]) { 
                    addSuggestionButtons(commonFollowUps[lastWord]); //if there are specific follow ups 
                } else if (words.length > 3) {
                    addSuggestionButtons(sentenceEndings); //suggest sentence endings if more than 3 words
                } else {
                    addSuggestionButtons(['and', 'the', 'to', 'with', 'for']); //default
                }
            }
        }

        function addSuggestionButtons(words) { //add suggestion buttons
            words.forEach(word => {
                const button = document.createElement('button');
                button.textContent = word;
                button.addEventListener('click', () => {
                    addWord(word);
                    showStatus(`Added: "${word}"`);
                });
                nextWordSuggestions.appendChild(button);
            });
        }
        


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
     }

    // generateButtons('');

});


