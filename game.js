// Prototype for ScienceQuiz, the quiz game!

var game = new Phaser.Game(720, 1280, Phaser.AUTO, 'game');

game.global = {
    name: '',
    score: 0,
    points_extra: 0,
    questions: {},
    results: {},
    current_category: '',
    selected_questions: [],
    current_question: 0,
    ticking: false,
    color: {
        'default': 0xaeaeae,
        'background': 0xd0d0d0,
        'header': 0x83de83,
        'bar': 0xfbc52c,
        'Química': 0xffccaa,
        'Matemáticas': 0xffeeaa,
        'Física': 0xf38181,
        'Ciencias Naturales': 0xdde9af,
        'Tecnología': 0xe3d7f4,
        'Astronomía': 0xd5f6ff },
};

function global_reset() {
    game.global.score = 0;
    game.global.results = {};
}

game.state.add('load', state_load);
game.state.add('intro', state_intro);
game.state.add('pretutorial', state_pretutorial);
game.state.add('tutorial', state_tutorial);
game.state.add('menu', state_menu);
game.state.add('play', state_play);
game.state.add('prizes', state_prizes);
game.state.add('final', state_final);

game.state.start('load');
