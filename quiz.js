// The different scenes ("states") of the game.

//  ************************************************************************
//  *                                                                      *
//  *                                Load.                                 *
//  *                                                                      *
//  ************************************************************************

var state_load = {
    label_loading: {},
    preload: function() {
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVeritcally = true;
//        game.scale.startFullScreen(false);
        game.load.image('logo', 'assets/logo.png');
        game.load.image('sky', 'assets/sky.png');
        game.load.audio('yes', 'assets/p-ping.mp3');
        game.load.audio('nope', 'assets/meow2.mp3');
        game.load.audio('blaster', 'assets/blaster.mp3');
        game.load.spritesheet('button', 'assets/button.png', 80, 20);

        read_file('contents.tsv', load_contents);
    },
    create: function() {
        flash_image('logo', 1000);
        game.time.events.add(2000, () => game.state.start('menu'));
    },
};


// Fade in and out an image for the given amount of milliseconds.
function flash_image(name, ms) {
    var img = game.add.sprite(game.world.centerX, game.world.centerY, name);
    img.anchor.setTo(0.5, 0.5);
    img.scale.setTo(2, 2);
    img.alpha = 0;
    game.add.tween(img).to({alpha: 1}, ms, null, true, 0, 0, true);
}


// Read the contents of local file fname and pass them to a callback
// if successful.
function read_file(fname, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', fname, true);
    request.onload = (e) => {
        if (request.readyState === 4) {
            if (request.status === 200)
                callback(request.responseText);
            else
                game.debug.text('Problema al leer: ' + fname,
                                game.world.centerX, game.world.centerY);
        }
    };
    request.onerror = (e) => game.debug.text(request.statusText);
    request.send(null);
}


// Save questions and load images from the raw text of the contents file.
function load_contents(text) {
    var qs = parse_questions(text.replace(/\r/g, ''));
    for (category in qs)
        for (i = 0; i < qs[category].length; i++) {
            var img = qs[category][i]['image'];
            if (img)
                game.load.image(img, 'assets/' + img);
        }
    game.load.start();  // force loading
    game.global.questions = qs;
}


// Parse tab-separated fields with contents and return the questions object.
// questions = {c1: [{question: 'q1',                   // c1 -> category 1
//                    answers: ['a1r', 'a12', 'a13'],   // ar -> right answer
//                    comments: ['c1r', 'c12', 'c13'],
//                    image: 'img1'},
//                    ... ],
//               c2: [ ... ],
//               ... }
function parse_questions(text) {
    var questions = {};
    lines = text.split('\n').slice(3);
    var category = "";
    var current_questions = [];
    for (i = 0; i < lines.length; i++) {
        var fields = lines[i].split('\t');
        if (is_empty(lines[i]))
            ;  // skip
        else if (has_new_category(fields)) {
            if (category)  // we had already a previous category
                questions[category] = current_questions; // save previous ones
            category = fields[0];
            current_questions = [];
        }
        else {
            current_questions.push({question: fields[0],
                                    answers: fields.slice(1, 4),
                                    comments: fields.slice(4, 7),
                                    image: fields[7]});
        }
    }
    if (current_questions.length != 0)  // we are missing the last category
        questions[category] = current_questions; // save previous questions

    return questions;
}

function is_empty(line) {
    return line.length === 0 || line[0] === '\t';
}

function has_new_category(fields) {
    return fields.length == 1 || fields[1].length === 0;
}


//  ************************************************************************
//  *                                                                      *
//  *                                 Menu                                 *
//  *                                                                      *
//  ************************************************************************

var state_menu = {
    create: function() {
        game.stage.backgroundColor = '#48a';

        if (game.global.done_categories.length ===
            Object.keys(game.global.questions).length) {
            game.state.start('final');
            return;
        }

        var x = game.world.centerX, y = 200;
        add_label(x, 100, 'Elige categoría:');
        for (category in game.global.questions) {
            if (game.global.done_categories.indexOf(category) === -1)
                add_button(x, y, category, set_category_and_play(category));
            else
                add_label(x, y, category);
            y += 100;
        }
    }
};


function set_category_and_play(category) {
    return () => {
        game.global.current_category = category;
        game.global.selected_questions = shuffle(game.global.questions[category].length);
        game.global.current_question = 0;
        game.add.audio('blaster').play();
        game.state.start('play');
    };
}


//  ************************************************************************
//  *                                                                      *
//  *                                 Play                                 *
//  *                                                                      *
//  ************************************************************************

