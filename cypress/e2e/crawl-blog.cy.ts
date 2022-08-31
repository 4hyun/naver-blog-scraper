// import { NAVER_BLOG_URL } from 'src/naver-blog-scraper/lib/naver-blog-scraper';
import blogPage from '../fixtures/blog.page';

const getIframeDocument = () => {
  return (
    cy
      .get('iframe')
      // Cypress yields jQuery element, which has the real
      // DOM element under property "0".
      // From the real DOM iframe element we can get
      // the "document" element, it is stored in "contentDocument" property
      // Cypress "its" command can access deep properties using dot notation
      // https://on.cypress.io/its
      .its('0.contentDocument')
      .should('exist')
  );
};

const getIframeBody = () => {
  // get the document
  return (
    getIframeDocument()
      // automatically retries until body is loaded
      .its('body')
      .should('not.be.undefined')
      // wraps "body" DOM element to allow
      // chaining more Cypress commands, like ".find(...)"
      .then(cy.wrap)
  );
};

function TOCAnchorElement($anchor: Element) {
  const REGEX = /(?<=category).+/;
  const $el = $anchor;
  let categoryId: string;
  const getCategoryId = () => {
    const categoryId: string = $anchor.getAttribute('id').match(REGEX)[0];
    return categoryId;
  };
  const setCategoryId = () => {
    categoryId = getCategoryId();
  };
  setCategoryId();

  const isCategoryIdDefined = () =>
    typeof categoryId === 'string' && categoryId.length > 0;
  this.getCategoryId = function () {
    if (!isCategoryIdDefined()) setCategoryId();
    return categoryId;
  };
  this.getHref = () => $el.getAttribute('href');

  this.getTitleText = () => $el.textContent;

  this.getChildrenCssSelector = () =>
    `.depth2.parentcategoryno_${getCategoryId()}`;
}

function TOC(
  tocDomNodeList: JQuery<HTMLElement>,
  cy: Cypress.cy & CyEventEmitter,
) {
  let toc: any;
  toc = Array.from(tocDomNodeList).reduce((acc, cur, index) => {
    const $tocItem = cy.wrap(cur);
    const $anchor = new TOCAnchorElement(cur.children[0]);
    const $postCount = cur.children[1];
    const $tocItemSiblings = $tocItem.siblings();
    const children = [];

    cy.log('$tocItem: ', $tocItem);
    cy.log('$tocItemSiblings: ', $tocItemSiblings);

    const childrenNodes = getIframeBody().find(
      $anchor.getChildrenCssSelector(),
    );
    cy.log('DEBUG childrenNodes: ', childrenNodes);
    acc[cur.textContent.trim()] = {
      href: $anchor.getHref(),
      title: $anchor.getTitleText(),
      total: +`${$postCount == null ? '(0)' : $postCount.textContent}`
        .replace('(', '')
        .replace(')', ''),
      children,
    };
    return acc;
  }, {});

  this.getTOC = function () {
    return toc;
  };

  this.listTOC = function () {
    const list = [];
    for (const key in toc) {
      list.push({ ...toc[key], rawTitleText: key });
    }
    return list;
  };

  this.setTOC = function (tocArg: typeof toc) {
    toc = tocArg;
  };
}

describe('Scrape Blog', () => {
  let toc: any;

  before(() => {
    cy.visit(blogPage.siteurl);
  });

  it('Gets TOC upto depth 2', () => {
    getIframeBody()
      .find(blogPage.toc.level1)
      .then((tocLevel1TupleList) => {
        toc = new TOC(tocLevel1TupleList, cy);
        cy.log('toc: ', toc.getTOC());
        cy.log('toc.listTOC', toc.listTOC());
      });
  });

  it('Saves TOC into a file', () => {
    cy.writeFile('scraped/toc-list.json', toc.listTOC());
  });
});
