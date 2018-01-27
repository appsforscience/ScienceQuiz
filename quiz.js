// The different scenes ("states") of the game.

//  ************************************************************************
//  *                                                                      *
//  *                                Load.                                 *
//  *                                                                      *
//  ************************************************************************

var state_load = {
    label_loading: {},
    preload: function() {
        var gl = game.load;  // shortcut
        gl.image('logo', 'assets/logo.png');
        gl.image('home', 'assets/home.png');
        gl.image('speaker_on', 'assets/speaker_on.png');
        gl.image('speaker_off', 'assets/speaker_off.png');
        gl.image('prizes', 'assets/prizes.png');
        gl.image('cat_phys', 'assets/cat_phys.jpg');
        gl.image('cat_chem', 'assets/cat_chem.jpg');
        gl.image('cat_math', 'assets/cat_math.jpg');
        gl.image('cat_bio', 'assets/cat_bio.jpg');
        gl.image('cat_tech', 'assets/cat_tech.jpg');
        gl.image('cat_astro', 'assets/cat_astro.jpg');
        gl.image('check', 'assets/check.png');
        gl.image('Premio_Astronomia', 'assets/Premio_Astronomia.png');
        gl.image('Premio_Fisica', 'assets/Premio_Fisica.png');
        gl.image('Premio_Historia', 'assets/Premio_Historia.png');
        gl.image('Premio_Informatica', 'assets/Premio_Informatica.png');
        gl.image('Premio_Mates', 'assets/Premio_Mates.png');
        gl.image('Premio_Naturales', 'assets/Premio_Naturales.png');
        gl.audio('yes', 'assets/p-ping.mp3');
        gl.audio('nope', 'assets/explosion.mp3');
        gl.audio('blaster', 'assets/blaster.mp3');
        gl.audio('menu', 'assets/menu_select.mp3');
        gl.bitmapFont('desyrel', 'assets/desyrel.png', 'assets/desyrel.xml');
        read_file('contents.tsv', load_contents);
        WebFontConfig = {
            google: { families: ['Ubuntu'] }
        };
        gl.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
    },
    create: function() {
        game.add.plugin(PhaserInput.Plugin);
        game.scale.windowConstraints.bottom = 'visual';
        // See http://www.html5gamedevs.com/topic/11007-question-about-scale-mode-show_all-in-22/
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVeritcally = true;

        flash_image('logo', 1000);
        game.time.events.add(2000, () => game.state.start('menu'));
    },
};


