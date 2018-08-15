// Ciencialas, the quiz game!

var game = new Phaser.Game(720, 1280, Phaser.AUTO, 'game');

game.global = {
    name: '',  // player's name
    score: 0,  // current score
    points_extra: 0,  // extra points to add to a correct answer
    questions: {},    // {category: [{question: q, answers: [a1, a2, a3],
                      //              comments: [c1, c2, c3], image: i},
                      //              ...], ...}
    results: {},      // {category: [[question_index, ...], [points_won, ...]}
    current_category: '',
    selected_questions: [],  // indices of questions for the current category
    current_question: 0,
    n_questions: 5,    // number of questions per category
    ticking: false,    // is the clock ticking for the remaining time bar?
    debug: false,      // are we in debug-mode?
    first_time: true,  // is it the first time we play?
    release: true,    // to remove debugging stuf (for a release)
    color: {  // our palette
        'default': 0xaeaeae,
        'background': 0xd0d0d0,
        'header': 0x83de83,
        'bar': 0xfbc52c,
        'Química': 0xffccaa,
        'Matemáticas': 0xffeeaa,
        'Física': 0xf38181,
        'Ciencias Naturales': 0xdde9af,
        'Tecnología': 0xe3d7f4,
        'Medicina': 0xd5f6ff },
};

function global_reset() {
    game.global.score = 0;
    game.global.results = {};
}

game.state.add('boot', state_boot);
game.state.add('load', state_load);
game.state.add('intro', state_intro);
game.state.add('menu', state_menu);
game.state.add('play', state_play);
game.state.add('prizes', state_prizes);
game.state.add('final', state_final);
game.state.add('credits', state_credits);

game.state.start('boot');
