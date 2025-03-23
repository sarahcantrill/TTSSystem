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

    const categoryWords = {
        'starters': ['I', 'You', 'We', 'They', 'He', 'She', 'It', 'Please', 'Today', 'Could', 'Would'],
        'questions': ['who', 'what', 'when', 'where', 'why', 'can I', 'could you', 'please', 'do you', 'Could', 'Would', 'is it'],
        'responses': ['yes', 'no', 'maybe', 'sort of', 'I agree', 'I disagree', 'I understand', 'I dont understand', 'I need help', 'good idea', 'can you explain more', 'Ill let you know'],
        'subjects': ['I', 'you', 'we', 'his', 'she', 'hers', 'they', 'them', 'their', 'it', 'the group'],
        'verbs': ['am', 'is', 'are', 'was', 'were', 'have', 'need', 'want', 'like', 'think', 'know', 'understand', 'finished'],
        'common': ['and', 'or', 'but', 'because', 'with', 'without', 'to', 'from', 'in', 'on', 'at', 'by', 'for']
    };

    // Language model for word predictions
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

    // All words for the model
    const allWords = Object.values(categoryWords).flat();

    // Initialize TensorFlow
    async function initTensorFlow() {
        try {
            // Create word indices
            allWords.forEach((word, index) => {
                wordIndex[word.toLowerCase()] = index + 1;
                reverseWordIndex[index + 1] = word;
            });
            
            // Create sequential model
            model = tf.sequential();

            // Add layers
            model.add(tf.layers.embedding({
                inputDim: Object.keys(wordIndex).length + 1,
                outputDim: 16,
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

            // Compile model
            model.compile({
                optimizer: 'adam',
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

   // let xs = tf.tensor([...]); // Example initialization

    // Train model with basic patterns
    async function trainModel() {
        const sequences = [];
        const nextWords = [];
    
        // Create training data from language model
        for (const [word, predictions] of Object.entries(languageModel)) {
            const wordIdx = wordIndex[word.toLowerCase()] || 0;
            
            predictions.forEach(nextWord => {
                const nextWordIdx = wordIndex[nextWord.toLowerCase()] || 0;
                if (nextWordIdx > 0) {
                    // Ensure that the sequence length is 3
                    const sequence = [0, 0, wordIdx]; // We need 3 elements to form a valid sequence
                    sequences.push(sequence); 
                    nextWords.push(nextWordIdx);
                }
            });
        }
    
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