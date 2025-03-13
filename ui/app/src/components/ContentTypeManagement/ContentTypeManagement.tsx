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

import GlobalAppToolbar from '../GlobalAppToolbar';
import { FormattedMessage } from 'react-intl';
import React, {
	createElement,
	ElementType,
	PropsWithChildren,
	RefObject,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import Box, { BoxProps } from '@mui/material/Box';
import { onSubmittingAndOrPendingChangeProps } from '../../hooks/useEnhancedDialogState';
import { useDispatch } from 'react-redux';
import useContentTypeList from '../../hooks/useContentTypeList';
import Button, { ButtonProps } from '@mui/material/Button';
import AddRounded from '@mui/icons-material/AddRounded';
import SelectContentType from '../SelectContentType/SelectContentType';
import ContentType, { ContentTypeField } from '../../models/ContentType';
import { ContentTypeListingProps } from './ContentTypeListing';
import ViewToolbar from '../ViewToolbar/ViewToolbar';
import { ArrowBackRounded, DeleteOutline, MoveToInboxRounded, SwapCallsOutlined } from '@mui/icons-material';
import Drawer from '@mui/material/Drawer';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper, { paperClasses } from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import { ItemTypeIcon } from '../ItemTypeIcon';
import { pushDialog } from '../../state/actions/dialogStack';
import { DeleteContentTypeDialogProps } from '../DeleteContentTypeDialog';
import { accordionClasses } from '@mui/material/Accordion';
import SectionAccordion from '../FormsEngine/components/SectionAccordion';
import { createStore, Provider } from 'jotai';
import {
	FormsEngineFormApiContextProps,
	FormsEngineFormContextApi,
	FormsEngineItemMetaContextProps,
	ItemContext,
	ItemMetaContext,
	StableFormContext,
	StableFormContextProps,
	StableGlobalContext,
	StableGlobalContextProps,
	useStableFormContext
} from '../FormsEngine/lib/formsEngineContext';
import ErrorBoundary from '../ErrorBoundary';
import { buildSectionExpandedStateAtoms, setFieldAtoms, useShowAlert } from '../FormsEngine/lib/formUtils';
import { fooFn, retrieveProperty } from '../../utils/object';
import ButtonBase, { ButtonBaseProps } from '@mui/material/ButtonBase';
import { alpha } from '@mui/system/colorManipulator';
import { capitalize } from '../../utils/string';
import { getMarginSxProps } from '../../utils/ui';
import Container from '@mui/material/Container';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNextRounded';
import ContentTypeFieldIcon from '../../icons/ContentTypeField';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import controlDescriptors, { dataSourcesSection, systemFieldsDescriptors, systemFieldsSection } from './descriptors';
import { BuiltInControlType } from '../FormsEngine/lib/controlMap';
import { renderFieldControl } from '../FormsEngine/lib/controlHelpers';
import { createParsedValueForField } from '../FormsEngine/lib/valueRetrievers';
import useContentTypes from '../../hooks/useContentTypes';
import LookupTable from '../../models/LookupTable';
import FormBackToTop from '../FormsEngine/components/FormBackToTop';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material';
import { useIsDarkModeTheme } from '../../hooks/useIsDarkModeTheme';
import { Subject } from 'rxjs';
import {
	createTypeValuesObject,
	createVirtualDataSourceFields,
	createVirtualSection,
	createVirtualType
} from './utils';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import XmlDeserializer from '../XmlTools/XmlDeserializer';
import ContentTypeCardMedia from './ContentTypeCardMedia';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import { XmlKeys } from '../FormsEngine/lib/formConsts';
import XmlBeautifier from '../XmlTools/XmlBeautifier';

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

interface TypeListAppProps {
	renderAppBar?: boolean;
	showOpenLauncherButton?: boolean;
	onTypeSelected?: ContentTypeListingProps['onCardClick'];
}

function TypeListApp(props: TypeListAppProps) {
	const { renderAppBar = true, showOpenLauncherButton = true, onTypeSelected } = props;
	const contentTypesList = useContentTypeList();
	const loading = contentTypesList == null;
	const createNewButton = (
		<Button variant={renderAppBar ? 'outlined' : 'text'} startIcon={<AddRounded />}>
			<FormattedMessage defaultMessage="Create Type" />
		</Button>
	);
	return (
		<Box height="100%" display="flex" flexDirection="column">
			{renderAppBar && (
				<GlobalAppToolbar
					title={<FormattedMessage id="componentsMessages.contentTypes" defaultMessage="Content Types" />}
					showAppsButton={showOpenLauncherButton}
					leftContent={createNewButton}
				/>
			)}
			<SelectContentType
				contentTypesList={contentTypesList}
				slotProps={{
					box: { sx: { p: 2 } },
					bar: {
						leftChildren: renderAppBar ? undefined : createNewButton
					},
					listing: {
						skeleton: loading,
						skeletonItemCount: 20,
						onCardClick: onTypeSelected
					}
				}}
			/>
		</Box>
	);
}

interface EditTypeAppProps {
	type: ContentType;
	values: LookupTable<unknown>;
	onClose?: () => void;
}

// This layout pattern could be useful in other parts of the application.

interface MainProps {
	open?: boolean;
	drawerWidth?: number;
}

const AddButton = Button;
// const AddButton = styled(Button)(({ theme }) => ({
// 	borderStyle: 'dashed',
// 	borderWidth: 1,
// 	borderColor: theme.palette.primary.main
// 	// minWidth: 200,
// 	// margin: 'auto',
// 	// display: 'block'
// 	// width: '100%'
// }));

const Main = styled('section', {
	shouldForwardProp: (prop) => !['open', 'drawerWidth'].includes(prop as string)
})<MainProps>((args) => {
	const { theme, drawerWidth } = args;
	return {
		flexGrow: 1,
		padding: theme.spacing(2),
		marginRight: 0,
		transition: theme.transitions.create('margin', {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.leavingScreen
		}),
		variants: [
			{
				props: ({ open }) => open,
				style: {
					marginRight: `${drawerWidth}px`,
					transition: theme.transitions.create('margin', {
						easing: theme.transitions.easing.easeOut,
						duration: theme.transitions.duration.enteringScreen
					})
				}
			}
		]
	};
});

const fooStableGlobalContextRef: StableGlobalContextProps = Object.freeze<StableGlobalContextProps>({
	formsStackData: [],
	api: {
		pushForm: fooFn,
		popForm: fooFn,
		updateProps: fooFn,
		setStateCache: fooFn
	}
});

const createStableFormContextProps = ({ type }: { type: ContentType }, createRootTypeSections: boolean = false) => {
	const context: StableFormContextProps = {
		atoms: {
			expandedStateBySectionId: buildSectionExpandedStateAtoms(type.sections),
			isSubmitting: undefined,
			hasPendingChanges: undefined,
			readonly: undefined,
			lockResult: undefined,
			valueByFieldId: undefined,
			validationByFieldId: undefined,
			versionComment: undefined,
			collapseToC: undefined,
			useCollapsedToC: undefined,
			isLargeContainer: undefined,
			tableOfContentsDrawerOpen: undefined,
			closeAfterSave: undefined
		},
		changedFieldIds: null,
		fieldUpdates$: null,
		itemMeta: null,
		originalValues: null,
		props: null,
		state: null
	};
	if (createRootTypeSections) {
		Object.assign(
			context.atoms.expandedStateBySectionId,
			buildSectionExpandedStateAtoms([systemFieldsSection, dataSourcesSection])
		);
	}
	return context;
};

// SectionAccordions render FieldChips, which receive a ContentTypeField data structure
// Each field descriptor/definition gets mapped to a "virtual" ContentType data structure to render a FormsEngine-like form using FormsEngine control components

function makeIntoTypeFieldStructPath(fieldPath: string): string {
	return fieldPath
		.split('.')
		.map((piece) => `${piece}.fields`)
		.join('.')
		.replace(/.fields$/, '');
}

function EditTypeApp(props: EditTypeAppProps) {
	const { type } = props;
	const theme = useTheme();

	const [open, setOpen] = useState(false);
	const [drawerWidth, setDrawerWidth] = useState(500);
	const [useDrawer, setUseDrawer] = useState(true);

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
	const valuesRef = useRef<LookupTable<unknown>>(undefined);
	const [selectedFieldIdPath, setSelectedFieldIdPath] = useState<string>();
	const [virtualContentType, setVirtualContentType] = useState<ContentType>();
	const [selectedField, setSelectedField] = useState<ContentTypeField>();
	const [virtualTypeValues, setVirtualTypeValues] = useState<LookupTable<unknown>>();
	const handleFieldSelected: FieldChipProps['onFieldSelected'] = (fieldPath, field) => {
		const controlDescriptor = controlDescriptors[field.type as BuiltInControlType];
		if (!controlDescriptor)
			return showAlert({ message: `No control descriptor found for field "${field.name}" of type "${field.type}"` });
		setSelectedFieldIdPath(fieldPath);
		const pathToField = makeIntoTypeFieldStructPath(fieldPath);
		const virtualType = createVirtualType(controlDescriptor);
		const fieldValues = retrieveProperty(typeValuesObject, pathToField);
		setVirtualTypeValues(fieldValues);
		setVirtualContentType(virtualType);
		setSelectedField(retrieveProperty(type.fields, pathToField));
		setOpen(true);
	};
	const handleSetValues: TypeFormsEngineProps['setValues'] = (values) => {
		valuesRef.current = values;
	};

	const fieldEditorView = virtualContentType ? (
		<TypeFormsEngine
			field={selectedField}
			fieldIdPath={selectedFieldIdPath}
			type={virtualContentType}
			values={virtualTypeValues}
			setValues={handleSetValues}
		/>
	) : null;

	return (
		<Box ref={containerRef} height="100%" display="flex" flexDirection="column" overflow="hidden">
			<ViewToolbar ref={toolbarRef}>
				<Box display="flex" alignItems="center">
					<IconButton onClick={props.onClose}>
						<ArrowBackRounded />
					</IconButton>
					<Typography variant="h5" component="h1" noWrap>
						<FormattedMessage defaultMessage="New Content Type" />
					</Typography>
				</Box>
				<div hidden>
					<Button onClick={() => setOpen(!open)}>Toggle Drawer</Button>
				</div>
			</ViewToolbar>
			<Box position="relative" flexGrow={1} sx={getMarginSxProps()}>
				<Main
					open={useDrawer && open}
					drawerWidth={drawerWidth}
					sx={{ height: 'var(--container-height)', overflow: 'auto' }}
				>
					<EditTypeAppLeft
						type={type}
						selectedFieldIdPath={selectedFieldIdPath}
						onFieldSelected={handleFieldSelected}
					/>
				</Main>
				{useDrawer ? (
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
					<Dialog open={open} onClose={() => setOpen(false)}>
						{fieldEditorView}
					</Dialog>
				)}
			</Box>
		</Box>
	);
}

const NullSymbol = Symbol(null);

function EditTypeAppLeft(props: {
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

	return (
		<ErrorBoundary>
			<Provider store={store}>
				<StableFormContext.Provider value={stableFormContextRef.current}>
					<XmlBeautifier beautifierOptions={{ xmlWhitespaceSensitivity: 'ignore' }} />
					<TypeHeader type={type} />
					<Box className="space-y-2">
						<SectionAccordion
							variant="outlined"
							colorize={false}
							section={systemFieldsSection}
							slotProps={{ accordionDetails: { className: '' } }}
							renderControl={(fieldId) => (
								<FieldChip
									key={fieldId}
									field={systemFieldsDescriptors[fieldId]}
									onFieldSelected={onFieldSelected}
									selectedFieldIdPath={selectedFieldIdPath}
								/>
							)}
						/>

						{type.sections.map((section) => (
							<SectionAccordion
								key={section.title}
								section={section}
								sx={{ [`&.${accordionClasses.expanded}`]: { margin: 0 } }}
								slotProps={{
									accordionDetails: {
										className: '',
										children: (
											<AddButton>
												<FormattedMessage defaultMessage="Add Field" />
											</AddButton>
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
						<AddButton>
							<FormattedMessage defaultMessage="Add Section" />
						</AddButton>

						<Divider sx={{ mx: -2 }} />

						<SectionAccordion
							variant="outlined"
							colorize={false}
							section={dataSourcesSection}
							slotProps={{
								accordionDetails: {
									className: '',
									children: (
										<AddButton>
											<FormattedMessage defaultMessage="Add Data Source" />
										</AddButton>
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
					</Box>
				</StableFormContext.Provider>
			</Provider>
		</ErrorBoundary>
	);
}

function Xml() {
	return (
		<XmlDeserializer
			deserializedObjectProcessor={(o) => {
				// @ts-expect-error: `configuration` not in unknown is handled.
				let config = o?.widget?.configuration ?? {};
				if (typeof config !== 'object') config = {};
				['baseSystemFieldOverrides', 'baseControlPropertyOverrides', 'baseControlConstraintOverrides'].forEach(
					(key) => {
						config[key] = typeof config[key] !== 'object' ? {} : config[key];
					}
				);
				return config;
			}}
			parserOptions={{
				parseAttributeValue: true,
				attributeValueProcessor(_, attrValue) {
					if (attrValue === 'null' || attrValue === 'undefined') return NullSymbol;
					return attrValue;
				},
				tagValueProcessor(_, tagValue) {
					if (tagValue === 'null' || tagValue === 'undefined') return NullSymbol;
					// Return original value for parser to parse.
					return tagValue;
					// Return undefined to keep the original value (i.e. no parsing, e.g. for boolean & number values)
					// return;
				},
				isArray(tagName: string, jPath: string) {
					return (
						jPath.endsWith('sections.fields') ||
						['controlExclusions', 'dataSourceExclusions', 'controls', 'sections'].includes(tagName)
					);
				}
			}}
		/>
	);
}

// function composeFieldPath(...pieces: string[]): string {return pieces.filter(Boolean).join('.');}
function composeFieldPath(fieldPath: string, fieldId: string): string {
	return fieldPath ? `${fieldPath}.${fieldId}` : fieldId;
}

export interface FieldChipProps {
	field: ContentTypeField;
	fieldPath?: string;
	selectedFieldIdPath?: string;
	onFieldSelected(
		fieldPath: string,
		field: ContentTypeField,
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): void;
}

function FieldChip(props: FieldChipProps) {
	const { field, fieldPath, selectedFieldIdPath, onFieldSelected } = props;
	const theme = useTheme();
	const isDark = useIsDarkModeTheme();
	const isRepeat = field.type === 'repeat';
	const currentFieldPath = composeFieldPath(fieldPath, field.id);
	const isSelected = currentFieldPath === selectedFieldIdPath;
	const Root: ElementType<BoxProps> = (isRepeat ? Box : ButtonBase) as ElementType<BoxProps>;
	const Title: ElementType<BoxProps> = (isRepeat ? ButtonBase : 'div') as ElementType<BoxProps>;
	const onClick: ButtonBaseProps['onClick'] = (e) => onFieldSelected?.(currentFieldPath, field, e);
	const selectorButtonStyles: SxProps<Theme> = {
		'&:active': { boxShadow: theme.shadows[1] },
		'&:hover': {
			bgcolor: alpha(
				theme.palette.action.selected,
				theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity
			)
		}
	};
	const selectorButtonSelectedStyles: SxProps<Theme> = {
		// borderWidth: 1,
		// borderStyle: 'solid',
		// borderColor: isDark ? lighten(theme.palette.action.selected, 0.5) : darken(theme.palette.action.selected, 0.5),
		bgcolor: 'action.selected',
		'&:hover': { bgcolor: 'action.selected' }
	};
	return (
		<Root
			disabled={isSelected}
			sx={[
				{
					mb: 1,
					// borderWidth: 1,
					// borderStyle: 'solid',
					// borderColor: isDark ? 'grey.800' : 'grey.200',
					width: '100%',
					alignItems: 'start',
					flexDirection: 'column',
					bgcolor: isDark ? 'grey.800' : 'grey.200',
					borderRadius: 10,
					overflow: 'hidden'
				},
				isRepeat ? { borderRadius: 2 } : selectorButtonStyles,
				isSelected && selectorButtonSelectedStyles
			]}
			// @ts-expect-error: Handled. Only when it is a button will it receive the onClick.
			onClick={isRepeat ? undefined : onClick}
		>
			<Box
				component={Title}
				// @ts-expect-error: Handled. Only when it is a button will it receive the onClick.
				onClick={isRepeat ? onClick : undefined}
				disabled={isSelected}
				sx={[
					{
						px: 1.5,
						py: 0.5,
						width: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between'
					},
					isRepeat && selectorButtonStyles
				]}
			>
				<span>
					<Typography component="strong" sx={{ mr: 0.5, fontWeight: 600 }}>
						{field.name}
					</Typography>
					<Typography component="span" variant="body2">
						({field.id})
					</Typography>
				</span>
				<Typography variant="body2">{capitalize(field.type).replaceAll('-', ' ')}</Typography>
			</Box>
			{isRepeat && (
				<Box p={1} pt={0}>
					{Object.entries(field.fields).map(([fieldId, subField]) => (
						<FieldChip
							key={fieldId}
							field={subField}
							selectedFieldIdPath={selectedFieldIdPath}
							fieldPath={currentFieldPath}
							onFieldSelected={onFieldSelected}
						/>
					))}
					<AddButton>
						<FormattedMessage defaultMessage="Add Field" />
					</AddButton>
				</Box>
			)}
		</Root>
	);
}

function TypeHeader({ type }: { type: ContentType }) {
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
		<Box display="flex" gap={1} mb={2}>
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

interface TypeFormsEngineProps {
	type: ContentType;
	field: ContentTypeField;
	fieldIdPath: string;
	values: LookupTable<unknown>;
	setValues(values: LookupTable<unknown>): void;
}

function TypeFormsEngineUI(props: TypeFormsEngineProps) {
	const { type, field, fieldIdPath, values, setValues } = props;
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
						<Button variant="outlined" onClick={undefined}>
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

function TypeFormsEngine(props: PropsWithChildren<TypeFormsEngineProps>) {
	const { type, field, values, setValues } = props;
	const store = useMemo(() => createStore(), []); // TODO: Use stable memo?
	const contentTypesLookup = useContentTypes();
	const contextApi = useMemo<FormsEngineFormApiContextProps>(() => {
		const api: FormsEngineFormApiContextProps = {
			rollback() {},
			rollbackField(fieldId: string) {},
			setValuesCheckpoint(values: LookupTable<unknown>) {}
		};
		return api;
	}, []);
	const stableFormContext = useMemo<StableFormContextProps>(() => {
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
	}, [contentTypesLookup, values, type]);
	const itemMetaContext = useMemo<FormsEngineItemMetaContextProps>(() => {
		return {
			id: '',
			path: '',
			sourceMap: null,
			pathInSite: '',
			contentType: type,
			contentObject: {},
			contentXml: null
		};
	}, [type]);
	return (
		<Provider store={store}>
			<StableGlobalContext.Provider value={fooStableGlobalContextRef}>
				<FormsEngineFormContextApi.Provider value={contextApi}>
					<StableFormContext.Provider value={stableFormContext}>
						<ItemContext.Provider value={null}>
							<ItemMetaContext.Provider value={itemMetaContext}>
								{createElement(TypeFormsEngineUI, props)}
							</ItemMetaContext.Provider>
						</ItemContext.Provider>
					</StableFormContext.Provider>
				</FormsEngineFormContextApi.Provider>
			</StableGlobalContext.Provider>
		</Provider>
	);
}

export default ContentTypeManagement;
