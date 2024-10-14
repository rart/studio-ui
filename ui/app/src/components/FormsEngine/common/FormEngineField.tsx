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

import { ContentTypeField } from '../../../models';
import { useFormEngineContext } from '../formEngineContext';
import FormControl from '@mui/material/FormControl';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import { FieldRequiredStateIndicator } from './FieldRequiredStateIndicator';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import React, { PropsWithChildren, ReactNode } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

function createLengthBlock({ length, max, min }: { length: number; max: number; min: number }) {
  const pieces = [];
  if (length != null) {
    pieces.push(`${length}`);
  }
  if (pieces.length && (min != null || max != null)) pieces.push('/');
  if (min != null && max != null) {
    pieces.push(`${min}-${max}`);
  } else if (max != null) {
    pieces.push(`${max}`);
  }
  return pieces.length ? (
    <Typography variant="body2" color="textSecondary" children={pieces.join('')} sx={{ mr: 1 }} />
  ) : null;
}

export function FormEngineField(
  props: PropsWithChildren<{
    field: ContentTypeField;
    min?: number;
    max?: number;
    length?: number;
    actions?: ReactNode;
  }>
) {
  const { children, field, max, min, length, actions } = props;
  const [{ fieldExpandedState }, { current }] = useFormEngineContext();
  const fieldId = field.id;
  const hasHelpText = Boolean(field.helpText);
  const hasDescription = Boolean(field.description);
  const lengthBlock = createLengthBlock({ length, max, min });
  return (
    <FormControl
      fullWidth
      variant="standard"
      data-field-id={fieldId}
      required={field.validations.required?.value}
      sx={{ '.MuiFormLabel-asterisk': { display: 'none' } }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <InputLabel
            shrink
            component="label"
            htmlFor={fieldId}
            sx={{
              transform: 'none',
              transition: 'none',
              lineHeight: 'inherit',
              position: 'relative'
            }}
          >
            {field.name}
          </InputLabel>
          {field.validations.required?.value && <FieldRequiredStateIndicator isValid={false} />}
          {hasHelpText && (
            <IconButton size="small" onClick={(e) => current.handleViewFieldHelpText(e, field)}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Box display="flex" alignItems="center">
          {lengthBlock}
          {actions}
          <IconButton size="small">
            <MoreVertRounded fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      {hasHelpText && (
        <Collapse in={fieldExpandedState[fieldId]}>
          <Alert severity="info" variant="outlined" sx={{ border: 'none' }}>
            <Typography
              variant="body2"
              component="section"
              color="textSecondary"
              dangerouslySetInnerHTML={{ __html: field.helpText }}
              sx={{ 'p:first-of-type:last-of-type': { margin: 0 } }}
            />
          </Alert>
        </Collapse>
      )}
      {children}
      {hasDescription && <FormHelperText>{field.description}</FormHelperText>}
    </FormControl>
  );
}
