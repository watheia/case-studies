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

import {DOMProps, MultipleSelection, Removable, StyleProps} from '@react-types/shared';
import {ReactChild, ReactElement, ReactNode} from 'react';

export interface TagProps extends Removable<ReactChild, void> {
  children?: ReactNode,
  icon?: ReactElement,
  isDisabled?: boolean,
  validationState?: 'invalid' | 'valid'
}

export interface TagGroupProps extends MultipleSelection {
  children: ReactElement<TagProps> | ReactElement<TagProps>[],
  isDisabled?: boolean,
  isReadOnly?: boolean,
  onRemove?: (items: any[]) => void,
  validationState?: 'invalid' | 'valid'
}

export interface SpectrumTagProps extends TagProps, DOMProps, StyleProps {}
export interface SpectrumTagGroupProps extends TagGroupProps, DOMProps, StyleProps {}
