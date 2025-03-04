import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { User } from 'app/interfaces/user.interface';
import { AdvancedSearchComponent } from 'app/modules/search-input/components/advanced-search/advanced-search.component';
import { BasicSearchComponent } from 'app/modules/search-input/components/basic-search/basic-search.component';
import { SearchInputComponent } from 'app/modules/search-input/components/search-input/search-input.component';
import { SearchInputHarness } from 'app/modules/search-input/components/search-input/search-input.harness';
import { AdvancedSearchAutocompleteService } from 'app/modules/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/search-input/services/query-to-api/query-to-api.service';

describe('SearchInputComponent', () => {
  let spectator: Spectator<SearchInputComponent<User>>;
  let searchHarness: SearchInputHarness;
  const createComponent = createComponentFactory({
    component: SearchInputComponent<User>,
    imports: [
      FormsModule,
    ],
    declarations: [
      BasicSearchComponent,
      AdvancedSearchComponent,
    ],
    providers: [
      QueryToApiService,
      QueryParserService,
      AdvancedSearchAutocompleteService,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, SearchInputHarness);
  });

  it('shows appropriate mode based on the query provided', async () => {
    spectator.setInput('query', {
      isBasicQuery: false,
      filters: [['username', '=', 'Bob']],
    });
    expect(await searchHarness.isInAdvancedMode()).toBe(true);

    spectator.setInput('query', {
      isBasicQuery: true,
      query: 'test',
    });

    expect(await searchHarness.isInAdvancedMode()).toBe(false);
  });

  it('switches to another mode when user presses Switch link', async () => {
    expect(await searchHarness.isInAdvancedMode()).toBe(false);
    await searchHarness.toggleMode();
    expect(await searchHarness.isInAdvancedMode()).toBe(true);
  });

  // TODO: Enable
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('retains old values in each mode when user is switching between them', async () => {
    await searchHarness.setValue('basic');
    await searchHarness.toggleMode();
    expect(await searchHarness.getValue()).toBe('');

    await searchHarness.setValue('Username = "Bob"');

    await searchHarness.toggleMode();
    expect(await searchHarness.getValue()).toBe('basic');

    await searchHarness.toggleMode();
    expect(await searchHarness.getValue()).toBe('Username = "Bob"');
  });

  // TODO: Test case for emit.
});
