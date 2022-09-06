import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectBrowser } from 'nest-puppeteer';
import { Browser } from 'puppeteer';

import { NAVER_BLOG_URL } from '../naver-blog-scraper/lib/naver-blog-scraper';
import { TOCTitleFactory } from './classes/TOCTitle';
import { ROOT_TOC_TITLES } from './constants/page-object';
import { StorageService } from 'src/storage/storage.service';
import * as cheerio from 'cheerio';

const MAIN_IFRAME_SELECTOR = 'iframe#mainFrame';
const POSTS_FROM_CHILD_TITLE_PAGE_SELECTOR =
  'div#postListBody > div.post._post_wrap > div.post-back';
const PAGINATION_WRAPPER_SELECTOR = 'div.wrap_blog2_paginate';
const PAGINATION_ITEMS_SELECTOR = 'div.blog2_paginate > a.page';
const NEXT_PAGE_ITEM_SELECTOR = 'div.blog2_paginate > strong.page + a';
const PAGINATION_ITEMS_NEXT_SET = 'div.blog2_paginate > a.next';
const TOC_DATA_PATH = '/scraped/toc.json';
const SKIP_TOC = ['23'];

@Injectable()
export class ScraperService {
  constructor(
    @InjectBrowser() private readonly browser: Browser,
    private tocTitle: TOCTitleFactory,
    private storageService: StorageService,
  ) {}

  async writePostDataToFile(posts: any[]) {
    posts.map(async (data) => {
      const disk = this.storageService.getDisk('local');
      await disk.put(data.file, JSON.stringify(data));
    });
  }

  async scrapeBlog() {
    const createTocTitle = this.tocTitle.create;
    const version = await this.browser.version();
    const page = await this.browser.newPage();
    const postPage = await this.browser.newPage();
    await page.goto(NAVER_BLOG_URL);
    await page.screenshot({ path: 'screenshot.png' });
    const mainIframeElement = await page.$(MAIN_IFRAME_SELECTOR);
    const mainIframe = await mainIframeElement.contentFrame();

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

    const tableOfContentsRootTitles = rootTitles.map((title) => {
      const tocTitle = this.tocTitle.create(title);
      return tocTitle;
    });

    /** This method sets `children` property on the Root TOC Titles scraped prior */
    const loopTableOfContentsRootTitles = (
      fn: (...args: any[]) => Promise<any>,
    ) => {
      return tableOfContentsRootTitles.map(fn);
    };

    const mapChildrenValueOfTableOfContentsRootTitle = async (tocTitle) => {
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
    };

    const getChildrenOfRootTitles = async () => {
      await Promise.all(
        loopTableOfContentsRootTitles(
          mapChildrenValueOfTableOfContentsRootTitle,
        ),
      );
    };
    await getChildrenOfRootTitles();

    const filteredRootTitles = tableOfContentsRootTitles.filter(
      ({ categoryId }) => !SKIP_TOC.includes(categoryId),
    );
    const disk = this.storageService.getDisk('local');
    await disk.put(TOC_DATA_PATH, JSON.stringify(filteredRootTitles));

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
      };

      //* Loop Root Titles
      for (const title of topLevelTitles) {
        let breakLoop = false;
        const setBreakLoop = (v: boolean) => (breakLoop = v);
        // console.log('DEBUG title : ', title);
        if (isBaseUrlEmpty()) setBaseUrl(mainIframe.url());

        //* Loop Child Titles
        if (Array.isArray(title.children))
          for (const child of title.children) {
            const titleLink = baseUrl + child.href;
            await mainIframe.goto(titleLink);
            // console.log('DEBUG testPage url : ', mainIframe.url(), '\n');

            const getPostDataOnCurrentPage = async (pageIndex = '1') => {
              const mainIframeElement = await page.$(MAIN_IFRAME_SELECTOR);
              const mainIframe = await mainIframeElement.contentFrame();
              const postsHtmlList = await mainIframe.$$eval(
                POSTS_FROM_CHILD_TITLE_PAGE_SELECTOR,
                ($posts) => {
                  return $posts.map(($post, i) => {
                    return {
                      html: $post.innerHTML,
                    };
                  });
                },
              );

              const postData = postsHtmlList.map((thePostHtml) => {
                const { html } = thePostHtml;
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
                const cHeadingTitle = $(
                  '#postViewArea .c-heading__title',
                ).text();
                const cHeadingContent = $(
                  '#postViewArea .c-heading__content',
                ).text();
                return {
                  postId,
                  file,
                  title,
                  cHeadingTitle,
                  cHeadingContent,
                  categoryId: child.categoryId,
                  //! Do not include html for now as there is no use for it yet and it is large
                  // html,
                };
              });

              return postData;
            };

            //* Get and Save First Page Post Data
            const postData = await getPostDataOnCurrentPage();
            await this.writePostDataToFile(postData);

            //* Loop Pagination (if exists) - Setup

            const getNextPageItem = async () => {
              const result = await mainIframe.$$eval(
                NEXT_PAGE_ITEM_SELECTOR,
                ($nextPageItem) => {
                  /*                   console.log(
                    '[1] getNextPageItem() $nextPageItem.length: ',
                    $nextPageItem.length,
                  ); */
                  let result = null;
                  if ($nextPageItem.length === 1) {
                    const href = $nextPageItem[0].getAttribute('href');
                    result = { href };
                  }
                  return result;
                },
              );

              // console.log('[2] getNextPageItem() result: ', result, '\n');
              return result;
            };

            const navigateToNextPage = async (path: string) => {
              const mainIframe = await mainIframeElement.contentFrame();
              await mainIframe.goto('https://blog.naver.com' + path);
            };

            //* Loop Pagination (if exists) - Start
            let nextPageItem = await getNextPageItem();
            let stopped = nextPageItem == null;
            while (!stopped) {
              console.log(`Paginated.`);
              await navigateToNextPage(nextPageItem.href);

              const postData = await getPostDataOnCurrentPage();
              await this.writePostDataToFile(postData);
              nextPageItem = await getNextPageItem();
              stopped = nextPageItem == null;
            }

            //! 'break' during development to NOT loop everything
            if (child.categoryId === '40') {
              // /* 가족갈등.. */ setBreakLoop(true);
              // break;
            }
          }
        if (breakLoop) {
          break;
        }
      }
    };

    await scrapePostsAndSave();

    return { result: { toc: tableOfContentsRootTitles } };
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

function postIdFromUrl(url: string) {
  return url.split('/').pop();
}
