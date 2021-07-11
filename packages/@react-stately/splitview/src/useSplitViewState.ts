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

import {SplitViewState, SplitViewStatelyProps} from '@react-types/shared';
import {useControlledState} from '@react-stately/utils';
import {useRef, useState} from 'react';

const COLLAPSE_THRESHOLD = 50;

export function useSplitViewState(props: SplitViewStatelyProps): SplitViewState {
  const {
    defaultPrimarySize = 304,
    primarySize,
    allowsCollapsing = false,
    onResize,
    onResizeEnd
  } = props;

  const [minPos, setMinPos] = useState(0);
  const [maxPos, setMaxPos] = useState(0);
  const [dragging, setDragging] = useState(false);
  const realTimeDragging = useRef(false);
  const [hovered, setHovered] = useState(false);
  const [offset, setOffset] = useControlledState(primarySize, defaultPrimarySize, () => {});
  const realTimeOffset = useRef<number>(null);
  realTimeOffset.current = offset;
  const prevOffset = useRef(offset);

  const hasChangedSinceDragStart = useRef<boolean>(null);

  let callOnResize = (value) => {
    if (onResize && value !== offset) {
      hasChangedSinceDragStart.current = true;
      onResize(value);
    }
  };

  let callOnResizeEnd = (value) => {
    if (hasChangedSinceDragStart.current && onResizeEnd) {
      onResizeEnd(value);
    }
  };

  let boundOffset = (offset) => {
    let dividerPosition = offset;
    if (allowsCollapsing && offset < minPos - COLLAPSE_THRESHOLD) {
      dividerPosition = 0;
    } else if (offset < minPos) {
      dividerPosition = minPos;
    } else if (offset > maxPos) {
      dividerPosition = maxPos;
    }
    return dividerPosition;
  };

  let setOffsetValue = (value) => {
    let nextOffset = boundOffset(value);
    callOnResize(nextOffset);
    setOffset(nextOffset);
    realTimeOffset.current = nextOffset;
  };

  let setDraggingValue = (value) => {
    if (realTimeDragging.current !== value) {
      realTimeDragging.current = value;
      setDragging(value);
      if (!value) {
        callOnResizeEnd(realTimeOffset.current);
      } else {
        hasChangedSinceDragStart.current = false;
      }
    }
  };

  let setHoverValue = (value) => {
    setHovered(value);
  };

  let increment = () => {
    let nextOffset = boundOffset(realTimeOffset.current + 10);
    if (nextOffset !== offset) {
      callOnResize(nextOffset);
    }
    realTimeOffset.current = nextOffset;
    setOffset(nextOffset);
  };

  let decrement = () => {
    let nextOffset = boundOffset(realTimeOffset.current - 10);
    if (nextOffset !== offset) {
      callOnResize(nextOffset);
    }
    realTimeOffset.current = nextOffset;
    setOffset(nextOffset);
  };

  let decrementToMin = () => {
    let nextOffset = allowsCollapsing ? 0 : minPos;
    if (nextOffset !== offset) {
      callOnResize(nextOffset);
      setOffset(nextOffset);
      realTimeOffset.current = nextOffset;
    }
  };

  let incrementToMax = () => {
    let nextOffset = maxPos;
    if (nextOffset !== offset) {
      callOnResize(nextOffset);
      setOffset(nextOffset);
      realTimeOffset.current = nextOffset;
    }
  };

  let collapseToggle = () => setOffset(prevHandleOffset => {
    if (!allowsCollapsing) {
      return prevHandleOffset;
    }
    let oldOffset = prevOffset.current;
    if (prevHandleOffset !== prevOffset.current) {
      prevOffset.current = prevHandleOffset;
    }
    let nextOffset = prevHandleOffset === 0 ? oldOffset || minPos : 0;
    callOnResize(nextOffset);
    return nextOffset;
  });

  return {
    handleState: {
      offset,
      dragging,
      hovered,
      setOffset: setOffsetValue,
      setDragging: setDraggingValue,
      setHover: setHoverValue,
      increment,
      decrement,
      incrementToMax,
      decrementToMin,
      collapseToggle
    },
    containerState: {
      minPos,
      maxPos,
      setMinPos,
      setMaxPos
    }
  };
}
