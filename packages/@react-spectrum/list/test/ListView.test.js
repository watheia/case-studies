/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {act, fireEvent, render as renderComponent, within} from '@testing-library/react';
import {ActionButton} from '@react-spectrum/button';
import {Item, ListView} from '../src';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';

describe('ListView', function () {
  let offsetWidth, offsetHeight;

  beforeAll(function () {
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb());
    jest.useFakeTimers();
  });

  afterAll(function () {
    offsetWidth.mockReset();
    offsetHeight.mockReset();
  });

  let render = (children, locale = 'en-US', scale = 'medium') => renderComponent(
    <Provider theme={theme} scale={scale} locale={locale}>
      {children}
    </Provider>
  );

  let getCell = (tree, text) => {
    // Find by text, then go up to the element with the cell role.
    let el = tree.getByText(text);
    while (el && !/gridcell|rowheader|columnheader/.test(el.getAttribute('role'))) {
      el = el.parentElement;
    }

    return el;
  };

  it('renders a static listview', function () {
    let {getByRole, getAllByRole} = render(
      <ListView aria-label="List" data-testid="test">
        <Item>Foo</Item>
        <Item>Bar</Item>
        <Item>Baz</Item>
      </ListView>
    );

    let grid = getByRole('grid');
    expect(grid).toBeVisible();
    expect(grid).toHaveAttribute('aria-label', 'List');
    expect(grid).toHaveAttribute('data-testid', 'test');
    expect(grid).toHaveAttribute('aria-rowcount', '3');
    expect(grid).toHaveAttribute('aria-colcount', '1');

    let rows = getAllByRole('row');
    expect(rows).toHaveLength(3);

    let gridCells = within(rows[0]).getAllByRole('gridcell');
    expect(gridCells).toHaveLength(1);
    expect(gridCells[0]).toHaveTextContent('Foo');
  });

  it('renders a dynamic table', function () {
    let items = [
      {key: 'foo', label: 'Foo'},
      {key: 'bar', label: 'Bar'},
      {key: 'baz', label: 'Baz'}
    ];
    let {getByRole, getAllByRole} = render(
      <ListView items={items} aria-label="List">
        {item =>
          <Item textValue={item.key}>{item.label}</Item>
        }
      </ListView>
    );

    let grid = getByRole('grid');
    expect(grid).toBeVisible();
    expect(grid).toHaveAttribute('aria-label', 'List');
    expect(grid).toHaveAttribute('aria-rowcount', '3');
    expect(grid).toHaveAttribute('aria-colcount', '1');

    let rows = getAllByRole('row');
    expect(rows).toHaveLength(3);

    let gridCells = within(rows[0]).getAllByRole('gridcell');
    expect(gridCells).toHaveLength(1);
    expect(gridCells[0]).toHaveTextContent('Foo');
  });

  describe('keyboard focus', function () {
    let items = [
      {key: 'foo', label: 'Foo'},
      {key: 'bar', label: 'Bar'},
      {key: 'baz', label: 'Baz'}
    ];
    let renderTable = () => render(
      <ListView items={items} aria-label="List">
        {item => (
          <Item textValue={item.key}>
            {item.label}
          </Item>
        )}
      </ListView>
    );

    let renderTableWithFocusables = (locale, scale) => render(
      <ListView items={items} aria-label="List">
        {item => (
          <Item textValue={item.key}>
            {item.label}
            <ActionButton>button1 {item.label}</ActionButton>
            <ActionButton>button2 {item.label}</ActionButton>
          </Item>
        )}
      </ListView>,
      locale,
      scale
    );

    let moveFocus = (key, opts = {}) => {fireEvent.keyDown(document.activeElement, {key, ...opts});};

    describe('ArrowRight', function () {
      it('should not move focus if no focusables present', function () {
        let tree = renderTable();
        let start = getCell(tree, 'Foo');
        act(() => start.focus());
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(start);
      });

      describe('with cell focusables', function () {
        it('should move focus to next cell and back to row', function () {
          let tree = renderTableWithFocusables();
          let focusables = within(tree.getAllByRole('row')[0]).getAllByRole('button');
          let start = getCell(tree, 'Foo');
          act(() => start.focus());
          moveFocus('ArrowRight');
          expect(document.activeElement).toBe(focusables[0]);
          moveFocus('ArrowRight');
          expect(document.activeElement).toBe(focusables[1]);
          moveFocus('ArrowRight');
          expect(document.activeElement).toBe(start);
        });

        it('should move focus to previous cell in RTL', function () {
          let tree = renderTableWithFocusables('ar-AE');
          let start = within(tree.getAllByRole('row')[0]).getAllByRole('button')[0];
          let end = within(tree.getAllByRole('row')[0]).getAllByRole('button')[1];
          act(() => start.focus());
          moveFocus('ArrowRight');
          expect(document.activeElement).toBe(end);
        });
      });
    });

    describe('ArrowLeft', function () {
      it('should not move focus if no focusables present', function () {
        let tree = renderTable();
        let start = getCell(tree, 'Foo');
        act(() => start.focus());
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(start);
      });

      describe('with cell focusables', function () {
        it('should move focus to previous cell and back to row', function () {
          let tree = renderTableWithFocusables();
          let focusables = within(tree.getAllByRole('row')[0]).getAllByRole('button');
          let start = getCell(tree, 'Foo');
          // console.log('start', start)
          act(() => start.focus());
          moveFocus('ArrowLeft');
          expect(document.activeElement).toBe(focusables[1]);
          moveFocus('ArrowLeft');
          expect(document.activeElement).toBe(focusables[0]);
          moveFocus('ArrowLeft');
          expect(document.activeElement).toBe(start);
        });

        it('should move focus to next cell in RTL', function () {
          let tree = renderTableWithFocusables('ar-AE');
          let start = within(tree.getAllByRole('row')[0]).getAllByRole('button')[1];
          let end = within(tree.getAllByRole('row')[0]).getAllByRole('button')[0];
          act(() => start.focus());
          moveFocus('ArrowLeft');
          expect(document.activeElement).toBe(end);
        });
      });
    });

    describe('ArrowUp', function () {
      it('should not change focus from first item', function () {
        let tree = renderTableWithFocusables();
        let start = getCell(tree, 'Foo');
        act(() => start.focus());
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(start);
      });

      it('should mov focus to above row', function () {
        let tree = renderTableWithFocusables();
        let start = getCell(tree, 'Bar');
        let end = getCell(tree, 'Foo');
        act(() => start.focus());
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(end);
      });
    });

    describe('ArrowDown', function () {
      it('should not change focus from first item', function () {
        let tree = renderTableWithFocusables();
        let start = getCell(tree, 'Baz');
        act(() => start.focus());
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(start);
      });

      it('should move focus to below row', function () {
        let tree = renderTableWithFocusables();
        let start = getCell(tree, 'Foo');
        let end = getCell(tree, 'Bar');
        act(() => start.focus());
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(end);
      });
    });
  });

  it('should display loading affordance', function () {
    let {getByRole} = render(<ListView aria-label="List" isLoading>{[]}</ListView>);
    expect(getByRole('progressbar')).toBeTruthy();
  });

  it('should render empty state', function () {
    function renderEmptyState() {
      return <div>No results</div>;
    }
    let {getByText} = render(<ListView aria-label="List" renderEmptyState={renderEmptyState} />);
    expect(getByText('No results')).toBeTruthy();
  });
});
