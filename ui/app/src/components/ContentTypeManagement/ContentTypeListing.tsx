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

import ContentTypeCard, { ContentTypeCardProps } from './ContentTypeCard';
import Box from '@mui/material/Box';
import React from 'react';
import ContentType from '../../models/ContentType';
import { EmptyState } from '../EmptyState';
import { FormattedMessage } from 'react-intl';
import palette from '../../styles/palette';

export interface ContentTypeListingProps extends Pick<ContentTypeCardProps, 'showTypeId' | 'compact'> {
	skeleton?: boolean;
	skeletonItemCount?: number;
	contentTypes: ContentType[];
	selectedTypeId?: string;
	onCardClick?: ContentTypeCardProps['onClick'];
}

export function ContentTypeListing(props: ContentTypeListingProps) {
	const {
		skeleton = false,
		skeletonItemCount = 10,
		contentTypes,
		showTypeId,
		compact,
		selectedTypeId,
		onCardClick
	} = props;
	if (!skeleton && !contentTypes) {
		return <></>;
	}
	if (!skeleton && contentTypes?.length === 0) {
		return <EmptyState title={<FormattedMessage defaultMessage="No content types available for display." />} />;
	}
	return (
		<Box display="flex" gap={2} flexWrap="wrap">
			{skeleton
				? new Array(skeletonItemCount)
						.fill(null)
						.map((_, index) => (
							<ContentTypeCard key={index} skeleton type={null} showTypeId={showTypeId} compact={compact} />
						))
				: contentTypes?.map((type) => {
						const isSelected = selectedTypeId === type.id;
						return (
							<ContentTypeCard
								key={type.id}
								type={type}
								showTypeId={showTypeId}
								compact={compact}
								onClick={isSelected ? undefined : (e) => onCardClick?.(e, type)}
								sx={[isSelected && { border: `2px solid ${palette.blue.tint}`, opacity: 0.7, boxShadow: 0 }]}
							/>
						);
					})}
		</Box>
	);
}

export default ContentTypeListing;
