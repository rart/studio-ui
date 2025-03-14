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
import TypeDetailsHeader from './TypeDetailsHeader';

export function TypeDetailsView(props: {
	type: ContentType;
	selectedFieldIdPath: string;
	onFieldSelected: FieldChipProps['onFieldSelected'];
}) {
	const { type, selectedFieldIdPath, onFieldSelected } = props;

	const store = useMemo(() => createStore(), []); // TODO: Use stable memo?
	const stableFormContextRef = useRef<StableFormContextProps>(null);
	if (stableFormContextRef.current === null)
		stableFormContextRef.current = createStableFormContextProps({ type }, true);

	const dataSourcesSection = createVirtualSection({
		title: 'Data Sources',
		fields: type.dataSources?.map((dataSource) => dataSource.id) ?? []
	});

	const dataSourceFields = createVirtualDataSourceFields(type);

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

	return (
		<ErrorBoundary>
			<Provider store={store}>
				<StableFormContext.Provider value={stableFormContextRef.current}>
					<TypeDetailsHeader type={type} />

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
							key={section.title}
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
									selectedFieldIdPath={selectedFieldIdPath}
									key={fieldId}
									field={type.fields[fieldId]}
									onFieldSelected={onFieldSelected}
								/>
							)}
						>
							<Button sx={{ position: 'absolute', top: 15, right: 10 }}>
								<FormattedMessage defaultMessage="Edit" />
							</Button>
						</SectionAccordion>
					))}

					<Divider sx={{ mx: -3 }} />

					<SectionAccordion
						variant="outlined"
						colorize={false}
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
								onFieldSelected={onFieldSelected}
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
