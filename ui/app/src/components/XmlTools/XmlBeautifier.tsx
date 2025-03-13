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
import { beautify, BeautifyOptions } from '../../utils/xml';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import { fetchContentXML } from '../../services/content';

export interface XmlBeautifierProps {
	site?: string;
	maxRows?: number;
	beautifierOptions?: Partial<BeautifyOptions>;
}

export function XmlBeautifier(props: XmlBeautifierProps) {
	const activeSiteId = useActiveSiteId();
	const { maxRows = 25, beautifierOptions, site = activeSiteId } = props;
	const [input, setInput] = useState<string>('');
	const [path, setPath] = useState<string>('/site/website/index.xml');
	const [output, setOutput] = useState<string>('');
	const handleBeautify = (xml: string) => {
		beautify(xml, beautifierOptions).then((formatted) => {
			setOutput(formatted);
		});
	};
	const handleFetchPath = () => {
		fetchContentXML(site, path).subscribe((xml) => {
			setInput(xml);
			handleBeautify(xml);
		});
	};
	return (
		<Grid container spacing={2}>
			<Grid size={11}>
				<TextField fullWidth value={path} onChange={(e) => setPath(e.target.value)} />
			</Grid>
			<Grid size={1}>
				<Button onClick={handleFetchPath}>Go</Button>
			</Grid>
			<Grid size={6}>
				<TextField multiline fullWidth value={input} rows={maxRows} onChange={(e) => setInput(e.target.value)} />
			</Grid>
			<Grid size={6}>
				<TextField
					multiline
					fullWidth
					value={output}
					disabled
					rows={maxRows}
					sx={(theme) => ({
						textarea: { color: theme.typography.body1.color, '-webkit-text-fill-color': theme.typography.body1.color }
					})}
				/>
			</Grid>
			<Grid size={12}>
				<Button variant="contained" onClick={() => handleBeautify(input)}>
					Beautify
				</Button>
			</Grid>
			<Grid size={12} />
		</Grid>
	);
}

export default XmlBeautifier;
