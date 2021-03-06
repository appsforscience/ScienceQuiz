// The different scenes ("states") of the game.


//  ************************************************************************
//  *                                                                      *
//  *                                Boot                                  *
//  *                                                                      *
//  ************************************************************************

var state_boot = {
    preload: function() {
        game.load.image('logo', 'assets/logo.png');
    },
    create: function() {
        game.scale.windowConstraints.bottom = 'visual';
        // See http://www.html5gamedevs.com/topic/11007-question-about-scale-mode-show_all-in-22/
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVeritcally = true;
        game.state.start('load');
    },
};


//  ************************************************************************
//  *                                                                      *
//  *                                Load                                  *
//  *                                                                      *
//  ************************************************************************

var music = undefined;

var state_load = {
    preload: function() {
        var gl = game.load;  // shortcut

        var splash = game.add.sprite(game.world.centerX, game.world.centerY, 'logo');
        splash.anchor.set(0.5);

        gl.setPreloadSprite(splash);

        var images = [
            'prizes.png', 'missing.png',
            'speaker_on.png', 'speaker_off.png',
            'cat_phys.jpg', 'cat_chem.jpg', 'cat_math.jpg',
            'cat_bio.jpg', 'cat_med.jpg', 'cat_tech.jpg',
            'Premio_tecno1.png', 'Premio_tecno2.png', 'Premio_tecno3.png',
            'Premio_quim1.png', 'Premio_quim2.png', 'Premio_quim3.png',
            'Premio_natu1.png', 'Premio_natu2.png', 'Premio_natu3.png',
            'Premio_mates1.png', 'Premio_mates2.png', 'Premio_mates3.png',
            'Premio_fisica1.png', 'Premio_fisica2.png', 'Premio_fisica3.png',
            'Premio_medicina1.png', 'Premio_medicina2.png',
            'Premio_medicina3.png',
        ];
        for (var i = 0; i < images.length; i++)
            gl.image(images[i].slice(0, -4), 'assets/' + images[i]);

        gl.spritesheet('home', 'assets/home_button.png', 60, 49);
        gl.spritesheet('next', 'assets/next.png', 100, 100);
        gl.spritesheet('more', 'assets/more.png', 100, 100);

        var dino_poses = [
            ['bored1', 1608, 217],
            ['breathing', 1616, 217],
            ['happy', 1640, 228],
            ['nope', 1608, 217],
            ['superhappy', 1680, 249],
            ['talk', 1608, 217],
            ['time', 1840, 236],
            ['yes', 1680, 251]];
        for (var i = 0; i < dino_poses.length; i++) {
            var [img, w, h] = dino_poses[i];
            var path = 'assets/Animation_' + img + '.png';
            gl.spritesheet(img, path, w / 8, h);
        }

        gl.audio('yes', 'assets/p-ping.mp3');
        gl.audio('nope', 'assets/explosion.mp3');
        gl.audio('blaster', 'assets/blaster.mp3');
        gl.audio('menu', 'assets/need_cells.mp3');
        gl.audio('disabled', 'assets/steps2.mp3');
        // TODO: add more sounds
        gl.audio('music', 'assets/music.mp3');

        gl.bitmapFont('inversionz', 'assets/inversionz.png',
                      'assets/inversionz.xml');
        // inversionz from https://www.dafont.com/inversionz.font
        //   convert -background none -fill black -font Inversionz.ttf \
        //           -pointsize 80 label:"-0123456789" inversionz.png
        // to extract, and later (tediously) generate the xml fnt file.

        WebFontConfig = {
            google: { families: ['Ubuntu'] }
        };
        gl.script('webfont',
                  '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

        call_on_url('contents.tsv', parse_questions);
    },
    create: function() {
        music = game.add.audio('music');
        music.onDecoded.add(() => music.play('', 0, 0.06, true), this);

        game.time.events.add(2000, () => game.state.start('intro'));
    },
};

// Read asynchronously the contents of local file fname and pass them
// to a callback if successful.
function call_on_url(fname, callback) {
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
    request.send();
}


// Parse tab-separated fields with contents and fill the questions object.
// questions = {c1: [{question: 'q1',                   // c1 -> category 1
//                    answers: ['a1r', 'a12', 'a13'],   // ar -> right answer
//                    comments: ['c1r', 'c12', 'c13'],
//                    image: 'img1'},
//                    ... ],
//               c2: [ ... ],
//               ... }
function parse_questions(text) {
    var questions = game.global.questions;  // shortcut
    var lines = text.replace(/\r/g, '').split('\n');
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
            if (img && img.startsWith('http'))
                img = get_url_fname(img);

            current_questions.push({question: fields[0],
                                    answers: fields.slice(1, 4),
                                    comments: fields.slice(4, 7),
                                    image: img});
        }
    }
    if (current_questions.length != 0)  // we are missing the last category
        questions[category] = current_questions; // save previous questions
}


