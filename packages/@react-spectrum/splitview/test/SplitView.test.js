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

import {fireEvent, render} from '@testing-library/react';
import {installMouseEvent, installPointerEvent} from '@react-spectrum/test-utils';
import React from 'react';
import {SplitView} from '../';

describe('SplitView tests', function () {
  describe('use MouseEvent', function () {


    // Stub offsetWidth/offsetHeight so we can calculate min/max sizes correctly
    let stub1, stub2;
    beforeAll(function () {
      stub1 = jest.spyOn(window.HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => 1000);
      stub2 = jest.spyOn(window.HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => 1000);
    });

    afterAll(function () {
      stub1.mockReset();
      stub2.mockReset();
    });

    afterEach(function () {
      document.body.style.cursor = null;
    });

    installMouseEvent();

    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{UNSAFE_className: 'splitview'}}
    `('$Name handles defaults', async function ({Component, props}) {
      let onResizeSpy = jest.fn();
      let onResizeEndSpy = jest.fn();
      let {getByRole} = render(
        <Component {...props} onResize={onResizeSpy} onResizeEnd={onResizeEndSpy} UNSAFE_style={{width: '100%'}}>
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({left: 0, right: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[0];
      expect(splitview.childNodes[1]).toEqual(splitSeparator);
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).toHaveAttribute('tabindex', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');
      expect(onResizeSpy).not.toHaveBeenCalled();
      expect(onResizeEndSpy).not.toHaveBeenCalled();

      let pageY = 20; // arbitrary
      // move mouse over to 310 and verify that the size changed to 310
      fireEvent.mouseEnter(splitSeparator, {pageX: 304, pageY});
      fireEvent.mouseMove(splitSeparator, {pageX: 304, pageY});
      expect(document.body.style.cursor).toBe('e-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 304, pageY, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 307, pageY}); // extra move so cursor change flushes
      expect(onResizeSpy).toHaveBeenLastCalledWith(307);
      fireEvent.mouseMove(splitSeparator, {pageX: 310, pageY});
      expect(onResizeSpy).toHaveBeenLastCalledWith(310);
      expect(document.body.style.cursor).toBe('ew-resize');
      fireEvent.mouseUp(splitSeparator, {pageX: 310, pageY, button: 0});
      expect(onResizeEndSpy).toHaveBeenLastCalledWith(310);
      expect(primaryPane).toHaveAttribute('style', 'width: 310px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '1');

      // move mouse to the far end so that it maxes out 1000px - secondaryMin(304px) = 696px
      // visual state: primary is maxed out, secondary is at minimum, mouse is beyond the container width
      fireEvent.mouseEnter(splitSeparator, {pageX: 310, pageY});
      fireEvent.mouseMove(splitSeparator, {pageX: 310, pageY});
      expect(document.body.style.cursor).toBe('ew-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 310, pageY, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 1001, pageY});
      expect(onResizeSpy).toHaveBeenLastCalledWith(696);
      fireEvent.mouseUp(splitSeparator, {pageX: 1001, pageY, button: 0});
      expect(onResizeEndSpy).toHaveBeenLastCalledWith(696);
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // move mouse so we shrink to the far left for minimum, non-collapisble = 304px;
      // visual state: primary is at minimum size, secondary is maxed out, mouse is to the left of the split by a lot
      fireEvent.mouseEnter(splitSeparator, {pageX: 696, pageY});
      fireEvent.mouseMove(splitSeparator, {pageX: 696, pageY});
      expect(document.body.style.cursor).toBe('w-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 696, pageY, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 0, pageY});
      expect(onResizeSpy).toHaveBeenLastCalledWith(304);
      fireEvent.mouseUp(splitSeparator, {pageX: 0, pageY, button: 0});
      expect(onResizeEndSpy).toHaveBeenLastCalledWith(304);
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate right 304px + 10px = 314px
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(onResizeSpy).toHaveBeenLastCalledWith(314);
      expect(onResizeEndSpy).toHaveBeenLastCalledWith(314);
      expect(primaryPane).toHaveAttribute('style', 'width: 314px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '2');

      // use keyboard to navigate left 314px - 10px = 304px
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(onResizeSpy).toHaveBeenLastCalledWith(304);
      expect(onResizeEndSpy).toHaveBeenLastCalledWith(304);
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate left a second time should do nothing
      let countResizeEndCall = onResizeEndSpy.mock.calls.length;
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(onResizeEndSpy.mock.calls.length).toBe(countResizeEndCall);
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate up shouldn't move
      fireEvent.keyDown(splitSeparator, {key: 'Up'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Up'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate down shouldn't move
      fireEvent.keyDown(splitSeparator, {key: 'Down'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Down'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate End should maximize the primary view -> 696px
      fireEvent.keyDown(splitSeparator, {key: 'End'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'End'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate right at max size should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate Home should minimize the primary view -> 304px
      fireEvent.keyDown(splitSeparator, {key: 'Home'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Home'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate Enter should do nothing because default does not allow collapsings
      fireEvent.keyDown(splitSeparator, {key: 'Enter'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Enter'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate right 304px + 10px = 314px and then use Enter, should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 314px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      fireEvent.keyDown(splitSeparator, {key: 'Enter'});
      expect(primaryPane).toHaveAttribute('style', 'width: 314px;');
      fireEvent.keyUp(splitSeparator, {key: 'Enter'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '2');
    });

    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{UNSAFE_className: 'splitview'}}
    `('$Name handles primaryPane being second', function ({Component, props}) {
      let {getByRole} = render(
        <Component {...props} primaryPane={1} UNSAFE_style={{width: '100%'}}>
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({left: 0, right: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[2];
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).toHaveAttribute('tabindex', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');
      expect(document.body.style.cursor).toBe('');

      // primary as second means mouse needs to go to 696px to get the handle
      // move mouse over to 670 and verify that the size changed to 1000px - 670px = 330px
      fireEvent.mouseEnter(splitSeparator, {pageX: 696, pageY: 20});
      fireEvent.mouseMove(splitSeparator, {pageX: 696, pageY: 20});
      expect(document.body.style.cursor).toBe('w-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 696, pageY: 20, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 680, pageY: 20});
      fireEvent.mouseMove(splitSeparator, {pageX: 670, pageY: 20});
      fireEvent.mouseUp(splitSeparator, {pageX: 670, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 330px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '6');

      // move mouse to the far end so that it maxes out 1000px - secondaryMin(304px) = 696px
      fireEvent.mouseEnter(splitSeparator, {pageX: 670, pageY: 20});
      fireEvent.mouseMove(splitSeparator, {pageX: 670, pageY: 20});
      expect(document.body.style.cursor).toBe('ew-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 670, pageY: 20, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 0, pageY: 20});
      fireEvent.mouseUp(splitSeparator, {pageX: 0, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate right 696px - 10px = 686px
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 686px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '97');

      // use keyboard to navigate left 686px + 10px = 696px
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate Home should minimize the primary view -> 304px
      fireEvent.keyDown(splitSeparator, {key: 'Home'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Home'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate right at min size should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate End should maximize the primary view -> 696px
      fireEvent.keyDown(splitSeparator, {key: 'End'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'End'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate left at max size should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');
    });


    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{allowsCollapsing: true, UNSAFE_className: 'splitview'}}
    `('$Name handles allowsCollapsing', function ({Component, props}) {
      let {getByRole} = render(
        <Component {...props} UNSAFE_style={{width: '100%'}}>
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({left: 0, right: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[0];
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).toHaveAttribute('tabindex', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');
      expect(document.body.style.cursor).toBe('');

      // move mouse over to 310 and verify that the size changed
      fireEvent.mouseEnter(splitSeparator, {pageX: 304, pageY: 20});
      fireEvent.mouseMove(splitSeparator, {pageX: 304, pageY: 20});
      expect(document.body.style.cursor).toBe('e-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 304, pageY: 20, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 310, pageY: 20});
      fireEvent.mouseUp(splitSeparator, {pageX: 310, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 310px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '1');

      // move mouse to the far end so that it maxes out 1000px - secondaryMin(304px) = 696px
      fireEvent.mouseEnter(splitSeparator, {pageX: 310, pageY: 20});
      fireEvent.mouseMove(splitSeparator, {pageX: 310, pageY: 20});
      expect(document.body.style.cursor).toBe('ew-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 310, pageY: 20, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 1001, pageY: 20});
      fireEvent.mouseUp(splitSeparator, {pageX: 1001, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // move mouse so we shrink to the collapse point 304px - 50px threshold - 1px = 253px
      fireEvent.mouseEnter(splitSeparator, {pageX: 696, pageY: 20});
      fireEvent.mouseMove(splitSeparator, {pageX: 696, pageY: 20});
      expect(document.body.style.cursor).toBe('w-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 696, pageY: 20, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 253, pageY: 20});
      fireEvent.mouseUp(splitSeparator, {pageX: 253, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 0px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '-77');

      // move mouse so we recover from the collapsing
      fireEvent.mouseEnter(splitSeparator, {pageX: 0, pageY: 20});
      fireEvent.mouseMove(splitSeparator, {pageX: 0, pageY: 20});
      expect(document.body.style.cursor).toBe('e-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 0, pageY: 20, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 254, pageY: 20});
      fireEvent.mouseUp(splitSeparator, {pageX: 254, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate right 304px + 10px = 314px
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 314px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '2');

      // use keyboard to navigate left 314px - 10px = 304px
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate left a second time should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate up shouldn't move
      fireEvent.keyDown(splitSeparator, {key: 'Up'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Up'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate down shouldn't move
      fireEvent.keyDown(splitSeparator, {key: 'Down'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Down'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate End should maximize the primary view -> 696px
      fireEvent.keyDown(splitSeparator, {key: 'End'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'End'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate right at max should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate Home should minimize the primary view, b/c of allows collapsing -> 0px
      fireEvent.keyDown(splitSeparator, {key: 'Home'});
      expect(primaryPane).toHaveAttribute('style', 'width: 0px;');
      fireEvent.keyUp(splitSeparator, {key: 'Home'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '-77');

      // reset us to max size -> 696px
      fireEvent.keyDown(splitSeparator, {key: 'End'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'End'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // collapse us with Enter
      fireEvent.keyDown(splitSeparator, {key: 'Enter'});
      expect(primaryPane).toHaveAttribute('style', 'width: 0px;');
      fireEvent.keyUp(splitSeparator, {key: 'Enter'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '-77');

      // use keyboard to navigate Right should restore it to the last size
      fireEvent.keyDown(splitSeparator, {key: 'Enter'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'Enter'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');
    });

    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{UNSAFE_className: 'splitview'}}
    `('$Name should render a vertical split view', function ({Component, props}) {
      let {getByRole} = render(
        <Component {...props} orientation="vertical">
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({top: 0, bottom: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[0];
      expect(primaryPane).toHaveAttribute('style', 'height: 304px;');
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).toHaveAttribute('tabindex', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');

      // move mouse over to 310 and verify that the size changed
      fireEvent.mouseEnter(splitSeparator, {pageX: 20, pageY: 304});
      fireEvent.mouseMove(splitSeparator, {pageX: 20, pageY: 304});
      expect(document.body.style.cursor).toBe('s-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 20, pageY: 304, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 20, pageY: 307}); // extra move so cursor change flushes
      fireEvent.mouseMove(splitSeparator, {pageX: 20, pageY: 310});
      expect(document.body.style.cursor).toBe('ns-resize');
      fireEvent.mouseUp(splitSeparator, {pageX: 20, pageY: 310, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'height: 310px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '1');

      // move mouse to the far end so that it maxes out 1000px - secondaryMin(304px) = 696px
      fireEvent.mouseEnter(splitSeparator, {pageX: 20, pageY: 310});
      fireEvent.mouseMove(splitSeparator, {pageX: 20, pageY: 310});
      expect(document.body.style.cursor).toBe('ns-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 20, pageY: 310, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 20, pageY: 1001});
      fireEvent.mouseUp(splitSeparator, {pageX: 20, pageY: 1001, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'height: 696px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // move mouse so we shrink to the far left for minimum, non-collapisble = 304px;
      fireEvent.mouseEnter(splitSeparator, {pageX: 20, pageY: 696});
      fireEvent.mouseMove(splitSeparator, {pageX: 20, pageY: 696});
      expect(document.body.style.cursor).toBe('n-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: 20, pageY: 696, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 20, pageY: 0});
      fireEvent.mouseUp(splitSeparator, {pageX: 20, pageY: 0, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'height: 304px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
    });


    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{allowsResizing: false, UNSAFE_className: 'splitview'}}
    `('$Name can be non-resizable', async function ({Component, props}) {
      let {getByRole} = render(
        <Component {...props} UNSAFE_style={{width: '100%'}}>
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({left: 0, right: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[0];
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).not.toHaveAttribute('tabindex');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');

      // move mouse over to 310 and verify that the size changed
      fireEvent.mouseEnter(splitSeparator, {pageX: 304, pageY: 20});
      fireEvent.mouseMove(splitSeparator, {pageX: 304, pageY: 20});
      expect(document.body.style.cursor).toBe('');
      fireEvent.mouseDown(splitSeparator, {pageX: 304, pageY: 20, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: 307, pageY: 20}); // extra move so cursor change flushes
      fireEvent.mouseMove(splitSeparator, {pageX: 310, pageY: 20});
      fireEvent.mouseUp(splitSeparator, {pageX: 310, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
    });

    // V2 version doesn't have this capability, firstly limited by onMouseDown `if (this.props.primarySize !== undefined) {`
    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{primarySize: 500, UNSAFE_className: 'splitview'}}
    `('$Name can have its size controlled', async function ({Component, props}) {
      let onResizeSpy = jest.fn();
      let {getByRole} = render(
        <Component {...props} onResize={onResizeSpy} UNSAFE_style={{width: '100%'}}>
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({left: 0, right: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[0];
      expect(primaryPane).toHaveAttribute('style', `width: ${props.primarySize}px;`);
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).toHaveAttribute('tabindex', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '50');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');

      // move mouse over to 505 and verify that the size didn't change
      fireEvent.mouseEnter(splitSeparator, {pageX: props.primarySize, pageY: 20});
      fireEvent.mouseMove(splitSeparator, {pageX: props.primarySize, pageY: 20});
      expect(document.body.style.cursor).toBe('ew-resize');
      fireEvent.mouseDown(splitSeparator, {pageX: props.primarySize, pageY: 20, button: 0});
      fireEvent.mouseMove(splitSeparator, {pageX: props.primarySize + 5, pageY: 20});
      fireEvent.mouseUp(splitSeparator, {pageX: props.primarySize + 5, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', `width: ${props.primarySize}px;`);
      expect(onResizeSpy).toHaveBeenCalledWith(props.primarySize + 5);
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '50');
    });
  });

  describe('using PointerEvent', function () {
    // Stub offsetWidth/offsetHeight so we can calculate min/max sizes correctly
    let stub1, stub2;
    beforeAll(function () {
      stub1 = jest.spyOn(window.HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => 1000);
      stub2 = jest.spyOn(window.HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => 1000);
    });

    afterAll(function () {
      stub1.mockReset();
      stub2.mockReset();
    });

    afterEach(function () {
      document.body.style.cursor = null;
    });

    installPointerEvent();

    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{UNSAFE_className: 'splitview'}}
    `('$Name handles defaults', async function ({Component, props}) {
      let onResizeSpy = jest.fn();
      let onResizeEndSpy = jest.fn();
      let {getByRole} = render(
        <Component {...props} onResize={onResizeSpy} onResizeEnd={onResizeEndSpy} UNSAFE_style={{width: '100%'}}>
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({left: 0, right: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[0];
      expect(splitview.childNodes[1]).toEqual(splitSeparator);
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).toHaveAttribute('tabindex', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');
      expect(onResizeSpy).not.toHaveBeenCalled();
      expect(onResizeEndSpy).not.toHaveBeenCalled();

      let pageY = 20; // arbitrary
      // move pointer over to 310 and verify that the size changed to 310
      fireEvent.pointerEnter(splitSeparator, {pageX: 304, pageY});
      fireEvent.pointerMove(splitSeparator, {pageX: 304, pageY});
      expect(document.body.style.cursor).toBe('e-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 304, pageY, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 307, pageY}); // extra move so cursor change flushes
      expect(onResizeSpy).toHaveBeenLastCalledWith(307);
      fireEvent.pointerMove(splitSeparator, {pageX: 310, pageY});
      expect(onResizeSpy).toHaveBeenLastCalledWith(310);
      expect(document.body.style.cursor).toBe('ew-resize');
      fireEvent.pointerUp(splitSeparator, {pageX: 310, pageY, button: 0});
      expect(onResizeEndSpy).toHaveBeenLastCalledWith(310);
      expect(primaryPane).toHaveAttribute('style', 'width: 310px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '1');

      // move pointer to the far end so that it maxes out 1000px - secondaryMin(304px) = 696px
      // visual state: primary is maxed out, secondary is at minimum, pointer is beyond the container width
      fireEvent.pointerEnter(splitSeparator, {pageX: 310, pageY});
      fireEvent.pointerMove(splitSeparator, {pageX: 310, pageY});
      expect(document.body.style.cursor).toBe('ew-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 310, pageY, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 1001, pageY});
      expect(onResizeSpy).toHaveBeenLastCalledWith(696);
      fireEvent.pointerUp(splitSeparator, {pageX: 1001, pageY, button: 0});
      expect(onResizeEndSpy).toHaveBeenLastCalledWith(696);
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // move pointer so we shrink to the far left for minimum, non-collapisble = 304px;
      // visual state: primary is at minimum size, secondary is maxed out, pointer is to the left of the split by a lot
      fireEvent.pointerEnter(splitSeparator, {pageX: 696, pageY});
      fireEvent.pointerMove(splitSeparator, {pageX: 696, pageY});
      expect(document.body.style.cursor).toBe('w-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 696, pageY, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 0, pageY});
      expect(onResizeSpy).toHaveBeenLastCalledWith(304);
      fireEvent.pointerUp(splitSeparator, {pageX: 0, pageY, button: 0});
      expect(onResizeEndSpy).toHaveBeenLastCalledWith(304);
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate right 304px + 10px = 314px
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(onResizeSpy).toHaveBeenLastCalledWith(314);
      expect(onResizeEndSpy).toHaveBeenLastCalledWith(314);
      expect(primaryPane).toHaveAttribute('style', 'width: 314px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '2');

      // use keyboard to navigate left 314px - 10px = 304px
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(onResizeSpy).toHaveBeenLastCalledWith(304);
      expect(onResizeEndSpy).toHaveBeenLastCalledWith(304);
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate left a second time should do nothing
      let countResizeEndCall = onResizeEndSpy.mock.calls.length;
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(onResizeEndSpy.mock.calls.length).toBe(countResizeEndCall);
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate up shouldn't move
      fireEvent.keyDown(splitSeparator, {key: 'Up'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Up'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate down shouldn't move
      fireEvent.keyDown(splitSeparator, {key: 'Down'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Down'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate End should maximize the primary view -> 696px
      fireEvent.keyDown(splitSeparator, {key: 'End'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'End'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate right at max size should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate Home should minimize the primary view -> 304px
      fireEvent.keyDown(splitSeparator, {key: 'Home'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Home'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate Enter should do nothing because default does not allow collapsings
      fireEvent.keyDown(splitSeparator, {key: 'Enter'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Enter'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate right 304px + 10px = 314px and then use Enter, should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 314px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      fireEvent.keyDown(splitSeparator, {key: 'Enter'});
      expect(primaryPane).toHaveAttribute('style', 'width: 314px;');
      fireEvent.keyUp(splitSeparator, {key: 'Enter'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '2');
    });

    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{UNSAFE_className: 'splitview'}}
    `('$Name handles primaryPane being second', function ({Component, props}) {
      let {getByRole} = render(
        <Component {...props} primaryPane={1} UNSAFE_style={{width: '100%'}}>
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({left: 0, right: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[2];
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).toHaveAttribute('tabindex', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');
      expect(document.body.style.cursor).toBe('');

      // primary as second means pointer needs to go to 696px to get the handle
      // move pointer over to 670 and verify that the size changed to 1000px - 670px = 330px
      fireEvent.pointerEnter(splitSeparator, {pageX: 696, pageY: 20});
      fireEvent.pointerMove(splitSeparator, {pageX: 696, pageY: 20});
      expect(document.body.style.cursor).toBe('w-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 696, pageY: 20, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 680, pageY: 20});
      fireEvent.pointerMove(splitSeparator, {pageX: 670, pageY: 20});
      fireEvent.pointerUp(splitSeparator, {pageX: 670, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 330px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '6');

      // move pointer to the far end so that it maxes out 1000px - secondaryMin(304px) = 696px
      fireEvent.pointerEnter(splitSeparator, {pageX: 670, pageY: 20});
      fireEvent.pointerMove(splitSeparator, {pageX: 670, pageY: 20});
      expect(document.body.style.cursor).toBe('ew-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 670, pageY: 20, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 0, pageY: 20});
      fireEvent.pointerUp(splitSeparator, {pageX: 0, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate right 696px - 10px = 686px
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 686px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '97');

      // use keyboard to navigate left 686px + 10px = 696px
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate Home should minimize the primary view -> 304px
      fireEvent.keyDown(splitSeparator, {key: 'Home'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Home'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate right at min size should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate End should maximize the primary view -> 696px
      fireEvent.keyDown(splitSeparator, {key: 'End'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'End'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate left at max size should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');
    });


    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{allowsCollapsing: true, UNSAFE_className: 'splitview'}}
    `('$Name handles allowsCollapsing', function ({Component, props}) {
      let {getByRole} = render(
        <Component {...props} UNSAFE_style={{width: '100%'}}>
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({left: 0, right: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[0];
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).toHaveAttribute('tabindex', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');
      expect(document.body.style.cursor).toBe('');

      // move pointer over to 310 and verify that the size changed
      fireEvent.pointerEnter(splitSeparator, {pageX: 304, pageY: 20});
      fireEvent.pointerMove(splitSeparator, {pageX: 304, pageY: 20});
      expect(document.body.style.cursor).toBe('e-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 304, pageY: 20, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 310, pageY: 20});
      fireEvent.pointerUp(splitSeparator, {pageX: 310, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 310px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '1');

      // move pointer to the far end so that it maxes out 1000px - secondaryMin(304px) = 696px
      fireEvent.pointerEnter(splitSeparator, {pageX: 310, pageY: 20});
      fireEvent.pointerMove(splitSeparator, {pageX: 310, pageY: 20});
      expect(document.body.style.cursor).toBe('ew-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 310, pageY: 20, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 1001, pageY: 20});
      fireEvent.pointerUp(splitSeparator, {pageX: 1001, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // move pointer so we shrink to the collapse point 304px - 50px threshold - 1px = 253px
      fireEvent.pointerEnter(splitSeparator, {pageX: 696, pageY: 20});
      fireEvent.pointerMove(splitSeparator, {pageX: 696, pageY: 20});
      expect(document.body.style.cursor).toBe('w-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 696, pageY: 20, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 253, pageY: 20});
      fireEvent.pointerUp(splitSeparator, {pageX: 253, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 0px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '-77');

      // move pointer so we recover from the collapsing
      fireEvent.pointerEnter(splitSeparator, {pageX: 0, pageY: 20});
      fireEvent.pointerMove(splitSeparator, {pageX: 0, pageY: 20});
      expect(document.body.style.cursor).toBe('e-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 0, pageY: 20, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 254, pageY: 20});
      fireEvent.pointerUp(splitSeparator, {pageX: 254, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate right 304px + 10px = 314px
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 314px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '2');

      // use keyboard to navigate left 314px - 10px = 304px
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate left a second time should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Left'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Left'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate up shouldn't move
      fireEvent.keyDown(splitSeparator, {key: 'Up'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Up'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate down shouldn't move
      fireEvent.keyDown(splitSeparator, {key: 'Down'});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      fireEvent.keyUp(splitSeparator, {key: 'Down'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');

      // use keyboard to navigate End should maximize the primary view -> 696px
      fireEvent.keyDown(splitSeparator, {key: 'End'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'End'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate right at max should do nothing
      fireEvent.keyDown(splitSeparator, {key: 'Right'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'Right'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // use keyboard to navigate Home should minimize the primary view, b/c of allows collapsing -> 0px
      fireEvent.keyDown(splitSeparator, {key: 'Home'});
      expect(primaryPane).toHaveAttribute('style', 'width: 0px;');
      fireEvent.keyUp(splitSeparator, {key: 'Home'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '-77');

      // reset us to max size -> 696px
      fireEvent.keyDown(splitSeparator, {key: 'End'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'End'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // collapse us with Enter
      fireEvent.keyDown(splitSeparator, {key: 'Enter'});
      expect(primaryPane).toHaveAttribute('style', 'width: 0px;');
      fireEvent.keyUp(splitSeparator, {key: 'Enter'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '-77');

      // use keyboard to navigate Right should restore it to the last size
      fireEvent.keyDown(splitSeparator, {key: 'Enter'});
      expect(primaryPane).toHaveAttribute('style', 'width: 696px;');
      fireEvent.keyUp(splitSeparator, {key: 'Enter'});
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');
    });

    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{UNSAFE_className: 'splitview'}}
    `('$Name should render a vertical split view', function ({Component, props}) {
      let {getByRole} = render(
        <Component {...props} orientation="vertical">
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({top: 0, bottom: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[0];
      expect(primaryPane).toHaveAttribute('style', 'height: 304px;');
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).toHaveAttribute('tabindex', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');

      // move pointer over to 310 and verify that the size changed
      fireEvent.pointerEnter(splitSeparator, {pageX: 20, pageY: 304});
      fireEvent.pointerMove(splitSeparator, {pageX: 20, pageY: 304});
      expect(document.body.style.cursor).toBe('s-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 20, pageY: 304, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 20, pageY: 307}); // extra move so cursor change flushes
      fireEvent.pointerMove(splitSeparator, {pageX: 20, pageY: 310});
      expect(document.body.style.cursor).toBe('ns-resize');
      fireEvent.pointerUp(splitSeparator, {pageX: 20, pageY: 310, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'height: 310px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '1');

      // move pointer to the far end so that it maxes out 1000px - secondaryMin(304px) = 696px
      fireEvent.pointerEnter(splitSeparator, {pageX: 20, pageY: 310});
      fireEvent.pointerMove(splitSeparator, {pageX: 20, pageY: 310});
      expect(document.body.style.cursor).toBe('ns-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 20, pageY: 310, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 20, pageY: 1001});
      fireEvent.pointerUp(splitSeparator, {pageX: 20, pageY: 1001, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'height: 696px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '100');

      // move pointer so we shrink to the far left for minimum, non-collapisble = 304px;
      fireEvent.pointerEnter(splitSeparator, {pageX: 20, pageY: 696});
      fireEvent.pointerMove(splitSeparator, {pageX: 20, pageY: 696});
      expect(document.body.style.cursor).toBe('n-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: 20, pageY: 696, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 20, pageY: 0});
      fireEvent.pointerUp(splitSeparator, {pageX: 20, pageY: 0, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'height: 304px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
    });


    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{allowsResizing: false, UNSAFE_className: 'splitview'}}
    `('$Name can be non-resizable', async function ({Component, props}) {
      let {getByRole} = render(
        <Component {...props} UNSAFE_style={{width: '100%'}}>
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({left: 0, right: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[0];
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).not.toHaveAttribute('tabindex');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');

      // move pointer over to 310 and verify that the size changed
      fireEvent.pointerEnter(splitSeparator, {pageX: 304, pageY: 20});
      fireEvent.pointerMove(splitSeparator, {pageX: 304, pageY: 20});
      expect(document.body.style.cursor).toBe('');
      fireEvent.pointerDown(splitSeparator, {pageX: 304, pageY: 20, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: 307, pageY: 20}); // extra move so cursor change flushes
      fireEvent.pointerMove(splitSeparator, {pageX: 310, pageY: 20});
      fireEvent.pointerUp(splitSeparator, {pageX: 310, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', 'width: 304px;');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '0');
    });

    // V2 version doesn't have this capability, firstly limited by onpointerDown `if (this.props.primarySize !== undefined) {`
    it.each`
      Name             | Component      | props
      ${'SplitView'}   | ${SplitView}   | ${{primarySize: 500, UNSAFE_className: 'splitview'}}
    `('$Name can have its size controlled', async function ({Component, props}) {
      let onResizeSpy = jest.fn();
      let {getByRole} = render(
        <Component {...props} onResize={onResizeSpy} UNSAFE_style={{width: '100%'}}>
          <div>Left</div>
          <div>Right</div>
        </Component>
      );

      let splitview = document.querySelector('.splitview');
      splitview.getBoundingClientRect = jest.fn(() => ({left: 0, right: 1000}));
      let splitSeparator = getByRole('separator');
      let primaryPane = splitview.childNodes[0];
      expect(primaryPane).toHaveAttribute('style', `width: ${props.primarySize}px;`);
      let id = primaryPane.getAttribute('id');
      expect(splitSeparator).toHaveAttribute('aria-controls', id);
      expect(splitSeparator).toHaveAttribute('tabindex', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '50');
      expect(splitSeparator).toHaveAttribute('aria-valuemin', '0');
      expect(splitSeparator).toHaveAttribute('aria-valuemax', '100');

      // move pointer over to 505 and verify that the size didn't change
      fireEvent.pointerEnter(splitSeparator, {pageX: props.primarySize, pageY: 20});
      fireEvent.pointerMove(splitSeparator, {pageX: props.primarySize, pageY: 20});
      expect(document.body.style.cursor).toBe('ew-resize');
      fireEvent.pointerDown(splitSeparator, {pageX: props.primarySize, pageY: 20, button: 0});
      fireEvent.pointerMove(splitSeparator, {pageX: props.primarySize + 5, pageY: 20});
      fireEvent.pointerUp(splitSeparator, {pageX: props.primarySize + 5, pageY: 20, button: 0});
      expect(primaryPane).toHaveAttribute('style', `width: ${props.primarySize}px;`);
      expect(onResizeSpy).toHaveBeenCalledWith(props.primarySize + 5);
      expect(splitSeparator).toHaveAttribute('aria-valuenow', '50');
    });
  });
});
