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

import ContentType, { ContentTypeField } from '../../models/ContentType';
import LookupTable from '../../models/LookupTable';
import { useTheme } from '@mui/material/styles';
import React, { useMemo, useRef, useState } from 'react';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { createTypeValuesObject, createVirtualType, makeIntoTypeFieldStructPath } from './utils';
import { useShowAlert } from '../FormsEngine/lib/formUtils';
import FieldFormView, { FieldFormViewProps } from './FieldFormView';
import { FieldChipProps } from './FieldChip';
import controlDescriptors from './descriptors';
import type { BuiltInControlType } from '../FormsEngine/lib/controlMap';
import { retrieveProperty } from '../../utils/object';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import Typography from '@mui/material/Typography';
import { FormattedMessage } from 'react-intl';
import { getMarginSxProps } from '../../utils/ui';
import Main from './MainSection';
import Drawer from '@mui/material/Drawer';
import { paperClasses } from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import ViewToolbar from '../ViewToolbar/ViewToolbar';
import TypeDetailsView from './TypeDetailsView';
import { StableFormContextProps } from '../FormsEngine/lib/formsEngineContext';
import Container, { ContainerProps } from '@mui/material/Container';
import Tooltip from '@mui/material/Tooltip';
import { ToolbarProps } from '@mui/material/Toolbar';

export interface EditTypeAppProps {
	type: ContentType;
	values: LookupTable<unknown>;
	onClose?: () => void;
}

// Context gets initialised
// When a field/section is clicked, the fieldFormContext gets created if it doesn't exist
// FieldForm looks up its context within the TypeEditAppContext
interface TypeEditAppContextProps {
	// Sections, fields & data sources form context
	formContextLookup: Record<string, StableFormContextProps>;
}

// SectionAccordions render FieldChips, which receive a ContentTypeField data structure
// Each field descriptor/definition gets mapped to a "virtual" ContentType data structure to render a FormsEngine-like form using FormsEngine control components

export function EditTypeApp(props: EditTypeAppProps) {
	const { type } = props;
	const theme = useTheme();

	const [open, setOpen] = useState(false);
	const [useDrawer, setUseDrawer] = useState(true);
	const [drawerWidth, setDrawerWidth] = useState(500);

	// Resize observer attached to the [scroll] container
	const containerRef = useRef<HTMLElement>(undefined);
	const toolbarRef = useRef<HTMLDivElement>(undefined);
	useResizeObserver(containerRef, () => {
		const container = containerRef.current;
		const toolbar = toolbarRef.current;
		const rect: DOMRect = container.getBoundingClientRect();
		const toolbarRect: DOMRect = toolbar.getBoundingClientRect();
		const width = rect.width;
		const useDrawer = width >= 900;
		container.style.setProperty('--container-width', `${width}px`);
		container.style.setProperty('--container-height', `${rect.height - toolbarRect.height - 1}px`);
		// Want at least 500px for the drawer and at least 400px for the main area (i.e. 900px).
		setUseDrawer(useDrawer);
		// Drawer to take up 55% of the container.
		setDrawerWidth(width * 0.55);
	});

	const typeValuesObject = useMemo<LookupTable<unknown>>(() => createTypeValuesObject(type), [type]);

	const showAlert = useShowAlert();
	const valuesRef = useRef<LookupTable<unknown>>(null);
	const [selectedFieldIdPath, setSelectedFieldIdPath] = useState<string>(null);
	const [virtualContentType, setVirtualContentType] = useState<ContentType>(null);
	const [selectedField, setSelectedField] = useState<ContentTypeField>(null);
	const [virtualTypeValues, setVirtualTypeValues] = useState<LookupTable<unknown>>(null);

	const handleSetValues: FieldFormViewProps['onChange'] = (values) => {
		valuesRef.current = values;
	};
	const handleFieldSelected: FieldChipProps['onFieldSelected'] = (fieldPath, field) => {
		const controlDescriptor = controlDescriptors[field.type as BuiltInControlType];
		if (!controlDescriptor)
			return showAlert({ message: `No control descriptor found for field "${field.name}" of type "${field.type}"` });
		const pathToField = makeIntoTypeFieldStructPath(fieldPath);
		const virtualType = createVirtualType(controlDescriptor);
		const fieldValues = retrieveProperty(typeValuesObject, pathToField);
		setSelectedField(retrieveProperty(type.fields, pathToField));
		setVirtualTypeValues(fieldValues);
		setVirtualContentType(virtualType);
		setSelectedFieldIdPath(fieldPath);
		setOpen(true);
	};
	const handleCloseForm: FieldFormViewProps['onClose'] = () => {
		setSelectedField(null);
		setVirtualTypeValues(null);
		setVirtualContentType(null);
		setSelectedFieldIdPath(null);
		setOpen(false);
	};

	// region const fieldEditorView = ...
	// TODO: Add field, add section also to render on the reactive side panel
	const fieldEditorView = virtualContentType ? (
		<FieldFormView
			field={selectedField}
			fieldIdPath={selectedFieldIdPath}
			type={virtualContentType}
			values={virtualTypeValues}
			onChange={handleSetValues}
			onClose={handleCloseForm}
		/>
	) : null;
	// endregion

	return (
		<Box
			ref={containerRef}
			height="100%"
			display="flex"
			flexDirection="column"
			overflow="hidden"
			bgcolor="background.default"
		>
			<ViewToolbar
				ref={toolbarRef}
				slotProps={{
					toolbar: {
						component: Container,
						maxWidth: open && useDrawer ? false : 'lg'
					} as Partial<ToolbarProps & ContainerProps>
				}}
			>
				<Box display="flex" alignItems="center">
					<Tooltip title={<FormattedMessage defaultMessage="Done" />}>
						<IconButton onClick={props.onClose} sx={{ mr: 1 }}>
							<ArrowBackRounded />
						</IconButton>
					</Tooltip>
					<Typography variant="h5" component="h1" noWrap>
						<FormattedMessage defaultMessage="New Content Type" />
					</Typography>
				</Box>
				<div />
			</ViewToolbar>
			<Box position="relative" flexGrow={1} sx={getMarginSxProps()}>
				<Main
					open={useDrawer && open}
					drawerWidth={drawerWidth}
					sx={{ height: 'var(--container-height)', overflow: 'auto', py: 2 }}
				>
					<Container maxWidth="lg" className="space-y">
						<TypeDetailsView
							type={type}
							onFieldSelected={handleFieldSelected}
							selectedFieldIdPath={selectedFieldIdPath}
						/>
					</Container>
				</Main>
				{
					// 	region fieldEditorView
					useDrawer ? (
						<Drawer
							open={open}
							anchor="right"
							variant="persistent"
							sx={{
								flexShrink: 0,
								width: drawerWidth,
								height: 'var(--container-height)',
								[`& > .${paperClasses.root}`]: {
									position: 'absolute',
									width: drawerWidth,
									boxSizing: 'border-box',
									backgroundColor: theme.palette.background.default
								}
							}}
						>
							{fieldEditorView}
						</Drawer>
					) : (
						<Dialog open={open} onClose={handleCloseForm}>
							{fieldEditorView}
						</Dialog>
					)
					// endregion
				}
			</Box>
		</Box>
	);
}

export default EditTypeApp;
