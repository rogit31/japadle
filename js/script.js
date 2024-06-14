//Top level variables
let wordData = [];
const gameWrapper = $('#gameWrapper');
const explanation = $('#explanation');
const gameModeButtons = $('.gameModeButtons');
const reload = $('#reload');
const kanjiModeButton = $('#kanjiModeButton');
const kanaModeButton = $('#kanaModeButton');
const meaningModeButton = $('#meaningModeButton');
let kanjiDisplay = $('#kanji');
let kanaDisplay = $('#kana');
let meaningDisplay = $('#meaning');
const kanjiInput = $('#kanjiInput');
const readingInput = $('#readingInput');
const meaningInput = $('#meaningInput');
const guess = $('#guess');
let gameModeEnabled = 'none';
const answer = $('#answer');
const score = $('#score');
let guessedCorrectlyCounter = 0;
let correctReading = false;
let correctMeaning = false;
let correctKanji = false;
let complete = false;
let startingHP = 10;
const heartDisplay = $('#hearts');
const defeatPopup = $('#defeatPopup');
const resetButton = $('#reset');
const highScore = $('#highScore');
let currentHighScore = 0;
const hint = $('#hint');
const backTo = $('#backTo');
const money = $('#moneyDisplay');
let currentMoney = 0;
let hintShown = false; 
let moneyLoaded = false;
let remainingHP = startingHP;
let wordKanji = '';
let wordKana = '';
let wordTranslations ='';
const feedback = $('#feedback');


// Fetch and parse JSON data function
function fetchWordData() {
    fetch('js/jmdict-eng-3.5.0.json')
        .then(response => response.json())
        .then(data => {
            wordData = data.words;
            filter();
            displayRandomWord();
        });
}

//Filter JSON file and attribute it to word a word
function filter() {
    wordData = wordData.filter(word => {
        const hasCommonKanji = word.kanji.some(kanji => kanji.common === true);
        const hasCommonKana = word.kana.length > 0 && word.kana[0].common === true;
        return hasCommonKanji && hasCommonKana;
    });
}

//Generate a random index number and a random word
function displayRandomWord() {
    randomIndex = Math.floor(Math.random() * wordData.length);
    const randomWord = wordData[randomIndex];
    console.log('randomWord generated', randomWord);

    //This will select the first item of the word array that is common. Originally, I was going to include uncommon readings or words that don't have chinese characters in them as an option, but this proved more complex than I thought.

    function findCommonText(items) {
        const commonItem = items.find(item => item.common === true);
        return commonItem ? commonItem.text : `Common kanji/kana not found. This shouldn't happen.`;
    };
    wordKanji = findCommonText(randomWord.kanji);
    wordKana = findCommonText(randomWord.kana);

    //The translations are contained in a glossary index with sometimes several separate translations, so here I had to double map/join them to a single string. In the future I want the check for correct meanings to be more accepting, currently you have to match the definition exactly.  
    wordTranslations = randomWord.sense.map(s => s.gloss.map(g => g.text).join(', ')).join(', ');
    kanjiDisplay.text(wordKanji);
    kanaDisplay.text(wordKana);
    meaningDisplay.text(wordTranslations);
    $('main').css('opacity', '100%');
    $('.loader').css('display', 'none');

    //Clear values on reload
    readingInput.val('');
    kanjiInput.val('');
    meaningInput.val('');
    answer.text('');

    //Remove error effect
    removeError();
    removeCorrect();
    console.log(wordKanji, wordKana, wordTranslations);
};

//Remove error effect
function removeError(){
    $('.errorEffect').removeClass('errorEffect');
}
//Remove correct effect
function removeCorrect(){
    $('.correctEffect').removeClass('correctEffect');
}

//Invoke the fetch data function as the first function
fetchWordData();

