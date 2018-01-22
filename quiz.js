// The different scenes ("states") of the game.

// TODO:
//  * Ask the name of the user (and use it to congratulate her at the end).
//  * Check the time used to answer each question.

//  ************************************************************************
//  *                                                                      *
//  *                                Load.                                 *
//  *                                                                      *
//  ************************************************************************

var state_load = {
    label_loading: {},
    preload: function() {
        game.load.image('logo', 'assets/logo.png');
        game.load.image('speaker_on', 'assets/speaker_on.png');
        game.load.image('speaker_off', 'assets/speaker_off.png');
        game.load.image('math', 'assets/math.jpg');
        game.load.image('biology', 'assets/biology.jpg');
        game.load.image('astronomy', 'assets/astronomy.jpg');
        game.load.image('Premio_Astronomia', 'assets/Premio_Astronomia.png');
        game.load.image('Premio_Fisica', 'assets/Premio_Fisica.png');
        game.load.image('Premio_Historia', 'assets/Premio_Historia.png');
        game.load.image('Premio_Informatica', 'assets/Premio_Informatica.png');
        game.load.image('Premio_Mates', 'assets/Premio_Mates.png');
        game.load.image('Premio_Naturales', 'assets/Premio_Naturales.png');
        game.load.audio('yes', 'assets/p-ping.mp3');
        game.load.audio('nope', 'assets/explosion.mp3');
        game.load.audio('blaster', 'assets/blaster.mp3');
        game.load.audio('menu', 'assets/menu_select.mp3');
        game.load.spritesheet('button', 'assets/button.png', 80, 20);
        game.load.bitmapFont('desyrel', 'assets/desyrel.png', 'assets/desyrel.xml');
        read_file('contents.tsv', load_contents);
    },
    create: function() {
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVeritcally = true;

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
        game.stage.backgroundColor = '#666';

        if (game.global.done_categories.length ===
            Object.keys(game.global.questions).length) {
            game.state.start('final');
            return;
        }

        var [x, y] = [game.world.centerX, 200];

        var text = game.add.bitmapText(x, 50, 'desyrel', 'Puedes elegir...', 64);
        text.anchor.setTo(0.5, 0.5);

        for (category in game.global.questions) {
            if (game.global.done_categories.indexOf(category) === -1)
                add_button(x, y, category, set_category_and_play(category));
            else
                add_prize(x, y, category);
            y += 100;
        }

        add_sound_button();
    }
};


function set_category_and_play(category, n_questions) {
    return () => {
        game.global.current_category = category;
        var n = 0;
        if (n_questions === undefined)
            n = game.global.questions[category].length;
        else
            n = n_questions;
        game.global.selected_questions = shuffle(n)
        game.global.current_question = 0;
        if (!game.sound.noAudio)
            game.add.audio('menu', 0.01).play();
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
        add_background();
        var audio_yes = game.add.audio('yes', 0.05);
        var audio_nope = game.add.audio('nope', 0.05);

        var text_score = game.add.bitmapText(5, 5, 'desyrel',
                                             'Puntos: ' + game.global.score, 50);

        question = choose_question();
        if (question == undefined) {
            game.global.done_categories.push(game.global.current_category);
            game.state.start('menu');
            return;
        }

        add_label(game.world.centerX, 120, question['question']);
        var y = 250;
        reorder = shuffle(question['answers'].length);
        for (i = 0; i < question['answers'].length; i++) {
            var j = reorder[i];

            var points = 0;
            var audio = audio_nope;
            if (j === 0) {
                points = 10;  // the first answer is the right one
                audio = audio_yes;
            }

            var button = add_button(game.world.centerX, y, question['answers'][j],
                                    score_and_teach(points, audio,
                                                    question['comments'][j],
                                                    question['image']));
            y += button.height + 50;
        }

        add_sound_button();
    }
};


function add_background() {
    game.stage.backgroundColor = '#fff';
    var [xc, yc] = [game.world.centerX, game.world.centerY];
    // Quick hack, before we have all the backgrounds.
    var bg_img = '';
    if (['Matemáticas', 'Física', 'Informática'].indexOf(game.global.current_category) >= 0)
        bg_img = 'math';
    else if (['Astronomía', 'Historia de la ciencia'].indexOf(game.global.current_category) >= 0)
        bg_img = 'astronomy';
    else
        bg_img = 'biology';
    var bg = game.add.sprite(xc / 2 + rand(xc), yc / 2 + rand(yc), bg_img);
    maximize(bg);
    bg.alpha = 0.2;
    bg.anchor.setTo(0.5, 0.5);
    function move_bg() {
        var bg_tween = game.add.tween(bg).to({x: xc / 2 + rand(xc),
                                              y: yc / 2 + rand(yc)},
                                             10000, null, true, 500);
        bg_tween.onComplete.addOnce(move_bg);
    }
    move_bg();
}


