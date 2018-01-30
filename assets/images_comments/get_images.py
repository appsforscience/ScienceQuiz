#!/usr/bin/env python3

"""
Read image urls from contents.tsv, download them and convert them
to widht 300px.
"""

import os
import subprocess as sp


def main():
    for url in get_urls():
        fname = url_decode(url.rsplit('/', 1)[-1])
        if not os.path.exists(fname):
            sp.call(['wget', '-nv', url])

        if is_image(fname):
            sp.call(['convert', '-verbose', '-resize', '300', fname, fname])
        else:
            print('Not an image:', fname)


def get_urls():
    "Return a list of the urls in contents.tsv"
    urls = []
    for line in open('../../contents.tsv'):
        fields = line.split('\t')
        if len(fields) >= 8 and fields[7].startswith('http'):
            urls.append(fields[7].strip())
    return urls


def url_decode(txt):
    "Return text with all url escape charaters converted to normal"
    for esc, c in [
            ('%20', ' '),
            ('%21', '!'),
            ('%22', '"'),
            ('%23', '#'),
            ('%24', '$'),
            ('%25', '%'),
            ('%26', '&'),
            ('%27', "'"),
            ('%28', '('),
            ('%29', ')'),
            ('%2C', ','),
            ('%C2%A9', '©'),
            ('%C3%B1', 'ñ')]:
        txt = txt.replace(esc, c)
    return txt


def is_image(fname):
    mime = sp.check_output(['file', '--mime-type', fname]).split()[-1]
    return mime.decode('utf8').startswith('image/')



if __name__ == '__main__':
    main()
