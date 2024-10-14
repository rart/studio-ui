/*
 * Copyright (C) 2007-2024 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import OutlinedInput from '@mui/material/OutlinedInput';
import React, { useMemo } from 'react';
import { useFormEngineContext } from '../formEngineContext';
import { ContentTypeField } from '../../../models/ContentType';
import { applyContentNameRules } from '../../../utils/content';
import { FormEngineField } from '../common/FormEngineField';
import { getInnerHtml } from '../../../utils/xml';
import InputAdornment from '@mui/material/InputAdornment';
import { ControlProps } from '../types';

export interface SlugProps extends ControlProps {}

export function Slug(props: SlugProps) {
  const { field } = props;
  const fieldId = field.id === 'fileName' || field.id === 'file-name' ? 'folder-name' : field.id;
  const [context, api] = useFormEngineContext();
  const { values, item } = context;
  const value: string = (values[fieldId] as string) ?? '';
  const location = useMemo(() => {
    /* Example:
     *   item.path = '/site/website/headless-cms-solutions/enterprise/index.xml'
     *   pieces = item.path.split('/').slice(3)
     *     ==> ['headless-cms-solutions', 'enterprise', 'index.xml']
     *   pieces.slice(0, result.length - 2)
     *     ==> ['headless-cms-solutions'] */
    const pieces = item.path
      .split('/')
      // .slice(3) removes the first empty string ('') created by the leading slash,
      // 'site', and whatever comes after (e.g. 'components' in /site/components,
      // or 'website' in /site/website).
      .slice(3);
    return (
      `/${
        // .slice(0, length - 2) removes the folder name and file name.
        // In the case of no folder name, it will return an empty string.
        pieces.slice(0, pieces.length - 2).join('/')
      }/`.replace(/\/+/g, '/')
    );
  }, [item.path]);
  const { updateValue } = api.current;
  return (
    <FormEngineField
      field={field}
      min={field.validations.minValue?.value}
      max={field.validations.maxLength?.value}
      length={value.length}
    >
      <OutlinedInput
        fullWidth
        id={fieldId}
        value={value}
        onChange={(e) => updateValue(fieldId, applyContentNameRules(e.currentTarget.value))}
        startAdornment={
          <InputAdornment position="start" title={location}>
            {location}
          </InputAdornment>
        }
      />
    </FormEngineField>
  );
}

export function serialize(): string {
  return null;
}

export function deserialize(field: ContentTypeField, contentDom: XMLDocument): unknown {
  // See services/contentTypes/parseLegacyFormDefinitionFields (line ~259)
  const fieldId = field.id === 'fileName' ? 'file-name' : field.id;
  const folderName = getInnerHtml(contentDom.querySelector(':scope > folder-name'));
  const fileName = getInnerHtml(contentDom.querySelector(`:scope > ${fieldId}`)).replace('index.xml', '');
  return `${folderName}${fileName}`;
}

export default Slug;
