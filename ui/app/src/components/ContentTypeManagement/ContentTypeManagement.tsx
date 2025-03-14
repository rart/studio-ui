/*
 * Copyright (C) 2007-2022 Crafter Software Corporation. All Rights Reserved.
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

import React, { useEffect, useState } from 'react';
import { onSubmittingAndOrPendingChangeProps } from '../../hooks/useEnhancedDialogState';
import useContentTypeList from '../../hooks/useContentTypeList';
import EditTypeApp from './EditTypeApp';
import ContentType from '../../models/ContentType';
import { ContentTypeListingProps } from './ContentTypeListing';
import { TypeListApp } from './TypeListApp';

export interface ContentTypeManagementProps {
	embedded?: boolean;
	showAppsButton?: boolean;
	mountMode?: 'dialog' | 'page';
	onClose?: () => void;
	onMinimize?: () => void;
	onSubmittingAndOrPendingChange?(value: onSubmittingAndOrPendingChangeProps): void;
}

// dispatch(emitSystemEvent(contentTypeCreated()));
// dispatch(emitSystemEvent(contentTypeDeleted()));
// onClose?.();
// onMinimize?.();

export function ContentTypeManagement(props: ContentTypeManagementProps) {
	const { embedded = false, showAppsButton, onClose, onMinimize, mountMode, onSubmittingAndOrPendingChange } = props;

	const [view, setView] = useState<'list' | 'edit' | 'create'>('list');
	const [selectedType, setSelectedType] = useState<ContentType>(null);

	// TODO: Temp
	const types = useContentTypeList();
	useEffect(() => {
		const type = types?.find((type) => type.id === '/page/article');
		if (type) {
			setSelectedType(type);
			setView('edit');
		}
	}, [types]);

	const handleTypeSelected: ContentTypeListingProps['onCardClick'] = (_, item) => {
		setSelectedType(item); // Set the item to be edited
		setView('edit'); // Switch to edit view
	};

	const handleBackToList = () => {
		setSelectedType(null); // Clear selected item
		setView('list'); // Switch back to list view
	};

	return (
		<>
			{view === 'list' && (
				<TypeListApp
					onTypeSelected={handleTypeSelected}
					renderAppBar={!embedded}
					showOpenLauncherButton={showAppsButton}
				/>
			)}
			{/* @ts-ignore */}
			{view === 'edit' && <EditTypeApp type={selectedType} onClose={handleBackToList} />}
		</>
	);
}

export default ContentTypeManagement;
