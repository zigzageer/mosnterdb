#!/usr/bin/env python3
"""Download product-linked images from Monster's U.S. listing for review.

Respects the inherited proxy and TLS trust. A policy denial is an error, not
permission to bypass the proxy. Generated candidates do not modify the catalog.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

LISTING = 'https://www.monsterenergy.com/en-us/energy-drinks/'
PRODUCT_PATH = re.compile(r'^/en-us/energy-drinks/[^/]+/[^/]+/?$')


def product_url(value):
    url = urljoin(LISTING, unescape(value))
    parsed = urlsplit(url)
    if parsed.hostname == 'www.monsterenergy.com' and PRODUCT_PATH.fullmatch(parsed.path):
        return parsed._replace(query='', fragment='').geturl().rstrip('/') + '/'


def image_url(value):
    url = urljoin(LISTING, unescape(value))
    parsed = urlsplit(url)
    if parsed.scheme == 'https' and parsed.hostname and parsed.hostname.endswith('.monsterenergy.com'):
        if re.search(r'\.(?:png|webp|jpe?g)(?:$|[?&])', url, re.I):
            return url


class ListingParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.current = None
        self.products = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a':
            self.current = product_url(attrs.get('href', ''))
            if self.current:
                self.products.setdefault(self.current, set())
        if tag == 'img' and self.current:
            candidates = [attrs.get('src', ''), attrs.get('data-src', '')]
            for key in ['srcset', 'data-srcset']:
                candidates.extend(part.strip().split(' ')[0] for part in attrs.get(key, '').split(',') if part.strip())
            for value in candidates:
                url = image_url(value)
                if url:
                    self.products[self.current].add(url)

    def handle_endtag(self, tag):
        if tag == 'a':
            self.current = None


def fetch(url, limit=12_000_000):
    request = Request(url, headers={'User-Agent': 'MonsterDB product-image research (independent fan archive)'})
    with urlopen(request, timeout=30) as response:
        data = response.read(limit + 1)
        if len(data) > limit:
            raise ValueError(f'Image/page exceeds {limit} bytes: {url}')
        return data


def scrape(output):
    html = fetch(LISTING).decode('utf-8')
    parser = ListingParser()
    parser.feed(html)
    # Product links can also occur in the page's serialized hydration data.
    normalized = unescape(html).replace('\\/', '/')
    for match in re.finditer(r'(?:https://www\.monsterenergy\.com)?(/en-us/energy-drinks/[^/"\s<>]+/[^/"\s<>]+/)', normalized):
        url = product_url(match.group(0))
        if url:
            parser.products.setdefault(url, set())
    if not parser.products:
        raise ValueError('No product links were found; the site markup may have changed. Existing catalog is untouched.')
    output.mkdir(parents=True, exist_ok=True)
    urls = sorted({url for images in parser.products.values() for url in images})
    downloads = {}

    def download(url):
        data = fetch(url)
        if data.startswith(b'\x89PNG\r\n\x1a\n'):
            ext = '.png'
        elif data.startswith(b'RIFF') and data[8:12] == b'WEBP':
            ext = '.webp'
        elif data.startswith(b'\xff\xd8\xff'):
            ext = '.jpg'
        else:
            raise ValueError(f'Unexpected image format: {url}')
        filename = hashlib.sha256(url.encode()).hexdigest()[:20] + ext
        (output / filename).write_bytes(data)
        return url, filename

    with ThreadPoolExecutor(max_workers=3) as pool:
        for url, filename in pool.map(download, urls):
            downloads[url] = filename
            print(f'Downloaded {len(downloads)}/{len(urls)}', flush=True)
    report = {'listingUrl': LISTING, 'fetchedAt': datetime.now(timezone.utc).isoformat(),
              'productCount': len(parser.products), 'imageCount': len(downloads),
              'products': [{'productUrl': url, 'images': [{'source': image, 'file': downloads[image]} for image in sorted(images)]}
                           for url, images in sorted(parser.products.items())],
              'reviewRequired': 'These are listing-linked image candidates, not a completeness claim about historical editions. Products with no parsed image need a detail-page review. Review identities before updating the catalog and append new tracking IDs.'}
    (output / 'listing.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Captured {len(parser.products)} product records and {len(downloads)} images in {output}.')


def scrape_public_snapshot(output):
    source = 'https://raw.githubusercontent.com/forsmark/monster-mash/main/src/data/flavors.json'
    products = json.loads(fetch(source).decode('utf-8'))
    if not products or not isinstance(products, list):
        raise ValueError('The public dataset did not contain product records.')
    output.mkdir(parents=True, exist_ok=True)

    def download(product):
        relative = product.get('image', '')
        if not re.fullmatch(r'cans/[a-z0-9-]+\.webp', relative) or not product_url(product.get('url', '')):
            raise ValueError('Unexpected public dataset record; review before downloading.')
        url = 'https://raw.githubusercontent.com/forsmark/monster-mash/main/public/' + relative
        data = fetch(url)
        if not (data.startswith(b'RIFF') and data[8:12] == b'WEBP'):
            raise ValueError('Public dataset photo is not a WebP: ' + url)
        filename = Path(relative).name
        (output / filename).write_bytes(data)
        return {'officialId': product['id'], 'name': product['name'], 'productUrl': product['url'],
                'originalImageUrl': product['sourceImage'], 'retrievedFrom': url, 'file': filename,
                'sha256': hashlib.sha256(data).hexdigest()}

    with ThreadPoolExecutor(max_workers=3) as pool:
        records = list(pool.map(download, products))
    report = {'source': source, 'fetchedAt': datetime.now(timezone.utc).isoformat(),
              'verification': 'Fresh download of a public mirrored listing and its images, not a fresh request to the Monster website.',
              'productCount': len(records), 'products': records}
    (output / 'listing.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Downloaded all {len(records)} product photos in the public U.S. listing to {output}.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', choices=['official', 'public-snapshot'], default='official')
    parser.add_argument('--output', type=Path, default=Path('.image-research/official-us'))
    args = parser.parse_args()
    try:
        (scrape_public_snapshot if args.source == 'public-snapshot' else scrape)(args.output)
    except Exception as error:
        print(f'Official scrape failed: {error}\nNo catalog entries were changed. Preserve TLS and request destination access if network policy denied it.', file=sys.stderr)
        sys.exit(1)
