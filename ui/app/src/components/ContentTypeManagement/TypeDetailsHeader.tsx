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

import ContentType from '../../models/ContentType';
import { useDispatch } from 'react-redux';
import Button, { ButtonProps } from '@mui/material/Button';
import { pushDialog } from '../../state/actions/dialogStack';
import { DeleteContentTypeDialogProps } from '../DeleteContentTypeDialog';
import Box from '@mui/material/Box';
import ContentTypeCardMedia from './ContentTypeCardMedia';
import Typography from '@mui/material/Typography';
import { ItemTypeIcon } from '../ItemTypeIcon';
import { FormattedMessage } from 'react-intl';
import React from 'react';

export function TypeDetailsHeader({ type }: { type: ContentType }) {
	const dispatch = useDispatch();
	const handleDeleteType: ButtonProps['onClick'] = () => {
		dispatch(
			pushDialog({
				component: 'craftercms.components.DeleteContentTypeDialog',
				props: {
					contentType: type,
					onComplete() {
						console.log('Deleted.');
					}
				} as Partial<DeleteContentTypeDialogProps>
			})
		);
	};
	return (
		<Box display="flex" gap={1}>
			<ContentTypeCardMedia typeId={type.id} sx={{ width: 200, height: 200 }} />
			<Box>
				<Typography variant="body2" color="textSecondary">
					{type.id}
				</Typography>
				<Typography variant="h6" component="h2" display="flex" alignItems="center">
					<ItemTypeIcon item={{ mimeType: '', systemType: type.type }} sx={{ color: 'info.main', mr: 0.5 }} />{' '}
					{type.name}
				</Typography>
				<Typography variant="body2" color="textSecondary" mb={0.5}>
					{type.description || <FormattedMessage defaultMessage="(no description)" />}
				</Typography>
				<Typography variant="body2" color="textSecondary" mb={0.5}>
					<FormattedMessage
						defaultMessage="Last updated on <b>{date}</b> by <b>{user}</b>"
						values={{
							date: 'today',
							user: 'John',
							b: (text) => <strong key={text[0] as string}>{text[0]}</strong>
						}}
					/>
				</Typography>
				<Button onClick={undefined}>
					<FormattedMessage defaultMessage="Properties" />
				</Button>
				<Button onClick={undefined}>
					<FormattedMessage defaultMessage="Template" />
				</Button>
				<Button onClick={undefined}>
					<FormattedMessage defaultMessage="Form Controller" />
				</Button>
				<Button onClick={undefined}>
					<FormattedMessage defaultMessage="Groovy Controller" />
				</Button>
				<Button onClick={handleDeleteType} color="error">
					<FormattedMessage defaultMessage="Delete" />
				</Button>
			</Box>
		</Box>
	);
}

export default TypeDetailsHeader;
