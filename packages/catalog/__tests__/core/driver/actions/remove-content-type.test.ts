import { GlobalTypes } from '@thoughtindustries/content';
import { SortDirection, SortField } from '../../../../src';
import { setupDriver } from '../helper';

describe('@thoughtindustries/catalog/CatalogDriver#getActions#removeContentType', () => {
  it('should update state', async () => {
    const contentTypeToRemove = GlobalTypes.ContentKind.Bundle;
    const initialState = {
      contentTypes: [contentTypeToRemove]
    };
    const { driver, stateAfterAction } = setupDriver({
      initialState,
      trackUrlState: false
    });
    const actions = driver.getActions();

    await actions.removeContentType(contentTypeToRemove);

    expect(stateAfterAction.state?.contentTypes).toHaveLength(0);
  });

  it('should not update other request state', async () => {
    const contentTypeToRemove = GlobalTypes.ContentKind.Bundle;
    const initialState = {
      searchTerm: 'test',
      aggregationFilters: [{ label: 'label', value: 'value' }],
      page: 3,
      token: 'abc',
      sort: { field: SortField.Title, direction: SortDirection.Asc },
      displayType: GlobalTypes.ContentItemDisplayType.Grid
    };
    const contentTypes = [contentTypeToRemove];
    const { driver, stateAfterAction } = setupDriver({
      initialState: {
        ...initialState,
        contentTypes
      },
      skipInit: true,
      trackUrlState: false
    });
    const actions = driver.getActions();

    await driver.init();
    await actions.removeContentType(contentTypeToRemove);

    expect(stateAfterAction.state).toEqual(expect.objectContaining(initialState));
  });

  it('should skip action when provided content type does not exist', async () => {
    const initialState = {
      searchTerm: 'test',
      contentTypes: [GlobalTypes.ContentKind.Course, GlobalTypes.ContentKind.CourseGroup]
    };
    const { driver, stateAfterAction, mockOnSearch } = setupDriver({
      initialState,
      trackUrlState: false,
      skipInit: true
    });
    const actions = driver.getActions();
    const contentTypeNonExist = GlobalTypes.ContentKind.Bundle;

    await driver.init();
    await actions.removeContentType(contentTypeNonExist);

    expect(mockOnSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          contentTypes: initialState.contentTypes
        })
      })
    );
    expect(stateAfterAction.state).toEqual(expect.objectContaining(initialState));
  });
});
