document.addEventListener("DOMContentLoaded", () => {
    const wordboxes = document.querySelectorAll(".word-box");
    const textOutput = document.getElementById("text-output");
    const resetButton = document.querySelector(".reset-btn");
    const undoButton = document.querySelector(".undo-btn");
    const nextWordSuggestions = document.getElementById("nextWordSuggestions");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const speakButton = document.querySelector(".speak-btn");
    const pauseButton = document.querySelector(".pause-btn");
    const repeatButton = document.querySelector(".repeat-btn");
    const voiceSelect = document.getElementById("voice-select");

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
    let tf = window.tf; // declare TensorFlow var

    // speech synthesis set upb
    const synth = window.speechSynthesis
    let selectedVoice = null
    const voices = synth.getVoices().filter(voice => voice.lang.startsWith('en-GB'));

    //add state tracking variables 
    let isSpeaking = false;
    let isPaused = false;
    let currentUtterance = null;
    let lastSpokenText = ""

    // voice selection dropdown
    function populateVoiceList() {

        const voiceSelect = document.getElementById('voice-select');
        
        //existing options cleared
        voiceSelect.innerHTML = '<option value="">Select Voice</option>';

        //const voices = synth.getVoices().filter(voice => voice.lang.startsWith('en-GB'));
        const allVoices = synth.getVoices();
        // filter to only include the requested voices
        const allowedVoiceNames = ['Daniel', 'Arthur', 'Martha', 'Google UK English Female', 'Google UK English Male'];
        const voices = allVoices.filter(voice => allowedVoiceNames.includes(voice.name));

        //fill dropdown with voices
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            option.value = index;
            voiceSelect.appendChild(option);
        });

        // default voice
        if (voices.length > 0) {
            // console.log("male");
            // let defaultVoice = voices.find(voice =>
            //     voice.lang.startsWith('en-GB') &&
            //     voice.name.toLowerCase().includes('Male')
                
            // );
            let voices = speechSynthesis.getVoices();
            // Find all matching voices
            let matchingVoices = voices.filter(voice =>
                voice.lang.startsWith('en-GB') &&
                voice.name.toLowerCase().includes('male')
            );
            let defaultVoice = matchingVoices.length > 0 ? matchingVoices[matchingVoices.length - 1] : null;
            console.log(defaultVoice);
            

            // if (!defaultVoice) {
            //     defaultVoice = voices.find(voice =>
            //         voice.lang.includes('en-') &&
            //         (voice.name.toLowerCase().includes('female') ||
            //          voice.name.toLowerCase().includes('male'))
            //     ) || voices[0];
            // }

            if (defaultVoice) {
                voiceSelect.value = voices.indexOf(defaultVoice);
                selectedVoice = defaultVoice;
                console.log("selectedVoice is:")
                console.log(selectedVoice)
            }
        }
    }

    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
            populateVoiceList();
        };
    } else {
        populateVoiceList(); // Fallback in case onvoiceschanged is not triggered
    }
    

    // voice changes
    // voiceSelect.addEventListener("change", (event) => {
    //     const voices = synth.getVoices()
    //     selectedVoice = voices[event.target.value]
    // })

    // voiceSelect.addEventListener("change", (event) => {
    //     const selectedIndex = event.target.value;
    //     const voices = synth.getVoices().filter(voice => voice.lang.startsWith('en-GB'));
        
    //     // validating
    //     if (selectedIndex !== "" && voices[selectedIndex]) {
    //         selectedVoice = voices[selectedIndex];
    //         console.log("Selected Voice:", selectedVoice.name);
    //     } else {
    //         console.warn("Invalid voice selection");
    //     }
    // });

    voiceSelect.addEventListener("change", (event) => {
        const selectedIndex = event.target.value;
        const allVoices = synth.getVoices();
        const allowedVoiceNames = ['Daniel', 'Arthur', 'Martha', 'Google UK English Female', 'Google UK English Male'];
        const voices = allVoices.filter(voice => allowedVoiceNames.includes(voice.name));
        
        // validating
        if (selectedIndex !== "" && voices[selectedIndex]) {
            selectedVoice = voices[selectedIndex];
            console.log("Selected Voice:", selectedVoice.name);
        } else {
            console.warn("Invalid voice selection");
        }
    });

    //speak functionality
    function speakText() {
        const textToSpeak = textOutput.value.trim()

        if (!textToSpeak) {
        alert("Please enter some text to speak.")
        return;
        }

        lastSpokenText = textToSpeak

        // if already paused, resume speech
        if (isPaused && currentUtterance) {
            resumeSpeech();
            return;
        }

        //if already speaking, stop current speech before starting new one
        if (isSpeaking) {
            synth.cancel()
        }

        //new speech utterance
        // const utterance = new SpeechSynthesisUtterance(textToSpeak)
        // Create new speech utterance
        currentUtterance = new SpeechSynthesisUtterance(textToSpeak)

        //selected voice if available
        if (selectedVoice) {
            currentUtterance.voice = selectedVoice
        }

        //adjust speech parameters
        currentUtterance.pitch = 1 // 0 to 2
        currentUtterance.rate = 1 // 0.1 to 10
        currentUtterance.volume = 1 // 0 to 1

        //speech state in console
        currentUtterance.onstart = () => {
            isSpeaking = true
            isPaused = false
            console.log("Speech started")
          }
      
          currentUtterance.onend = () => {
            isSpeaking = false
            isPaused = false
            currentUtterance = null
            console.log("Speech ended")

            // clear the text output after speech is complete
            textOutput.value = "";
            
            //update history to include the empty state
            textHistory.push("");
            currentHistoryIndex = textHistory.length - 1;
            
            // word suggestions for the empty text
            updateWordSuggestions();
          }
      
          currentUtterance.onpause = () => {
            isPaused = true
            console.log("Speech paused")
          }
      
          currentUtterance.onresume = () => {
            isPaused = false
            console.log("Speech resumed")
          }

        //speak
        synth.speak(currentUtterance)
    }

    function repeatLastText() {
        if (lastSpokenText) {
          //already speech happening, cancel it
          if (isSpeaking) {
            synth.cancel()
          }
    
          // new utterance with the last spoken text
          currentUtterance = new SpeechSynthesisUtterance(lastSpokenText)
    
          //set voice
          if (selectedVoice) {
            currentUtterance.voice = selectedVoice
          }
    
          currentUtterance.pitch = 1
          currentUtterance.rate = 1
          currentUtterance.volume = 1
    
          //event handlers
          currentUtterance.onstart = () => {
            isSpeaking = true
            isPaused = false
            console.log("Repeat speech started")
          }
    
          currentUtterance.onend = () => {
            isSpeaking = false
            isPaused = false
            currentUtterance = null
            console.log("Repeat speech ended")

            textOutput.value = "";
  
            //update history to include the empty state
            textHistory.push("");
            currentHistoryIndex = textHistory.length - 1;
            
            // word suggestions for the empty state
            updateWordSuggestions();
          }
    
          currentUtterance.onpause = () => {
            isPaused = true
            console.log("Repeat speech paused")
          }
    
          currentUtterance.onresume = () => {
            isPaused = false
            console.log("Repeat speech resumed")
          }
    
          synth.speak(currentUtterance)
        } else {
          console.log("No previous text to repeat")
        }
      }

    // pause speech function
    function pauseSpeech() {
        if (isSpeaking && !isPaused) {
            synth.pause();
            isPaused = true;
            console.log("Speech paused manually");
        }
    }

    // resume speech function
    function resumeSpeech() {
        if (isPaused) {
            synth.resume();
            isPaused = false;
            console.log("Speech resumed manually");
        }
    }

    // reset speech function
    function resetSpeech() {
        synth.cancel();
        isSpeaking = false;
        isPaused = false;
        currentUtterance = null;
        console.log("Speech reset");
    }

    speakButton.addEventListener("click", speakText)
    pauseButton.addEventListener("click", pauseSpeech);
    repeatButton.addEventListener("click", repeatLastText);

    // voices are loaded
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = populateVoiceList
    }

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
        'bathroom', 'hungry', 'thirsty', 'tired', 'pain', 'uncomfortable', 'medicine', 'teacher',
        'too hot', 'too cold', 'yes please', 'no thanks', 'not sure', 'maybe', 'definitely',
        'family', 'friend', 'assistance', 'caregiver', 'appointment', 'schedule', 'visit', 'call'
    ];

    const categoryWords = {
        'starters': ['The', 'It', 'I', 'He', 'She', 'They', 'We', 'There', 'This', 'That', 'A', 'An', 'In', 'On', 'At', 'As', 'When', 'While', 'After', 'Before', 'Because', 'Although', 'Though', 'If', 'But', 'And', 'So', 'Since', 'Then', 'Now', 'However', 'Moreover', 'Furthermore', 'Therefore', 'Indeed', 'Also', 'Yet', 'Even', 'Some', 'Most', 'All', 'Each', 'One', 'Many', 'People', 'Time', 'Day'],
        'questions': ['who', 'what', 'when', 'where', 'why', 'can I', 'Can you help me?', 'Can you explain that?', 'What does this mean?', 'What does that mean?', 'Could you repeat that?', 'How do I do this?', 'How do I do that?', 'Is this correct?', 'Can you show me how to do this?', 'Can you show me how to do that?', 'Is this going to be on the exam?', 'Do we have any homework?', 'How are you?', 'What do you do?', 'What’s your name?', 'How old are you?', 'What time is it?', 'What do you think?', 'Are you alright?', 'What do you mean?', 'Can I ask you something?', 'What’s going on?', 'How many words does it have to be?', 'Can you check my work?', 'What does this word mean?'],
        'responses': ['yes', 'no', 'maybe', 'sort of', 'I agree', 'I disagree', 'I understand', 'I dont understand', 'I need help', 'good idea', 'can you explain more', 'Ill let you know'],
        'subjects': ['I', 'you', 'we', 'his', 'she', 'hers', 'they', 'them', 'their', 'it', 'the group'],
        'verbs': ['am', 'is', 'are', 'was', 'were', 'have', 'need', 'want', 'like', 'think', 'know', 'understand', 'finished', 'read', 'write', 'say', 'show', 'explain', 'check', 'finish', 'start', 'can', 'should', 'must', 'help', 'ask', 'repeat', 'listen', 'answer', 'examine'],
        'common': ['and', 'or', 'but', 'because', 'with', 'without', 'to', 'from', 'in', 'on', 'at', 'by', 'for'],
        'topics': ['idea', 'answer', 'question', 'presentation', 'topic', 'opinion', 'solution', 'point', 'example', 'group', 'project', 'task', 'sentence', 'word', 'slide', 'chart', 'diagram'],
        'adjectives': ['clear', 'confusing', 'interesting', 'important', 'helpful', 'difficult', 'easy', 'correct', 'wrong', 'new', 'old', 'next', 'previous', 'better'],
        'numbers': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '25', '50', '75', '100', '%', '.', '-'],
        'requests': ['Look at this', 'Can you come here?', 'Please wait', 'Next slide', 'Can you help me?', 'Please listen', 'Look over here', 'Please stop', 'Can you explain that?', 'Could you repeat that?', 'Can I get some help?', 'Can you slow down?', 'I don’t understand', 'Please show me', 'Can you write that down?', 'Can you give me a minute?', 'Could you point to that?', 'Please go slower'],
        'sentence-starters': ['I don’t understand', 'Can you help me with', 'Is it OK if I', 'What if I do', 'I think I can', 'Could you explain', 'I’m not sure if', 'I would like to', 'What should I do if', 'I need to', 'Can I please', 'How do I', 'I feel like', 'Do I need to', 'I was wondering if', 'Could I ask', 'I don’t know how to', 'What if I don’t', 'Could you show me how to']
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
        'need': ['to', 'a', 'some', 'help', 'assistance', 'support', 'information', 'time', 'water', 'food', 'medicine', 'rest', 'break', 'bathroom', 'teacher'],
        'want': ['to', 'a', 'some', 'more', 'less', 'this', 'that', 'it', 'water', 'food', 'help', 'rest', 'break', 'bathroom', 'medicine'],
        'like': ['to', 'this', 'that', 'it', 'them', 'the', 'a', 'some', 'more', 'less', 'your', 'my', 'his', 'her', 'their'],
        'have': ['a', 'an', 'the', 'some', 'any', 'many', 'more', 'less', 'this', 'that', 'these', 'those', 'to', 'been', 'my', 'your', 'our'],
        
        // articles with nouns
        'a': ['little', 'lot', 'few', 'bit', 'moment', 'second', 'minute', 'day', 'week', 'month', 'year', 'person', 'teacher', 'assistance', 'problem', 'question'],
        'the': ['same', 'other', 'next', 'last', 'first', 'second', 'third', 'teacher', 'assistance', 'bathroom', 'medication', 'medicine', 'pain', 'hospital'],
        
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

            // compile model
            model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'sparseCategoricalCrossentropy',
                metrics: ['accuracy']
            });

            // train model with basic patterns
            await trainModel();

            tfLoaded = true;
            console.log("TensorFlow model loaded successfully!");
        } catch (error) {
            console.error("Error initializing TensorFlow:", error);
            console.log("Using fallback suggestions.");
        }
    }

    // train model with basic patterns
    async function trainModel() {
        const sequences = [];
        const nextWords = [];
    
        // create training data from language model
        for (const [word, predictions] of Object.entries(improvedLanguageModel)) {
            const wordIdx = wordIndex[word.toLowerCase()] || 0;
            
            predictions.forEach(nextWord => {
                const nextWordIdx = wordIndex[nextWord.toLowerCase()] || 0;
                if (nextWordIdx > 0) {
                    // ensure that the sequence length is 5
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
        const xs = tf.tensor2d(sequences, [sequences.length, 5], 'float32'); // Shape [number of sequences, sequence length]
        const ys = tf.tensor1d(nextWords, 'float32'); // Labels (integer indices of the next word)

        console.log(`Training model with ${sequences.length} sequences...`);

        // train model
        await model.fit(xs, ys, {
            epochs: 50,
            batchSize: 32,
            shuffle: true,
            verbose: 0,
            callbacks: {
                // onEpochEnd: (epoch, logs) => {
                //     if (epoch % 10 === 0) {
                //         console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                //     }
                // }
            }
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
    

    //  word suggestions based on TensorFlow model
    async function predictNextWords(text) {
        if (!text || !tfLoaded || !model) return null;
        
        try {
            const words = text.toLowerCase().trim().split(/\s+/).slice(-5);
            
            // Get the last three words or whatever is available
            // const lastThreeWords = words.slice(-3).map(w => {
            //     return wordIndex[w.toLowerCase()] || 0;
            // });
            const wordIndices = words.map(w => wordIndex[w.toLowerCase()] || 0);

            //ensure 5 tokens 
            while (wordIndices.length < 5) {
                wordIndices.unshift(0);
            }
            
            // Create the tensor input with proper shape
            // const input = tf.tensor2d([lastThreeWords], [1, 3], 'float32'); 
            // const prediction = model.predict(input);
            // const values = prediction.dataSync();

            //take last 5 if too long 
            const inputIndices = wordIndices.slice(-5);
            // Create tensor
            const inputTensor = tf.tensor2d([inputIndices], [1, 5], 'float32');
            // Get prediction
            const prediction = model.predict(inputTensor);
            const values = prediction.dataSync();
            
            // Get top 5 predictions
            const indices = Array.from(values)
                .map((value, index) => ({ value, index }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 15)
                .map(item => item.index)
                .filter(index => index > 0); 
            
            // indices to words
            const suggestions = indices.map(index => reverseWordIndex[index])
                .filter(word => word);
            
            // clean tensors
            // input.dispose();
            // prediction.dispose();
            inputTensor.dispose();
            prediction.dispose();

            //if there is valid suggestions, suggest them 
            if (suggestions.length > 0) {
                return suggestions;
            }
            
            return getFallbackSuggestions(text);
        } catch (error) {
            console.error("Error making prediction:", error);
            return getFallbackSuggestions(text);
        }
    }

    //better fallback suggestions
    function getFallbackSuggestions(text) {
        if (!text || text.trim() === '') {
            return categoryWords.starters.slice(0, 10);
        }
        
        const words = text.toLowerCase().trim().split(/\s+/);
        const lastWord = words[words.length - 1];
        
        // try improved language model 
        if (improvedLanguageModel[lastWord]) {
            return improvedLanguageModel[lastWord].slice(0, 10);
        }
        
        // try original language model
        if (languageModel[lastWord]) {
            return languageModel[lastWord].slice(0, 10);
        }
        
        //last 2 words pattern
        if (words.length >= 2) {
            const lastTwoWords = words.slice(-2).join(' ');
            const lastWordPairs = {
                'I am': ['feeling', 'going', 'trying', 'looking', 'thinking', 'working', 'ready', 'not', 'here', 'tired'],
                'I need': ['help', 'to', 'a', 'some', 'more', 'information', 'assistance', 'water', 'food', 'medicine'],
                'I want': ['to', 'a', 'some', 'more', 'help', 'food', 'water', 'rest', 'something', 'it'],
                'thank you': ['for', 'so', 'very', 'much', '.', '!', 'kindly', 'again', 'teacher', 'assistant'],
                'can you': ['help', 'please', 'get', 'bring', 'find', 'tell', 'show', 'explain', 'repeat', 'do'],
                'could you': ['please', 'help', 'get', 'bring', 'find', 'tell', 'show', 'explain', 'repeat', 'do']
            };
            
            if (lastWordPairs[lastTwoWords]) {
                return lastWordPairs[lastTwoWords];
            }
        }
        
        // punctuation-based suggestions
        const lastChar = text.trim().slice(-1);
        if (lastChar === '.' || lastChar === '!' || lastChar === '?') {
            return ['I', 'You', 'We', 'The', 'This', 'That', 'It', 'Today', 'Yesterday', 'Tomorrow'];
        }
        
        // default common words 
        return ['the', 'and', 'to', 'a', 'in', 'is', 'it', 'I', 'that', 'was', 'for', 'on', 'with'];
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
        
        //if empty, suggest starter words
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
            
            if (improvedLanguageModel[lastWord]) {
                //specific follow-ups for the last word
                addSuggestionButtons(improvedLanguageModel[lastWord].slice(0, 10));
            } else if (languageModel[lastWord]) {
                //specific follow-ups in the original model
                addSuggestionButtons(languageModel[lastWord].slice(0, 10));
            } else if (lastWord.length > 0) {
                // default
                addSuggestionButtons(['and', 'the', 'to', 'with', 'for', 'is', 'a', 'in', 'on', 'at']);
            } else {
                //just spaces
                addSuggestionButtons(categoryWords.starters.slice(0, 10));
            }
        }
    }

    // add suggestion buttons
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

    // add space after word
    function addSpace() {
        const currentText = textOutput.value;
        if (currentText.length > 0 && !currentText.endsWith(' ')) {
            textOutput.value = currentText + ' ';
            updateWordSuggestions();
        }
    }

    // reset text
    function resetText() {
        textOutput.value = "";
        textHistory = [''];
        currentHistoryIndex = 0;
        updateWordSuggestions();
    }

    // undo action
    function undoAction() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            textOutput.value = textHistory[currentHistoryIndex];
            updateWordSuggestions();
        }
    }

    // add event listeners
    function setupEventListeners() {
        // word buttons
        wordboxes.forEach(button => {
            button.addEventListener("click", () => {
                addWordToOutput(button.textContent);
            });
        });
        
        // reset button
        // resetButton.addEventListener("click", resetText);
        resetButton.addEventListener("click", () => {
            resetText();
            resetSpeech();
        });
        
        // undo button
        undoButton.addEventListener("click", () => {
            let words = textOutput.value.trim().split(" ");
            if (words.length > 0) {
                words.pop(); // remove the last word
                textOutput.value = words.join(" ");
                if (words.length > 0) textOutput.value += " ";
                updateWordSuggestions();
            }
        });
        
        // tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        // text output changes
        textOutput.addEventListener('input', updateWordSuggestions);
    }

    // initialise everything
    async function init() {
        //  event listeners
        setupEventListeners();
        
        // try to initialize TensorFlow
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