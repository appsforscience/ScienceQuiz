// Prototype for ScienceQuiz, the quiz game!

var game = new Phaser.Game(720, 1280, Phaser.AUTO, 'game');

game.global = {
    score: 0,
    questions: {},
    done_categories: [],
    current_category: "",
    selected_questions: [],
    current_question: 0,
};

function global_reset() {
    game.global.score = 0;
    game.global.done_categories = [];
}

game.state.add('load', state_load);
game.state.add('menu', state_menu);
game.state.add('play', state_play);
game.state.add('final', state_final);

game.state.start('load');