// Fade in and out an image for the given amount of milliseconds.
function flash_image(name, ms) {
    var img = game.add.sprite(game.world.centerX, game.world.centerY, name);
    img.anchor.set(0.5);
    img.scale.set(3);
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


// Load questions and images from the raw text of the contents file.
function load_contents(text) {
    var qs = parse_questions(text.replace(/\r/g, ''));
    for (category in qs)
        for (i = 0; i < qs[category].length; i++) {
            var img = qs[category][i]['image'];
            if (img && !img.startsWith('http'))
                game.load.image(img, 'assets/' + img);
        }
    game.load.start();  // force loading (it's automatic only in preload())
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
//  *                                Intro                                 *
//  *                                                                      *
//  ************************************************************************

var state_intro = {
    create: function() {
        game.stage.backgroundColor = game.global.color['background'];
        var [x, y] = [game.world.centerX, game.world.centerY];
        var label = add_label(x, y, 'Hola, ¿cómo te llamas?');
        var input = game.add.inputField(x - 75, y + label.height, {
            font: '18px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: 150,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            textAlign: 'center'});

        //input.onKeyboardOpen(() => game.scale.reset());
        // maybe something like this can fix the zoom problems?

        input.startFocus();
        add_button(0xbbbbbb, input.y + input.height + 100,
                   'Pulsa cuando quieras', () => {
                       game.global.name = input.text.text || 'persona anonima';
                       game.state.start('menu');});
    }
};

// We are not using this state right now, because there are problems
// with the mobile browsers zooming in when writting text, and the app
// stops being usable.


//  ************************************************************************
//  *                                                                      *
//  *                                 Menu                                 *
//  *                                                                      *
//  ************************************************************************

var state_menu = {
    create: function() {
        if (game.global.done_categories.length ===
            Object.keys(game.global.questions).length) {
            game.state.start('final');
            return;
        }

        game.stage.backgroundColor = game.global.color['background'];
        var header = add_menu_header();

        var [x, y] = [game.world.centerX, 250];

        var delay_ms = 50;
        for (category in game.global.questions) {
            var element = {};
            if (game.global.done_categories.indexOf(category) === -1) {
                element = add_button(game.global.color[category] || 0xffffff,
                                     y, category,
                                     set_category_and_play(category),
                                     delay_ms);
                delay_ms += 50;
            }
            else {
                element = add_done(y, category);
            }
            y += element.height + 50;
        }
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
        if (n > 5)
            game.global.selected_questions = game.global.selected_questions.slice(0, 5);
        game.global.current_question = 0;
        if (!game.sound.noAudio)
            game.add.audio('menu', 0.05).play();
        game.state.start('play');
    };
}


//  ************************************************************************
//  *                                                                      *
//  *                                 Play                                 *
//  *                                                                      *
//  ************************************************************************

var state_play = {
    time0: 0,
    bar_time: {},
    create: function() {
        add_play_background();
        var audio_yes = game.add.audio('yes', 0.1);
        var audio_nope = game.add.audio('nope', 0.1);
        add_play_header();

        time0 = game.time.time;
        bar_time = game.add.graphics(0, 200);
        bar_time.beginFill(0x00ff00, 1);
        bar_time.drawRect(game.world.width - 50, 0, 30, 0.8 * game.world.height);
        bar_time.endFill();

        question = choose_question();
        if (question == undefined) {
            game.global.done_categories.push(game.global.current_category);
            game.state.start('menu');
            return;
        }

        var qtext = add_label(game.world.centerX, 160, question['question']);
        var y = qtext.y + qtext.height + 100;
        reorder = shuffle(question['answers'].length);
        for (i = 0; i < question['answers'].length; i++) {
            var j = reorder[i];

            var points = 0;
            var audio = audio_nope;
            if (j === 0) {
                points = 10;  // the first answer is the right one
                audio = audio_yes;
            }

            var button = add_button(game.global.color[game.global.current_category], y,
                                    question['answers'][j],
                                    score_and_teach(points, audio,
                                                    question['comments'][j],
                                                    question['image']),
                                    i * 50);
            y += button.height + 50;
        }
    },
    update: function() {
        var fraction = (20 + (time0 - game.time.time) / 1000) / 20;
        if (fraction > 0) {
            bar_time.height = 0.8 * game.world.height * fraction;
            bar_time.y = 200 + 0.8 * game.world.height * (1 - fraction);
        }
    }
};


function add_play_background() {
    game.stage.backgroundColor = '#fff';
    var [xc, yc] = [game.world.centerX, game.world.centerY];
    var bg_img = {
        'Física': 'cat_phys',
        'Química': 'cat_chem',
        'Matemáticas': 'cat_math',
        'Ciencias Naturales': 'cat_bio',
        'Astronomía': 'cat_astro',
        'Tecnología': 'cat_tech'}[game.global.current_category];
    var bg = game.add.sprite(xc, yc, bg_img);
    maximize(bg, true);
    bg.alpha = 0.2;
    bg.anchor.set(0.5);
}


// Increase the global score and show a text and image.
function score_and_teach(points, audio, txt, image) {
    return () => {
        if (!game.sound.noAudio)
            audio.play();
        game.global.score += points;

        var graphics = game.add.graphics();
        graphics.beginFill(0xffffff, 1);
        graphics.drawRect(0, 0, game.world.width, game.world.height);
        graphics.endFill();
        graphics.inputEnabled = true;
        graphics.events.onInputDown.add(() => game.state.start('play'));

        add_play_background();

        if (image) {
            var sprite = game.add.sprite(game.world.centerX, 0, image);
            sprite.anchor.setTo(0.5, 0);
            maximize(sprite);
        }

        var text = game.add.text(game.world.centerX, game.world.centerY * 1.5, txt,
                                 {fontSize: '32px', fill:'white'});
        text.setShadow(0, 0, 'rgba(0, 0, 0, 1)', 10);
        text.wordWrap = true;
        text.wordWrapWidth = 500;
        text.anchor.set(0.5);  // text centered at the given x, y

        score_feedback(points);
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
//  *                                Prizes                                *
//  *                                                                      *
//  ************************************************************************

var state_prizes = {
    create: function() {
        game.stage.backgroundColor = game.global.color['background'];

        function next(x, y) {
            if (x > game.world.centerX)
                return [game.world.centerX / 2, y + 300];
            else
                return [3 * game.world.centerX / 2, y];
        }

        var [x, y] = [game.world.centerX / 2, 200];
        for (category in game.global.questions) {
            var prize = add_prize(x, y, category);
            if (game.global.done_categories.indexOf(category) == -1)
                prize.alpha = 0.2;
            [x, y] = next(x, y);
        }

        add_button(0xbbbbbb, y + 50, 'Volver al menú',
                   () => { game.state.start('menu'); });
    }
};


// Add an image with the prize that corresponds to a category and its name.
function add_prize(x, y, category) {
    var image = {
        'Astronomía': 'Premio_Astronomia',
        'Física': 'Premio_Fisica',
        'Química': 'Premio_Historia',
        'Tecnología': 'Premio_Informatica',
        'Matemáticas': 'Premio_Mates',
        'Ciencias Naturales': 'Premio_Naturales'}[category] || 'Premio_Mates';

    var group = game.add.group();
    var prize = game.add.sprite(x, y, image);
    prize.anchor.set(0.5);
    prize.scale.set(0.35);
    var text = add_label(x, prize.y + prize.height / 2 + 10, category);
    group.addMultiple([prize, text]);
    return group;
}

//  ************************************************************************
//  *                                                                      *
//  *                                Final                                 *
//  *                                                                      *
//  ************************************************************************

var state_final = {
    create: function() {
        game.stage.backgroundColor = game.global.color['background'];

        var [x, y] = [game.world.centerX, game.world.centerY];
        var text_congrats = game.add.bitmapText(x, 100, 'desyrel',
                                                'Enhorabuena\n' + game.global.name + '!!!', 80);
        text_congrats.align = 'center';
        text_congrats.anchor.set(0.5);
        var text_score = game.add.bitmapText(x, y - 100, 'desyrel',
                                             'Total de puntos:\n' + game.global.score, 80);
        text_score.align = 'center';
        text_score.anchor.set(0.5);

        var brag = 'He completado ScienceQuiz y conseguido ' +
            game.global.score + ' puntos!'.replace(/ /g, '%20');
        var tweet = 'https://twitter.com/intent/tweet?text=' + brag;
        add_button(0xbbbbbb, y + 100, 'Compartir en twitter',
                           () => window.open(tweet, '_blank'));
        add_button(0xbbbbbb, y + 200, 'Volver a jugar',
                           () => { global_reset(); game.state.start('menu'); });
    }
};


//  ************************************************************************
//  *                                                                      *
//  *                              Utilities                               *
//  *                                                                      *
//  ************************************************************************

function add_menu_header() {
    add_header_background();
    add_prizes_button();
    add_score();
    add_sound_button();
}


function add_header_background() {
    var graphics = game.add.graphics();
    graphics.beginFill(0x000000, 0.8);
    graphics.drawRect(0, 0, game.world.width, 140);
    graphics.beginFill(0xd0d0d0, 1);
    graphics.drawRect(0, 0, game.world.width, 130);
    graphics.endFill();
}


function add_play_header() {
    add_header_background();
    add_home_button();
    add_score();
    add_sound_button();
}


function add_score() {
    return game.add.bitmapText(game.world.width - 250, 30, 'desyrel',
                               '' + game.global.score, 60);
}


function add_home_button() {
    var sprite = game.add.sprite(60, 40, 'home');
    sprite.inputEnabled = true;
    sprite.events.onInputDown.add(() => game.state.start('menu'));
}


// Add sound on/of button.
function add_sound_button() {
    var sprite = game.add.sprite(game.width - 60, 50,
                                 game.sound.noAudio ? 'speaker_off' : 'speaker_on');
    function switch_audio() {
        game.sound.noAudio = !game.sound.noAudio;
        sprite.loadTexture(game.sound.noAudio ? 'speaker_off' : 'speaker_on');
    }

    sprite.inputEnabled = true;
    sprite.events.onInputDown.add(switch_audio);
}


// Add prizes button.
function add_prizes_button() {
    var sprite = game.add.sprite(60, 30, 'prizes');

    sprite.inputEnabled = true;
    sprite.events.onInputDown.add(() => game.state.start('prizes'));
}


// Add label at position x, y.
function add_label(x, y, txt) {
    var text = game.add.text(x, y, txt,
                             {font: 'Ubuntu', fontSize: 40, fill: 'black',
                              wordWrap: true, wordWrapWidth: 400, align: 'center'});
    text.anchor.setTo(0.5, 0);
    return text;
}


// Add button with text on it, centered, at the given y, with a
// callback when clicked.
function add_button(color, y, text, on_click, delay_animation) {
    var group_button = game.add.group();
    var button_text = add_label(0, y, text);
    var [w, h] = [Math.max(400, button_text.width) + 40, button_text.height + 40];
    function paint(rect, shift, color) {
        rect.beginFill(color, 1);
        rect.drawRoundedRect(shift - w / 2, y - 20 + shift, w, h, 5);
        rect.endFill();
        return rect;
    }

    var button_bg = game.add.graphics(0, 0);
    paint(button_bg, 5, 0x333333);
    var button_fg = game.add.graphics(0, 0);
    paint(button_fg, 0, color);
    group_button.addMultiple([button_bg, button_fg, button_text]);

    var c = Phaser.Color.getRGB(color);
    var color_dark = Phaser.Color.getColor(c.red * 0.9, c.green * 0.9, c.blue * 0.9);
    button_fg.inputEnabled = true;
    button_fg.input.useHandCursor = true;
    button_fg.events.onInputOver.add(() => paint(button_fg, 0, color_dark));
    button_fg.events.onInputOut.add(() => paint(button_fg, 0, color));
    button_fg.events.onInputDown.add(() => paint(button_fg, 0, 0x555555));
    button_fg.events.onInputUp.add(on_click);

    delay_animation = delay_animation || 0;
    group_button.x = -group_button.width;
    game.add.tween(group_button).to({x: game.world.centerX}, 300, null,
                                    true, delay_animation, 0);
    return group_button;
}


// Give feedback on the scored points by briefely showing it on screen.
function score_feedback(points) {
    var [x, y] = [game.world.centerX, game.world.centerY];
    var text = game.add.bitmapText(x, y, 'desyrel',
                                   (points >= 0 ? '+' : '') + points, 128);
    text.anchor.set(0.5);
    game.add.tween(text).to({alpha: 0,
                             height: 2 * text.height,
                             width: 2 * text.width}, 1500, null, true);
}


// Add name of category with a checkmark on its left to indicate that
// it is already done.
function add_done(y, category) {
    var check = game.add.sprite(game.world.centerX - 200, y, 'check');
    check.anchor.set(0.5);
    return add_label(game.world.centerX, y, category);
}


// Make the sprite use as much space as possible on the screen.
function maximize(sprite, fill_all) {
    var scale = 0;
    if (!fill_all)
        scale = Math.min(game.world.width / sprite.width,
                         game.world.height / sprite.height);
    else
        scale = Math.max(game.world.width / sprite.width,
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
