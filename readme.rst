Prototipo para Science Quiz
===========================

Prototipo usando phaser en lugar de godot.

El `phaser.js` que usamos es el que viene del "community edition"
v.2.10.0, y antes lo incluíamos así::

  <script src="//cdn.jsdelivr.net/npm/phaser-ce@2.10.0"></script>

En lugar de usar la versión minificada, para el desarrollo usamos una
copia local de::

  https://cdn.jsdelivr.net/npm/phaser-ce@2.10.0/build/phaser.js

También usamos el plugin `Phaser Input`_, y tenemos una copia local
para el desarrollo.

.. _`Phaser Input`: https://github.com/orange-games/phaser-input


Ejecutar
--------

Una forma rápida es tener abierto un servidor local
(http://localhost:8000), por ejemplo ejecutando desde este
directorio::

  python3 -m http.server


Ejemplos
--------

* https://phaser.io/examples


Referencia
----------

* https://phaser.io/docs/2.6.2/
* https://photonstorm.github.io/phaser-ce/


Contenido
---------

Las preguntas por categoría están en una hoja de cálculo:
https://docs.google.com/spreadsheets/d/13fWnAzvhiCUsWbc_UEmR2k2NIl6-9XUq_8S_ovVuz-I/edit#gid=0
. Salvada como tsv (tab-separated values) y renombrada a
`contents.tsv`.

Las imágenes grandes se pueden convertir a un tamaño razonable con::

  convert -resize 400 img_big.jpg img.jpg


Compilación para Android con Cocoon
-----------------------------------

Instrucciones en http://www.emanueleferonato.com/2017/11/01/step-by-step-guide-to-create-android-native-games-in-html5-with-cocoon-io-and-without-android-studio/

Resumen:

- Incluir en index.html la línea: "<script src="cordova.js"></script>" antes que cualquier otro script
- Añadir en la carpeta principal el archivo cordova.js (descargable en https://github.com/apache/cordova-js/blob/master/src/cordova.js)
- Crear un fichero zip y subir a Cocoon



Herramientas colaborativas
--------------------------

* Borrador preguntas - https://docs.google.com/spreadsheets/d/1h3KgxQoQhvGUW2ph2jCXoCwTmlB7LuenmH0La0JTmjU/edit#gid=0
* Preguntas - https://docs.google.com/spreadsheets/d/13fWnAzvhiCUsWbc_UEmR2k2NIl6-9XUq_8S_ovVuz-I/edit#gid=0
* Slack - https://appsforscience.slack.com/messages
* Waffle - https://waffle.io/appsforscience/ScienceQuiz