// Increase the global score and show a text and image.
function score_and_teach(points, audio, txt, image) {
    return () => {
        if (!game.sound.noAudio)
            audio.play();
        game.global.score += points;

        var graphics = game.add.graphics();
        graphics.beginFill(0xFFFFFF, 1);
        graphics.drawRect(0, 0, game.world.width, game.world.height);
        graphics.inputEnabled = true;
        graphics.events.onInputDown.add(() => game.state.start('play'));

        add_background();

        if (image) {
            var sprite = game.add.sprite(game.world.centerX, 0, image);
            sprite.anchor.setTo(0.5, 0);
            maximize(sprite);
        }

        var text = game.add.text(game.world.centerX, game.world.centerY, txt,
                                 {fontSize: '32px', fill:'white'});
        text.setShadow(0, 0, 'rgba(0, 0, 0, 1)', 10);
        text.wordWrap = true;
        text.wordWrapWidth = 500;
        text.anchor.setTo(0.5, 0.5);  // text centered at the given x, y
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
        var text_score = game.add.bitmapText(x, y - 100, 'desyrel',
                                             'Total de puntos:\n' + game.global.score, 80);
        text_score.align = 'center';
        text_score.anchor.setTo(0.5, 0.5);

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

// Add sound on/of button.
function add_sound_button() {
    var sprite = game.add.sprite(game.width - 60, game.height - 60,
                                 game.sound.noAudio ? 'speaker_off' : 'speaker_on');
    function switch_audio() {
        game.sound.noAudio = !game.sound.noAudio;
        sprite.loadTexture(game.sound.noAudio ? 'speaker_off' : 'speaker_on');
    }

    sprite.inputEnabled = true;
    sprite.events.onInputDown.add(switch_audio);
}


// Add label at position x, y.
function add_label(x, y, txt) {
    var text = game.add.text(x, y, txt,
                             {font: '25px Times', fill: 'black',
                              wordWrap: true, wordWrapWidth: 500, align: 'center'});
    text.anchor.setTo(0.5, 0.5);  // text centered at the given x, y
    return text;
}


// Add button with text on it, at the given x, y position and calling
// a callback when clicked.
function add_button(x, y, txt, on_click) {
    var group_button = game.add.group();

    var button = game.add.button(0, 0, 'button', on_click, this, 0, 1, 2);
    button.anchor.setTo(0.5, 0.5);  // button centered at the given x, y
    group_button.add(button);

    var text = add_label(0, 0, txt);
    button.width = Math.max(400, text.width + 40);
    button.height = text.height + 30;
    group_button.add(text);

    group_button.x = rand(2) * 2 * x;
    group_button.y = rand(2) * 2 * y,
    game.add.tween(group_button).to({x: x, y: y}, rand(500), null,
                                    true, rand(200), 0);

    return group_button;
}


// Add an image with the prize that corresponds to a category and its name.
function add_prize(x, y, category) {
    var image = {
        'Astronomía': 'Premio_Astronomia',
        'Física': 'Premio_Fisica',
        'Historia de la ciencia': 'Premio_Historia',
        'Informática': 'Premio_Informatica',
        'Matemáticas': 'Premio_Mates',
        'Ciencias Naturales': 'Premio_Naturales'}[category];
    if (category) {
        var medal = game.add.sprite(x, y, image);
        medal.anchor.setTo(0.5, 0.5);
        medal.scale.setTo(0.2, 0.2);
    }

    add_label(x, y, category);
}


// Make the sprite use as much space as possible on the screen.
function maximize(sprite) {
    var scale = Math.min(game.world.width / sprite.width,
                         game.world.height / sprite.height);
    sprite.width *= scale;
    sprite.height *= scale;
}


// Return range(n) randomly shuffled.
function shuffle(n) {
    var reorder = new Array(n).fill().map((e, i) => i);  // reoder = range(n)
    for (i = 0; i < n; i++) {
        var j = rand(n);
        tmp = reorder[i];
        reorder[i] = reorder[j];
        reorder[j] = tmp;
    }
    return reorder;
}


// Return a random number between 0 and n-1.
function rand(n) {
    return Math.floor(Math.random() * n);
}
