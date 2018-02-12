all:
	@echo make upload - uploads the game to appsforscience.org
	@echo make zip - creates a zip that can be used with cocoon

upload:
	rsync -azv -e ssh *.html *.css *.js *.tsv assets puntuaciones \
	    bb:/var/www/appsforscience.org/sdc

zip:
	rm -f sdc.zip
	find . -name '*.jpg' -or -name '*.png' -or -name '*.mp3' -or -name '*.xml' \
	   -or -name '*.js' -or -name '*.html' | zip sdc -@
