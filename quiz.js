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

        var images = [
            'logo.png', 'prizes.png', 'missing.png',
            'speaker_on.png', 'speaker_off.png',
            'cat_phys.jpg', 'cat_chem.jpg', 'cat_math.jpg',
            'cat_bio.jpg', 'cat_astro.jpg', 'cat_tech.jpg',
            'Premio_Fisica.png', 'Premio_Historia.png', 'Premio_Mates.png',
            'Premio_Naturales.png', 'Premio_Astronomia.png',
            'Premio_Informatica.png'];
        for (var i = 0; i < images.length; i++)
            gl.image(images[i].slice(0, -4), 'assets/' + images[i]);

        gl.spritesheet('dino', 'assets/dino.png', 200, 217, 3);
        gl.spritesheet('home', 'assets/home_button.png', 60, 49);

        gl.audio('yes', 'assets/p-ping.mp3');
        gl.audio('nope', 'assets/explosion.mp3');
        gl.audio('blaster', 'assets/blaster.mp3');
        gl.audio('menu', 'assets/menu_select.mp3');
        gl.audio('disabled', 'assets/steps2.mp3');

        gl.bitmapFont('desyrel', 'assets/desyrel.png', 'assets/desyrel.xml');
        gl.bitmapFont('inversionz', 'assets/inversionz.png',
                      'assets/inversionz.xml');
        // inversionz from https://www.dafont.com/inversionz.font
        //   convert -background none -fill black -font Inversionz.ttf -pointsize 80 label:"-0123456789" inversionz.png
        // to extract, and later (tediously) generate the xml fnt file.

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
        game.time.events.add(2000, () => game.state.start('pretutorial'));
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
    for (var category in qs)
        for (var i = 0; i < qs[category].length; i++) {
            var img = qs[category][i]['image'];
            if (img)
                game.load.image(img, 'assets/images_comments/' + img);
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
    var lines = text.split('\n');
    var category = '';
    var current_questions = [];
    for (var i = 0; i < lines.length; i++) {
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
            img = fields[7];
            if (img && img.startsWith('http')) {
                img = img.split('/').slice(-1)[0]
                img = img.replace('%20', ' ');
                img = img.replace('%21', '!');
                img = img.replace('%22', '"');
                img = img.replace('%23', '#');
                img = img.replace('%24', '$');
                img = img.replace('%25', '%');
                img = img.replace('%26', '&');
                img = img.replace('%27', "'");
                img = img.replace('%28', '(');
                img = img.replace('%29', ')');
                img = img.replace('%2C', ',');
                img = img.replace('%C2%A9', '©');
                img = img.replace('%C3%B1', 'ñ');
            }

            current_questions.push({question: fields[0],
                                    answers: fields.slice(1, 4),
                                    comments: fields.slice(4, 7),
                                    image: img});
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
        var gg = game.global;  // shortcut
        game.stage.backgroundColor = gg.color['background'];
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

        // input.onKeyboardOpen(() => game.scale.reset());
        // maybe something like this can fix the zoom problems?

        input.startFocus();
        add_button(gg.color.default, input.y + input.height + 100,
                   'Pulsa cuando quieras', () => {
                       gg.name = input.text.text || 'persona anónima';
                       game.state.start('pretutorial');});
    }
};

// We are not using this state right now, because there are problems
// with the mobile browsers zooming in when writting text, and the app
// stops being usable.


//  ************************************************************************
//  *                                                                      *
//  *                             Pretutorial                              *
//  *                                                                      *
//  ************************************************************************

var state_pretutorial = {
    create: function() {
        var gg = game.global;  // shortcut
        add_button(gg.color.default, 300, 'Tutorial',
                   () => game.state.start('tutorial'), 50);
        add_button(gg.color.default, 500, 'Jugar',
                   () => game.state.start('menu'), 100);
    }
};


//  ************************************************************************
//  *                                                                      *
//  *                               Tutorial                               *
//  *                                                                      *
//  ************************************************************************

