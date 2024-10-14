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
import React from 'react';
import { useFormEngineContext } from '../formEngineContext';
import { ContentTypeField } from '../../../models/ContentType';
import { FormEngineField } from '../common/FormEngineField';
import { ControlProps } from '../types';
import ContentInstance from '../../../models/ContentInstance';

export interface TextProps extends ControlProps {}

export function Text(props: TextProps) {
  const { field } = props;
  const fieldId = field.id;
  const [context, api] = useFormEngineContext();
  const { values } = context;
  const value: string = ((fieldId === 'internalName' ? values['internal-name'] : values[fieldId]) ?? '') as string;
  const { updateValue } = api.current;
  const maxLength = field.validations.maxLength?.value;
  return (
    <FormEngineField field={field} max={maxLength} length={value.length}>
      <OutlinedInput
        fullWidth
        inputProps={{ maxLength }}
        id={fieldId}
        value={value}
        onChange={(e) => updateValue(fieldId, e.currentTarget.value)}
      />
    </FormEngineField>
  );
}

export function serialize(): string {
  return null;
}

export function deserialize(): unknown {
  return null;
}

export default Text;
