#!/usr/bin/env python3
# -*- python -*-

import cgi

print('Content-Type: text/html\n')


def main():
    send(head)

    for score, name in sorted(get_results(), reverse=True):
        send("""
    <div class="result">
      <div class="name">%s</div>
      <div class="points">%s</div>
    </div>
    """ % (name, score))

    send(tail)


def send(text):
    "Return text with all non-ascii characteres converted to html escape codes"
    print(text.encode('ascii', 'xmlcharrefreplace').decode('ascii'))
    # Got it from: https://wiki.python.org/moin/EscapingHtml


def get_results():
    "Return a set with all the (score, name) tuples read from results.txt"
    results = set()
    for line in open('results.txt'):
        fields = line.strip().split('\t')
        if len(fields) == 2:
            try:
                results.add( (int(fields[1]), fields[0]) )
            except:
                pass
    return results


head = """<!doctype html>
<html>
<head>
  <title>Resultados de ¿Sabes De Ciencia?</title>
<link rel="stylesheet" href="../main.css" />
  <link rel="icon" type="image/png" href="../assets/favicon.png" />
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no" />
  <meta name="description" content="¿Sabes de Ciencia? Una app de divulgación científica realizada por Jordi Burguet, Fernando Liébana y Sara Gil. ¡Apps for Science!" />
  <meta name="keywords" content="ciencia,quiz,app" />
  <meta name="author" content="Sara Gil Casanova, Fernando Liebana Bernardez y Jordi Burguet Castell" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@appsforscience_" />
  <meta name="twitter:creator" content="@sagilca" />
  <meta name="twitter:title" content="¿Sabes de Ciencia?" />
  <meta name="twitter:description" content="¿Sabes de Ciencia? Una app de divulgación científica." />
  <meta name="twitter:image" content="http://appsforscience.org/sdc/assets/banner.png" />
  <meta property="og:image" content="http://appsforscience.org/sdc/assets/banner.png" />
  <meta property="og:image:width" content="512" />
  <meta property="og:image:height" content="250" />
  <meta property="og:title" content="¿Sabes de Ciencia?"/ />
  <meta property="og:description" content="¿Sabes de Ciencia? Una app de divulgación científica realizada por Jordi Burguet, Fernando Liébana y Sara Gil. ¡Apps for Science!" />
</head>
<body>

  <h1>¡Puntuaciones Máximas!</h1>

  <h2><a href="/sdc/index.html">¿Sabes de Ciencia?</a></h2>
"""


tail = """
  <!-- Global site tag (gtag.js) - Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=UA-113870937-1"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'UA-113870937-1');
  </script>

</body>
</html>
"""


if __name__ == '__main__':
    main()
