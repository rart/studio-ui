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

import React, { useState } from 'react';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { deserialize } from '../utils/xml';
import { X2jOptions } from 'fast-xml-parser';
import LookupTable from '../models/LookupTable';

export interface XmlDeserializerProps {
	maxRows?: number;
	formatterSpace?: Parameters<typeof JSON.stringify>[2];
	parserOptions?: Partial<X2jOptions>;
	deserializedObjectProcessor?: (object: LookupTable<unknown>) => unknown;
}

export function XmlDeserializer(props: XmlDeserializerProps) {
	const { formatterSpace = '\t', parserOptions, maxRows = 25, deserializedObjectProcessor = (o) => o } = props;
	const [value, setValue] = useState<string>('');
	const [json, setJson] = useState<string>('');
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setValue(event.target.value);
	};
	const handleDeserialize = () => {
		const object = deserializedObjectProcessor(deserialize(value, parserOptions));
		setJson(JSON.stringify(object, null, formatterSpace));
	};
	return (
		<Grid container spacing={2}>
			<Grid size={6}>
				<TextField multiline fullWidth value={value} onChange={handleChange} maxRows={maxRows} />
			</Grid>
			<Grid size={6}>
				<TextField multiline fullWidth value={json} disabled maxRows={maxRows} />
			</Grid>
			<Grid size={12}>
				<Button variant="contained" onClick={handleDeserialize}>
					Deserialize
				</Button>
			</Grid>
			<Grid size={12} />
		</Grid>
	);
}

export default XmlDeserializer;
