all: upload

upload:
	rsync -azv -e ssh *.html *.js *.tsv assets bb:/var/www/metamagical.org/phaser