//Making a skip cost a hit point
reload.on('click', skipHeart);
function skipHeart() {
    showPreviousAnswer();
    if (remainingHP > 0) {
        $(`#heart-${remainingHP - 1}`).remove(); // Remove the last heart
        remainingHP--; // Decrease remainingHP
        $('#livesLeft').text(remainingHP);
        displayRandomWord();

        if (gameModeEnabled === 'kanji') {
            kanjiMode();
        }
        else if (gameModeEnabled === 'kana') {
            kanaMode();
        }
        else if (gameModeEnabled === 'meaning') {
            meaningMode();
        }
        hintShown = false;
    }
    else {
        defeatPopup.css('display', 'flex');
        gameWrapper.css('display', 'none');
    }
}
//Feedback on previous answer
function showPreviousAnswer() {
    $('#feedbackWrapper').css('display', 'inline');
    feedback.empty();
    let textToShow = '';
    if (gameModeEnabled == "kanji"){
        textToShow = wordKana + ';  ' + wordTranslations;
    }
    else if(gameModeEnabled == "kana"){
        textToShow = wordKanji + ';  ' + wordTranslations;
    }
    else{
        textToShow = wordKanji + ';  '+  wordKana;
    }
    const maxLength = 100;
    if (textToShow.length > maxLength){
        const nextComma = textToShow.indexOf(',', maxLength);
        if (nextComma !== -1){
            textToShow = textToShow.substring(0, nextComma) + '...';
        }
        else {
            textToShow = textToShow.substring(0, maxLength) + '...';
        }
    }
feedback.append(textToShow);
}
//Introduction clear
gameModeButtons.on('click', function () {
    gameWrapper.css('display', 'block');
    explanation.css('display', 'none');
    initialize();
});

//Initializing function called when players click on a game mode or after game over
function initialize() {
    heartDisplay.empty();
    for (let i = 0; i < startingHP; i++) {
        heartDisplay.append(`<img id="heart-${i}" class="heart" src="media/heart.png" alt="small heart">`);
    };
    score.text('0');
    $('#livesLeft').text('10');
    let initialHighScore = getHighScore();
    highScore.text(initialHighScore);
    loadMoney();
    money.text(currentMoney);
};

//Function for the defeat screen to be reset and game re-initialized
resetButton.on('click', reset)
function reset() {
    console.log("Reset function called");
    defeatPopup.css('display', 'none');
    gameWrapper.css('display', 'block');
    guessedCorrectlyCounter = 0;
    remainingHP = 10;
    currentBackground = 1;
    player.playerPosition = 0;
    path = `url(../media/backgroundimage${currentBackground}.gif)`;
    backgroundImage.css('background-image', path);
    hintShown = false;
    animate();
    initialize();
}

//Function for hints, they cost 50 and are either randomly picked in between the two possible inputs, or the one that is incorrect.
hint.on('click', showHint); 
function showHint() {
    const cost = 50;
    const randomNumber = Math.random();

    if (currentMoney < cost) {
        answer.text('Nuh-uh! Not enough coins.');
        return;
    }

    if (hintShown) {
        answer.text('You already got a hint!');
        return;
    }
    currentMoney -= cost;
    money.text(currentMoney);
    saveMoney(currentMoney);
    hintShown = true;

    switch (gameModeEnabled) {
        case 'kanji':
            displayKanjiHint(randomNumber);
            break;
        case 'kana':
            displayKanaHint(randomNumber);
            break;
        case 'meaning':
            displayMeaningHint(randomNumber);
            break;
        default:
            answer.append('How did you even get here?');
    }
};
//Differing functions for hints based on game mode, here kanji
function displayKanjiHint(randomNumber) {
    if (!correctReading && !correctMeaning) {
        displayRandomHint(randomNumber, wordTranslations, wordKana);
    } else if (correctReading && !correctMeaning) {
        meaningInput.val(wordTranslations);
    } else if (!correctReading && correctMeaning) {
        readingInput.val(wordKana);
    }
};
//Here reading/kana
function displayKanaHint(randomNumber) {
    if (!correctKanji && !correctMeaning) {
        displayRandomKanaHint(randomNumber, wordTranslations, wordKanji);
    } else if (correctKanji && !correctMeaning) {
        meaningInput.val(wordTranslations);
    } else if (!correctKanji && correctMeaning) {
        readingInput.val(wordKanji);
    }
};

//Here meaning
function displayMeaningHint(randomNumber) {
    if (!correctKanji && !correctReading) {
        displayRandomMeaningHint(randomNumber, wordKanji, wordKana);
    } else if (!correctKanji && correctReading) {
        kanjiInput.val(wordKanji)
    } else if (correctKanji && !correctReading) {
       readingInput.val(wordKana)
    }
}
//Random select hint
function displayRandomHint(randomNumber, hint1, hint2) {
    if (randomNumber < 0.5) {
        meaningInput.val(hint1);
        readingInput.val('');
    } else {
        meaningInput.val('');
        readingInput.val(hint2);
    }
};
function displayRandomKanaHint(randomNumber, hint1, hint2) {
    if (randomNumber < 0.5) {
        meaningInput.val(hint1);
        kanjiInput.val('');
    } else {
        meaningInput.val('');
        kanjiInput.val(hint2);
    }
};
function displayRandomMeaningHint(randomNumber, hint1, hint2) {
    if (randomNumber < 0.5) {
        kanjiInput.val(hint1);
        readingInput.val('');
    } else {
        kanjiInput.val('');
        readingInput.val(hint2);
    }
};

