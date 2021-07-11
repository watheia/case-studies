/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, fireEvent, render} from '@testing-library/react';
import {Calendar, RangeCalendar} from '../';
import {getDaysInMonth} from 'date-fns';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import {triggerPress} from '@react-spectrum/test-utils';
import V2Calendar from '@react/react-spectrum/Calendar';

let cellFormatter = new Intl.DateTimeFormat('en-US', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
let headingFormatter = new Intl.DateTimeFormat('en-US', {month: 'long', year: 'numeric'});
let keyCodes = {'Enter': 13, ' ': 32, 'PageUp': 33, 'PageDown': 34, 'End': 35, 'Home': 36, 'ArrowLeft': 37, 'ArrowUp': 38, 'ArrowRight': 39, 'ArrowDown': 40};

describe('CalendarBase', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb());
  });

  afterAll(() => {
    jest.useRealTimers();
    window.requestAnimationFrame.mockRestore();
  });

  afterEach(() => {
    // clear any live announcers
    act(() => {
      jest.runAllTimers();
    });
  });

  describe('basics', () => {
    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{}}
      ${'v2 Calendar'}       | ${V2Calendar}    | ${{}}
      ${'v2 range Calendar'} | ${V2Calendar}    | ${{selectionType: 'range'}}
    `('$Name shows the current month by default', ({Calendar, props}) => {
      const isV2 = Calendar === V2Calendar;
      let {getByLabelText, getByRole, getAllByRole} = render(<Calendar {...props} />);

      let calendar = getByRole('group');
      expect(calendar).toBeVisible();

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent(headingFormatter.format(new Date()));

      let grid = getByRole('grid');

      if (isV2) {
        expect(grid).toHaveAttribute('tabIndex', '0');
      } else {
        expect(grid).not.toHaveAttribute('tabIndex');
      }

      let today = getByLabelText('today', {exact: false});
      expect(isV2 ? today : today.parentElement).toHaveAttribute('role', 'gridcell');
      expect(today).toHaveAttribute('aria-label', `Today, ${cellFormatter.format(new Date())}`);
      expect(today).toHaveAttribute('tabIndex', !isV2 ? '0' : '-1');

      expect(getByLabelText('Previous')).toBeVisible();
      expect(getByLabelText('Next')).toBeVisible();

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(getDaysInMonth(new Date()));
      for (let cell of gridCells) {
        expect(isV2 ? cell : cell.children[0]).toHaveAttribute('aria-label');
      }
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{isDisabled: true}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{isDisabled: true}}
      ${'v2 Calendar'}       | ${V2Calendar}    | ${{disabled: true}}
      ${'v2 range Calendar'} | ${V2Calendar}    | ${{selectionType: 'range', disabled: true}}
    `('$Name should set aria-disabled when isDisabled', ({Calendar, props}) => {
      let {getByRole, getAllByRole, getByLabelText} = render(<Calendar {...props} />);

      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-disabled', 'true');
      expect(grid).not.toHaveAttribute('tabIndex');

      let gridCells = getAllByRole('gridcell');
      for (let cell of gridCells) {
        expect(cell).toHaveAttribute('aria-disabled', 'true');
      }

      expect(getByLabelText('Previous')).toHaveAttribute('disabled');
      expect(getByLabelText('Next')).toHaveAttribute('disabled');
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{isReadOnly: true}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{isReadOnly: true}}
      ${'v2 Calendar'}       | ${V2Calendar}    | ${{readOnly: true}}
      ${'v2 range Calendar'} | ${V2Calendar}    | ${{selectionType: 'range', readOnly: true}}
    `('$Name should set aria-readonly when isReadOnly', ({Calendar, props}) => {
      const isV2 = Calendar === V2Calendar;
      let {getByRole} = render(<Calendar {...props} />);
      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-readonly', 'true');
      if (isV2) {
        expect(grid).toHaveAttribute('tabIndex', '0');
      } else {
        expect(grid).not.toHaveAttribute('tabIndex');
      }
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{}}
      ${'v2 Calendar'}       | ${V2Calendar}    | ${{}}
      ${'v2 range Calendar'} | ${V2Calendar}    | ${{selectionType: 'range'}}
    `('$Name should focus today if autoFocus is set and there is no selected value', ({Name, Calendar}) => {
      const isV2 = Calendar === V2Calendar;
      let {getByRole, getByLabelText} = render(<Calendar autoFocus />);

      let cell = getByLabelText('today', {exact: false});
      expect(isV2 ? cell : cell.parentElement).toHaveAttribute('role', 'gridcell');

      let grid = getByRole('grid');
      expect(isV2 ? grid : cell).toHaveFocus();
      if (isV2) {
        expect(grid).toHaveAttribute('aria-activedescendant', cell.id);
      }
    });

    it.each`
      Name                    | Calendar              | props
      ${'v3 Calendar'}        | ${Calendar}           | ${{defaultValue: new Date(2019, 1, 10), minValue: new Date(2019, 1, 3), maxValue: new Date(2019, 1, 20)}}
      ${'v2 Calendar'}        | ${V2Calendar}         | ${{defaultValue: new Date(2019, 1, 10), min: new Date(2019, 1, 3), max: new Date(2019, 1, 20)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}      | ${{defaultValue: {start: new Date(2019, 1, 10), end: new Date(2019, 1, 15)}, minValue: new Date(2019, 1, 3), maxValue: new Date(2019, 1, 20)}}
      ${'v2 range Calendar'}  | ${V2Calendar}         | ${{selectionType: 'range', defaultValue: [new Date(2019, 1, 10), new Date(2019, 1, 15)], min: new Date(2019, 1, 3), max: new Date(2019, 1, 20)}}
    `('$Name should set aria-disabled on cells outside the valid date range', ({Calendar, props}) => {
      let {getAllByRole} = render(<Calendar {...props} />);

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(18);
    });

    it.each`
      Name                    | Calendar              | props
      ${'v3 Calendar'}        | ${Calendar}           | ${{defaultValue: new Date(2019, 1, 10), minValue: new Date(2019, 1, 3), maxValue: new Date(2019, 2, 20)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}      | ${{defaultValue: {start: new Date(2019, 1, 10), end: new Date(2019, 1, 15)}, minValue: new Date(2019, 1, 3), maxValue: new Date(2019, 2, 20)}}
    `('$Name should disable the previous button if outside valid date range', ({Calendar, props}) => {
      let {getByLabelText} = render(<Calendar {...props} />);

      expect(getByLabelText('Previous')).toHaveAttribute('disabled');
      expect(getByLabelText('Next')).not.toHaveAttribute('disabled');
    });

    it.each`
      Name                    | Calendar              | props
      ${'v3 Calendar'}        | ${Calendar}           | ${{defaultValue: new Date(2019, 2, 10), minValue: new Date(2019, 1, 3), maxValue: new Date(2019, 2, 20)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}      | ${{defaultValue: {start: new Date(2019, 2, 10), end: new Date(2019, 2, 15)}, minValue: new Date(2019, 1, 3), maxValue: new Date(2019, 2, 20)}}
    `('$Name should disable the next button if outside valid date range', ({Calendar, props}) => {
      let {getByLabelText} = render(<Calendar {...props} />);

      expect(getByLabelText('Previous')).not.toHaveAttribute('disabled');
      expect(getByLabelText('Next')).toHaveAttribute('disabled');
    });

    it.each`
      Name                    | Calendar              | props
      ${'v3 Calendar'}        | ${Calendar}           | ${{defaultValue: new Date(2019, 2, 10), minValue: new Date(2019, 1, 3), maxValue: new Date(2019, 1, 20)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}      | ${{defaultValue: {start: new Date(2019, 2, 10), end: new Date(2019, 2, 15)}, minValue: new Date(2019, 1, 3), maxValue: new Date(2019, 1, 20)}}
    `('$Name should disable both the next and previous buttons if outside valid date range', ({Calendar, props}) => {
      let {getByLabelText} = render(<Calendar {...props} />);

      expect(getByLabelText('Previous')).toHaveAttribute('disabled');
      expect(getByLabelText('Next')).toHaveAttribute('disabled');
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new Date(2019, 5, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new Date(2019, 5, 5), end: new Date(2019, 5, 10)}}}
      ${'v2 Calendar'}       | ${V2Calendar}    | ${{defaultValue: new Date(2019, 5, 5)}}
      ${'v2 range Calendar'} | ${V2Calendar}    | ${{selectionType: 'range', defaultValue: [new Date(2019, 5, 5), new Date(2019, 5, 10)]}}
    `('$Name should change the month when previous or next buttons are clicked', ({Calendar, props}) => {
      let {getByRole, getByLabelText, getAllByLabelText, getAllByRole} = render(<Calendar {...props} />);

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent('June 2019');

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(30);
      expect(getAllByLabelText('selected', {exact: false}).length).toBeGreaterThan(0);

      let nextButton = getByLabelText('Next');
      triggerPress(nextButton);

      expect(() => {
        getAllByLabelText('selected', {exact: false});
      }).toThrow();

      expect(heading).toHaveTextContent('July 2019');
      gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(31);

      expect(nextButton).toHaveFocus();

      let prevButton = getByLabelText('Previous');
      triggerPress(prevButton);

      expect(heading).toHaveTextContent('June 2019');
      gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(30);
      expect(getAllByLabelText('selected', {exact: false}).length).toBeGreaterThan(0);
      expect(prevButton).toHaveFocus();
    });
  });

  describe('labeling', () => {
    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new Date(2019, 5, 5)}}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new Date(2019, 5, 5), end: new Date(2019, 5, 5)}}}
      ${'v2 Calendar'}       | ${V2Calendar}    | ${{defaultValue: new Date(2019, 5, 5)}}
      ${'v2 range Calendar'} | ${V2Calendar}    | ${{defaultValue: new Date(2019, 5, 5), selectionType: 'range'}}
    `('$Name should be labeled by month heading by default', async ({Calendar, props}) => {
      let {getByRole} = render(<Calendar  {...props} />);
      let calendar = getByRole('group');
      let heading = getByRole('heading');
      let body = getByRole('grid');
      expect(calendar).toHaveAttribute('id');
      expect(calendar).toHaveAttribute('aria-labelledby', heading.id);
      expect(body).toHaveAttribute('aria-labelledby', heading.id);
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{}}
      ${'v2 Calendar'}       | ${V2Calendar}    | ${{}}
      ${'v2 range Calendar'} | ${V2Calendar}    | ${{selectionType: 'range'}}
    `('$Name should support labeling with aria-label', ({Calendar, props}) => {
      let {getByRole} = render(<Calendar {...props} aria-label="foo" />);
      let calendar = getByRole('group');
      let heading = getByRole('heading');
      let body = getByRole('grid');
      expect(calendar).toHaveAttribute('id');
      expect(calendar).toHaveAttribute('aria-label', 'foo');
      expect(calendar).toHaveAttribute('aria-labelledby', `${calendar.id} ${heading.id}`);
      expect(body).toHaveAttribute('aria-labelledby', `${calendar.id} ${heading.id}`);
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{}}
      ${'v2 Calendar'}       | ${V2Calendar}    | ${{}}
      ${'v2 range Calendar'} | ${V2Calendar}    | ${{selectionType: 'range'}}
    `('$Name should support labeling with aria-labelledby', ({Calendar, props}) => {
      let {getByRole} = render(<Calendar {...props} aria-labelledby="foo" />);
      let calendar = getByRole('group');
      let heading = getByRole('heading');
      let body = getByRole('grid');
      expect(calendar).toHaveAttribute('id');
      expect(calendar).toHaveAttribute('aria-labelledby', `foo ${heading.id}`);
      expect(body).toHaveAttribute('aria-labelledby', `foo ${heading.id}`);
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{}}
      ${'v2 Calendar'}       | ${V2Calendar}    | ${{}}
      ${'v2 range Calendar'} | ${V2Calendar}    | ${{selectionType: 'range'}}
    `('$Name should support labeling with aria-labelledby and aria-label', ({Calendar, props}) => {
      let {getByRole} = render(<Calendar {...props} aria-label="cal" aria-labelledby="foo" />);
      let calendar = getByRole('group');
      let heading = getByRole('heading');
      let body = getByRole('grid');
      expect(calendar).toHaveAttribute('id');
      expect(calendar).toHaveAttribute('aria-label', 'cal');
      expect(calendar).toHaveAttribute('aria-labelledby', `foo ${calendar.id} ${heading.id}`);
      expect(body).toHaveAttribute('aria-labelledby', `foo ${calendar.id} ${heading.id}`);
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{}}
      ${'v2 Calendar'}       | ${V2Calendar}    | ${{}}
      ${'v2 range Calendar'} | ${V2Calendar}    | ${{selectionType: 'range'}}
    `('$Name should support labeling with a custom id', ({Calendar, props}) => {
      let {getByRole} = render(<Calendar {...props} id="hi" aria-label="cal" aria-labelledby="foo" />);
      let calendar = getByRole('group');
      let heading = getByRole('heading');
      let body = getByRole('grid');
      expect(calendar).toHaveAttribute('id', 'hi');
      expect(calendar).toHaveAttribute('aria-label', 'cal');
      expect(calendar).toHaveAttribute('aria-labelledby', `foo hi ${heading.id}`);
      expect(body).toHaveAttribute('aria-labelledby', `foo hi ${heading.id}`);
    });
  });

  describe('keyboard navigation', () => {
    async function testKeyboard(Calendar, defaultValue, key, value, month, props, opts) {
      let isV2 = Calendar === V2Calendar;

      // For range calendars, convert the value to a range of one day
      if (Calendar === RangeCalendar) {
        defaultValue = {start: defaultValue, end: defaultValue};
      } else if (isV2 && props && props.selectionType === 'range') {
        defaultValue = [defaultValue, defaultValue];
      }

      let {getByRole, getAllByRole, getByLabelText, getAllByLabelText, unmount} = render(<Calendar defaultValue={defaultValue} autoFocus {...props} />);
      let grid = getAllByRole('grid')[0]; // get by role will see two, role=grid and implicit <table> which also has role=grid

      let cell = getAllByLabelText('selected', {exact: false}).filter(cell => cell.role !== 'grid')[0];
      if (isV2) {
        expect(grid).toHaveAttribute('aria-activedescendant', cell.id);
      } else {
        expect(grid).not.toHaveAttribute('aria-activedescendant');
        expect(document.activeElement).toBe(cell);
      }

      fireEvent.keyDown(document.activeElement, {key, keyCode: keyCodes[key], ...opts});
      fireEvent.keyUp(document.activeElement, {key, keyCode: keyCodes[key], ...opts});

      cell = getByLabelText(value, {exact: false});
      if (isV2) {
        expect(grid).toHaveAttribute('aria-activedescendant', cell.id);
      } else {
        expect(grid).not.toHaveAttribute('aria-activedescendant');
        expect(document.activeElement).toBe(cell);
      }

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent(month);

      // clear any live announcers
      act(() => {
        jest.runAllTimers();
      });

      unmount();
    }

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
      ${'v2 Calendar'}        | ${V2Calendar}     | ${{}}
      ${'v2 range Calendar'}  | ${V2Calendar}     | ${{selectionType: 'range'}}
    `('$Name should move the focused date by one day with the left/right arrows', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'ArrowLeft', 'Tuesday, June 4, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'ArrowRight', 'Thursday, June 6, 2019', 'June 2019', props);

      await testKeyboard(Calendar, new Date(2019, 5, 1), 'ArrowLeft', 'Friday, May 31, 2019', 'May 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 30), 'ArrowRight', 'Monday, July 1, 2019', 'July 2019', props);
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
      ${'v2 Calendar'}        | ${V2Calendar}     | ${{}}
      ${'v2 range Calendar'}  | ${V2Calendar}     | ${{selectionType: 'range'}}
    `('$Name should move the focused date by one week with the up/down arrows', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new Date(2019, 5, 12), 'ArrowUp', 'Wednesday, June 5, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 12), 'ArrowDown', 'Wednesday, June 19, 2019', 'June 2019', props);

      await testKeyboard(Calendar, new Date(2019, 5, 5), 'ArrowUp', 'Wednesday, May 29, 2019', 'May 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 26), 'ArrowDown', 'Wednesday, July 3, 2019', 'July 2019', props);
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
      ${'v2 Calendar'}        | ${V2Calendar}     | ${{}}
      ${'v2 range Calendar'}  | ${V2Calendar}     | ${{selectionType: 'range'}}
    `('$Name should move the focused date to the start or end of the month with the home/end keys', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new Date(2019, 5, 12), 'Home', 'Saturday, June 1, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 12), 'End', 'Sunday, June 30, 2019', 'June 2019', props);
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
      ${'v2 Calendar'}        | ${V2Calendar}     | ${{}}
      ${'v2 range Calendar'}  | ${V2Calendar}     | ${{selectionType: 'range'}}
    `('$Name should move the focused date by one month with the page up/page down keys', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'PageUp', 'Sunday, May 5, 2019', 'May 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'PageDown', 'Friday, July 5, 2019', 'July 2019', props);
    });

    // v2 tests disabled until next release
    // it.each`
    //   Name                    | Calendar          | props
    //   ${'v3 Calendar'}        | ${Calendar}       | ${{}}
    //   ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
    //   ${'v2 Calendar'}        | ${V2Calendar}     | ${{}}
    //   ${'v2 range Calendar'}  | ${V2Calendar}     | ${{selectionType: 'range'}}
    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
    `('$Name should move the focused date by one year with the shift + page up/shift + page down keys', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'PageUp', 'Tuesday, June 5, 2018', 'June 2018', props, {shiftKey: true});
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'PageDown', 'Friday, June 5, 2020', 'June 2020', props, {shiftKey: true});
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{minValue: new Date(2019, 5, 2), maxValue: new Date(2019, 5, 8)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{minValue: new Date(2019, 5, 2), maxValue: new Date(2019, 5, 8)}}
      ${'v2 Calendar'}        | ${V2Calendar}     | ${{min: new Date(2019, 5, 5), max: new Date(2019, 5, 8)}}
      ${'v2 range Calendar'}  | ${V2Calendar}     | ${{selectionType: 'range', min: new Date(2019, 5, 5), max: new Date(2019, 5, 8)}}
    `('$Name should not move the focused date outside the valid range', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new Date(2019, 5, 2), 'ArrowLeft', 'Sunday, June 2, 2019 selected', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 8), 'ArrowRight', 'Saturday, June 8, 2019 selected', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'ArrowUp', 'Wednesday, June 5, 2019 selected', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'ArrowDown', 'Wednesday, June 5, 2019 selected', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'Home', 'Wednesday, June 5, 2019 selected', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'End', 'Wednesday, June 5, 2019 selected', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'PageUp', 'Wednesday, June 5, 2019 selected', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'PageDown', 'Wednesday, June 5, 2019 selected', 'June 2019', props);
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'PageUp', 'Wednesday, June 5, 2019 selected', 'June 2019', props, {shiftKey: true});
      await testKeyboard(Calendar, new Date(2019, 5, 5), 'PageDown', 'Wednesday, June 5, 2019 selected', 'June 2019', props, {shiftKey: true});
    });
  });

  // These tests only apply to v3
  describe('internationalization', () => {
    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{}}
    `('$Name should change the week start day based on the locale', ({Calendar}) => {
      let {getAllByRole, rerender} = render(
        <Provider theme={theme} locale="en-US">
          <Calendar />
        </Provider>
      );

      let headers = getAllByRole('columnheader');
      expect(headers[0]).toHaveTextContent('S');

      rerender(
        <Provider theme={theme} locale="de-DE">
          <Calendar />
        </Provider>
      );

      headers = getAllByRole('columnheader');
      expect(headers[0]).toHaveTextContent('M');
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new Date(2019, 5, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new Date(2019, 5, 5), end: new Date(2019, 5, 10)}}}
    `('$Name should mirror arrow key movement in an RTL locale', ({Calendar, props}) => {
      // LTR
      let {getByRole, getAllByRole, rerender} = render(
        <Provider theme={theme} locale="en-US">
          <Calendar {...props} autoFocus />
        </Provider>
      );

      let grid = getByRole('grid');
      let selected = getAllByRole('button').find(cell => cell.getAttribute('tabIndex') === '0');
      expect(document.activeElement).toBe(selected);

      fireEvent.keyDown(grid, {key: 'ArrowLeft'});
      expect(document.activeElement).toBe(selected.parentNode.previousSibling.children[0]);

      fireEvent.keyDown(grid, {key: 'ArrowRight'});
      expect(document.activeElement).toBe(selected);

      // RTL
      rerender(
        <Provider theme={theme} locale="ar-EG">
          <Calendar {...props} autoFocus />
        </Provider>
      );

      // make sure focused cell gets updated after rerender
      fireEvent.blur(grid);
      fireEvent.focus(grid);

      selected = getAllByRole('button').find(cell => cell.getAttribute('tabIndex') === '0');
      expect(document.activeElement).toBe(selected);

      fireEvent.keyDown(grid, {key: 'ArrowLeft'});
      expect(document.activeElement).toBe(selected.parentNode.nextSibling.children[0]);


      fireEvent.keyDown(grid, {key: 'ArrowRight'});
      expect(document.activeElement).toBe(selected);
    });
  });
});
