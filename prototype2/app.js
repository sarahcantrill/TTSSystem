document.addEventListener("DOMContentLoaded", () => {
    const wordboxes = document.querySelectorAll(".word-box");
    const textOutput = document.getElementById("text-output");
    const resetButton = document.querySelector(".reset-btn");
    const undoButton = document.querySelector(".undo-btn");
    const nextWordSuggestions = document.getElementById("nextWordSuggestions");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    if (!textOutput || !resetButton || !undoButton || !nextWordSuggestions || !tabButtons.length || !tabContents.length) {
        console.error("One or more elements are missing from the DOM.");
        return;
    }

    console.log("All elements selected correctly.");

    // Undo functionality
    let textHistory = [''];
    let currentHistoryIndex = 0;

    // TensorFlow vars
    let wordIndex = {};
    let reverseWordIndex = {};
    let model = null;
    let tfLoaded = false;
    let tf = window.tf; // Declare TensorFlow var

    //expnaded word lists with common words 
    const commonEnglishWords = [
        // Basic words (existing)
        'I', 'you', 'we', 'they', 'he', 'she', 'it', 'am', 'is', 'are', 'was', 'were',
        'the', 'a', 'an', 'and', 'but', 'or', 'because', 'if', 'when', 'where', 'how', 'what', 'why',
        'to', 'in', 'on', 'at', 'by', 'with', 'of', 'for', 'from', 'about',
        
        // verbs
        'have', 'has', 'had', 'do', 'does', 'did', 'go', 'goes', 'went', 'say', 'says', 'said',
        'get', 'gets', 'got', 'make', 'makes', 'made', 'know', 'knows', 'knew', 'think', 'thinks', 'thought',
        'take', 'takes', 'took', 'see', 'sees', 'saw', 'come', 'comes', 'came', 'want', 'wants', 'wanted',
        'use', 'uses', 'used', 'find', 'finds', 'found', 'give', 'gives', 'gave', 'tell', 'tells', 'told',
        'work', 'works', 'worked', 'call', 'calls', 'called', 'try', 'tries', 'tried', 'ask', 'asks', 'asked',
        'need', 'needs', 'needed', 'feel', 'feels', 'felt', 'become', 'becomes', 'became', 'like', 'likes', 'liked',
        
        // nouns
        'time', 'year', 'people', 'way', 'day', 'man', 'woman', 'child', 'children', 'world',
        'life', 'hand', 'part', 'eye', 'place', 'work', 'week', 'case', 'point', 'government',
        'company', 'number', 'group', 'problem', 'fact', 'be', 'person', 'school', 'morning', 'evening',
        
        // adjectives
        'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old',
        'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important',
        'few', 'public', 'bad', 'same', 'able', 'best', 'better', 'happy', 'sad', 'tired',
        
        // time words
        'today', 'tomorrow', 'yesterday', 'now', 'later', 'soon', 'never', 'always', 'sometimes', 'often',
        
        // question words (expanded)
        'who', 'whom', 'whose', 'which', 'whatever', 'whichever', 'whoever', 'whomever',
        
        // prepositions (expanded)
        'through', 'between', 'among', 'across', 'after', 'before', 'during', 'until', 'against', 'into',
        
        // common phrases for AAC users
        'help me', 'thank you', 'please', 'I need', 'I want', 'I feel', 'can you', 'could you',
        'bathroom', 'hungry', 'thirsty', 'tired', 'pain', 'uncomfortable', 'medicine', 'doctor',
        'too hot', 'too cold', 'yes please', 'no thanks', 'not sure', 'maybe', 'definitely',
        'family', 'friend', 'nurse', 'caregiver', 'appointment', 'schedule', 'visit', 'call'
    ];

    const categoryWords = {
        'starters': ['I', 'You', 'We', 'They', 'He', 'She', 'It', 'Please', 'Today', 'Could', 'Would'],
        'questions': ['who', 'what', 'when', 'where', 'why', 'can I', 'could you', 'please', 'do you', 'Could', 'Would', 'is it'],
        'responses': ['yes', 'no', 'maybe', 'sort of', 'I agree', 'I disagree', 'I understand', 'I dont understand', 'I need help', 'good idea', 'can you explain more', 'Ill let you know'],
        'subjects': ['I', 'you', 'we', 'his', 'she', 'hers', 'they', 'them', 'their', 'it', 'the group'],
        'verbs': ['am', 'is', 'are', 'was', 'were', 'have', 'need', 'want', 'like', 'think', 'know', 'understand', 'finished'],
        'common': ['and', 'or', 'but', 'because', 'with', 'without', 'to', 'from', 'in', 'on', 'at', 'by', 'for']
    };

    const improvedLanguageModel = {
        // questions
        'what': ['is', 'are', 'do', 'does', 'did', 'happened', 'time', 'about', 'should', 'can', 'would', 'will'],
        'where': ['is', 'are', 'did', 'do', 'can', 'should', 'will', 'would', 'has', 'have', 'was', 'were'],
        'when': ['is', 'are', 'will', 'did', 'do', 'can', 'should', 'would', 'has', 'have', 'was', 'were'],
        'why': ['is', 'are', 'did', 'do', 'can', 'should', 'would', 'has', 'have', 'was', 'were', 'not'],
        'how': ['is', 'are', 'did', 'do', 'can', 'should', 'would', 'has', 'have', 'was', 'were', 'many', 'much', 'long', 'often', 'about', 'come'],
        
        // pronouns with verbs
        'I': ['am', 'was', 'have', 'had', 'will', 'would', 'can', 'could', 'should', 'need', 'want', 'feel', 'think', 'know', 'like', 'love', 'hate', 'see', 'hear', 'understand'],
        'you': ['are', 'were', 'have', 'had', 'will', 'would', 'can', 'could', 'should', 'need', 'want', 'feel', 'think', 'know', 'like', 'love', 'see', 'hear', 'understand', 'help'],
        'he': ['is', 'was', 'has', 'had', 'will', 'would', 'can', 'could', 'should', 'needs', 'wants', 'feels', 'thinks', 'knows', 'likes', 'loves', 'sees', 'hears', 'understands', 'helps'],
        'she': ['is', 'was', 'has', 'had', 'will', 'would', 'can', 'could', 'should', 'needs', 'wants', 'feels', 'thinks', 'knows', 'likes', 'loves', 'sees', 'hears', 'understands', 'helps'],
        'we': ['are', 'were', 'have', 'had', 'will', 'would', 'can', 'could', 'should', 'need', 'want', 'feel', 'think', 'know', 'like', 'love', 'see', 'hear', 'understand', 'help'],
        'they': ['are', 'were', 'have', 'had', 'will', 'would', 'can', 'could', 'should', 'need', 'want', 'feel', 'think', 'know', 'like', 'love', 'see', 'hear', 'understand', 'help'],
        
        // auxilary verbs
        'can': ['I', 'you', 'we', 'they', 'he', 'she', 'it', 'help', 'see', 'hear', 'go', 'come', 'make', 'take', 'get', 'find', 'tell', 'ask', 'show', 'give'],
        'could': ['I', 'you', 'we', 'they', 'he', 'she', 'it', 'help', 'see', 'hear', 'go', 'come', 'make', 'take', 'get', 'find', 'tell', 'ask', 'show', 'give'],
        'would': ['I', 'you', 'we', 'they', 'he', 'she', 'it', 'like', 'love', 'prefer', 'rather', 'need', 'want', 'help', 'suggest', 'recommend', 'advise'],
        'should': ['I', 'you', 'we', 'they', 'he', 'she', 'it', 'go', 'come', 'make', 'take', 'get', 'find', 'tell', 'ask', 'show', 'give', 'help', 'see', 'hear'],
        
        // common verbs with objects
        'need': ['to', 'a', 'some', 'help', 'assistance', 'support', 'information', 'time', 'water', 'food', 'medicine', 'rest', 'break', 'bathroom', 'doctor'],
        'want': ['to', 'a', 'some', 'more', 'less', 'this', 'that', 'it', 'water', 'food', 'help', 'rest', 'break', 'bathroom', 'medicine'],
        'like': ['to', 'this', 'that', 'it', 'them', 'the', 'a', 'some', 'more', 'less', 'your', 'my', 'his', 'her', 'their'],
        'have': ['a', 'an', 'the', 'some', 'any', 'many', 'more', 'less', 'this', 'that', 'these', 'those', 'to', 'been', 'my', 'your', 'our'],
        
        // articles with nouns
        'a': ['little', 'lot', 'few', 'bit', 'moment', 'second', 'minute', 'day', 'week', 'month', 'year', 'person', 'doctor', 'nurse', 'problem', 'question'],
        'the': ['same', 'other', 'next', 'last', 'first', 'second', 'third', 'doctor', 'nurse', 'bathroom', 'medication', 'medicine', 'pain', 'hospital'],
        
        // adjectives with nouns
        'good': ['morning', 'afternoon', 'evening', 'night', 'day', 'time', 'idea', 'choice', 'decision', 'job', 'work', 'question', 'answer'],
        'bad': ['idea', 'choice', 'decision', 'time', 'day', 'feeling', 'pain', 'reaction', 'situation', 'news'],
        
        // prepositions with context
        'in': ['the', 'my', 'your', 'his', 'her', 'their', 'our', 'a', 'an', 'pain', 'hospital', 'room', 'bed', 'morning', 'afternoon', 'evening', 'night'],
        'on': ['the', 'my', 'your', 'his', 'her', 'their', 'our', 'a', 'an', 'time', 'schedule', 'it', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        
        // time-related chains
        'today': ['I', 'is', 'we', 'at', 'in', 'the', 'morning', 'afternoon', 'evening', 'night', 'will', 'have', 'has', 'feel', 'felt'],
        'tomorrow': ['I', 'is', 'we', 'will', 'at', 'in', 'the', 'morning', 'afternoon', 'evening', 'night', 'would', 'could', 'should', 'might'],
        
        // common AAC-specific chains
        'help': ['me', 'please', 'with', 'this', 'that', 'now', 'soon', 'I', 'need', 'can', 'could', 'you', 'someone'],
        'thank': ['you', 'for', 'your', 'the', 'everyone', 'all', 'so', 'much', 'very'],
        'please': ['help', 'can', 'could', 'would', 'give', 'take', 'bring', 'find', 'tell', 'show', 'me', 'my'],
        
        // ending tokens
        '.': ['I', 'The', 'This', 'That', 'It', 'We', 'They', 'He', 'She', 'You', 'In', 'On', 'At', 'For', 'With', 'About'],
        '?': ['I', 'Can', 'Could', 'Would', 'Should', 'Is', 'Are', 'Was', 'Were', 'Do', 'Does', 'Did', 'Have', 'Has', 'Had', 'Why', 'How', 'When', 'Where', 'What'],
        '!': ['I', 'You', 'We', 'That', 'This', 'It', 'Thank', 'Please', 'Help', 'Yes', 'No', 'Maybe', 'Good', 'Great', 'Wonderful']
    };

    // language model for word predictions, old kept for backward compatibility 
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

    // All words for the model CHANGE TO INLCUDE THE OTHER LANGUAGE MODEL OR REMOVE 
    //const allWords = Object.values(categoryWords).flat();

    // initialise TensorFlow
    async function initTensorFlow() {
        try {
            console.log("Initializing improved TensorFlow model...");
            
            // create word indices from expanded vocabulary
            wordIndex = {};
            reverseWordIndex = {};
            
            // add padding token
            wordIndex['<PAD>'] = 0;
            reverseWordIndex[0] = '<PAD>';
            
            // create word indices
            commonEnglishWords.forEach((word, index) => {
                const normalizedWord = word.toLowerCase();
                wordIndex[normalizedWord] = index + 1;
                reverseWordIndex[index + 1] = word;
            });
            
            // create sequential model
            model = tf.sequential();

            // add layers
            model.add(tf.layers.embedding({
                inputDim: Object.keys(wordIndex).length + 1,
                outputDim: 64,
                inputLength: 5  
            }));

            //potnetially remove this 
           // model.add(tf.layers.flatten());

           // LSTM layer for better sequence learning
                model.add(tf.layers.lstm({
                units: 128,
                returnSequences: false
            }));
            
            //  dropout to prevent overfitting
            model.add(tf.layers.dropout({ rate: 0.2 }));

             // dense hidden layer
             model.add(tf.layers.dense({
                units: 256,
                activation: 'relu'
            }));
            
            // output layer
            model.add(tf.layers.dense({
                units: Object.keys(wordIndex).length + 1,
                activation: 'softmax'
            }));

            // Compile model
            model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'sparseCategoricalCrossentropy',
                metrics: ['accuracy']
            });

            // Train model with basic patterns
            await trainModel();

            tfLoaded = true;
            console.log("TensorFlow model loaded successfully!");
        } catch (error) {
            console.error("Error initializing TensorFlow:", error);
            console.log("Using fallback suggestions.");
        }
    }

    // Train model with basic patterns
    async function trainModel() {
        const sequences = [];
        const nextWords = [];
    
        // Create training data from language model
        for (const [word, predictions] of Object.entries(improvedLanguageModel)) {
            const wordIdx = wordIndex[word.toLowerCase()] || 0;
            
            predictions.forEach(nextWord => {
                const nextWordIdx = wordIndex[nextWord.toLowerCase()] || 0;
                if (nextWordIdx > 0) {
                    // Ensure that the sequence length is 5
                    const sequence = [0, 0, 0, 0, wordIdx]; // 5 elements with mostly padding at first
                    sequences.push(sequence); 
                    nextWords.push(nextWordIdx);
                }
            });
        }

        // more complex sequences, three words to next word
        Object.entries(improvedLanguageModel).forEach(([word1, predictions1]) => {
            predictions1.forEach(word2 => {
                if (improvedLanguageModel[word2]) {
                    improvedLanguageModel[word2].forEach(word3 => {
                        const idx1 = wordIndex[word1.toLowerCase()] || 0;
                        const idx2 = wordIndex[word2.toLowerCase()] || 0;
                        const idx3 = wordIndex[word3.toLowerCase()] || 0;
                        
                        if (idx1 > 0 && idx2 > 0 && idx3 > 0) {
                            // valid triple, predict several possible next words
                            const possibleNextWords = (improvedLanguageModel[word3] || []).slice(0, 5);
                            
                            possibleNextWords.forEach(nextWord => {
                                const nextWordIdx = wordIndex[nextWord.toLowerCase()] || 0;
                                if (nextWordIdx > 0) {
                                    const sequence = [0, 0, idx1, idx2, idx3];
                                    sequences.push(sequence);
                                    nextWords.push(nextWordIdx);
                                }
                            });
                        }
                    });
                }
            });
        });
    
        // Convert to tensors and ensure correct data type (float32 for inputs)
        const xs = tf.tensor2d(sequences, [sequences.length, 3], 'float32'); // Shape [number of sequences, sequence length]
        const ys = tf.tensor1d(nextWords, 'float32'); // Labels (integer indices of the next word)

    
        // Train model
        await model.fit(xs, ys, {
            epochs: 50,
            batchSize: 8,
            shuffle: true,
            verbose: 0
        });

        // model.add(tf.layers.lstm({
        //     units: 64,
        //     returnSequences: false,
        //     inputShape: [3, 16]  // for your embedding output
        //   }));
    
        // Clean tensors
        xs.dispose();
        ys.dispose();
    }
    

    // Get word suggestions based on TensorFlow model
    async function predictNextWords(text) {
        if (!text || !tfLoaded || !model) return null;
        
        try {
            const words = text.toLowerCase().trim().split(/\s+/);
            
            // Get the last three words or whatever is available
            const lastThreeWords = words.slice(-3).map(w => {
                return wordIndex[w.toLowerCase()] || 0;
            });
            
            while (lastThreeWords.length < 3) {
                lastThreeWords.unshift(0);
            }
            
            // Create the tensor input with proper shape
            const input = tf.tensor2d([lastThreeWords], [1, 3], 'float32'); 
            const prediction = model.predict(input);
            const values = prediction.dataSync();
            
            // Get top 5 predictions
            const indices = Array.from(values)
                .map((value, index) => ({ value, index }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map(item => item.index)
                .filter(index => index > 0); // Filter padding
            
            // Convert indices to words
            const suggestions = indices.map(index => reverseWordIndex[index])
                .filter(word => word); // Filter undefined
            
            // Clean tensors
            input.dispose();
            prediction.dispose();
            
            return suggestions;
        } catch (error) {
            console.error("Error making prediction:", error);
            return null;
        }
    }

    // Function to add word to text output
    function addWordToOutput(word) {
        const currentText = textOutput.value;
        let newText;

        // Check if space is needed before the new word
        if (currentText.length === 0 || currentText.endsWith(' ') || 
            currentText.endsWith('.') || currentText.endsWith('?') || 
            currentText.endsWith('!')) {
            newText = currentText + word;
        } else {
            newText = currentText + ' ' + word;
        }
        
        // Update text and history
        textHistory = textHistory.slice(0, currentHistoryIndex + 1);
        textHistory.push(newText);
        currentHistoryIndex = textHistory.length - 1;
        
        textOutput.value = newText;
        updateWordSuggestions();
    }

    // Update word suggestions
    async function updateWordSuggestions() {
        nextWordSuggestions.innerHTML = '';
        const text = textOutput.value.trim();
        
        // If empty, suggest starter words
        if (!text) {
            addSuggestionButtons(categoryWords.starters.slice(0, 5));
            return;
        }
        
        // Try to get predictions from TensorFlow model
        const predictions = await predictNextWords(text);
        
        if (predictions && predictions.length > 0) {
            addSuggestionButtons(predictions.slice(0, 10));
        } else {
            // Fallback to rule-based predictions
            const words = text.toLowerCase().split(/\s+/);
            const lastWord = words[words.length - 1];
            
            if (languageModel[lastWord]) {
                // If there are specific follow-ups for the last word
                addSuggestionButtons(languageModel[lastWord].slice(0, 5));
            } else if (lastWord.length > 0) {
                // Default common words
                addSuggestionButtons(['and', 'the', 'to', 'with', 'for']);
            } else {
                // Empty or just spaces
                addSuggestionButtons(categoryWords.starters.slice(0, 10));
            }
        }
    }

    // Add suggestion buttons
    function addSuggestionButtons(words) {
        words.forEach(word => {
            const button = document.createElement('button');
            button.textContent = word;
            button.classList.add('word-box');
            button.addEventListener('click', () => {
                addWordToOutput(word);
            });
            nextWordSuggestions.appendChild(button);
        });
    }

    // Add space after word
    function addSpace() {
        const currentText = textOutput.value;
        if (currentText.length > 0 && !currentText.endsWith(' ')) {
            textOutput.value = currentText + ' ';
            updateWordSuggestions();
        }
    }

    // Reset text
    function resetText() {
        textOutput.value = "";
        textHistory = [''];
        currentHistoryIndex = 0;
        updateWordSuggestions();
    }

    // Undo action
    function undoAction() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            textOutput.value = textHistory[currentHistoryIndex];
            updateWordSuggestions();
        }
    }

    // Add event listeners
    function setupEventListeners() {
        // Word buttons
        wordboxes.forEach(button => {
            button.addEventListener("click", () => {
                addWordToOutput(button.textContent);
            });
        });
        
        // Reset button
        resetButton.addEventListener("click", resetText);
        
        // Undo button
        undoButton.addEventListener("click", () => {
            let words = textOutput.value.trim().split(" ");
            if (words.length > 0) {
                words.pop(); // Remove the last word
                textOutput.value = words.join(" ");
                if (words.length > 0) textOutput.value += " ";
                updateWordSuggestions();
            }
        });
        
        // Tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        // Text output changes
        textOutput.addEventListener('input', updateWordSuggestions);
    }

    // Initialize everything
    async function init() {
        // Setup event listeners
        setupEventListeners();
        
        // Try to initialize TensorFlow
        if (tf) {
            try {
                await initTensorFlow();
            } catch (error) {
                console.error("Failed to initialize TensorFlow:", error);
            }
        } else {
            console.warn("TensorFlow is not available. Using fallback suggestions only.");
        }
        
        // Initial suggestions
        updateWordSuggestions();
    }

    // Start the application
    init();
});