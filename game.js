// Prototype for ScienceQuiz, the quiz game!

var game = new Phaser.Game(800, 800, Phaser.AUTO, 'game');
// use 720x1280 instead of 800x800?

game.global = {
    name: '',
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
game.state.add('intro', state_intro);
game.state.add('menu', state_menu);
game.state.add('play', state_play);
game.state.add('final', state_final);

game.state.start('load');
