import { InstructorsFragmentFragment, ProductsFragmentFragment } from './graphql';
import { ContentKind } from './graphql/global-types';

export interface ContentTabsProps {
  /** Determine whether to show or hide the tabs */
  tabsView: boolean;
  /** The slug for the Course Group or Learning Path */
  slug: string;
  /**  Specifies the type of content to be displayed. It can be set to "course" or "learningPath" */
  contentKind: ContentKind.Course | ContentKind.LearningPath;
}

export enum TabType {
  FreeText = 'free-text',
  Instructors = 'instructors',
  Testimonials = 'testimonials',
  Products = 'products'
}

export type ContentTabType = {
  __typename?: 'CourseTab' | 'LearningPathTab' | undefined;
  id?: string | undefined;
  label?: string | undefined;
  body?: string;
  tabType?: string | undefined;
  instructors?: InstructorsFragmentFragment[];
  products?: ProductsFragmentFragment[];
};
