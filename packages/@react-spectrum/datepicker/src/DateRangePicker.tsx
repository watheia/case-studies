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

import CalendarIcon from '@spectrum-icons/workflow/Calendar';
import {classNames, useStyleProps} from '@react-spectrum/utils';
import {DatePickerField} from './DatePickerField';
import datepickerStyles from './index.css';
import {Dialog, DialogTrigger} from '@react-spectrum/dialog';
import {FieldButton} from '@react-spectrum/button';
import {FocusRing, FocusScope, useFocusManager} from '@react-aria/focus';
import {mergeProps} from '@react-aria/utils';
import {RangeCalendar} from '@react-spectrum/calendar';
import React, {useRef} from 'react';
import {SpectrumDateRangePickerProps} from '@react-types/datepicker';
import styles from '@adobe/spectrum-css-temp/components/inputgroup/vars.css';
import {useDateRangePicker} from '@react-aria/datepicker';
import {useDateRangePickerState} from '@react-stately/datepicker';
import {useHover} from '@react-aria/interactions';
import {useLocale} from '@react-aria/i18n';
import {useProviderProps} from '@react-spectrum/provider';

export function DateRangePicker(props: SpectrumDateRangePickerProps) {
  props = useProviderProps(props);
  let {
    isQuiet,
    isDisabled,
    isReadOnly,
    isRequired,
    autoFocus,
    formatOptions,
    placeholderDate,
    ...otherProps
  } = props;
  let {styleProps} = useStyleProps(otherProps);
  let {hoverProps, isHovered} = useHover({isDisabled});
  let state = useDateRangePickerState(props);
  let {comboboxProps, buttonProps, dialogProps, startFieldProps, endFieldProps} = useDateRangePicker(props, state);
  let {value, setDate, selectDateRange, isOpen, setOpen} = state;
  let targetRef = useRef<HTMLDivElement>();
  let {direction} = useLocale();

  let className = classNames(
    styles,
    'spectrum-InputGroup',
    'spectrum-Datepicker--range',
    {
      'spectrum-InputGroup--quiet': isQuiet,
      'is-invalid': state.validationState === 'invalid',
      'is-disabled': isDisabled,
      'is-hovered': isHovered
    },
    styleProps.className
  );

  return (
    <FocusRing
      within
      isTextInput
      focusClass={classNames(styles, 'is-focused')}
      focusRingClass={classNames(styles, 'focus-ring')}
      autoFocus={autoFocus}>
      <div
        {...styleProps}
        {...mergeProps(comboboxProps, hoverProps)}
        className={className}
        ref={targetRef}>
        <FocusScope autoFocus={autoFocus}>
          <DatePickerField
            {...startFieldProps as any}
            isQuiet={props.isQuiet}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            isRequired={isRequired}
            formatOptions={formatOptions}
            placeholderDate={placeholderDate}
            value={value.start}
            onChange={start => setDate('start', start)}
            UNSAFE_className={classNames(styles, 'spectrum-Datepicker-startField')} />
          <DateRangeDash />
          <DatePickerField
            {...endFieldProps as any}
            isQuiet={props.isQuiet}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            isRequired={isRequired}
            validationState={state.validationState}
            formatOptions={formatOptions}
            placeholderDate={placeholderDate}
            value={value.end}
            onChange={end => setDate('end', end)}
            UNSAFE_className={classNames(
              styles,
              'spectrum-Datepicker-endField',
              classNames(
                datepickerStyles,
                'react-spectrum-Datepicker-endField'
              )
            )} />
        </FocusScope>
        <DialogTrigger
          type="popover"
          mobileType="tray"
          placement={direction === 'rtl' ? 'bottom right' : 'bottom left'}
          targetRef={targetRef}
          hideArrow
          isOpen={isOpen}
          onOpenChange={setOpen}>
          <FieldButton
            {...buttonProps}
            UNSAFE_className={classNames(styles, 'spectrum-FieldButton')}
            isQuiet={isQuiet}
            validationState={state.validationState}
            isDisabled={isDisabled || isReadOnly}>
            <CalendarIcon />
          </FieldButton>
          <Dialog UNSAFE_className={classNames(datepickerStyles, 'react-spectrum-Datepicker-dialog')} {...dialogProps}>
            <RangeCalendar
              autoFocus
              value={value}
              onChange={selectDateRange} />
          </Dialog>
        </DialogTrigger>
      </div>
    </FocusRing>
  );
}

function DateRangeDash() {
  let focusManager = useFocusManager();
  let onMouseDown = (e) => {
    e.preventDefault();
    focusManager.focusNext({from: e.target});
  };

  return (
    <div
      role="presentation"
      data-testid="date-range-dash"
      className={classNames(styles, 'spectrum-Datepicker--rangeDash')}
      onMouseDown={onMouseDown} />
  );
}
