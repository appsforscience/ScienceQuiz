// Prototipo del juego ScienceQuiz.

var score = 0;

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');

game.global = {
    score: 0,
    questions: {},
    current_category: "",
    selected_questions: [],
    current_question: 0,
};

game.state.add('load', state_load);
game.state.add('menu', state_menu);
game.state.add('play', state_play);

game.state.start('load');