// Return the file name from a url, unencoded.
function get_url_fname(url) {
    fname = img.split('/').slice(-1)[0];
    substitutions = [
        ['%20', ' '], ['%21', '!'], ['%22', '"'], ['%23', '#'], ['%24', '$'],
        ['%25', '%'], ['%26', '&'], ['%27', "'"], ['%28', '['], ['%29', ']'],
        ['%2C', ','], ['%C2%A9', '©'], ['%C3%B1', 'ñ']];
    for (var i = 0; i < substitutions.length; i++) {
        var [x, y] = substitutions[i];
        fname = fname.replace(x, y)
    }
    return fname;
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
        game.stage.backgroundColor = gg.color.background;
        var name = prompt('¡Hola!\n\n¿Cómo te llamas?\n', get_default_name());
        gg.name = name ? name.slice(0, 20) : 'persona anónima';
        game.state.start('menu');
    }
};


function get_default_name() {
    return game.rnd.pick([
        'RATS', 'Ada', 'Elaine Marley', 'Vera',
        'Leela', 'Bender', 'Dora la exploradora',
        'Leia', 'BB-8', 'K-2SO',
        'Wendy Freedman']);
}


//  ************************************************************************
//  *                                                                      *
//  *                                 Menu                                 *
//  *                                                                      *
//  ************************************************************************

var state_menu = {
    current_text: {},
    tutorial_texts: [],
    text_i: 0,
    create: function() {
        if (!all_categories_done()) {
            add_menu_background();
            add_remove_texts_layer();
            add_menu_header();
            add_category_buttons();
            add_info_button();
            if (!game.global.release)
                add_debug_button();
            this.tutorial_texts = get_tutorial_texts();
            this.text_i = 0;
            if (game.global.first_time) {
                this.current_text = add_dino_talk(
                    '¡Hola ' + game.global.name + '!\n' +
                        'Soy Tiranosara Rex, tu guía. Si quieres saber cómo ' +
                        'jugar puedes hacer click sobre mí.',
                    () => state_menu.tutorial());
                game.time.events.add(10000, () => this.current_text.destroy());
                game.global.first_time = false;
            }
            add_dino('bored1', () => this.tutorial());
        }
        else {
            game.state.start('final');
        }
    },
    remove_texts: function() {
        game.time.events.removeAll();

        if (this.current_text)
            this.current_text.destroy();
    },
    tutorial: function() {
        this.remove_texts();
        if (this.text_i < this.tutorial_texts.length)
            this.current_text = add_dino_talk(this.tutorial_texts[this.text_i++],
                                              () => state_menu.tutorial());
        else
            this.text_i = 0;
    }
};


function get_tutorial_texts() {
    return [
        ('Para jugar, ve eligiendo categorías. En cada categoría saldrán 5 ' +
         'preguntas elegidas al azar. ' +
         'Después de responder una pregunta aparecen dos nuevos botones:\n' +
         '  "?": saber más\n' +
         '  ">": continuar\n' +
         'En la pantalla de "saber más" toca en cualquier sitio para seguir.'),
        ('Cuanto más rápido respondas la pregunta, más puntos conseguirás. ' +
         'Superarás el reto si aciertas al menos 3 preguntas.\n' +
         '3 aciertos: medalla de bronce\n' +
         '4 aciertos: medalla de plata\n' +
         '5 aciertos: ¡medalla de oro!\n'),
        ('Puedes ver tus medallas dando al icono del trofeo, y puedes ' +
         'pausar el juego dando al icono de la casa que saldrá arriba.'),
        // Si tocas sobre una moneda podrás ver las respuestas.
        //     Pincha sobre este texto para seguir leyendo.
        ('Si quieres que vuelva a salir este tutorial, pincha sobre mí. ' +
         'Intenta no hacerme cosquillas 😉 ' +
         'Sin ciencia no hay futuro. No seas como mi especie. ¡Aprende ciencia!')];
}


