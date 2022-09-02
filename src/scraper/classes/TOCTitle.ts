import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { idMaker } from '../../lib/table-of-contents/id-maker';
import { TOC_TITLE_WRAPPER } from '../constants/selectors';

const idGen = idMaker();

export interface TOCTitle {
  id: number;
  title: string;
  href: string;
  total: string;
  parentTitle: number | null;
  children: TOCTitle[] | null;
  categoryId: string;
}

class TOCTitleImpl implements TOCTitle {
  id: number;
  title: string;
  href: string;
  total: string;
  parentTitle: number | null;
  children: TOCTitle[] | null;
  categoryId: string;
  constructor({
    id,
    title,
    href,
    total,
    parentTitle,
    children,
    categoryId,
  }: Partial<TOCTitle>) {
    if (!this.validateIdArgument(id)) {
      this.id = this.createId();
    } else {
      this.id = id;
    }
    this.title = title;
    this.href = href;
    this.total = total;
    this.parentTitle = this.validateTitleId(parentTitle) ? parentTitle : null;
    this.children = this.validateTitleId(children) ? children : null;
    if (this.validateCategoryId(categoryId)) this.categoryId = categoryId;
  }
  validateIdArgument(id: number) {
    if (id === 0 || id > 0) return true;
    return false;
  }
  validateTitleId(parentTitle: unknown) {
    if (typeof parentTitle === 'number' && parentTitle > 0) {
      return true;
    }
    return false;
  }
  validateCategoryId(id: string) {
    if (typeof id !== 'string')
      throw new InternalServerErrorException('Invalid TOC Title categoryId');
    return true;
  }
  createId(): number {
    return idGen.next().value;
  }
  setChildren(childrenTitles: InstanceType<typeof TOCTitleImpl>[]) {
    this.children = childrenTitles.map((title) => this.getTocTitle(title));
  }
  getTocTitle(title: InstanceType<typeof TOCTitleImpl>) {
    return (({
      id,
      title,
      href,
      total,
      parentTitle,
      children,
      categoryId,
    }) => ({ id, title, href, total, parentTitle, children, categoryId }))(
      title,
    );
  }
  getChildrenTitleCssSelector() {
    return `li.depth2.parentcategoryno_${this.categoryId} > ${TOC_TITLE_WRAPPER}`;
  }
}

@Injectable()
export class TOCTitleFactory {
  create(options: Partial<TOCTitle>): InstanceType<typeof TOCTitleImpl> {
    return new TOCTitleImpl(options);
  }
}