//Originally, I was planning on having a few more possible upgrades but this also ended up being quite challenging. With the time I had, this is what I managed to implement.
//Function to earn money when correct
function earnMoney() {
    currentMoney += 10; // Earn 10 money
    saveMoney(currentMoney); // Save the updated money
}
//Saving money called whenever money is changed
function saveMoney(money) {
    if (typeof (Storage) !== 'undefined') {
        localStorage.setItem('currentMoney', money.toString());
    } else {
        console.log("Your browser doesn't support web storage.");
    }
}
//Load money from browser history on initialization. 
function loadMoney() {
    if (typeof (Storage) !== 'undefined' && !moneyLoaded) {
        if (localStorage.getItem('currentMoney') !== null) {
            currentMoney = parseInt(localStorage.getItem('currentMoney'), 10);
        }
        moneyLoaded = true;
    } else {
        console.log("Your browser doesn't support web storage.");
    }
}

//Function to go back to the explanation/game modes. In hindsight, this should've probably been a different page.
backTo.on('click', displayModes);
function displayModes() {
    reset();
    displayRandomWord();
    gameWrapper.css('display', 'none');
    explanation.css('display', 'block');
    resetDisplays();
    gameModeEnabled = 'none';
}

//High score functions. This one is invoked on completion.
function saveHighScore(score) {
    if (typeof (Storage) !== "undefined") {
        if (localStorage.getItem("highScore") === null) {
            localStorage.setItem("highScore", score.toString());
        } else {
            let currentHighScore = parseInt(localStorage.getItem("highScore"), 10);
            if (score > currentHighScore) {
                localStorage.setItem("highScore", score.toString());
            }
        }
    } 
};
//This one is invoked on initialization.
function getHighScore() {
    if (typeof (Storage) !== "undefined") {
        if (localStorage.getItem("highScore") !== null) {
            return parseInt(localStorage.getItem("highScore"), 10);
        } else {
            return 0; 
        }
    }
};

//Function used to check inputs for correct answers.
guess.on('click', checkInputs);
function checkInputs() {
    answer.text('');
    let guessedKana, guessedKanji, guessedMeaning;
    if (gameModeEnabled === 'kanji') {
        //this makes it so the user can type in roman characters and still return true based on wanakana's JSON. 
        guessedKana = wanakana.toKana(readingInput.val());
        guessedMeaning = meaningInput.val();
        //invoking the corresponding functions depending on game mode
        checkMeaning(guessedMeaning);
        checkKana(guessedKana);
    } else if (gameModeEnabled === 'kana') {
        guessedKanji = kanjiInput.val();
        guessedMeaning = meaningInput.val();
        checkKanji(guessedKanji);
        checkMeaning(guessedMeaning);
    } else {
        guessedKanji = kanjiInput.val();
        guessedKana = wanakana.toKana(readingInput.val());
        checkKanji(guessedKanji);
        checkKana(guessedKana);
    }
    //Flag for completion is switched if at least two inputs are right
    if (correctReading && correctMeaning || correctKanji && correctMeaning || correctKanji && correctReading) {
        complete = true;
    }
    //invoke completion function
    checkForCompletion();
}
//functions for checking based on game mode
function checkKana(guessedKana) {
    if (guessedKana.trim() === kanaDisplay.text()) {
        readingInput.addClass('correctEffect');
        removeError();
        correctReading = true;
    } else {
        readingInput.addClass('errorEffect');
        correctReading = false; 
    }
}
//functions for checking based on game mode
function checkKanji(guessedKanji) {
    if (guessedKanji.trim() === kanjiDisplay.text()) {
        kanjiInput.addClass('correctEffect');
        removeError();
        correctKanji = true;
    } else {
        kanjiInput.addClass('errorEffect');
        correctKanji = false;
    }
}

