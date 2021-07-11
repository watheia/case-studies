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

import {RangeValue} from '@react-types/shared';

export interface CalendarStateBase {
  isDisabled: boolean,
  isReadOnly: boolean,
  currentMonth: Date,
  focusedDate: Date,
  setFocusedDate(value: Date): void,
  focusNextDay(): void,
  focusPreviousDay(): void,
  focusNextWeek(): void,
  focusPreviousWeek(): void,
  focusNextMonth(): void,
  focusPreviousMonth(): void,
  focusStartOfMonth(): void,
  focusEndOfMonth(): void,
  focusNextYear(): void,
  focusPreviousYear(): void,
  selectFocusedDate(): void,
  selectDate(date: Date): void,
  isFocused: boolean,
  setFocused(value: boolean): void,
  weeksInMonth: number,
  weekStart: number,
  daysInMonth: number,
  weekDays: Array<Date>,
  getCellDate(weekIndex: number, dayIndex: number): Date,
  isInvalid(date: Date): boolean,
  isSelected(date: Date): boolean,
  isCellFocused(date: Date): boolean,
  isCellDisabled(date: Date): boolean,
  isPreviousMonthInvalid(): boolean,
  isNextMonthInvalid(): boolean
}

export interface CalendarState extends CalendarStateBase {
  value: Date,
  setValue(value: Date): void
}

export interface RangeCalendarState extends CalendarStateBase {
  value: RangeValue<Date>,
  setValue(value: RangeValue<Date>): void,
  highlightDate(date: Date): void,
  anchorDate: Date | null,
  setAnchorDate(date: Date | null): void,
  highlightedRange: RangeValue<Date>
}
