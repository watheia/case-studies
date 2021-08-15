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

import { useLocale } from "@react-aria/i18n";
import { useListBoxSection } from "@react-aria/listbox";
import { useSeparator } from "@react-aria/separator";
import { layoutInfoToStyle, useVirtualizerItem } from "@react-aria/virtualizer";
import { classNames } from "@react-spectrum/utils";
import { ReusableView } from "@react-stately/virtualizer";
import { Node } from "@react-types/shared";
import styles from "@watheia/spectrum-css-temp/components/menu/vars.css";
import React, { Fragment, ReactNode, useContext, useRef } from "react";
import { ListBoxContext } from "./ListBoxContext";

interface ListBoxSectionProps<T> {
  reusableView: ReusableView<Node<T>, unknown>,
  header: ReusableView<Node<T>, unknown>,
  children?: ReactNode
}

/** @private */
export function ListBoxSection<T>(props: ListBoxSectionProps<T>) {
  let {children, reusableView, header} = props;
  let item = reusableView.content;
  let {headingProps, groupProps} = useListBoxSection({
    heading: item.rendered,
    "aria-label": item["aria-label"]
  });

  let {separatorProps} = useSeparator({
    elementType: "li"
  });

  let headerRef = useRef();
  useVirtualizerItem({
    reusableView: header,
    ref: headerRef
  });

  let {direction} = useLocale();
  let state = useContext(ListBoxContext);

  return (
    <Fragment>
      <div role="presentation" ref={headerRef} style={layoutInfoToStyle(header.layoutInfo, direction)}>
        {item.key !== state.collection.getFirstKey() &&
          <div
            {...separatorProps}
            className={classNames(
              styles,
              "spectrum-Menu-divider"
            )} />
        }
        {item.rendered &&
          <div
            {...headingProps}
            className={
              classNames(
                styles,
                "spectrum-Menu-sectionHeading"
              )
            }>
            {item.rendered}
          </div>
        }
      </div>
      <div
        {...groupProps}
        style={layoutInfoToStyle(reusableView.layoutInfo, direction)}
        className={
          classNames(
            styles,
            "spectrum-Menu"
          )
        }>
        {children}
      </div>
    </Fragment>
  );
}