// Return true only if all questions in all categories have been done.
function all_categories_done() {
    for (category in game.global.questions)
        if (!category_done(category))
            return false;
    return true;
}


function category_done(category) {
    var results = game.global.results;
    return category_started(category) &&
        questions_done(category).length === questions_selected(category).length;
}


function questions_done(category) {
    return game.global.results[category][1];
}


function questions_selected(category) {
    return game.global.results[category][0];
}

function category_started(category) {
    return Object.keys(game.global.results).indexOf(category) != -1;
}


function add_menu_background() {
    if (!game.global.debug)
        game.stage.backgroundColor = game.global.color.background;
    else
        game.stage.backgroundColor = 0xff0000;
}


function add_remove_texts_layer() {
    var bg = game.add.graphics();
    bg.beginFill(0xffffff, 0);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    bg.endFill();
    bg.inputEnabled = true;
    bg.events.onInputDown.add(() => state_menu.remove_texts());
}


function add_menu_header() {
    add_header_background();
    add_prizes_button();
    add_score();
    add_sound_button();
}


function add_category_buttons() {
    var y = 250;
    var delay_ms = 50;
    var gg = game.global;  // shortcut
    for (var category in gg.questions) {
        var element = {};
        if (!category_done(category)) {
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


// Return a function that, when called, starts asking questions of the
// given category (so, actually "playing").
function set_category_and_play(category) {
    return () => {
        game.global.current_category = category;

        if (category_started(category)) {
            recover_position(category);
            play();
        }
        else {
            select_new_questions(category);
            load_images();
            state_menu.remove_texts();
            add_dino_talk('Cargando información...');
            game.load.onLoadComplete.add(play, this);
        }
    };
}


function play() {
    if (!game.sound.noAudio)
        game.add.audio('menu', 0.05).play();
    game.state.start('play');
}


function recover_position(category) {
    var gg = game.global;  // shortcut
    gg.selected_questions = questions_selected(category);
    gg.current_question = questions_done(category).length;
}


function select_new_questions(category) {
    var gg = game.global;  // shortcut
    var questions = [];

    n_questions = gg.questions[category].length;

    if (gg.debug) {
        questions = range(n_questions);
    }
    else {
        questions = shuffle(range(n_questions));
        if (n_questions > gg.n_questions)
            questions = questions.slice(0, gg.n_questions);
    }

    gg.selected_questions = questions;
    gg.current_question = 0;
}


// Load the images that correspond to the currently selected questions.
function load_images() {
    var gg = game.global;  // shortcut
    var questions = gg.questions[gg.current_category];
    for (var i = 0; i < gg.selected_questions.length; i++) {
        var img = questions[gg.selected_questions[i]]['image'];
        game.load.image(img, 'assets/images_comments/' + img);
    }
    game.load.start();  // force loading (it's automatic only in preload())
}


//  ************************************************************************
//  *                                                                      *
//  *                                 Play                                 *
//  *                                                                      *
//  ************************************************************************

var state_play = {
    time0: 0,
    bar_time: {},
    buttons: [],
    right_answer: -1,
    question: {},
    dino: {},
    create: function() {
        add_play_background();
        add_play_header();
        add_progress();

        game.global.ticking = true;
        time0 = game.time.time;
        bar_time = add_bar_time();

        question = choose_question();
        if (question === undefined) {
            game.global.ticking = false;
            give_prize();
            return;
        }

        this.dino = add_dino('talk');
        game.time.events.add(3000, () => change_dino(this.dino, 'breathing'));
        game.time.events.add(18000, () => change_dino(this.dino, 'time'));
        add_dino_talk(question['question']);

        add_answers(250, question['answers'],
                    question['comments'], question['image']);
    },
    update: function() {
        if (!game.global.ticking)
            return;

        var fraction = (25 + (time0 - game.time.time) / 1000) / 25;
        if (fraction > 0) {
            game.global.points_extra = Math.floor(fraction * 100);
            bar_time.height = 0.83 * game.world.height * fraction;
            bar_time.y = 200 + 0.83 * game.world.height * (1 - fraction);
        }
        else if (fraction < -0.01) {
            var text = question['comments'][0];
            var img = question['image'];
            score_and_teach(0, game.add.audio('nope', 0.1), text, img)();
        }
    },
    show_correct: function() {
        for (var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].children[1].inputEnabled = false;
            if (i != this.right_answer)
                this.buttons[i].alpha = 0.2;
        }
    }
};


// Gives a category medal... if earned.
function give_prize() {
    var bg = add_play_background();
    bg.inputEnabled = true;
    bg.events.onInputDown.add(() => game.state.start('prizes'));
    var medal = add_medal(game.world.centerX, game.world.centerY - 100,
                          game.global.current_category,
                          result_goodness(game.global.current_category));
    medal.alpha = 0.2;
    maximize(medal);
    var more_info = '\n\nDale a cualquier medalla para repasar las respuestas.';
    if (result_goodness(game.global.current_category) <= 3) {
        add_dino('happy');
        add_dino_talk(game.rnd.pick([
            '¡Genial!', '¡Bravo!', '¡Estupendo!', '¡Qué guay!']) + more_info);
        game.add.tween(medal).to({alpha: 1}, 1000, null, true, 0, 0, false);
        var points = 300;
        game.global.score += points;
        show_earnings(points);  // after the others so it's not covered
    }
    else {
        add_dino('breathing');
        add_dino_talk(game.rnd.pick([
            'Otra vez será.', 'La próxima irá mejor.', '¡Ánimo!']) + more_info);
    }
}


function add_answers(y, answers, comments, image) {
    var audio_yes = game.add.audio('yes', 0.1);
    var audio_nope = game.add.audio('nope', 0.1);
    reorder = shuffle(range(answers.length));
    state_play.buttons = [];
    var delay_ms = 50;
    for (var i = 0; i < answers.length; i++) {
        var j = reorder[i];

        var points = (j === 0 ? 100 : -10);  // the 1st answer is the right one
        var audio = (j === 0 ? audio_yes : audio_nope);

        if (j === 0)
            state_play.right_answer = i;

        var color = game.global.color[game.global.current_category];
        state_play.buttons.push(add_button(color, y, answers[j],
                                score_and_teach(points, audio,
                                                comments[j], image),
                                delay_ms));
        delay_ms += 50;
        y += state_play.buttons[i].height + 50;
    }
}


// Add timer in the form of a bar that will shorten.
function add_bar_time() {
    var bar_time = game.add.graphics(0, 200);
    bar_time.beginFill(game.global.color.bar, 1);
    bar_time.lineStyle(2, 0x000000, 0.8);
    bar_time.drawRect(game.world.width - 40, 0, 30, game.world.height);
    bar_time.endFill();
    return bar_time;
}


// Add background image for the current category.
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
        'Medicina': 'cat_med',
        'Tecnología': 'cat_tech'}[game.global.current_category];
    var bg = game.add.sprite(game.world.centerX, game.world.centerY, bg_img);
    maximize(bg, true);
    bg.anchor.set(0.5);
    bg.alpha = 0.2;
    return bg;
}