var state_tutorial = {
    create: function() {
        add_button(game.global.color.default, 500, 'Jugar',
                   () => game.state.start('menu'), 50);
        // TODO
    }
};


//  ************************************************************************
//  *                                                                      *
//  *                                 Menu                                 *
//  *                                                                      *
//  ************************************************************************

var state_menu = {
    create: function() {
        var gg = game.global;  // shortcut
        if (gg.done_categories.length < Object.keys(gg.questions).length) {
            add_menu_background();
            add_menu_header();
            add_category_buttons();
            add_puppy();
        }
        else {
            game.state.start('final');
        }
    }
};


function add_menu_background() {
    game.stage.backgroundColor = game.global.color['background'];
}


function add_menu_header() {
    add_header_background();
    add_prizes_button();
    add_score();
    add_sound_button();
}


function add_puppy() {
    var puppy = game.add.sprite(0, 0, 'dino');
    puppy.y = game.world.height - puppy.height;
    puppy.animations.add('blink', [0, 0, 2, 2, 0, 0, 2, 0, 2, 2, 0, 0, 1]);
    puppy.animations.play('blink', 5, true);
}


function add_category_buttons() {
    var y = 250;
    var delay_ms = 50;
    var gg = game.global;  // shortcut
    for (var category in gg.questions) {
        var element = {};
        if (gg.done_categories.indexOf(category) === -1) {
            element = add_button(gg.color[category] || gg.color.default,
                                 y, category,
                                 set_category_and_play(category), delay_ms);
            delay_ms += 50;
        }
        else {
            element = add_done(y, category);
        }
        y += element.height + 50;
    }
}


function set_category_and_play(category, n_questions) {
    return () => {
        var gg = game.global;  // shortcut
        gg.current_category = category;
        if (n_questions === undefined)
            n_questions = gg.questions[category].length;
        gg.selected_questions = shuffle(n_questions)
        if (n_questions > 5)
            gg.selected_questions = gg.selected_questions.slice(0, 5);
        gg.current_question = 0;
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
        add_play_header();
        add_puppy();

        time0 = game.time.time;
        bar_time = add_bar_time();

        question = choose_question();
        if (question == undefined) {
            game.global.done_categories.push(game.global.current_category);
            show_medal();
            // TODO: add delay
            game.state.start('menu');
            return;
        }

        var qtext = add_question(question['question']);
        add_answers(qtext.y + qtext.height + 100, question['answers'],
                    question['comments'], question['image']);
    },
    update: function() {
        var fraction = (20 + (time0 - game.time.time) / 1000) / 20;
        if (fraction > 0) {
            bar_time.height = 0.8 * game.world.height * fraction;
            bar_time.y = 200 + 0.8 * game.world.height * (1 - fraction);
        }
    }
};


function show_medal() {
    var medal = add_medal(game.world.centerX, game.world.centerY,
                          game.global.current_category);
    medal.alpha = 0;
    maximize(medal);
    game.add.tween(medal).to({alpha: 1}, 1000, null, true, 0, 0, true);
}


function add_question(text) {
    var bubble = game.add.graphics(0, 0);
    bubble.beginFill(0xffffff, 1);
    var qtext = add_label(game.world.centerX, 160, text);
    bubble.x = qtext.x - qtext.width / 2 - 30;
    bubble.y = qtext.y - 10;
    bubble.lineStyle(4, 0x000000, 0.5);
    bubble.drawRoundedRect(0, 0, qtext.width + 60, qtext.height + 20, 9);
    bubble.alpha = 0.9;
    bubble.endFill();

    // TODO: add line connecting the bubble with dino
    // (see https://phaser.io/examples/v2/display/graphics)

    return qtext;
}


function add_answers(y, answers, comments, image) {
    var audio_yes = game.add.audio('yes', 0.1);
    var audio_nope = game.add.audio('nope', 0.1);
    reorder = shuffle(answers.length);
    var delay_ms = 50;
    for (var i = 0; i < answers.length; i++) {
        var j = reorder[i];

        var points = (j === 0 ? 10 : 0);  // the 1st answer is the right one
        var audio = (j === 0 ? audio_yes : audio_nope);

        var color = game.global.color[game.global.current_category];
        var button = add_button(color, y, answers[j],
                                score_and_teach(points, audio,
                                                comments[j], image),
                                delay_ms);
        delay_ms += 50;
        y += button.height + 50;
    }
}