//functions for checking based on game mode. This one is perhaps the most complicated and I am still unsatisfied with it. The translations for words are contained in different arrays depending on the number of possible definitions. To check if the input is correct, this means that I have to check against all definitions. I decided to map all definitions into one string delimited by commas. Then, I take the users input, lowercase it, split it in the same fashion and then check if any of the words are contained within the definition excluding common words. I am not satisfied with it because know all you need is *one* of the words to get the full definition right. But then again, some of the definitions in the dictionary are ridiculously long and are impossible to get accurately even if you understand the word perfectly. Maybe the solution is to implement value of % of words guessed? Like if one of the definitions is three words long and you had two words correct it flags as correct? Unsure. 
function checkMeaning(guessedMeaning) {
    const meanings = meaningDisplay.text().split(',').map(m => m.trim()).flatMap(m => m.split(/\s+/)).filter(Boolean);
    
    // List of common words to exclude
    const commonWords = ['of', 'the', 'and', 'to', 'in', 'is', 'it', 'that', 'on', 'was', 'for', 'with', 'as', 'be', 'at', 'by', 'i', 'you', 'are', 'this', 'or', 'but', 'not', 'an', 'they', 'do', 'from', 'we', 'can', 'will', 'if', 'there', 'any', 'he', 'she', 'so', 'has', 'been', 'what', 'when', 'who', 'which', 'how', 'where', 'why', 'whom', 'whose', 'our', 'your', 'my', 'his', 'her', 'their', 'its'];

    // Convert guessedMeaning to lowercase and split into words
    const guessedWords = guessedMeaning.toLowerCase().trim().split(/\s+/);

    // Filter out common words from meanings
    const filteredMeanings = meanings.filter(word => !commonWords.includes(word));

    // Check if any of the guessed words are in the filtered meanings array
    if (guessedWords.some(word => filteredMeanings.includes(word))) {
        meaningInput.addClass('correctEffect');
        removeError();
        correctMeaning = true;
    } else {
        meaningInput.addClass('errorEffect');
        correctMeaning = false;
    }
}
//TO DO: STOP MAKING IT SO THAT WHITESPACE WILL FLAG THE ANSWER AS FALSE!!!
// FIX THE UI GODDAYUMN IT LOOKS LIKE SHIT 
// MAYBE GET SOMEONE TO PLAY TEST IT 
//CHANGE TITLE 

//functions for what to do when the complete flag is true
function checkForCompletion() {
    if (complete === true) {
        //updates the current HS depending on either store memory or current
        let currentHighScore = getHighScore();
        //trigger animation
        animate();
        //iterate counters and update(i really should've just called this score)
        guessedCorrectlyCounter++;
        score.text(guessedCorrectlyCounter);
        showPreviousAnswer();
        
        //Small timeout to confirm to the player that they got the answer right
        setTimeout(function(){

            //clear inputs
            answer.text('');
            readingInput.val('');
            kanjiInput.val('');
            meaningInput.val('');
    
            //update high score if current counter is bigger
            if (guessedCorrectlyCounter > currentHighScore) {
                saveHighScore(guessedCorrectlyCounter);
                highScore.text(guessedCorrectlyCounter);
            } else {
                highScore.text(currentHighScore);
            }
    
            //earn money, save it, and update the display
            earnMoney();
            saveMoney(currentMoney);
            money.text(currentMoney);
    
            //display a new word
            displayRandomWord();
    
            //reset flags
            complete = false;
            correctKanji = false;
            correctReading = false;
            correctMeaning = false;
            hintShown = false;
        }, 800)

    }
}
//Reset all displays to original so that when switching game modes the display nones don't bleed into other game modes
function resetDisplays() {
    meaningDisplay.css('display', 'block');
    kanaDisplay.css('display', 'block');
    kanjiDisplay.css('display', 'block');
    kanjiInput.css('display', 'inline-block');
    readingInput.css('display', 'inline-block');
    meaningInput.css('display', 'inline-block');
}

//Functions to change what is displayed, flags what game mode is used
kanjiModeButton.on('click', kanjiMode);
function kanjiMode() {
    meaningDisplay.css('display', 'none');
    kanaDisplay.css('display', 'none');
    kanjiInput.css('display', 'none');
    gameModeEnabled = 'kanji';
}

kanaModeButton.on('click', kanaMode);
function kanaMode() {
    meaningDisplay.css('display', 'none');
    kanjiDisplay.css('display', 'none');
    readingInput.css('display', 'none');
    gameModeEnabled = 'kana';
}

