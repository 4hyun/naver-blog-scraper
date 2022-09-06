import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectBrowser } from 'nest-puppeteer';
import { Browser } from 'puppeteer';

import { NAVER_BLOG_URL } from '../naver-blog-scraper/lib/naver-blog-scraper';
import { TOCTitleFactory } from './classes/TOCTitle';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT_TOC_TITLES } from './constants/page-object';
import { StorageService } from 'src/storage/storage.service';
import * as cheerio from 'cheerio';

const MAIN_IFRAME_SELECTOR = 'iframe#mainFrame';
const TOC_DATA_PATH = '/scraped/toc.json';
const SKIP_TOC = ['23'];

@Injectable()
export class ScraperService {
  constructor(
    @InjectBrowser() private readonly browser: Browser,
    private tocTitle: TOCTitleFactory,
    private storageService: StorageService,
  ) {}

  async scrapeBlog() {
    const createTocTitle = this.tocTitle.create;
    const version = await this.browser.version();
    const page = await this.browser.newPage();
    await page.goto(NAVER_BLOG_URL);
    await page.screenshot({ path: 'screenshot.png' });
    const mainIframeElement = await page.$(MAIN_IFRAME_SELECTOR);
    const mainIframe = await mainIframeElement.contentFrame();

    // const iframeContent = await mainIframe.content();

    page.on('console', (msg) => console.log('msg.args: ', msg.text()));

    const rootTitles = await mainIframe.$$eval(ROOT_TOC_TITLES, ($elems) => {
      return $elems.map(($elem, i) => {
        const [$anchor, $postCount] = $elem.children;

        const categoryId = $anchor.id.replace('category', '');

        const href = $anchor.getAttribute('href').trim();

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
              return $childrenTitles.map(($childTitle) => {
                const [$anchor, $postCount] = $childTitle.children;

                const categoryId = $anchor.id.replace('category', '');

                const href = $anchor.getAttribute('href').trim();

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

    await getChildrenTitles();
    const rootTOCTitlesFiltered = rootTOCTitles.filter(
      ({ categoryId }) => !SKIP_TOC.includes(categoryId),
    );
    const disk = this.storageService.getDisk('local');
    await disk.put(TOC_DATA_PATH, JSON.stringify(rootTOCTitlesFiltered));

    // const samplePost = posts[1];
    const topLevelTitles = await this.getTitlesFromFile();
    const scrapePostsAndSave = async () => {
      let baseUrl = '';
      const isBaseUrlEmpty = () => {
        if (typeof baseUrl !== 'string')
          throw new InternalServerErrorException();
        if (baseUrl.length === 0) return true;
        return false;
      };
      const setBaseUrl = (url: string) => {
        const urlObj = new URL(url);
        const { protocol, host } = urlObj;
        baseUrl = `${protocol}//${host}`;
        console.log('SET_BASEURL : ', baseUrl);
      };
      // const testPage = await this.browser.newPage();
      // const mainIframe = testPage;
      for (const title of topLevelTitles) {
        if (isBaseUrlEmpty()) setBaseUrl(mainIframe.url());

        for (const child of title.children) {
          const titleLink = baseUrl + child.href;
          await mainIframe.goto(titleLink);
          console.log('DEBUG testPage url : ', mainIframe.url(), '\n');
          /*         await mainIframe.page().screenshot({ path: 'sample-post-page.png' }); */

          const getPostDataOnInnerPage = async (pageIndex = '1') => {
            const mainIframeElement = await page.$(MAIN_IFRAME_SELECTOR);
            const mainIframe = await mainIframeElement.contentFrame();
            const postsHtmlList = await mainIframe.$$eval(
              'div#postListBody > div.post._post_wrap > div.post-back',
              ($posts) => {
                console.log('$posts count : ', $posts.length);
                return $posts.map(($post, i) => {
                  return {
                    html: $post.innerHTML,
                  };
                });
              },
            );

            const postData = postsHtmlList.map(({ html }) => {
              const getPostId = () => {
                const $ = cheerio.load(html);

                let postUrl = $('input.copyTargetUrl').val();
                if (Array.isArray(postUrl)) postUrl = postUrl[0];
                return postIdFromUrl(postUrl);
              };
              const postId = getPostId();
              const file = `/scraped/post-${postId}.json`;
              const $ = cheerio.load(html);
              const title = $('.htitle > span.itemSubjectBoldfont').text();
              const cHeadingTitle = $('#postViewArea .c-heading__title').text();
              const cHeadingContent = $(
                '#postViewArea .c-heading__content',
              ).text();
              // debugGetPostContent({ title, cHeadingTitle, cHeadingContent, postId });
              return {
                postId,
                file,
                title,
                cHeadingTitle,
                cHeadingContent,
                html,
              };
            });

            return postData;
          };

          const postData = await getPostDataOnInnerPage();
          console.log(
            `postData on innerPage of titlePage "${child.title}"`,
            postData.length,
          );
        }

        return;
        /*         const writePostDataToFile = async (posts: any[]) => {
          posts.map(async (data) => {
            await disk.put(data.file, JSON.stringify(data));
          });
        };
        await writePostDataToFile(postData); */
      }
    };

    await scrapePostsAndSave();

    return { result: { toc: rootTOCTitles } };
  }

  async getTitlesFromFile(): Promise<any[]> {
    console.log('WIP >> will sample scrape 1 post from toc.json');
    const disk = this.storageService.getDisk('local');
    const { content } = await disk.get(TOC_DATA_PATH);
    const json = JSON.parse(content);
    // console.log('json: ', json);
    return json;
  }
}

function debugGetPostContent({
  cHeadingTitle,
  cHeadingContent,
  title,
  postId,
}) {
  console.log('postId: ', postId);
  console.log('title: ', title);
  console.log('cHeadingTitle: ', cHeadingTitle);
  console.log('cHeadingContent: ', cHeadingContent);
}

function postIdFromUrl(url: string) {
  console.log('postIdFromUrl() url argument: ', url);
  return url.split('/').pop();
}