function add_bar_time() {
    var bar_time = game.add.graphics(0, 200);
    bar_time.beginFill(0x00ff00, 1);
    bar_time.drawRect(game.world.width - 50, 0, 30, 0.8 * game.world.height);
    bar_time.endFill();
    return bar_time;
}


function add_play_background() {
    var graphics = game.add.graphics();
    graphics.beginFill(0xffffff, 1);
    graphics.drawRect(0, 0, game.world.width, game.world.height);
    graphics.endFill();
    var bg_img = {
        'Física': 'cat_phys',
        'Química': 'cat_chem',
        'Matemáticas': 'cat_math',
        'Ciencias Naturales': 'cat_bio',
        'Astronomía': 'cat_astro',
        'Tecnología': 'cat_tech'}[game.global.current_category];
    var bg = game.add.sprite(game.world.centerX, game.world.centerY, bg_img);
    maximize(bg, true);
    bg.anchor.set(0.5);
    bg.alpha = 0.2;
    return bg;
}


// Increase the global score and show a text and image.
function score_and_teach(points, audio, txt, image) {
    return () => {
        if (!game.sound.noAudio)
            audio.play();
        game.global.score += points;

        var bg = add_play_background();
        bg.inputEnabled = true;
        bg.events.onInputDown.add(() => game.state.start('play'));

        if (image) {
            if (image.startsWith('http'))
                image = 'missing';
            var sprite = game.add.sprite(0, 0, image);
            maximize(sprite);
        }

        var text = game.add.text(
            game.world.centerX, game.world.centerY * 1.5, txt,
            {fontSize: '32px', fill:'black', align: 'center',
             wordWrap: true, wordWrapWidth: 600});
        text.setShadow(0, 0, 'rgba(1, 1, 1, 0.3)', 10);
        text.anchor.set(0.5);  // text centered at the given x, y

        show_earnings(points);  // after the others so it's not covered
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
        for (var category in game.global.questions) {
            var prize = add_prize(x, y, category);
            if (game.global.done_categories.indexOf(category) == -1)
                prize.alpha = 0.2;
            [x, y] = next(x, y);
        }

        add_button(game.global.color.default, y + 50, 'Volver al menú',
                   () => { game.state.start('menu'); });
    }
};


function add_medal(x, y, category) {
    var image = {
        'Astronomía': 'Premio_Astronomia',
        'Física': 'Premio_Fisica',
        'Química': 'Premio_Historia',
        'Tecnología': 'Premio_Informatica',
        'Matemáticas': 'Premio_Mates',
        'Ciencias Naturales': 'Premio_Naturales'}[category] || 'Premio_Mates';
    var medal = game.add.sprite(x, y, image);
    medal.anchor.set(0.5);
    return medal;
}


// Add an image with the prize that corresponds to a category and its name.
function add_prize(x, y, category) {
    var group = game.add.group();
    var prize = add_medal(x, y, category);
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

        function add_text(y, txt) {
            var text = game.add.bitmapText(game.world.centerX, y, 'desyrel',
                                           txt, 80);
            text.align = 'center';
            text.anchor.set(0.5);
        }

        add_text(200, 'Enhorabuena\n' + game.global.name + '!!!');
        add_text(500, 'Total de puntos:\n' + game.global.score);

        var brag = 'He completado ScienceQuiz y conseguido ' +
            game.global.score + ' puntos!'.replace(/ /g, '%20');
        var tweet = 'https://twitter.com/intent/tweet?text=' + brag;
        add_button(game.global.color.default, 700, 'Compartir en twitter',
                   () => window.open(tweet, '_blank'));
        add_button(game.global.color.default, 850, 'Volver a jugar',
                   () => { global_reset(); game.state.start('menu'); });
    }
};


