export function TOCAnchorElement($anchor: Element) {
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
