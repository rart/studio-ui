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

import React, { createElement, useEffect, useState } from 'react';
import { onSubmittingAndOrPendingChangeProps } from '../../hooks/useEnhancedDialogState';
import useContentTypeList from '../../hooks/useContentTypeList';
import EditTypeApp from './EditTypeApp';
import ContentType from '../../models/ContentType';
import { ContentTypeListingProps } from './ContentTypeListing';
import { TypeListApp } from './TypeListApp';
import { useDispatch } from 'react-redux';
import { contentTypeCreated, contentTypeDeleted, emitSystemEvent } from '../../state/actions/system';
import { fromEvent, filter } from 'rxjs';
import Box from '@mui/material/Box';
import GlobalAppToolbar from '../GlobalAppToolbar/GlobalAppToolbar';
import { FormattedMessage } from 'react-intl';
import LoadingState from '../LoadingState/LoadingState';
import LegacyIFrame from '../LegacyIFrame';
import { ProjectToolsRoutes } from '../../env/routes';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

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
	const [useLegacy, setUseLegacy] = useState(false);

	const handleTypeSelected: ContentTypeListingProps['onCardClick'] = (_, item) => {
		setSelectedType(item);
		setView('edit');
	};
	const handleBackToList = () => {
		setSelectedType(null);
		setView('list');
	};

	// TODO: Temp. For development purposes. Remove.
	// const types = useContentTypeList();
	// useEffect(() => {
	// 	const type = types?.find((type) => type.id === '/page/article');
	// 	if (type) {
	// 		setSelectedType(type);
	// 		setView('edit');
	// 	}
	// }, [types]);

	return (
		<>
			{view === 'list' && (
				<>
					<Alert
						variant="outlined"
						severity={useLegacy ? 'warning' : 'info'}
						action={
							<Button onClick={() => setUseLegacy(!useLegacy)}>{useLegacy ? 'Use New Tool' : 'Use Legacy Tool'}</Button>
						}
						sx={{ height: 38, borderStyle: 'none none solid', borderRadius: 0, py: 0 }}
						slotProps={{
							action: { sx: { pt: 0 } },
							message: { sx: { display: 'flex', alignItems: 'center' } },
							icon: { sx: { display: 'flex', alignItems: 'center' } }
						}}
					>
						{useLegacy ? "You're using the legacy Content Type UX." : "You're viewing the new Content Type UX."}
					</Alert>
					{useLegacy ? (
						createElement(LegacyTypeManagement, props)
					) : (
						<TypeListApp
							sx={{ height: 'calc(100% - 38px)' }}
							onTypeSelected={handleTypeSelected}
							renderAppBar={!embedded}
							showOpenLauncherButton={showAppsButton}
						/>
					)}
				</>
			)}
			{view === 'edit' && <EditTypeApp type={selectedType} onClose={handleBackToList} />}
		</>
	);
}

function LegacyTypeManagement(props: ContentTypeManagementProps) {
	const { embedded = false, showAppsButton, onClose, onMinimize, mountMode, onSubmittingAndOrPendingChange } = props;
	const [loading, setLoading] = useState(true);
	const dispatch = useDispatch();

	useEffect(() => {
		const messagesSubscription = fromEvent(window, 'message')
			.pipe(
				filter((e: any) =>
					[
						'CONTENT_TYPES_ON_SAVED',
						'CONTENT_TYPES_ON_CREATED',
						'CONTENT_TYPES_ON_DELETED',
						'CONTENT_TYPES_ON_SUBMITTING_OR_PENDING_CHANGES_MESSAGE'
					].includes(e.data?.type)
				)
			)
			.subscribe((e: any) => {
				switch (e.data.type) {
					case 'CONTENT_TYPES_ON_SAVED': {
						switch (e.data.saveType) {
							case 'saveAndClose':
								onClose?.();
								break;
							case 'saveAndMinimize':
								onMinimize?.();
								break;
						}
						break;
					}
					case 'CONTENT_TYPES_ON_CREATED': {
						dispatch(emitSystemEvent(contentTypeCreated()));
						break;
					}
					case 'CONTENT_TYPES_ON_DELETED': {
						dispatch(emitSystemEvent(contentTypeDeleted()));
						break;
					}
					case 'CONTENT_TYPES_ON_SUBMITTING_OR_PENDING_CHANGES_MESSAGE': {
						onSubmittingAndOrPendingChange?.(e.data.payload);
						break;
					}
				}
			});
		return () => {
			messagesSubscription.unsubscribe();
		};
	}, [dispatch, onSubmittingAndOrPendingChange, embedded, onClose, onMinimize]);

	return (
		<Box height="calc(100% - 38px)" display="flex" flexDirection="column">
			{!embedded && (
				<GlobalAppToolbar
					title={<FormattedMessage id="componentsMessages.contentTypes" defaultMessage="Content Types" />}
					showAppsButton={showAppsButton}
				/>
			)}
			{loading && <LoadingState sxs={{ root: { flexGrow: 1 } }} />}
			<LegacyIFrame
				path={`/legacy-site-config?mode=embedded${mountMode ? `&mountMode=${mountMode}` : ''}#tool${ProjectToolsRoutes.ContentTypes}`}
				iframeProps={{
					style: {
						height: loading ? '0' : '100%'
					},
					onLoad: () => {
						setLoading(false);
					}
				}}
			/>
		</Box>
	);
}

export default ContentTypeManagement;