//  ************************************************************************
//  *                                                                      *
//  *                              Utilities                               *
//  *                                                                      *
//  ************************************************************************

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
    return game.add.bitmapText(game.world.width - 250, 30, 'inversionz',
                               '' + game.global.score, 60);
}


function add_home_button() {
    game.add.button(60, 40, 'home', () => game.state.start('menu'),
                    this, 1, 0, 1);
}


// Add sound on/of button.
function add_sound_button() {
    var img = game.add.sprite(game.width - 60, 50,
                              'speaker_' + (game.sound.noAudio ? 'off' : 'on'));
    function switch_audio() {
        game.sound.noAudio = !game.sound.noAudio;
        img.loadTexture('speaker_' + (game.sound.noAudio ? 'off' : 'on'));
    }

    img.inputEnabled = true;
    img.input.useHandCursor = true;
    img.events.onInputDown.add(switch_audio);
}


// Add prizes button.
function add_prizes_button() {
    var img = game.add.sprite(60, 40, 'prizes');

    img.scale.set(1.2);
    img.inputEnabled = true;
    img.input.useHandCursor = true;
    img.events.onInputDown.add(() => game.state.start('prizes'));
}


// Add label at position x, y.
function add_label(x, y, txt) {
    var text = game.add.text(x, y, txt,
                             {font: 'Ubuntu', fontSize: 40, fill: 'black',
                              wordWrap: true, wordWrapWidth: 600,
                              align: 'center'});
    text.anchor.setTo(0.5, 0);
    return text;
}


// Add button with text on it, centered, at the given y, with a
// callback when clicked.
function add_button(color, y, text, on_click, delay_animation) {
    var group_button = game.add.group();

    var button_text = add_label(0, y, text);

    var w = Math.max(400, button_text.width) + 40;
    var h = button_text.height + 40;
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
    var over = Phaser.Color.getColor(c.red * 0.9, c.green * 0.9, c.blue * 0.9);
    var click = Phaser.Color.getColor(c.red * 0.8, c.green * 0.8, c.blue * 0.8);
    button_fg.inputEnabled = true;
    button_fg.input.useHandCursor = true;
    button_fg.events.onInputOver.add(() => paint(button_fg, 0, over));
    button_fg.events.onInputOut.add(() => paint(button_fg, 0, color));
    button_fg.events.onInputDown.add(() => paint(button_fg, 0, click));
    button_fg.events.onInputUp.add(on_click);

    delay_animation = delay_animation || 0;
    group_button.x = -group_button.width;
    game.add.tween(group_button).to({x: game.world.centerX}, 300, null,
                                    true, delay_animation, 0);
    return group_button;
}


// Give feedback on the scored points by briefely showing it on screen.
function show_earnings(points) {
    var gw = game.world;
    var text = game.add.bitmapText(gw.centerX, gw.centerY, 'desyrel',
                                   (points >= 0 ? '+' : '') + points, 128);
    text.anchor.set(0.5);
    game.add.tween(text).to({alpha: 0,
                             height: 2 * text.height,
                             width: 2 * text.width}, 1500, null, true);
}


// Add name of category with a checkmark on its left to indicate that
// it is already done.
function add_done(y, category) {
    function disabled() {
        if (!game.sound.noAudio)
            game.add.audio('disabled', 0.5).play();
    }
    var button = add_button(game.global.color.default, y, category, disabled);
    button.alpha = 0.2;
    return button;
}


// Make the image use as much space as possible on the screen.
function maximize(img, fill_all) {
    var gw = game.world;  // shortcut
    var choose = (!fill_all ? Math.min : Math.max);
    var scale = choose(gw.width / img.width, gw.height / img.height);
    img.width *= scale;
    img.height *= scale;
}


// Return range(n) randomly shuffled.
function shuffle(n) {
    var a = new Array(n).fill().map((e, i) => i);  // a = range(n)
    for (var i = 0; i < n; i++) {
        var j = rand(n);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


// Return a random number between 0 and n-1.
function rand(n) {
    return Math.floor(Math.random() * n);
}