var state_play = {
    create: function() {
        game.add.sprite(0, 0, 'sky');

        var audio_yes = game.add.audio('yes');
        var audio_nope = game.add.audio('nope');

        var text_score = game.add.text(16, 16, 'Puntos: ' + game.global.score,
                                       {fontSize: '32px', fill:'black'});

        question = choose_question();
        if (question == undefined) {
            game.global.done_categories.push(game.global.current_category);
            game.state.start('menu');
            return;
        }

        add_label(game.world.centerX, 100, question['question']);
        var y = 200;
        reorder = shuffle(question['answers'].length);
        for (i = 0; i < question['answers'].length; i++) {
            var j = reorder[i];

            var points = 0;
            var audio = audio_nope;
            if (j === 0) {
                points = 10;  // the first answer is the right one
                audio = audio_yes;
            }

            add_button(game.world.centerX, y, question['answers'][j],
                       score_and_teach(points, audio,
                                       question['comments'][j], question['image']));
            y += 100;
        }
    }
};


// Increase the global score and show a text and image.
function score_and_teach(points, audio, txt, image) {
    return () => {
        audio.play();
        game.global.score += points;

        var graphics = game.add.graphics();
        graphics.beginFill(0xFFFFFF, 1);
        graphics.drawRect(0, 0, game.world.width, game.world.height);
        graphics.inputEnabled = true;
        graphics.events.onInputDown.add(() => game.state.start('play'));

        if (image) {
            var sprite = game.add.sprite(game.world.centerX, 0, image);
            sprite.anchor.setTo(0.5, 0);
            xstretch = sprite.width / game.world.width;
            ystretch = sprite.height / game.world.height;
            if (xstretch > ystretch) {
                sprite.width = game.world.width;
                sprite.height /= xstretch;
            }
            else {
                sprite.width /= ystretch;
                sprite.height = game.world.height;
            }
        }

        var text = game.add.text(game.world.centerX, game.world.centerY, txt,
                                 {fontSize: '32px', fill:'white'});
        text.setShadow(0, 0, 'rgba(0, 0, 0, 1)', 10);
        text.wordWrap = true;
        text.wordWrapWidth = 500;
        text.anchor.setTo(0.5, 0.5);  // text centered at the given x, y

        add_label(game.world.centerX, 550,
                  '(Toca en cualquier sitio para continuar)');
    };
}


// Return the next selected question.
function choose_question() {
    var questions = game.global.questions[game.global.current_category];
    var selected = game.global.selected_questions;
    return questions[selected[game.global.current_question++]];
}


//  ************************************************************************
//  *                                                                      *
//  *                                Final                                 *
//  *                                                                      *
//  ************************************************************************

var state_final = {
    create: function() {
        game.stage.backgroundColor = '#48a';

        var [x, y] = [game.world.centerX, game.world.centerY];
        add_label(x, y, 'Tu puntuación final es\n' + game.global.score);

        var brag = 'He completado ScienceQuiz y conseguido ' +
            game.global.score + ' puntos!'.replace(/ /g, '%20');
        var tweet = 'https://twitter.com/intent/tweet?text=' + brag;
        add_button(x, y + 100, 'Compartir en twitter',
                   () => window.open(tweet, '_blank'));
        add_button(x, y + 200, 'Volver a jugar',
                   () => { global_reset(); game.state.start('menu'); });
    }
};


//  ************************************************************************
//  *                                                                      *
//  *                              Utilities                               *
//  *                                                                      *
//  ************************************************************************

// Return range(n) randomly shuffled.
function shuffle(n) {
    var reorder = new Array(n).fill().map((e, i) => i);  // reoder = range(n)
    for (i = 0; i < n; i++) {
        var j = Math.floor(Math.random() * n);
        tmp = reorder[i];
        reorder[i] = reorder[j];
        reorder[j] = tmp;
    }
    return reorder;
}


// Add label at position x, y.
function add_label(x, y, txt) {
    var text = game.add.text(x, y, txt,
                             {font: '25px Arial', fill: 'black',
                              wordWrap: true, wordWrapWidth: 500, align: "center"});
    text.anchor.setTo(0.5, 0.5);  // text centered at the given x, y
    return text;
}


// Add button with text on it, at the given x, y position and calling
// a callback when clicked.
function add_button(x, y, txt, on_click) {
    var button = game.add.button(x, y, 'button', on_click, this, 0, 1, 2);
    button.anchor.setTo(0.5, 0.5);  // button centered at the given x, y

    var text = game.add.text(x, y, txt,
                             {font: '25px Arial', fill: 'black',
                              wordWrap: true, wordWrapWidth: 500, align: "center"});
    text.anchor.setTo(0.5, 0.5);  // text centered at the given x, y
    button.width = Math.max(200, text.width + 40);
    button.height = text.height + 30;

    return button;
}
