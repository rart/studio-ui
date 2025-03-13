/*
 * Copyright (C) 2007-2025 Crafter Software Corporation. All Rights Reserved.
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

// function composeFieldPath(...pieces: string[]): string {return pieces.filter(Boolean).join('.');}
import { useTheme } from '@mui/material/styles';
import React, { ElementType } from 'react';
import Box, { BoxProps } from '@mui/material/Box';
import ButtonBase, { ButtonBaseProps } from '@mui/material/ButtonBase';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material';
import { alpha } from '@mui/system/colorManipulator';
import Typography from '@mui/material/Typography';
import { capitalize } from '../../utils/string';
import TypeBuilderAddButton from './TypeBuilderAddButton';
import { FormattedMessage } from 'react-intl';
import { ContentTypeField } from '../../models';
import useIsDarkModeTheme from '../../hooks/useIsDarkModeTheme';

function composeFieldPath(fieldPath: string, fieldId: string): string {
	return fieldPath ? `${fieldPath}.${fieldId}` : fieldId;
}

export interface FieldChipProps {
	field: ContentTypeField;
	fieldPath?: string;
	selectedFieldIdPath?: string;
	onFieldSelected(
		fieldPath: string,
		field: ContentTypeField,
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): void;
}

export function FieldChip(props: FieldChipProps) {
	const { field, fieldPath, selectedFieldIdPath, onFieldSelected } = props;
	const theme = useTheme();
	const isDark = useIsDarkModeTheme();
	const isRepeat = field.type === 'repeat';
	const currentFieldPath = composeFieldPath(fieldPath, field.id);
	const isSelected = currentFieldPath === selectedFieldIdPath;
	const Root: ElementType<BoxProps> = (isRepeat ? Box : ButtonBase) as ElementType<BoxProps>;
	const Title: ElementType<BoxProps> = (isRepeat ? ButtonBase : 'div') as ElementType<BoxProps>;
	const onClick: ButtonBaseProps['onClick'] = (e) => onFieldSelected?.(currentFieldPath, field, e);
	const selectorButtonStyles: SxProps<Theme> = {
		'&:active': { boxShadow: theme.shadows[1] },
		'&:hover': {
			bgcolor: alpha(
				theme.palette.action.selected,
				theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity
			)
		}
	};
	const selectorButtonSelectedStyles: SxProps<Theme> = {
		// borderWidth: 1,
		// borderStyle: 'solid',
		// borderColor: isDark ? lighten(theme.palette.action.selected, 0.5) : darken(theme.palette.action.selected, 0.5),
		bgcolor: 'action.selected',
		'&:hover': { bgcolor: 'action.selected' }
	};
	return (
		<Root
			disabled={isSelected}
			sx={[
				{
					mb: 1,
					// borderWidth: 1,
					// borderStyle: 'solid',
					// borderColor: isDark ? 'grey.800' : 'grey.200',
					width: '100%',
					alignItems: 'start',
					flexDirection: 'column',
					bgcolor: isDark ? 'grey.800' : 'grey.200',
					borderRadius: 10,
					overflow: 'hidden'
				},
				isRepeat ? { borderRadius: 2 } : selectorButtonStyles,
				isSelected && selectorButtonSelectedStyles
			]}
			// @ts-expect-error: Handled. Only when it is a button will it receive the onClick.
			onClick={isRepeat ? undefined : onClick}
		>
			<Box
				component={Title}
				// @ts-expect-error: Handled. Only when it is a button will it receive the onClick.
				onClick={isRepeat ? onClick : undefined}
				disabled={isSelected}
				sx={[
					{
						px: 1.5,
						py: 0.5,
						width: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between'
					},
					isRepeat && selectorButtonStyles
				]}
			>
				<span>
					<Typography component="strong" sx={{ mr: 0.5, fontWeight: 600 }}>
						{field.name}
					</Typography>
					<Typography component="span" variant="body2">
						({field.id})
					</Typography>
				</span>
				<Typography variant="body2">{capitalize(field.type).replaceAll('-', ' ')}</Typography>
			</Box>
			{isRepeat && (
				<Box p={1} pt={0}>
					{Object.entries(field.fields).map(([fieldId, subField]) => (
						<FieldChip
							key={fieldId}
							field={subField}
							selectedFieldIdPath={selectedFieldIdPath}
							fieldPath={currentFieldPath}
							onFieldSelected={onFieldSelected}
						/>
					))}
					<TypeBuilderAddButton>
						<FormattedMessage defaultMessage="Add Field" />
					</TypeBuilderAddButton>
				</Box>
			)}
		</Root>
	);
}

export default FieldChip;
