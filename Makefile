all: upload

upload:
	rsync -azv -e ssh *.html *.js *.tsv assets bb:/var/www/metamagical.org/phaser

zip:
	rm -f science_quiz.zip
	find . -name '*.jpg' -or -name '*.png' -or -name '*.mp3' -or -name '*.xml' \
		   -or -name '*.js' -or -name '*.html' | zip science_quiz -@
