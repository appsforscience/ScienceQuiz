#!/usr/bin/env python3

"""
Read image urls from contents.tsv, download them and convert them
to width 300px.
"""

import os
import subprocess as sp


def main():
    download_new_images()
    resize_all_images()
    compare_expected_files()


def download_new_images():
    for url in get_contents_urls():
        fname = get_fname(url)
        if not os.path.exists(fname):
            print('-- Downloading new file:', fname)
            sp.call(['wget', '-nv', url])


def resize_all_images():
    for fname in os.listdir('.'):
        if is_image(fname):
            if get_size(fname)[0] != 300:
                print('-- Converting to 300px width:', fname)
                sp.call(['convert', '-verbose', '-resize', '300', fname, fname])
            else:
                print('-- Already has 300px width:', fname)
        else:
            print('-- Not an image:', fname)


def compare_expected_files():
    expected = ({get_fname(url) for url in get_contents_urls()} |
                set(get_contents_fnames()))
    existing = set(os.listdir('.')) - {'.', '..', 'get_images.py'}
    missing = expected - existing
    if missing:
        print('-- Expected files that are missing (why?):')
        for fname in missing:
            print(' ', fname)
    unexpected = existing - expected
    if unexpected:
        print('-- Unexpected existing files (probably legacy, "git rm" them):')
        for fname in unexpected:
            print(' ', fname)


def get_contents_urls():
    "Return a list of the urls in contents.tsv"
    urls = []
    for line in open('../../contents.tsv'):
        fields = line.split('\t')
        if len(fields) >= 8 and fields[7].startswith('http'):
            urls.append(fields[7].strip())
    return urls


def get_contents_fnames():
    "Return a list of the file names in contents.tsv"
    exclude = {'Imagen'}
    fnames = []
    for line in open('../../contents.tsv'):
        fields = line.split('\t')
        if len(fields) >= 8:
            img = fields[7]
            if img and not img.startswith('http') and img not in exclude:
                fnames.append(img)
    return fnames


def get_fname(url):
    return url_decode(url.rsplit('/', 1)[-1])


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
    "Return True if file fname is an image"
    mime = sp.check_output(['file', '--mime-type', fname]).split()[-1]
    return mime.decode('utf8').startswith('image/')


def get_size(fname):
    "Return (width, height) of the image in fname"
    fields = sp.check_output(['file', fname]).split(b',')
    # Depending on the image type, the command "file" says the size at...
    for ext, pos in [('jpg', -2), ('jpeg', -2), ('png', -3), ('gif', -1)]:
        if fname.lower().endswith('.' + ext):
            size = fields[pos].split(b'x')  # '300x200' -> ['300', '200']
            return (int(size[0]), int(size[1]))
    return (None, None)



if __name__ == '__main__':
    main()
