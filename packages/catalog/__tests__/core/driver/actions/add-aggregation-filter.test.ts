import { GlobalTypes } from '@thoughtindustries/content';
import { SortDirection, SortField, DEFAULT_STATE } from '../../../../src';
import { setupDriver } from '../helper';

describe('@thoughtindustries/catalog/CatalogDriver#getActions#addAggregationFilter', () => {
  it('should update state', async () => {
    const initialState = {
      aggregationFilters: [{ label: 'label1', value: 'value1' }]
    };
    const { driver, stateAfterAction } = setupDriver({
      initialState
    });
    const actions = driver.getActions();
    const newFilter = { label: 'label2', value: 'value2' };

    await actions.addAggregationFilter(newFilter);

    expect(stateAfterAction.state?.aggregationFilters).toEqual([
      ...initialState.aggregationFilters,
      newFilter
    ]);
  });

  it('should not update other request state', async () => {
    const initialState = {
      searchTerm: 'test',
      page: 3,
      token: 'abc',
      sort: { field: SortField.Title, direction: SortDirection.Asc },
      displayType: GlobalTypes.ContentItemDisplayType.Grid,
      contentTypes: [GlobalTypes.ContentKind.Article]
    };
    const { driver, stateAfterAction } = setupDriver({
      initialState
    });
    const actions = driver.getActions();
    const newFilter = { label: 'label', value: 'value' };

    await actions.addAggregationFilter(newFilter);

    expect(stateAfterAction.state).toEqual(expect.objectContaining(initialState));
  });

  it('should reset and update state when is curated', async () => {
    const initialState = {
      searchTerm: 'test',
      page: 3,
      token: 'foo',
      contentTypes: [GlobalTypes.ContentKind.Article],
      aggregationFilters: [{ label: 'label1', value: 'value1' }],
      isCurated: true
    };
    const { driver, stateAfterAction } = setupDriver({
      initialState
    });
    const actions = driver.getActions();
    const newFilter = { label: 'label2', value: 'value2' };

    await actions.addAggregationFilter(newFilter);

    const { contentTypes, searchTerm, token, tokenLabel, page } = DEFAULT_STATE;
    expect(stateAfterAction.state).toEqual(
      expect.objectContaining({
        contentTypes,
        searchTerm,
        token,
        tokenLabel,
        page,
        aggregationFilters: [newFilter]
      })
    );
  });

  it('should reset page and update state if display type is calendar', async () => {
    const initialState = {
      page: 3,
      displayType: GlobalTypes.ContentItemDisplayType.Calendar
    };
    const { driver, stateAfterAction } = setupDriver({
      initialState
    });
    const actions = driver.getActions();
    const newFilter = { label: 'label2', value: 'value2' };

    await actions.addAggregationFilter(newFilter);

    expect(stateAfterAction.state).toEqual(
      expect.objectContaining({
        page: DEFAULT_STATE.page,
        aggregationFilters: [newFilter]
      })
    );
  });
});
