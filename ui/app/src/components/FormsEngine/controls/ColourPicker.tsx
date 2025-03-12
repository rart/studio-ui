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

import Box from '@mui/material/Box';

import { ControlProps } from '../types';
import {
	HexAlphaColorPicker,
	HexColorInput,
	HexColorPicker,
	HslaStringColorPicker,
	HslStringColorPicker,
	RgbaStringColorPicker,
	RgbStringColorPicker
} from 'react-colorful';
import { ComponentProps, ElementType, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Theme } from '@mui/material';
import type { ColorFormat } from '@mui/system/colorManipulator/colorManipulator';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import OutlinedInput from '@mui/material/OutlinedInput';
import { SxProps } from '@mui/system';

export type ColourFormat = Exclude<ColorFormat, 'color' | 'rgba' | 'hsla'> | 'hex';

export interface ColourPickerProps extends ControlProps {
	value: {
		alpha: boolean;
		format: ColourFormat;
		value: string;
	};
}

const pickers: Record<ColourFormat, { true: ElementType; false: ElementType }> = {
	rgb: { true: RgbaStringColorPicker, false: RgbStringColorPicker },
	hsl: { true: HslaStringColorPicker, false: HslStringColorPicker },
	hex: { true: HexAlphaColorPicker, false: HexColorPicker }
};

const CustomHexColorInput = forwardRef((props, ref) => {
	const divRef = useRef<HTMLDivElement>(undefined);
	useImperativeHandle(ref, () => divRef.current.previousSibling);
	return (
		<>
			<HexColorInput {...props} />
			<div ref={divRef} hidden></div>
		</>
	);
});

const hexColorInputSx: SxProps<Theme> = {
	input: { border: 0, padding: '8.5px 14px', font: 'inherit', '&:focus': { outline: 'none' } }
};

export function ColourPicker(props: ColourPickerProps) {
	// const { field, readonly, value, autoFocus, setValue } = props;
	// const presetColors = ['#cd9323', '#1a53d8', '#9a2151', '#0d6416', '#8d2808'];
	// return (
	// 	<FormsEngineField field={field}>
	// 		<RgbaColorPicker color={value} onChange={setValue} />
	// 	</FormsEngineField>
	// );
	const value: ColourPickerProps['value'] = {
		alpha: true,
		format: 'hex',
		value: null
	};
	const buttonRef = useRef<HTMLButtonElement>(undefined);
	const [colour, setColour] = useState(value.value ?? '');
	const [open, setOpen] = useState(false);
	const isHex = value.format === 'hex';
	const ColourPicker: ElementType = pickers[value.format][String(value.alpha)] ?? HexColorPicker;
	const hexColorInputProps: ComponentProps<typeof HexColorInput> = {
		color: colour,
		alpha: Boolean(value.alpha),
		prefixed: true
	};
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);
	const handleChange = (value: string) => {
		setColour(value);
	};
	return (
		<Box className="space-y-2">
			<Box>
				<ButtonBase ref={buttonRef} sx={{ px: 1 }} onClick={() => handleOpen()}>
					<Box
						sx={{
							mr: isHex ? 0 : 1,
							width: '28px',
							height: '28px',
							borderRadius: 2,
							border: '3px solid #fff',
							boxShadow: 2,
							backgroundColor: colour
						}}
					/>
					{isHex ? undefined : <Typography>{colour}</Typography>}
				</ButtonBase>
				{isHex && (
					<OutlinedInput
						size="small"
						// @ts-expect-error: OutlinedInput expects (event) => void, but the onChange that actually occurs is the HexColorInput's
						onChange={handleChange}
						slotProps={{ input: hexColorInputProps as unknown }}
						slots={{ input: CustomHexColorInput }}
						sx={hexColorInputSx}
					/>
				)}
			</Box>
			<Popover
				open={open}
				onClose={handleClose}
				anchorEl={buttonRef.current}
				anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
			>
				<Paper sx={{ p: 1 }}>
					<ColourPicker color={colour} onChange={handleChange} />
					<Button fullWidth sx={{ mt: 1 }} onClick={handleClose}>
						Done
					</Button>
				</Paper>
			</Popover>
		</Box>
	);
}

export default ColourPicker;