function add_play_header() {
    add_header_background();
    add_home_button();
    add_score();
    add_sound_button();
}


function add_progress() {
    var [gg, gw] = [game.global, game.world];  // shortcuts
    var [done, total] = [gg.current_question + 1, gg.selected_questions.length];
    add_label(gw.width - 200, gw.height - 100, done + ' / ' + total);
}


// Increase the global score and show a text and image.
function score_and_teach(points, audio, txt, image) {
    return () => {
        var gg = game.global;  // shortcut
        gg.ticking = false;
        if (!game.sound.noAudio)
            audio.play();
        if (points > 0)
            points += gg.points_extra;
        gg.score += points;

        // Add points to the result of this question.
        if (!category_started(gg.current_category))
            gg.results[gg.current_category] = [gg.selected_questions.slice(),
                                               []];
        gg.results[gg.current_category][1].push(points);

        add_play_header();
        state_play.show_correct();

        if (points > 0)
            change_dino(state_play.dino, 'yes');
        else
            change_dino(state_play.dino, 'nope');

        game.time.events.removeAll();
        game.time.events.add(5000, () => game.state.start('play'), this);

        var group = game.add.group();
        var graphics_bg = game.add.graphics();
        graphics_bg.beginFill(0x000000, 1);
        graphics_bg.drawRoundedRect(-140, 360, 150, 400, 8);
        graphics_bg.endFill();
        var graphics = game.add.graphics();
        graphics.beginFill(gg.color.header, 1);
        graphics.drawRoundedRect(-150, 350, 150, 400, 8);
        graphics.endFill();
        var more = game.add.button(-110, 420, 'more',
                                   () => { game.time.events.events = [];
                                           teach(txt, image); },
                                   this, 1, 0, 2);
        var next = game.add.button(-110, 600, 'next',
                                   () =>  { game.time.events.events = [];
                                            game.state.start('play'); },
                                   this, 1, 0, 2);
        group.addMultiple([graphics_bg, graphics, more, next]);
        game.add.tween(group).to({x: 110}, 200, null, true, 0, 0);
        show_earnings(points);  // after the others so it's not covered
    }
}


