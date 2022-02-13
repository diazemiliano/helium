import { CatalogContentQuery, GlobalTypes } from '@thoughtindustries/content';
import { CatalogDriver, CatalogDriverConfig, CatalogDriverState } from '../../../src';

const mockAggregations = [
  {
    key: 'key-1',
    label: 'label-1',
    buckets: [
      {
        count: 10,
        label: 'bucket-1',
        value: 'value-1'
      }
    ]
  }
];

const mockContentItems = [
  {
    courseGracePeriodEnded: false,
    coursePresold: false,
    currentUserMayReschedule: false,
    hasChildren: false,
    hideCourseDescription: false,
    id: 'test-id',
    slug: 'test-slug',
    isActive: true,
    waitlistingEnabled: false,
    waitlistingTriggered: false
  }
];

export const getMockSearchResponse = ({
  tokenLabel,
  isCurated = false,
  resultsDisplayType = GlobalTypes.ContentItemDisplayType.List,
  sortUpdatedAtEnabled = true,
  sortCreatedAtEnabled = true,
  sortTitleEnabled = true,
  sortPublishDateEnabled = true,
  sortCourseStartDateEnabled = true,
  sortRelevanceEnabled = true,
  displayTypeListEnabled = true,
  displayTypeGridEnabled = true,
  displayTypeCalendarEnabled = true,
  displayStartDateEnabled = true,
  displayAuthorsEnabled = true,
  displayDescriptionOnCalendar = true,
  contentTypeFilterEnabled = true,
  contentTypes = []
}: {
  tokenLabel?: string;
  isCurated?: boolean;
  resultsDisplayType?: GlobalTypes.ContentItemDisplayType;
  sortUpdatedAtEnabled?: boolean;
  sortCreatedAtEnabled?: boolean;
  sortTitleEnabled?: boolean;
  sortPublishDateEnabled?: boolean;
  sortCourseStartDateEnabled?: boolean;
  sortRelevanceEnabled?: boolean;
  displayTypeListEnabled?: boolean;
  displayTypeGridEnabled?: boolean;
  displayTypeCalendarEnabled?: boolean;
  displayStartDateEnabled?: boolean;
  displayAuthorsEnabled?: boolean;
  displayDescriptionOnCalendar?: boolean;
  contentTypeFilterEnabled?: boolean;
  contentTypes?: GlobalTypes.ContentKind[];
} = {}): CatalogContentQuery => ({
  CatalogContent: {
    meta: {
      tokenLabel,
      total: 1000,
      hasMore: true,
      isCurated,
      aggregations: [...mockAggregations],
      contentTypes,
      selectedSort: 'createdAt:desc',
      resultsDisplayType,
      sortUpdatedAtEnabled,
      sortCreatedAtEnabled,
      sortTitleEnabled,
      sortPublishDateEnabled,
      sortCourseStartDateEnabled,
      sortRelevanceEnabled,
      displayTypeListEnabled,
      displayTypeGridEnabled,
      displayTypeCalendarEnabled,
      displayStartDateEnabled,
      displayAuthorsEnabled,
      displayDescriptionOnCalendar,
      contentTypeFilterEnabled,
      queryCustomFields: JSON
    },
    contentItems: [...mockContentItems]
  }
});

export function getMockOnSearch() {
  return jest.fn().mockResolvedValue({ data: getMockSearchResponse() });
}

export function setupDriver({
  mockSearchResponse,
  mockOnSearch,
  ...rest
}: Omit<CatalogDriverConfig, 'onSearch'> & {
  mockSearchResponse?: CatalogContentQuery;
  mockOnSearch?: jest.Mock;
} = {}) {
  let overrideMockOnSearch = mockOnSearch || getMockOnSearch();

  if (mockSearchResponse) {
    overrideMockOnSearch = jest.fn().mockResolvedValue({ data: mockSearchResponse });
  }

  const driver = new CatalogDriver({
    onSearch: overrideMockOnSearch,
    // Pass, e.g., initialState and all other configs
    ...rest
  });

  const stateAfterAction: { state?: CatalogDriverState } = {};
  driver.subscribeToStateChanges(newState => {
    stateAfterAction.state = newState;
  });

  return {
    driver,
    stateAfterCreation: driver.getState(),
    stateAfterAction,
    mockOnSearch: overrideMockOnSearch
  };
}
