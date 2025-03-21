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

import ContentType, { ContentTypeSection, DataSource } from '../../models/ContentType';
import FieldChip, { FieldChipProps } from './FieldChip';
import React, { useMemo, useRef } from 'react';
import { createStore, Provider } from 'jotai/index';
import { StableFormContext, StableFormContextProps } from '../FormsEngine/lib/formsEngineContext';
import { createStableFormContextProps, createVirtualDataSourceFields, createVirtualSection } from './utils';
import ErrorBoundary from '../ErrorBoundary';
import Box from '@mui/material/Box';
import TypeBuilderAddButton from './TypeBuilderAddButton';
import { FormattedMessage } from 'react-intl';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import UnfoldMore from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLess from '@mui/icons-material/UnfoldLessRounded';
import SectionAccordion from '../FormsEngine/components/SectionAccordion';
import { accordionClasses } from '@mui/material/Accordion';
import Button from '@mui/material/Button';
import TypeDetailsHeader, { TypeDetailsHeaderProps } from './TypeDetailsHeader';
import LookupTable from '../../models/LookupTable';
import { defaultDataSourcesSection } from './descriptors';

export interface TypeDetailsViewProps {
	type: ContentType;
	fieldPathsWithErrors: LookupTable<boolean>;
	selectedFieldIdPath: string;
	onFieldSelected: FieldChipProps['onFieldSelected'];
	onDataSourceSelected(dataSource: DataSource): void;
	onSectionSelected(section: ContentTypeSection): void;
	onEditTypeAction: TypeDetailsHeaderProps['onActionClick'];
}

export function TypeDetailsView(props: TypeDetailsViewProps) {
	const {
		type,
		selectedFieldIdPath,
		onFieldSelected,
		fieldPathsWithErrors,
		onSectionSelected,
		onDataSourceSelected,
		onEditTypeAction
	} = props;

	const store = useMemo(() => createStore(), []); // TODO: Use stable memo?
	const stableFormContextRef = useRef<StableFormContextProps>(null);
	if (stableFormContextRef.current === null)
		stableFormContextRef.current = createStableFormContextProps({ type }, true);

	const dataSourcesSection = useMemo(
		() =>
			createVirtualSection({
				...defaultDataSourcesSection,
				fields: type.dataSources?.map((dataSource) => dataSource.id) ?? []
			}),
		[type]
	);

	const dataSourceFields = useMemo(() => createVirtualDataSourceFields(type), [type]);

	const setSectionsExpandedState = (expanded: boolean) => {
		Object.values(stableFormContextRef.current.atoms.expandedStateBySectionId).forEach((atom) => {
			store.set(atom, expanded);
		});
	};
	const handleExpandAllSections = () => {
		setSectionsExpandedState(true);
	};
	const handleCollapseAllSections = () => {
		setSectionsExpandedState(false);
	};

	const handleDataSourceSelected = (_, field) => {
		onDataSourceSelected?.(type.dataSources.find((dataSource) => dataSource.id === field.id));
	};

	return (
		<ErrorBoundary>
			<Provider store={store}>
				<StableFormContext.Provider value={stableFormContextRef.current}>
					<TypeDetailsHeader type={type} onActionClick={onEditTypeAction} />

					<Box display="flex" justifyContent="space-between" mt={(theme) => `${theme.spacing(1)} !important`}>
						<TypeBuilderAddButton>
							<FormattedMessage defaultMessage="Add Section" />
						</TypeBuilderAddButton>
						<div>
							<Divider orientation="vertical" flexItem />
							<Tooltip title={<FormattedMessage defaultMessage="Expand All" />}>
								<IconButton onClick={handleExpandAllSections}>
									<UnfoldMore />
								</IconButton>
							</Tooltip>
							<Tooltip title={<FormattedMessage defaultMessage="Collapse All" />}>
								<IconButton onClick={handleCollapseAllSections}>
									<UnfoldLess />
								</IconButton>
							</Tooltip>
						</div>
					</Box>

					{type.sections.map((section) => (
						<SectionAccordion
							key={section.id}
							section={section}
							sx={{ [`&.${accordionClasses.expanded}`]: { margin: 0 } }}
							slotProps={{
								accordionDetails: {
									className: '',
									children: (
										<TypeBuilderAddButton>
											<FormattedMessage defaultMessage="Add Field" />
										</TypeBuilderAddButton>
									)
								}
							}}
							renderControl={(fieldId) => (
								<FieldChip
									key={fieldId}
									field={type.fields[fieldId]}
									fieldPathsWithErrors={fieldPathsWithErrors}
									onFieldSelected={onFieldSelected}
									selectedFieldIdPath={selectedFieldIdPath}
								/>
							)}
						>
							<Button sx={{ position: 'absolute', top: 15, right: 10 }} onClick={() => onSectionSelected?.(section)}>
								<FormattedMessage defaultMessage="Edit" />
							</Button>
						</SectionAccordion>
					))}

					<Divider sx={{ mx: -3 }} />

					<SectionAccordion
						colorize={false}
						variant="outlined"
						section={dataSourcesSection}
						slotProps={{
							accordionDetails: {
								className: '',
								children: (
									<TypeBuilderAddButton>
										<FormattedMessage defaultMessage="Add Data Source" />
									</TypeBuilderAddButton>
								)
							}
						}}
						renderControl={(fieldId) => (
							<FieldChip
								key={fieldId}
								field={dataSourceFields[fieldId]}
								fieldPathsWithErrors={fieldPathsWithErrors}
								onFieldSelected={handleDataSourceSelected}
								selectedFieldIdPath={selectedFieldIdPath}
							/>
						)}
					/>
				</StableFormContext.Provider>
			</Provider>
		</ErrorBoundary>
	);
}

export default TypeDetailsView;
