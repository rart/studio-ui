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

import React, { createElement, PropsWithChildren, RefObject, useEffect, useMemo, useRef } from 'react';
import {
	FormsEngineFormApiContextProps,
	FormsEngineFormContextApi,
	FormsEngineItemMetaContextProps,
	ItemContext,
	ItemMetaContext,
	StableFormContext,
	StableFormContextProps,
	StableGlobalContext,
	useStableFormContext
} from '../FormsEngine/lib/formsEngineContext';
import controlDescriptors from './descriptors';
import type { BuiltInControlType } from '../FormsEngine/lib/controlMap';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { FormattedMessage } from 'react-intl';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNextRounded';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import { XmlKeys } from '../FormsEngine/lib/formConsts';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import SwapCallsOutlined from '@mui/icons-material/SwapCallsOutlined';
import ListItemIcon from '@mui/material/ListItemIcon';
import ContentTypeFieldIcon from '../../icons/ContentTypeField';
import ListItemText from '@mui/material/ListItemText';
import SectionAccordion from '../FormsEngine/components/SectionAccordion';
import Paper from '@mui/material/Paper';
import { renderFieldControl } from '../FormsEngine/lib/controlHelpers';
import FormBackToTop from '../FormsEngine/components/FormBackToTop';
import ContentType, { ContentTypeField } from '../../models/ContentType';
import LookupTable from '../../models/LookupTable';
import { createStore, Provider } from 'jotai/index';
import useContentTypes from '../../hooks/useContentTypes';
import { createStableFormContextProps, fooStableGlobalContextRef } from './utils';
import { Subject } from 'rxjs';
import { createParsedValueForField } from '../FormsEngine/lib/valueRetrievers';
import { setFieldAtoms } from '../FormsEngine/lib/formUtils';

export interface FieldFormViewProps {
	type: ContentType;
	field: ContentTypeField;
	// section
	// dataSource
	fieldIdPath: string;
	values: LookupTable<unknown>;
	onChange(values: LookupTable<unknown>): void;
	onClose(): void;
}

function FieldFormViewBody(props: FieldFormViewProps) {
	const { type, field, fieldIdPath, values, onChange, onClose } = props;
	const containerRef = useRef<HTMLDivElement>(undefined);
	const stableFormContext = useStableFormContext();
	const controlDescriptor = controlDescriptors[field.type as BuiltInControlType];
	const fieldPathIds = fieldIdPath?.split('.') ?? [];
	useEffect(() => {
		containerRef.current.scroll({ top: 0, behavior: 'smooth' });
	}, [type]);
	return (
		<Box ref={containerRef} sx={{ py: 2, height: 'var(--container-height)', overflow: 'auto' }}>
			<Container maxWidth="md">
				<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
					<Box display="flex" flexDirection="column">
						<Typography variant="h6">
							<FormattedMessage defaultMessage="Edit Field" />
						</Typography>
						{fieldPathIds.length > 1 && (
							<Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
								{fieldPathIds.map((id) => (
									<Typography variant="body2">{id}</Typography>
								))}
							</Breadcrumbs>
						)}
					</Box>
					<Box display="flex" alignItems="center">
						<Tooltip title={<FormattedMessage defaultMessage="Move to another section" />}>
							<IconButton>
								<DriveFileMoveOutlined />
							</IconButton>
						</Tooltip>
						{field.id !== XmlKeys.internalName && field.id !== XmlKeys.fileName && (
							<Tooltip title={<FormattedMessage defaultMessage="Delete field" />}>
								<IconButton>
									<DeleteRounded />
								</IconButton>
							</Tooltip>
						)}
						<Divider sx={{ ml: 1, mr: 2 }} orientation="vertical" flexItem />
						<Button variant="outlined" onClick={onClose}>
							<FormattedMessage defaultMessage="Done" />
						</Button>
					</Box>
				</Box>
				<ListItem
					component="div"
					secondaryAction={
						field.type === 'file-name' && (
							<Tooltip title={<FormattedMessage defaultMessage="Swap Field" />}>
								<IconButton>
									<SwapCallsOutlined />
								</IconButton>
							</Tooltip>
						)
					}
				>
					<ListItemIcon>
						<ContentTypeFieldIcon />
					</ListItemIcon>
					<ListItemText
						primary={controlDescriptor.name}
						secondary={controlDescriptor.description || controlDescriptor.id}
					/>
				</ListItem>

				{type.sections.map((section) => (
					<SectionAccordion
						key={section.title}
						section={section}
						colorize={false}
						renderControl={(fieldId) => {
							const field = type.fields[fieldId];
							if (!field) return <Paper sx={{ p: 1 }}>Field {fieldId} not found</Paper>;
							return renderFieldControl(field, stableFormContext.atoms.valueByFieldId, false, false, type);
						}}
					/>
				))}

				<FormBackToTop containerRef={containerRef} />
			</Container>
		</Box>
	);
}

