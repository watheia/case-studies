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

import {number, withKnobs} from '@storybook/addon-knobs';
import {ProgressBar} from '../';
import React, {CSSProperties} from 'react';
import {storiesOf} from '@storybook/react';

const sliderOptions = {
  range: true,
  min: 0,
  max: 100,
  step: 1
};

const formatOptions = {
  style: 'currency',
  currency: 'JPY'
};

const grayedBoxStyle: CSSProperties = {
  width: '250px',
  height: '60px',
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

storiesOf('Progress/ProgressBar', module)
  .addParameters({providerSwitcher: {status: 'positive'}})
  .addDecorator(withKnobs)
  .add(
    'Default',
    () => render()
  )
  .add(
    'value: 50',
    () => render({value: 50})
  )
  .add(
    'value: 100',
    () => render({value: 100})
  )
  .add(
    'size: S',
    () => {
      const value = number('Value', 50, sliderOptions);
      return render({value, size: 'S'});
    }
  )
  .add(
    'showValueLabel: true',
    () => {
      const value = number('Value', 32, sliderOptions);
      return render({showValueLabel: true, value});
    }
  )
  .add(
    'showValueLabel: false',
    () => {
      const value = number('Value', 32, sliderOptions);
      return render({showValueLabel: false, value});
    }
  )
  .add(
    'valueLabel: 1 of 4',
    () => render({value: 25, valueLabel: '1 of 4'})
  )
  .add(
    'Using number formatOptions with currency style',
    () => {
      const value = number('Value', 60, sliderOptions);
      return render({
        showValueLabel: true,
        value,
        formatOptions
      });
    }
  )
  .add(
    'no visible label',
    () => {
      const value = number('Value', 32, sliderOptions);
      return render({label: null, 'aria-label': 'Loading…', value});
    }
  )
  .add(
    'labelPosition: side',
    () => {
      const value = number('Value', 32, sliderOptions);
      return render({value, labelPosition: 'side'});
    }
  )
  .add(
    'labelPosition: top',
    () => {
      const value = number('Value', 32, sliderOptions);
      return render({value, labelPosition: 'top'});
    }
  )
  .add(
    'long label',
    () => {
      const value = number('Value', 32, sliderOptions);
      return render({value, label: 'Super long progress bar label. Sample label copy. Loading...'});
    }
  )
  .add(
    'long label, labelPosition: side',
    () => {
      const value = number('Value', 32, sliderOptions);
      return render({value, labelPosition: 'side', label: 'Super long progress bar label. Sample label copy. Loading...'});
    }
  )
  .add(
    'isIndeterminate: true',
    () => {
      const value = number('Value', 32, sliderOptions);
      return render({isIndeterminate: true, value});
    }
  )
  .add(
    'isIndeterminate: true, size: S',
    () => render({isIndeterminate: true, size: 'S'})
  )
  .add(
    'variant: overBackground',
    () => {
      const value = number('Value', 32, sliderOptions);
      return (
        <div style={grayedBoxStyle}>
          {render({variant: 'overBackground', value})}
        </div>
      );
    }
  )
  .add(
    'parent width 100%',
    () => (
      <span style={{width: '100%'}}>
        {render()}
      </span>
    )
  )
  .add(
    'parent width 100px',
    () => (
      <span style={{width: '100px'}}>
        {render()}
      </span>
    )
  )
  .add(
    'width: 300px',
    () => render({width: '300px', value: 100})
  )
  .add(
    'width: 300px, isIndeterminate: true',
    () => render({width: '300px', isIndeterminate: true})
  )
  .add(
    'width: 300px, labelPosition: side',
    () => render({width: '300px', labelPosition: 'side'})
  )
  .add(
    'width: 300px, labelPosition: side, isIndeterminate: true',
    () => render({width: '300px', labelPosition: 'side', isIndeterminate: true})
  )
  .add(
    'width: 30px',
    () => render({width: '30px'})
  )
  .add(
    'width: 30px, size: S',
    () => render({width: '30px', size: 'S'})
  )
  .add(
    'width: 30px, labelPosition: side, long label',
    () => render({width: '30px', labelPosition: 'side', label: 'Super long progress bar label. Sample label copy. Loading...'})
  )
  .add(
    'width: 30px, labelPosition: side, isIndeterminate: true, long label, button on right',
    () => (
      <>
        {render({width: '30px', labelPosition: 'side', isIndeterminate: true, label: 'Super long progress bar label. Sample label copy. Loading...'})}
        <button>Confirm</button>
      </>
    )
  )
  .add(
    'Using raw values for minValue, maxValue, and value',
    () => render({
      showValueLabel: true,
      labelPosition: 'top',
      maxValue: 2147483648,
      value: 715827883
    })
  )
  .add(
    'Using raw values with number formatter',
    () => render({
      showValueLabel: true,
      labelPosition: 'top',
      maxValue: 2147483648,
      value: 715827883,
      formatOptions
    })
  );

function render(props: any = {}) {
  return (<ProgressBar label="Loading…" {...props} />);
}