// Show a screen with an image and a caption text. Whenever anything is
// touched it goes to the "Play" state. Normally used to teach about a subject.
function teach(txt, image, callback) {
    var bg = add_play_background();
    bg.inputEnabled = true;
    if (!callback)
        bg.events.onInputDown.add(() => game.state.start('play'));
    else
        bg.events.onInputDown.add(callback);

    var y_text = 50;
    if (image) {
        if (image.startsWith('http'))
            image = 'missing';
        var sprite = game.add.sprite(0, 0, image);
        maximize(sprite);
        y_text += sprite.y + sprite.height;
    }

    var text = game.add.text(
        game.world.centerX, y_text, txt,
        {fontSize: '32px', fill:'black', align: 'center',
         wordWrap: true, wordWrapWidth: 600});
    text.setShadow(0, 0, 'rgba(1, 1, 1, 0.3)', 10);
    text.anchor.setTo(0.5, 0);
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
        game.stage.backgroundColor = game.global.color.background;

        function next(x, y) {
            if (x > game.world.centerX)
                return [game.world.centerX / 2, y + 300];
            else
                return [3 * game.world.centerX / 2, y];
        }

        var [x, y] = [game.world.centerX / 2, 150];
        for (var category in game.global.questions) {
            var prize = add_prize(x, y, category, result_goodness(category));
            [x, y] = next(x, y);
        }

        add_button(game.global.color.default, y, 'Volver al menú',
                   () => { game.state.start('menu'); });
        add_button(game.global.color.default, y + 120, 'Ver puntuaciones máximas',
                   () => window.open('puntuaciones', '_blank'), 50);
    }
};


// Return 1 if gold-like, 2 silver-like, 3 for bronze-like and 4 for no prize.
function result_goodness(category) {
    var gg = game.global;  // shortcut
    if (Object.keys(gg.results).indexOf(category) === -1)
        return 4;
    var res = gg.results[category];
    var total_right = 0;
    for (var i = 0; i < res[1].length; i++)
        if (res[1][i] > 0)
            total_right++;
    var right = total_right / res[0].length;
    if (right >= 5/5)
        return 1;
    if (right >= 4/5)
        return 2;
    if (right >= 3/5)
        return 3;
    return 4;
}


function add_medal(x, y, category, goodness) {
    var image = {
        'Medicina': 'Premio_medicina',
        'Física': 'Premio_fisica',
        'Química': 'Premio_quim',
        'Tecnología': 'Premio_tecno',
        'Matemáticas': 'Premio_mates',
        'Ciencias Naturales': 'Premio_natu'}[category];
    image += (goodness <= 3) ? goodness : 3;
    var medal = game.add.sprite(x, y, image);
    if (goodness > 3)
        medal.alpha = 0.2;
    medal.anchor.set(0.5);
    return medal;
}


// Add an image with the prize that corresponds to a category and its name.
function add_prize(x, y, category, goodness) {
    var group = game.add.group();
    var prize = add_medal(x, y, category, goodness);
    prize.scale.set(0.35);
    if (category_done(category)) {
        prize.inputEnabled = true;
        prize.input.useHandCursor = true;
        prize.events.onInputDown.add(() => recap(category, 0));
    }
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
        var gg = game.global;  // shortcut
        game.stage.backgroundColor = gg.color.background;

        add_menu_header();

        function add_text(y, txt) {
            var text = add_label(game.world.centerX, y, txt);
            text.align = 'center';
            text.anchor.set(0.5);
        }

        add_dino('superhappy');
        var talk = add_dino_talk('¡¡¡Enhorabuena ' + gg.name + '!!!');

        var brag = ('He completado Ciencialas ' +
                    '(https://appsforscience.org/sdc/) y conseguido ' +
                    gg.score + ' puntos!').replace(/ /g, '%20');
        var tweet = 'https://twitter.com/intent/tweet?text=' + brag;

        function upload_score() {
            talk.destroy();
            add_dino_talk('Subiendo puntuación...');
            var params = ('?name=' + encodeURIComponent(gg.name) +
                          '&score=' + gg.score);
            call_on_url('puntuaciones/add' + params,
                        (text) => window.open('puntuaciones', '_self'));
        }
        var y = 300;
        add_button(gg.color.default, y, 'Subir puntuación a la web',
                   upload_score);
        add_button(gg.color.default, y + 175, 'Compartir en twitter',
                   () => window.open(tweet, '_blank'));
        add_button(gg.color.default, y + 2 * 175, 'Volver a jugar',
                   () => { global_reset(); game.state.start('menu'); });

        emit_medals();
    }
};


