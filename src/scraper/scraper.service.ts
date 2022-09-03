import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectBrowser } from 'nest-puppeteer';
import { title } from 'process';
import { Browser } from 'puppeteer';

import { NAVER_BLOG_URL } from '../naver-blog-scraper/lib/naver-blog-scraper';
import { TOCTitleFactory } from './classes/TOCTitle';
import { ROOT_TOC_TITLES } from './constants/selectors';
import * as fs from 'fs';
import * as path from 'path';

const TOC_DATA_PATH = '/scraped/toc.json';

@Injectable()
export class ScraperService {
  constructor(
    @InjectBrowser() private readonly browser: Browser,
    private tocTitle: TOCTitleFactory,
  ) {}

  async scrapeBlog() {
    const createTocTitle = this.tocTitle.create;
    const version = await this.browser.version();
    const page = await this.browser.newPage();
    await page.goto(NAVER_BLOG_URL);
    await page.screenshot({ path: 'screenshot.png' });
    const mainIframeElement = await page.$('iframe');
    const mainIframe = await mainIframeElement.contentFrame();

    // const iframeContent = await mainIframe.content();

    page.on('console', (msg) => console.log('msg.args: ', msg.text()));

    const rootTitles = await mainIframe.$$eval(ROOT_TOC_TITLES, ($elems) => {
      return $elems.map(($elem, i) => {
        const [$anchor, $postCount] = $elem.children;

        const categoryId = $anchor.id.replace('category', '');

        const href = $anchor.getAttribute('href');

        const postCount = `${
          $postCount == null ? '(0)' : $postCount.textContent
        }`
          .replace('(', '')
          .replace(')', '');
        const titleText = $anchor.textContent.trim();

        // TOC title
        const rootTitle = {
          title: titleText,
          href,
          total: postCount,
          categoryId,
        };

        return rootTitle;
      });
    });

    const rootTOCTitles = rootTitles.map((title) => {
      const tocTitle = this.tocTitle.create(title);
      return tocTitle;
    });

    /** This method sets `children` property on the Root TOC Titles scraped prior */
    const getChildrenTitles = async () => {
      return await Promise.all(
        rootTOCTitles.map(async (tocTitle) => {
          const childrenTitles = await mainIframe.$$eval(
            tocTitle.getChildrenTitleCssSelector(),
            ($childrenTitles) => {
              // console.log('$childrenTitles.length: ', $childrenTitles.length);
              return $childrenTitles.map(($childTitle) => {
                const [$anchor, $postCount] = $childTitle.children;

                const categoryId = $anchor.id.replace('category', '');

                const href = $anchor.getAttribute('href');

                const postCount = `${
                  $postCount == null ? '(0)' : $postCount.textContent
                }`
                  .replace('(', '')
                  .replace(')', '');
                const titleText = $anchor.textContent.trim();

                // TOC title
                const childTitle = {
                  title: titleText,
                  href,
                  total: postCount,
                  categoryId,
                };

                return childTitle;
              });
            },
          );
          if (childrenTitles.length > 0)
            tocTitle.setChildren(childrenTitles.map(createTocTitle));

          return tocTitle;
        }),
      );
    };

    const childrenTitles = await getChildrenTitles();

    this.saveToFile(TOC_DATA_PATH, JSON.stringify(rootTOCTitles));

    return { result: { toc: rootTOCTitles } };
  }

  saveToFile(file: string, data: string) {
    const filepath = path.resolve(__dirname + file);
    console.log('filepath using `path`: ', filepath);
    try {
      fs.writeFileSync(filepath, data);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error saving scraped data to file.',
      );
    }
  }
}

function getTOCLinkElement() {}
