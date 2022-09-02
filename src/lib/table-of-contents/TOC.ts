import { TOCAnchorElement } from './TOCAnchorElement';

function TOC(tocDomNodeList: Element[]) {
  let toc: any;
  /*   toc = Array.from(tocDomNodeList).reduce((acc, cur, index) => {
    const $anchor = new TOCAnchorElement(cur.children[0]);
    const $postCount = cur.children[1];

    const children = [];


    acc[cur.textContent.trim()] = {
      href: $anchor.getHref(),
      title: $anchor.getTitleText(),
      total: +`${$postCount == null ? '(0)' : $postCount.textContent}`
        .replace('(', '')
        .replace(')', ''),
    };
    return acc;
  }, {}); */

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

export default TOC;