meaningModeButton.on('click', meaningMode);
function meaningMode() {
    meaningInput.css('display', 'none');
    kanjiDisplay.css('display', 'none');
    kanaDisplay.css('display', 'none');
    gameModeEnabled = 'meaning';
}


// Animation
//Animation variables. In retrospect, a lot of these could've been better organized as objects but I was not aware of just how many variables I would end up with. 
let animateButton = $('#animate');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasWidth = canvas.width = 960;
const canvasHeight = canvas.height = 538;
let frameX = 0;
let gameFrame = 0;
let staggerFrames = 10;
//Maximum duration for the animation.
let maxDuration = 12;
//Quantity of background images to be cycled through
let backgroundImageQuantity = 3;
let currentBackground = 1;
//Path to the background images. Must precisely be named backgroundimage_.gif.
let path = `url(../media/backgroundimage${currentBackground}.gif)`;
let currentPlacement = 1;
let backgroundImage = $('#canvas');

//Player object tracking the sprite.
let player = {
    playerImage: new Image(),
    playerPosition: 5,
    playerSpeed: .8,
    spriteWidth: 32,
    spriteHeight: 32,
    spriteFrames: 6,
    yStartPosition: 470
};

//Image source for the player sprite.
player.playerImage.src = '../media/catwalksprite.png';

//Animation function is called on content load so that the creature is visible from the get go. Uses sprite sheets made by me, cycles through every frame by multiplying the sprite width times the current frame.
document.addEventListener('DOMContentLoaded', animate);
function animate() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(player.playerImage, frameX * player.spriteWidth, 0, player.spriteWidth, player.spriteHeight, player.playerPosition, player.yStartPosition, 80, 80);
//It's only been a day since I did this but I'm already starting to forget exactly how it worked. 
    if (gameFrame % staggerFrames == 0) {
        if (frameX < player.spriteFrames) {
            frameX++;
        } else {
            frameX = 0;
        }
        if (gameFrame >= maxDuration) {
            gameFrame = 0;
            maxDuration--;
        }
    }
    gameFrame++;
    player.playerPosition += player.playerSpeed;
    if (maxDuration <= 0) {
        cancelAnimationFrame(animate);
        maxDuration = 12;
    } else {
        requestAnimationFrame(animate);
    }

    if (player.playerPosition > canvasWidth) {
        player.playerPosition = 5;
        currentBackground++;
        if (currentBackground > backgroundImageQuantity) {
            currentBackground = 1;
        }
        path = `url(../media/backgroundimage${currentBackground}.gif)`;
        backgroundImage.css('background-image', path);
    }
}

//Economy variables. Originally I was planning on making more upgrades and storing them in browser memory but I simply ran out of time. 
let duck = $('#duck');
let buyText = $('#buyText');
let buyMenu = $('#moneyWrapper');
let x = $('#x');
//Simple menu display functions
buyMenu.on('click', function(event) {
    event.stopPropagation();
    $('#buyMenu').css('display', 'block');
});

x.on('click', function(event) {
    event.stopPropagation();
    $('#buyMenu').css('display', 'none');
});
$(document).on('click', function(event) {
    if (!$(event.target).closest('#moneyWrapper').length) {
        $('#buyMenu').css('display', 'none');
    }
});
//When you click on the duck it triggers the buycreature function
duck.on('click', function() { buyCreatureSprite('duck'); });
//Function buycreature that accepts a creatureName parameter in case one day I make more upgrades
function buyCreatureSprite(creatureName) {
    // Define the cost for each creature
    const creatureCosts = {
        'duck': 100,
    };
    if (creatureCosts.hasOwnProperty(creatureName)) {
        const cost = creatureCosts[creatureName];
        if (currentMoney >= cost) {
            currentMoney -= cost;
            //Makes a new object with new properties
            switch (creatureName) {
                case 'duck':
                    player.playerImage.src = '../media/duckwalksprite.png';
                    player.spriteHeight = 80;
                    player.spriteWidth = 80;
                    player.spriteFrames =5;
                    player.yStartPosition = 460;
                    break;
            }
            //Refresh the animation, money, cache it
            animate();
            money.text(currentMoney);
            saveMoney(currentMoney);
        } else {
            buyText.text(`You're poor lol!`);
        }
    }
}