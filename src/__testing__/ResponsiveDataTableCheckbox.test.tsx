import { render, screen } from '@testing-library/react';
import React from 'react';
import { SistentThemeProvider } from '../theme';

/**
 * `ResponsiveDataTable` hands mui-datatables a custom `components.Checkbox`, and the
 * only thing that tells the select-all checkbox apart from a row checkbox is the
 * `data-description` mui-datatables puts on it. The sibling ResponsiveDataTable test
 * mocks the datatable as a plain <table> and drops `components` entirely, so nothing
 * routed through it exercises that wiring. This mock renders `components.Checkbox`
 * for both cases instead, which is what makes the assertions below meaningful.
 */
jest.mock('@sistent/mui-datatables', () => {
  const MockMUIDataTable = ({
    components
  }: {
    components: { Checkbox: React.ComponentType<Record<string, unknown>> };
  }) => {
    const { Checkbox } = components;
    return (
      <div>
        <Checkbox data-description="row-select-header" data-testid="header-checkbox" />
        <Checkbox data-description="row-select" data-testid="row-checkbox" />
      </div>
    );
  };
  return { __esModule: true, default: MockMUIDataTable };
});

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }));

jest.mock('rehype-raw', () => ({ __esModule: true, default: () => {} }));

import ResponsiveDataTable from '../custom/ResponsiveDataTable';

const columns = [{ name: 'id', label: 'ID', options: { display: true } }];

const renderTable = () =>
  render(
    <SistentThemeProvider>
      <ResponsiveDataTable
        data={[['1']]}
        columns={columns}
        tableCols={columns}
        columnVisibility={{ id: true }}
      />
    </SistentThemeProvider>
  );

// FilterAllIcon's distinguishing path; the base Checkbox icons do not contain it.
const FILTER_ALL_PATH_PREFIX = 'M3 5h2V3c-1.1 0-2 .9-2 2z';

const iconPathOf = (checkbox: HTMLElement) =>
  checkbox.querySelector('svg path')?.getAttribute('d') ?? '';

describe('ResponsiveDataTable select-all checkbox', () => {
  it('renders FilterAllIcon for the header checkbox', () => {
    renderTable();
    expect(iconPathOf(screen.getByTestId('header-checkbox'))).toContain(FILTER_ALL_PATH_PREFIX);
  });

  it('leaves row checkboxes on the default icon', () => {
    renderTable();
    expect(iconPathOf(screen.getByTestId('row-checkbox'))).not.toContain(FILTER_ALL_PATH_PREFIX);
  });

  it('labels the header checkbox for assistive technology', () => {
    renderTable();
    expect(screen.getByLabelText('select all rows')).toBeTruthy();
  });

  it('does not label row checkboxes as select-all', () => {
    renderTable();
    expect(
      screen.getByTestId('row-checkbox').querySelector('input')?.getAttribute('aria-label')
    ).toBeNull();
  });
});