function emit_medals() {
    function next(x, y) {
        if (x > game.world.centerX)
            return [game.world.centerX / 2, y + 300];
        else
            return [3 * game.world.centerX / 2, y];
    }

    var [x, y] = [game.world.centerX / 2, 200];
    for (var category in game.global.questions) {
        make_particles(x, y, category, result_goodness(category));
        [x, y] = next(x, y);
    }
}


function make_particles(x, y, category, goodness) {
    var emitter = game.add.emitter(x, y, 5);

    var image = {
        'Medicina': 'Premio_medicina',
        'Física': 'Premio_fisica',
        'Química': 'Premio_quim',
        'Tecnología': 'Premio_tecno',
        'Matemáticas': 'Premio_mates',
        'Ciencias Naturales': 'Premio_natu'}[category];
    if (goodness > 3)
        return;

    image += goodness;
    emitter.makeParticles(image);

    emitter.setRotation(0, 0);
    emitter.setScale(0.5, 0.5, 0.5, 0.5);
    emitter.gravity = 200;

    emitter.start(false, 5000, 100, 5);
}


//  ************************************************************************
//  *                                                                      *
//  *                                Recap                                 *
//  *                                                                      *
//  ************************************************************************

function recap(category, question_index) {
    if (!category_done(category))
        return;

    var indices = questions_selected(category);
    if (question_index >= indices.length) {
        game.state.start('prizes');
        return;
    }

    var gg = game.global;  // shortcut
    var i = indices[question_index];
    var question = gg.questions[category][i];
    teach(question['comments'][0], question['image'],
          () => recap(category, question_index + 1));
}


//  ************************************************************************
//  *                                                                      *
//  *                               Credits                                *
//  *                                                                      *
//  ************************************************************************

var state_credits = {
    create: function() {
        var gg = game.global;  // shortcut
        game.stage.backgroundColor = gg.color.background;

        add_menu_header();

        function add_text(y, txt) {
            var text = add_label(game.world.centerX, y, txt);
            text.align = 'center';
            text.anchor.set(0.5);
        }

        add_dino('superhappy');
        var talk = add_dino_talk(
            'CIENCIALAS\n' +
             '\n' +
             'Un rato para conocer a tus científicas favoritas traído por\n' +
             '\n' +
             'Sara Gil Casanova\n' +
             'Fernando Liébana\n' +
             'Jordi Burguet Castell',
            () => { global_reset(); game.state.start('menu'); });
    },
};


//  ************************************************************************
//  *                                                                      *
//  *                              Utilities                               *
//  *                                                                      *
//  ************************************************************************

function add_dino(action, callback) {
    var dino = game.add.sprite(0, 0, action);
    dino.y = game.world.height - dino.height;
    var frames = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];
    dino.animations.add('play', frames);
    dino.animations.play('play', 10, true);

    if (callback) {
        dino.inputEnabled = true;
        dino.events.onInputDown.add(callback);
    }
    return dino;
}


// Add bubble with the text that dino is saying.
function add_dino_talk(text, callback) {
    var group = game.add.group();

    var bubble = game.add.graphics(0, 0);
    bubble.beginFill(0xffffff, 1);
    var qtext = add_label(game.world.centerX, 0, text);
    qtext.y = game.world.height - qtext.height - 250;
    bubble.x = qtext.x - qtext.width / 2 - 30;
    bubble.y = qtext.y - 10;
    bubble.lineStyle(4, 0x000000, 0.5);
    bubble.drawRoundedRect(0, 0, qtext.width + 60, qtext.height + 20, 9);
    bubble.alpha = 0.9;
    bubble.endFill();

    var line = game.add.graphics(0, 0);
    line.lineStyle(4, 0x000000, 0.5);
    line.moveTo(210, game.world.height - 130);
    line.quadraticCurveTo(qtext.x, game.world.height - 150,
                          qtext.x, qtext.y + qtext.height + 20);

    group.addMultiple([bubble, qtext, line]);
    var [w, h] = [group.width, group.height];
    group.width /= 10;
    group.height /= 10;
    group.x = 200;
    group.y = game.world.height - 200;
    game.add.tween(group).to({width: w, height: h, x: 0, y: 0},
                             400, null, true, 0, 0);
    bubble.inputEnabled = true;
    if (callback)
        bubble.events.onInputDown.add(callback);

    return group;
}


