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

import {AriaCheckboxProps} from '@react-types/checkbox';
import {getRowLabelledBy} from './utils';
import {Key} from 'react';
import {TableState} from '@react-stately/table';
import {useId} from '@react-aria/utils';

interface SelectionCheckboxProps {
  /** A unique key for the checkbox. */
  key: Key
}

interface SelectionCheckboxAria {
  /** Props for the row selection checkbox element. */
  checkboxProps: AriaCheckboxProps
}

interface SelectAllCheckboxAria {
  /** Props for the select all checkbox element. */
  checkboxProps: AriaCheckboxProps
}

/**
 * Provides the behavior and accessibility implementation for a selection checkbox in a table.
 * @param props - Props for the selection checkbox.
 * @param state - State of the table, as returned by `useTableState`.
 */
export function useTableSelectionCheckbox<T>(props: SelectionCheckboxProps, state: TableState<T>): SelectionCheckboxAria {
  let {key} = props;

  let manager = state.selectionManager;
  let checkboxId = useId();
  let isDisabled = state.disabledKeys.has(key);
  let isSelected = state.selectionManager.isSelected(key);

  let onChange = () => manager.select(key);

  return {
    checkboxProps: {
      id: checkboxId,
      'aria-label': 'Select',
      'aria-labelledby': `${checkboxId} ${getRowLabelledBy(state, key)}`,
      isSelected,
      isDisabled: isDisabled || manager.selectionMode === 'none',
      onChange
    }
  };
}

/**
 * Provides the behavior and accessibility implementation for the select all checkbox in a table.
 * @param props - Props for the select all checkbox.
 * @param state - State of the table, as returned by `useTableState`.
 */
export function useTableSelectAllCheckbox<T>(state: TableState<T>): SelectAllCheckboxAria {
  let {isEmpty, isSelectAll, selectionMode} = state.selectionManager;
  return {
    checkboxProps: {
      'aria-label': 'Select All',
      isSelected: isSelectAll,
      isDisabled: selectionMode !== 'multiple',
      isIndeterminate: !isEmpty && !isSelectAll,
      onChange: () => state.selectionManager.toggleSelectAll()
    }
  };
}