export function createFieldFormContext(
	type: ContentType,
	values: LookupTable<unknown>,
	contentTypesLookup: LookupTable<ContentType>
): StableFormContextProps {
	const context = createStableFormContextProps({ type });
	const contextRef: RefObject<StableFormContextProps> = { current: context };
	const contentTypeFields = type.fields;
	const formValues: LookupTable<unknown> = {};
	context.atoms.valueByFieldId = {};
	context.atoms.validationByFieldId = {};
	context.changedFieldIds = new Set();
	context.originalValues = values;
	context.fieldUpdates$ = new Subject();
	Object.values(contentTypeFields).forEach((field) => {
		formValues[field.id] = createParsedValueForField(values[field.id], field, contentTypesLookup);
		setFieldAtoms(contextRef, type, type.fields, field.id, context.atoms, formValues[field.id]);
	});
	return context;
}

export function createFieldFormContextApi(): FormsEngineFormApiContextProps {
	const api: FormsEngineFormApiContextProps = {
		rollback() {},
		rollbackField() {},
		setValuesCheckpoint() {}
	};
	return api;
}

export function createFieldItemMetaContext(type: ContentType): FormsEngineItemMetaContextProps {
	const context: FormsEngineItemMetaContextProps = {
		id: '',
		path: '',
		sourceMap: null,
		pathInSite: '',
		contentType: type,
		contentObject: {},
		contentXml: null
	};
	return context;
}

export function FieldFormView(props: PropsWithChildren<FieldFormViewProps>) {
	const { type, values } = props;
	const store = useMemo(() => createStore(), []); // TODO: Use stable memo?
	const contentTypesLookup = useContentTypes();
	const contextApi = useMemo<FormsEngineFormApiContextProps>(() => createFieldFormContextApi(), []);
	const stableFormContext = useMemo<StableFormContextProps>(
		() => createFieldFormContext(type, values, contentTypesLookup),
		[contentTypesLookup, values, type]
	);
	const itemMetaContext = useMemo<FormsEngineItemMetaContextProps>(() => createFieldItemMetaContext(type), [type]);
	useEffect(() => {
		const sub = stableFormContext.fieldUpdates$.subscribe(() => {});
		return () => {
			sub.unsubscribe();
		};
	}, [stableFormContext.fieldUpdates$]);
	return (
		<Provider store={store}>
			<StableGlobalContext.Provider value={fooStableGlobalContextRef}>
				<FormsEngineFormContextApi.Provider value={contextApi}>
					<StableFormContext.Provider value={stableFormContext}>
						<ItemContext.Provider value={null}>
							<ItemMetaContext.Provider value={itemMetaContext}>
								{createElement(FieldFormViewBody, props)}
							</ItemMetaContext.Provider>
						</ItemContext.Provider>
					</StableFormContext.Provider>
				</FormsEngineFormContextApi.Provider>
			</StableGlobalContext.Provider>
		</Provider>
	);
}

export default FieldFormView;