// Add a background for the header, with a small black shadow.
function add_header_background() {
    var graphics = game.add.graphics();
    graphics.beginFill(0x000000, 0.8);
    graphics.drawRect(0, 0, game.world.width, 140);
    graphics.beginFill(game.global.color.header, 1);
    graphics.drawRect(0, 0, game.world.width, 130);
    graphics.endFill();
}


// Add current score to the top-right, with nice letters.
function add_score() {
    var score =  game.add.bitmapText(game.world.width - 100, 30, 'inversionz',
                                     '' + game.global.score, 60);
    score.anchor.setTo(1, 0);
}


function add_home_button() {
    game.add.button(60, 40, 'home', () => game.state.start('menu'),
                    this, 1, 0, 1);
}


// Add sound on/off button.
function add_sound_button() {
    var img = game.add.sprite(game.width - 60, 50,
                              'speaker_' + (game.sound.noAudio ? 'off' : 'on'));
    function switch_audio() {
        game.sound.noAudio = !game.sound.noAudio;
        img.loadTexture('speaker_' + (game.sound.noAudio ? 'off' : 'on'));

        if (game.sound.noAudio)
            music.fadeOut();
        else
            music.play('', 0, 0.06, true);
    }

    img.inputEnabled = true;
    img.input.useHandCursor = true;
    img.events.onInputDown.add(switch_audio);
}


// Add prizes button.
function add_prizes_button() {
    var img = game.add.sprite(60, 30, 'prizes');

    img.inputEnabled = true;
    img.input.useHandCursor = true;
    img.events.onInputDown.add(() => game.state.start('prizes'));
}


// Add label at position x, y.
function add_label(x, y, txt) {
    var text = game.add.text(x, y, txt,
                             {font: 'Ubuntu', fontSize: 40, fill: 'black',
                              wordWrap: true, wordWrapWidth: 550,
                              align: 'center'});
    text.anchor.setTo(0.5, 0);
    return text;
}


function add_button_simple(color, x, y, text, on_click) {
    var group_button = game.add.group();

    var button_text = add_label(0, y, text);

    var w = button_text.width + 40;
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

    group_button.x = x;

    return group_button;
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
    var text = add_label(gw.centerX, gw.centerY,
                         (points >= 0 ? '+' : '') + points);
    text.fontSize = 100;
    text.fill = (points > 0) ? 'green' : 'red';
    text.anchor.set(0.5);
    game.add.tween(text).to({alpha: 0,
                             height: 5 * text.height,
                             width: 5 * text.width}, 1500, null, true);
}


// Change the animation that dino is doing.
function change_dino(dino, pose) {
    dino.loadTexture(pose);
    dino.y = game.world.height - dino.height;
    var frames = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];
    dino.animations.add('play', frames);
    dino.animations.play('play', 10, true);  // 10 fps, loop=true
}


// Add disabled button for a done category.
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


// Return array randomly shuffled.
function shuffle(aa) {
    var a = aa.slice();  // copy
    for (var i = 0; i < a.length; i++) {
        var j = rand(a.length);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


// Like python's range(n).
function range(n) {
    return new Array(n).fill().map((e, i) => i);
}


// Return a random number between 0 and n-1.
function rand(n) {
    return Math.floor(Math.random() * n);
}


// Add a button at the bottom of the screen that flips the debug mode.
function add_debug_button() {
    add_button(0xff0000, game.world.height - 100, 'DEBUG',
               () => { game.global.debug = !game.global.debug;
                       add_menu_background(); });
}


// Add a info button
function add_info_button() {
    add_button_simple(game.global.color.header,
               game.world.width - 40, game.world.height - 75, 'i',
               () => { game.state.start('credits'); });
}
