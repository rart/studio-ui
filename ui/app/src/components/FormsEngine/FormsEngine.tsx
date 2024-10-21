/*
 * Copyright (C) 2007-2024 Crafter Software Corporation. All Rights Reserved.
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

import { styled, Theme, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import useEnv from '../../hooks/useEnv';
import { useDispatch } from 'react-redux';
import useActiveSite from '../../hooks/useActiveSite';
import useContentTypes from '../../hooks/useContentTypes';
import React, {
  Dispatch,
  ElementType,
  MutableRefObject,
  SetStateAction,
  SyntheticEvent,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { ContentTypeField, ContentTypeSection, SandboxItem } from '../../models';
import {
  FormEngineContext,
  FormEngineContextType,
  FormsEngineContextApi,
  FormsEngineContextProps
} from './formEngineContext';
import { fetchContentXML, fetchSandboxItem, lock } from '../../services/content';
import { catchError, map, tap } from 'rxjs/operators';
import { fetchSandboxItemComplete } from '../../state/actions/content';
import { forkJoin, of, switchMap } from 'rxjs';
import { createElements, deserialize, fromString, getInnerHtml, newXMLDocument, serialize } from '../../utils/xml';
import LoadingState from '../LoadingState';
import Paper, { paperClasses } from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Drawer, { drawerClasses, DrawerProps } from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import MinimizeIconRounded from '@mui/icons-material/RemoveRounded';
import MaximiseIcon from '@mui/icons-material/OpenInFullRounded';
import CloseFullscreenOutlined from '@mui/icons-material/CloseFullscreenOutlined';
import Close from '@mui/icons-material/Close';
import ItemTypeIcon from '../ItemTypeIcon';
import CalendarTodayRounded from '@mui/icons-material/CalendarTodayRounded';
import ItemPublishingTargetIcon from '../ItemPublishingTargetIcon';
import { getItemPublishingTargetText, getItemStateText } from '../ItemDisplay/utils';
import ItemStateIcon from '../ItemStateIcon';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { FieldRequiredStateIndicator } from './common/FieldRequiredStateIndicator';
import Alert from '@mui/material/Alert';
import { createErrorStatePropsFromApiResponse } from '../ApiResponseErrorState';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IFrame from '../IFrame';
import { StickyBox } from './common/StickyBox';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import { copyToClipboard } from '../../utils/system';
import { BuiltInControlType, controlMap } from './controlMap';
import MenuRounded from '@mui/icons-material/MenuRounded';
import { EnhancedDialogProps } from '../EnhancedDialog';
import useEnhancedDialogContext from '../EnhancedDialog/useEnhancedDialogContext';
import useLocale from '../../hooks/useLocale';
import { v4 as uuid } from 'uuid';
import { prettyPrintPerson } from '../../utils/object';
import { EditOutlined } from '@mui/icons-material';
import ContentType from '../../models/ContentType';
import { SearchBar } from '../SearchBar';
import validateFieldValue, {
  createCleanValuesObject,
  isFieldRequired,
  retrieveFieldValue,
  XmlKeys
} from './validateFieldValue';
import { UnknownControl } from './common/UnknownControl';
import LookupTable from '../../models/LookupTable';
import { XMLBuilder } from 'fast-xml-parser';
import { ControlProps } from './types';
import { toColor } from '../../utils/string';
import { NodeSelectorItem } from './controls/NodeSelector';
import { RepeatItem } from './controls/Repeat';

/**
 * Formats a FormsEngine values object with "hints" for attributes or other specifics for the XML serialiser to serialise
 * the content as a CrafterCMS content xml.
 **/
function prepareValuesForXmlSerialising(
  fields: LookupTable<ContentTypeField>,
  values: LookupTable<unknown>,
  contentTypesLookup: LookupTable<ContentType>
): LookupTable<unknown> {
  const jObj = { ...values };
  Object.entries(jObj).forEach(([id, value]) => {
    const field = fields[id];
    const fieldType = field?.type as BuiltInControlType;
    switch (fieldType) {
      case 'repeat':
      case 'node-selector': {
        const isRepeat = fieldType === 'repeat';
        jObj[id] = {
          '@:item-list': true,
          item: isRepeat
            ? (value as RepeatItem[]).map((item) =>
                prepareValuesForXmlSerialising(field.fields, item, contentTypesLookup)
              )
            : (value as NodeSelectorItem[]).map((item) => {
                if (item.component == null) {
                  return item;
                }
                const contentType = contentTypesLookup[(item.component[XmlKeys.contentTypeId] as string)?.trim()];
                if (!contentType) {
                  console.error(`Content type not found for embedded component`, item.component);
                  return item;
                }
                const component = prepareValuesForXmlSerialising(
                  contentType.fields,
                  item.component,
                  contentTypesLookup
                );
                component['@:id'] = component[XmlKeys.objectId];
                return { ...item, '@:inline': true, component };
              })
        };
        break;
      }
      case 'rte': {
        jObj[id] = { __cdata__: value };
        break;
      }
      case 'checkbox-group': {
        jObj[id] = { item: value };
        break;
      }
      default:
        break;
    }
  });
  return jObj;
}

/**
 * Takes in a FormsEngine values object and creates the XML representation
 **/
function buildContentXml(values: LookupTable<unknown>, contentTypesLookup: LookupTable<ContentType>): string {
  const rootContentType: ContentType = contentTypesLookup[values[XmlKeys.contentTypeId] as string];
  const rootObjectType = rootContentType.type;
  const jObj = prepareValuesForXmlSerialising(rootContentType.fields, values, contentTypesLookup);
  const builder = new XMLBuilder({
    format: true,
    indentBy: '\t',
    ignoreAttributes: false,
    attributeNamePrefix: '@:',
    cdataPropName: '__cdata__',
    suppressBooleanAttributes: false
  });
  const xml = builder.build({ [`${rootObjectType}`]: jObj });
  return xml as string;
}

interface BaseProps extends Partial<UpdateModeProps & RepeatModeProps & CreateModeProps> {
  /** Whether the form is rendered in a dialog. Causes various layout adjustments. **/
  isDialog?: boolean;
  onClose?: EnhancedDialogProps['onClose'];
  onMinimize?: EnhancedDialogProps['onMinimize'];
  onFullScreen?: EnhancedDialogProps['onFullScreen'];
  onCancelFullScreen?: EnhancedDialogProps['onCancelFullScreen'];
}

interface UpdateModeProps {
  update: {
    path: string;
    modelId?: string;
  };
}

interface RepeatModeProps {
  repeat: {
    fieldId: string;
    index?: number;
    values?: RepeatItem;
  };
}

interface CreateModeProps {
  create: {
    path: string;
    contentTypeId: string;
  };
}

export type FormsEngineProps = BaseProps & (UpdateModeProps | RepeatModeProps | CreateModeProps);

function getScrollContainer(container: HTMLElement): HTMLElement {
  return container;
}

const createInitialState: (mixin?: Partial<FormsEngineContextProps>) => FormsEngineContextProps = (
  mixin?: Partial<FormsEngineContextProps>
) => ({
  pathInProject: null,
  activeTab: 0,
  values: null,
  contentDom: null,
  contentXml: null,
  contentType: null,
  contentTypeXml: null,
  fieldHelpExpandedState: {},
  fieldValidityState: {},
  formsEngineExtensions: null,
  formsStack: [],
  formsStackState: [],
  item: null,
  locked: false,
  lockError: null,
  previousScrollTopPosition: null,
  requirementsFetched: false,
  sectionExpandedState: {},
  isCreateMode: false,
  ...mixin
});

const buildSectionExpandedState = (contentTypeSections: ContentTypeSection[]) => {
  return contentTypeSections.reduce(
    (sectionExpandedState, section) => {
      sectionExpandedState[section.title] = section.expandByDefault;
      return sectionExpandedState;
    },
    {} as Record<string, boolean>
  );
};

const buildInitialFieldValidityState = (
  contentTypeFields: LookupTable<ContentTypeField>,
  values: LookupTable<unknown>
): FormsEngineContextProps['fieldValidityState'] => {
  return Object.keys(contentTypeFields).reduce(
    (fieldValidityState, fieldId) => {
      const field = contentTypeFields[fieldId];
      fieldValidityState[fieldId] = {
        isValid: validateFieldValue(field, retrieveFieldValue(field, values)),
        messages: null
      };
      if (fieldValidityState[fieldId].isValid === false) {
        fieldValidityState[fieldId].messages = ['This field is required.'];
      }
      return fieldValidityState;
    },
    {} as FormsEngineContextProps['fieldValidityState']
  );
};

const DenseTab = styled(Tab)(({ theme }) => ({ minHeight: 0, padding: theme.spacing(1) }));

export function FormsEngine(props: FormsEngineProps) {
  const { create, update, repeat, isDialog = false } = props;
  const theme = useTheme();
  const { formatMessage } = useIntl();
  const { guestBase } = useEnv();
  const dispatch = useDispatch();
  const activeSite = useActiveSite();
  const siteId = activeSite.id;
  const contentTypesById = useContentTypes();
  const containerRef = useRef<HTMLDivElement>();
  const [containerStats, setContainerStats] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
    isLargeContainer: boolean;
  }>(null);
  const [openDrawerSidebar, setOpenDrawerSidebar] = useState(false);
  const isFullScreen = useEnhancedDialogContext()?.isFullScreen;
  const [disableAutoFocus, setDisableAutoFocus] = useState(true);
  // const effectRefs = useUpdateRefs({ contentTypesById });

  // region Context
  const [parentState, parentContextApiRef] = useContext(FormEngineContext) ?? [];
  const [state, setState] = useState<FormsEngineContextProps>(() => {
    if (parentState?.formsStackState) {
      // Stacked forms open with the state from the formsStackState. Once set, the object in the formsStackState
      // is not updated unless the stacked form pushes another on the stack. Otherwise, it remains mostly stale until
      // it is popped.
      return parentState.formsStackState[parentState.formsStackState.length - 1];
    } else {
      return createInitialState();
    }
  });
  const contextApiRef = useRef<FormsEngineContextApi>(null);
  const context = useMemo<FormEngineContextType>(() => {
    const update = <K extends keyof FormsEngineContextProps>(
      newStateOrKey: K | Partial<FormsEngineContextProps>,
      newState?: FormsEngineContextProps[K]
    ) => {
      if (typeof newStateOrKey === 'string') {
        setState({ ...state, [newStateOrKey]: newState });
      } else {
        setState({ ...state, ...newStateOrKey });
      }
    };
    const api: FormsEngineContextApi = {
      update,
      pushForm(formProps: FormsEngineProps, openerFormState?: FormsEngineContextProps) {
        if (parentContextApiRef) {
          state.previousScrollTopPosition = getScrollContainer(containerRef.current).scrollTop;
          parentContextApiRef.current.pushForm(formProps, state);
        } else {
          let newState: FormsEngineContextProps = createInitialState();
          if (formProps.repeat) {
            newState.values = formProps.repeat.values;
            newState.item = state.item;
            newState.locked = state.locked;
            newState.contentDom = state.contentDom.querySelector(`:scope > ${formProps.repeat.fieldId}`);
            newState.contentXml = newState.contentDom.outerHTML;
            newState.contentType = state.contentType;
            newState.pathInProject = state.pathInProject;
            newState.values = formProps.repeat.values ?? {};
            newState.sectionExpandedState = buildSectionExpandedState(contentType.sections);
            newState.fieldValidityState = buildInitialFieldValidityState(state.contentType.fields, newState.values);
            console.log(newState.contentXml);
            return;
          }
          update({
            formsStack: [...state.formsStack, formProps],
            formsStackState: openerFormState
              ? // Replace/update the opener form state to reflect the current state so it is restored correctly.
                [...state.formsStackState.slice(0, -1), openerFormState, newState]
              : [...state.formsStackState, newState]
          });
        }
      },
      popForm() {
        if (parentContextApiRef) {
          parentContextApiRef.current.popForm();
        } else {
          update({
            formsStack: state.formsStack.slice(0, -1),
            formsStackState: state.formsStackState.slice(0, -1)
          });
        }
      },
      updateValue(fieldId: string, value: unknown) {
        update({
          values: { ...state.values, [fieldId]: value },
          fieldValidityState: state.contentType.fields[fieldId]
            ? {
                ...state.fieldValidityState,
                [fieldId]: {
                  isValid: validateFieldValue(state.contentType.fields[fieldId], value),
                  messages: null
                }
              }
            : state.fieldValidityState
        });
      },
      handleTabChange(event: SyntheticEvent, newValue: number) {
        update('activeTab', newValue);
      },
      handleToggleSectionAccordion(event: SyntheticEvent, expanded: boolean) {
        api.setAccordionExpandedState(event.currentTarget.getAttribute('data-section-id'), expanded);
      },
      handleViewFieldHelpText(event: SyntheticEvent, field: ContentTypeField) {
        event.preventDefault();
        const key = field.id;
        update('fieldHelpExpandedState', {
          ...state.fieldHelpExpandedState,
          [key]: !state.fieldHelpExpandedState[key]
        });
      },
      setAccordionExpandedState(sectionId: string, expanded: boolean) {
        update('sectionExpandedState', {
          ...state.sectionExpandedState,
          [sectionId]: expanded
        });
      }
    };
    contextApiRef.current = api;
    return [state, contextApiRef];
  }, [state, parentContextApiRef]);
  // endregion

  const requirementsFetched = state.requirementsFetched;
  const hasStackedForms = state.formsStack.length > 0;

  // TODO: Consider backend that provides all form requirements: form def xml, context xml, sandbox/detailed item. Lock too?
  useEffect(() => {
    // TODO:
    //  - Content type not found
    //  - Item/Content not found
    //  - Invalid params (e.g. create mode without a content type id)
    if (!requirementsFetched && contentTypesById && !repeat) {
      const isCreateMode = Boolean(create);
      let pathInProject = isCreateMode ? create.path : '';
      if (!isCreateMode) {
        /* Example:
         *   item.path = '/site/website/headless-cms-solutions/enterprise/index.xml'
         *   pieces = item.path.split('/').slice(3)
         *     ==> ['headless-cms-solutions', 'enterprise', 'index.xml']
         *   pieces.slice(0, result.length - 2)
         *     ==> ['headless-cms-solutions'] */
        const pieces = (update.path ?? parentState.item.path)
          .split('/')
          // .slice(3) removes the first empty string created by the leading slash (''),
          // 'site', and whatever comes after (e.g. 'components' in /site/components,
          // or 'website' in /site/website).
          .slice(3);
        pathInProject = `/${(isCreateMode
          ? pieces
          : // .slice(0, length - 2) removes the folder name and file name.
            // In the case of no folder name, it will return an empty string.
            pieces.slice(0, pieces.length - 2)
        ).join('/')}/`.replace(/\/+/g, '/');
      }
      if (isCreateMode) {
        // Create mode
        const dateIsoString = new Date().toISOString();
        const newModelId = uuid();
        const contentType = contentTypesById[create.contentTypeId];
        const contentDom = newXMLDocument(contentType.type);
        const values = createCleanValuesObject(
          contentType.fields,
          {
            objectId: newModelId,
            [XmlKeys.contentTypeId]: contentType.id,
            'display-template': contentType.displayTemplate,
            'no-template-required': Boolean(contentType.displayTemplate ? 'false' : 'true'),
            'merge-strategy': 'inherit-levels',
            createdDate: dateIsoString,
            createdDate_dt: dateIsoString,
            lastModifiedDate: dateIsoString,
            lastModifiedDate_dt: dateIsoString
          },
          contentTypesById
        );
        createElements(contentDom.documentElement, values);
        const contentXml = serialize(contentDom);
        contextApiRef.current.update({
          values,
          contentType,
          contentDom,
          contentXml,
          pathInProject,
          fieldValidityState: buildInitialFieldValidityState(contentType.fields, values),
          requirementsFetched: true,
          sectionExpandedState: buildSectionExpandedState(contentType.sections)
        });
      } else {
        const subscription = fetchSandboxItem(siteId, update.path)
          // region forkJoin
          .pipe(
            tap((item) => dispatch(fetchSandboxItemComplete({ item }))),
            switchMap((item) =>
              forkJoin([
                of(item),
                lock(siteId, update.path).pipe(
                  map(() => ({ locked: true, error: null })),
                  catchError((error) => of({ locked: false, error: error.response?.response }))
                ),
                fetchContentXML(siteId, update.path)
                // fetchConfigurationXML(siteId, `/content-types${item.contentTypeId}/form-definition.xml`, 'studio'),
                // fetchContentType(siteId, item.contentTypeId),
                // of(null)
                // importPlugin({
                //   site: siteId,
                //   type: 'examples',
                //   name: 'forms-engine',
                //   file: 'index.js',
                //   id: 'org.craftercms'
                // }).catch(() => null)
              ])
            )
          )
          // endregion
          .subscribe(([item, lockResult, contentXml]) => {
            let contentType = contentTypesById[item.contentTypeId];
            let contentDom: XMLDocument | Element = fromString(contentXml);
            let rootTagName = contentDom.documentElement.tagName;
            if (update.modelId) {
              contentDom = contentDom.querySelector(`[id="${update.modelId}"]`);
              rootTagName = contentDom.tagName;
              contentType = contentTypesById[getInnerHtml(contentDom.querySelector(':scope > content-type'))];
            }
            const contentObject = deserialize(contentDom, {
              ignoreAttributes: true,
              isArray(tagName: string, jPath: string) {
                // Ideally, we would extract all collection types (item selector, repeat) that have
                // this sort of syntax to avoid false positives.
                // e.g.collectionFieldIds.map((fieldId) => `${rootTagName}.${fieldId}.item`).includes(jPath);
                return jPath.endsWith('.item');
              }
            })[rootTagName];
            const values = createCleanValuesObject(contentType.fields, contentObject, contentTypesById);
            contextApiRef.current.update({
              item,
              values,
              contentDom,
              locked: lockResult.locked,
              lockError: lockResult.error,
              contentXml,
              contentTypeXml: null,
              contentType,
              pathInProject,
              fieldValidityState: buildInitialFieldValidityState(contentType.fields, values),
              requirementsFetched: true,
              sectionExpandedState: buildSectionExpandedState(contentType.sections),
              formsEngineExtensions: null
              // formsStack: [
              //   !modelId && {
              //     path: '/site/website/index.xml',
              //     modelId: '310b0c87-c3ca-4da0-4aa2-7002a318d7ce'
              //   }
              // ].filter(Boolean)
            });
          });
        return () => subscription.unsubscribe();
      }
    }
  }, [requirementsFetched, siteId, dispatch, contentTypesById, create, update, repeat, parentState?.item.path]);

  // Resize observer attached to the [scroll] container
  useLayoutEffect(() => {
    if (containerRef.current) {
      const container: HTMLElement = getScrollContainer(containerRef.current);
      const setValues = (rect: DOMRect) => {
        const width = rect.width;
        container.style.setProperty('--container-width', `${width}px`);
        container.style.setProperty('--container-height', `${rect.height}px`);
        setContainerStats({
          x: rect.x,
          y: rect.y,
          top: rect.top,
          right: rect.right,
          left: rect.left,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          isLargeContainer: width >= theme.breakpoints.values.lg
        });
      };
      const resizeObserver = new ResizeObserver((entries) =>
        entries.forEach(() => setValues(container.getBoundingClientRect()))
      );
      resizeObserver.observe(document.documentElement);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [
    theme.breakpoints.values.lg,
    // `requirementsFetched` isn't used inside the effect, but it is used as a way to
    // trigger the effect when the containerRef is set.
    requirementsFetched,
    // `isFullScreen` isn't used inside the effect but want to trigger the calculations when changed.
    isFullScreen
  ]);

  // Restore previous scroll position if provided
  useEffect(() => {
    if (containerRef.current) {
      const container: HTMLElement = getScrollContainer(containerRef.current);
      // Restore the previous scroll position
      if (state.previousScrollTopPosition != null) {
        container.scrollTop = state.previousScrollTopPosition;
      }
    }
  }, [
    state.previousScrollTopPosition,
    // `requirementsFetched` isn't used inside the effect, but it is used as a way to
    // trigger the effect when the containerRef is set.
    requirementsFetched
  ]);

  useLayoutEffect(() => {
    if (requirementsFetched && hasStackedForms) {
      const scrollContainer = getScrollContainer(containerRef.current);
      // Store the current scroll position to restore
      const scrollTop = scrollContainer.scrollTop;
      const scrollLeft = scrollContainer.scrollLeft;
      // Disable scrolling
      scrollContainer.style.overflow = 'hidden';
      // Restore the scroll position
      scrollContainer.scrollTop = scrollTop;
      scrollContainer.scrollLeft = scrollLeft;
      scrollContainer.style.setProperty('--scroll-top', `${scrollTop}px`);
      return () => {
        scrollContainer.style.overflow = '';
      };
    }
  }, [requirementsFetched, hasStackedForms]);

  // If the form is rendered in/as a dialog, take up the whole screen minus
  // top/bottom margins (2 top, 2 bottom). If not a dialog, take up the whole screen.
  const targetHeight = isDialog ? `calc(100vh - ${isFullScreen ? 0 : theme.spacing(4)})` : '100%';

  if (!requirementsFetched) {
    return (
      <LoadingState
        sx={{ height: targetHeight }}
        title={<FormattedMessage defaultMessage="Please wait" />}
        subtitle={<FormattedMessage defaultMessage="Gathering content information" />}
      />
    );
  }

  const isEmbedded = Boolean(update?.modelId);
  const isCreateMode = Boolean(!create?.path);
  const isLargeContainer = containerStats?.isLargeContainer;
  const contentType = state.contentType;
  const contentTypeFields = contentType.fields;
  const contentTypeSections = contentType.sections;
  const { handleToggleSectionAccordion } = contextApiRef.current;
  const { activeTab, sectionExpandedState } = state;
  const objectId = getInnerHtml(state.contentDom.querySelector(':scope > objectId'));
  const values = state.values;
  const handleOpenDrawerSidebar = () => {
    const scroller = getScrollContainer(containerRef.current);
    scroller.style.setProperty('--scroll-top', `${containerRef.current.scrollTop}px`);
    scroller.style.overflowY = 'hidden';
    setOpenDrawerSidebar(true);
  };
  const handleCloseDrawerSidebar: DrawerProps['onClose'] = () => {
    containerRef.current.style.overflowY = '';
    setOpenDrawerSidebar(false);
  };
  const handleCloseDrawerForm: DrawerProps['onClose'] = () => {
    containerRef.current.style.overflowY = '';
    contextApiRef.current.popForm();
  };
  const tableOfContents = (
    <TableOfContents
      theme={theme}
      containerRef={containerRef}
      contextApiRef={contextApiRef}
      contentTypeFields={contentTypeFields}
      fieldValidityState={state.fieldValidityState}
      contentTypeSections={contentTypeSections}
      sectionExpandedState={sectionExpandedState}
      setOpenDrawerSidebar={setOpenDrawerSidebar}
    />
  );

  const currentStackedForm = hasStackedForms ? state.formsStack[state.formsStack.length - 1] : null;
  let stackedFormKey = undefined;
  if (hasStackedForms) {
    if (currentStackedForm.update) {
      stackedFormKey = `${currentStackedForm.update.path}_${currentStackedForm.update.modelId}_${state.formsStack.length}`;
    } else if (currentStackedForm.create) {
      stackedFormKey = `${currentStackedForm.create.path}_${currentStackedForm.create.contentTypeId}_${state.formsStack.length}`;
    } else if (currentStackedForm.repeat) {
      stackedFormKey = `${currentStackedForm.repeat.fieldId}_${state.formsStack.length}`;
    }
  }

  const handleSave = () => {
    const xml = buildContentXml(values, contentTypesById);
    console.clear();
    console.log(xml);
  };

  return (
    <FormEngineContext.Provider value={context}>
      <Box
        data-model-id={objectId}
        data-area-id="formContainer"
        ref={containerRef}
        sx={{
          display: 'flex',
          height: targetHeight,
          flexDirection: 'column',
          position: 'relative',
          overflow: 'auto',
          '.space-y > :not([hidden]) ~ :not([hidden])': { mt: 1 },
          '.space-x > :not([hidden]) ~ :not([hidden])': { ml: 1 },
          '.space-y-2 > :not([hidden]) ~ :not([hidden])': { mt: 2 }
        }}
      >
        <Paper square component="header" data-area-id="formHeader" elevation={0}>
          <Box component={Container} display="flex" alignItems="center" justifyContent="space-between" pt={2}>
            <Typography variant="body2" color="textSecondary">
              <span title={siteId}>{activeSite.name}</span> / <span title={contentType.id}>{contentType.name}</span>
            </Typography>
            <div>
              {props.onMinimize && (
                <Tooltip title={<FormattedMessage defaultMessage="Miminize" />}>
                  <IconButton size="small" onClick={props.onMinimize}>
                    <MinimizeIconRounded />
                  </IconButton>
                </Tooltip>
              )}
              {(props.onCancelFullScreen || props.onFullScreen) && (
                <Tooltip title={<FormattedMessage defaultMessage="Maximize" />}>
                  <IconButton size="small" onClick={isFullScreen ? props.onCancelFullScreen : props.onFullScreen}>
                    {isFullScreen ? <CloseFullscreenOutlined /> : <MaximiseIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
              {props.onClose && (
                <Tooltip title={<FormattedMessage defaultMessage="Close" />}>
                  <IconButton size="small" onClick={(e) => props.onClose(e, '' as 'backdropClick')}>
                    <Close />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          </Box>
          {isCreateMode ? (
            <CreateModeHeader contentType={contentType} path={create?.path} />
          ) : (
            <EditModeHeader
              contextApiRef={contextApiRef}
              isEmbedded={isEmbedded}
              state={state}
              theme={theme}
              objectId={objectId}
              activeTab={activeTab}
            />
          )}
          <Divider />
        </Paper>
        <Box
          sx={{
            display: activeTab === 0 ? 'inherit' : 'none',
            px: 0,
            py: 2,
            backgroundColor: theme.palette.background.default
          }}
        >
          <Container maxWidth={isLargeContainer ? 'xl' : undefined}>
            <Grid container spacing={2}>
              <Grid item xs={isLargeContainer ? true : 'auto'}>
                <StickyBox data-area-id="stickySidebar">
                  {isLargeContainer ? (
                    tableOfContents
                  ) : (
                    <IconButton size="small" onClick={handleOpenDrawerSidebar}>
                      <MenuRounded />
                    </IconButton>
                  )}
                </StickyBox>
              </Grid>
              <Grid item xs={isLargeContainer ? 7 : 8} className="space-y" data-area-id="formBody">
                {state.lockError && (
                  <Alert severity="warning">
                    {createErrorStatePropsFromApiResponse(state.lockError, formatMessage).message}
                  </Alert>
                )}
                {contentTypeSections.map((section, index) => (
                  <Accordion
                    key={index}
                    expanded={sectionExpandedState[section.title]}
                    onChange={handleToggleSectionAccordion}
                    sx={{
                      borderLeftColor: toColor(section.title, 0.7),
                      borderLeftWidth: 5,
                      borderLeftStyle: 'solid',
                      borderTopLeftRadius: theme.shape.borderRadius,
                      borderBottomLeftRadius: theme.shape.borderRadius,
                      borderTopRightRadius: theme.shape.borderRadius,
                      borderBottomRightRadius: theme.shape.borderRadius
                    }}
                  >
                    <AccordionSummary data-section-id={section.title}>{section.title}</AccordionSummary>
                    <AccordionDetails className="space-y-2">
                      {section.fields.map((fieldId) => {
                        const field = contentTypeFields[fieldId];
                        const Control: ElementType<ControlProps> = controlMap[field.type] ?? UnknownControl;
                        return (
                          <Control
                            key={fieldId}
                            value={values[fieldId]}
                            setValue={(newValue) => contextApiRef.current.updateValue(fieldId, newValue)}
                            field={contentTypeFields[fieldId]}
                            contentType={contentType}
                          />
                        );
                      })}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Grid>
              <Grid item xs>
                <StickyBox className="space-y">
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Add to release</InputLabel>
                    <Select labelId="demo-simple-select-label" label="Add to release">
                      <MenuItem>AWS Landing Page</MenuItem>
                    </Select>
                  </FormControl>
                  <Paper sx={{ p: 1 }} className="space-y">
                    <TextField multiline fullWidth label={<FormattedMessage defaultMessage="Version Comment" />} />
                    <Button fullWidth variant="contained" onClick={handleSave}>
                      <FormattedMessage defaultMessage="Save" />
                    </Button>
                  </Paper>
                  <Button fullWidth variant="outlined">
                    <FormattedMessage defaultMessage="Publish" />
                  </Button>
                  <Button fullWidth variant="outlined">
                    <FormattedMessage defaultMessage="Unpublish" />
                  </Button>
                  <Button fullWidth variant="outlined">
                    <FormattedMessage defaultMessage="Close" />
                  </Button>
                </StickyBox>
              </Grid>
            </Grid>
          </Container>
        </Box>
        {/* TODO: All tabs other than 0 should be pluggable? */}
        {/* region Other tabs... */}
        {activeTab === 1 && (
          <IFrame
            url={guestBase}
            title="Preview"
            sx={{ display: 'flex', flex: '1' }}
            styles={{ iframe: { height: null } }}
          />
        )}
        {/* endregion */}
        {/* region Stacked Form Drawer */}
        <Drawer
          open={hasStackedForms}
          anchor="right"
          variant="temporary"
          disablePortal
          data-area-id="stackedFormDrawer"
          onClose={handleCloseDrawerForm}
          // Autofocus combined with absolute positioning (as opposed to the default fixed) causes the
          // scroll position to jump off the page (where the drawer panel is shown at) and looks like it
          // is the background element the one that's moving/animating in a jittery fashion.
          disableAutoFocus={disableAutoFocus}
          onTransitionExited={() => setDisableAutoFocus(true)}
          onTransitionEnd={
            // onTransitionEnd keeps triggering after the Drawer transition has finished on certain interactions (e.g. when hovering buttons)
            disableAutoFocus
              ? () => {
                  setDisableAutoFocus(false);
                  (
                    containerRef.current.querySelector(
                      `[data-area-id="stackedFormDrawer"] .${drawerClasses.paper}`
                    ) as HTMLDivElement
                  )?.focus();
                }
              : undefined
          }
          sx={{
            top: 'var(--scroll-top)',
            position: 'absolute',
            [`& > .${paperClasses.root}`]: {
              top: 0,
              width: 'calc(var(--container-width) - 100px)',
              height: isDialog ? `var(--container-height)` : '100vh',
              position: 'absolute'
            }
          }}
        >
          {hasStackedForms && (
            <FormsEngine
              key={stackedFormKey}
              {...currentStackedForm}
              isDialog={isDialog}
              onClose={() => contextApiRef.current.popForm()}
            />
          )}
        </Drawer>
        {/* endregion */}
        {/* region Sidebar Drawer */}
        <Drawer
          open={openDrawerSidebar}
          variant="temporary"
          disablePortal
          onClose={handleCloseDrawerSidebar}
          sx={{
            position: 'absolute',
            [`& > .${paperClasses.root}`]: {
              p: 2,
              top: 'var(--scroll-top)',
              width: 300,
              height: isDialog ? `var(--container-height)` : '100vh',
              position: 'absolute'
            }
          }}
        >
          {tableOfContents}
        </Drawer>
        {/* endregion */}
      </Box>
    </FormEngineContext.Provider>
  );
}

// region TableOfContents
function TableOfContents({
  theme,
  containerRef,
  contextApiRef,
  contentTypeFields,
  fieldValidityState,
  contentTypeSections,
  sectionExpandedState,
  setOpenDrawerSidebar
}: {
  theme: Theme;
  containerRef: MutableRefObject<HTMLDivElement>;
  contextApiRef: MutableRefObject<FormsEngineContextApi>;
  contentTypeFields: LookupTable<ContentTypeField>;
  fieldValidityState: FormsEngineContextProps['fieldValidityState'];
  contentTypeSections: ContentTypeSection[];
  sectionExpandedState: FormsEngineContextProps['sectionExpandedState'];
  setOpenDrawerSidebar: Dispatch<SetStateAction<boolean>>;
}) {
  const expandedSectionIds = Object.entries(sectionExpandedState).flatMap(([key, expanded]) => (expanded ? [key] : []));
  const handleSectionTreeItemClick = (event: SyntheticEvent) => {
    setOpenDrawerSidebar(false);
    const sectionId = event.currentTarget.parentElement.getAttribute('data-section-id');
    if (!sectionExpandedState[sectionId]) {
      contextApiRef.current.setAccordionExpandedState(sectionId, true);
    }
    getScrollContainer(containerRef.current).style.overflowY = '';
    getScrollContainer(containerRef.current)
      .querySelector(`[data-area-id="formBody"] [data-section-id="${sectionId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };
  const handleFieldTreeItemClick = (event: SyntheticEvent) => {
    const fieldId = event.currentTarget.parentElement.getAttribute('data-field-id');
    setOpenDrawerSidebar(false);
    getScrollContainer(containerRef.current).style.overflowY = '';
    getScrollContainer(containerRef.current)
      .querySelector(`[data-area-id="formBody"] [data-field-id="${fieldId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };
  const handleItemExpansionToggleClick = (event: SyntheticEvent, itemId: string, expanded: boolean) => {
    event.stopPropagation(); // Avoid accordion expansion
    contextApiRef.current.setAccordionExpandedState(itemId, expanded);
    setOpenDrawerSidebar(false);
  };
  return (
    <>
      <SearchBar
        showDecoratorIcon={false}
        dense
        keyword=""
        onChange={() => {}}
        styles={{ root: { marginBottom: theme.spacing(1) } }}
      />
      <SimpleTreeView
        expansionTrigger="iconContainer"
        onItemExpansionToggle={handleItemExpansionToggleClick}
        expandedItems={expandedSectionIds}
      >
        {contentTypeSections.map((section) => (
          <TreeItem
            key={section.title}
            itemId={section.title}
            data-section-id={section.title}
            label={section.title}
            onClick={handleSectionTreeItemClick}
            children={section.fields.map((fieldId) => {
              const field = contentTypeFields[fieldId];
              const isRequired = isFieldRequired(field);
              return (
                <TreeItem
                  key={fieldId}
                  itemId={fieldId}
                  data-field-id={fieldId}
                  onClick={handleFieldTreeItemClick}
                  label={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <span>{field.name}</span>
                      {isRequired && <FieldRequiredStateIndicator isValid={fieldValidityState[fieldId]?.isValid} />}
                    </Box>
                  }
                />
              );
            })}
          />
        ))}
      </SimpleTreeView>
    </>
  );
}
// endregion

// region EditModeHeader
function EditModeHeader({
  contextApiRef,
  isEmbedded,
  state,
  theme,
  objectId,
  activeTab
}: {
  contextApiRef: MutableRefObject<FormsEngineContextApi>;
  isEmbedded: boolean;
  state: FormsEngineContextProps;
  theme: Theme;
  objectId: string;
  activeTab: number;
}) {
  const item = state.item;
  const localeConf = useLocale();
  const { handleTabChange } = contextApiRef.current;
  const itemLabel = isEmbedded ? getInnerHtml(state.contentDom.querySelector(':scope > internal-name')) : item.label;
  const typeIconItem: Pick<SandboxItem, 'systemType' | 'mimeType'> = isEmbedded
    ? { systemType: 'component', mimeType: 'application/xml' }
    : item;
  const formattedCreator = prettyPrintPerson(item.creator);
  const formattedCreationDate = new Intl.DateTimeFormat(localeConf.localeCode, {
    dateStyle: 'short'
  }).format(new Date(item.dateCreated));
  const formattedModifier = prettyPrintPerson(item.modifier);
  const formattedModifiedDate = new Intl.DateTimeFormat(localeConf.localeCode, {
    dateStyle: 'short'
  }).format(new Date(item.dateModified));
  return (
    <>
      <Container className="space-y" sx={{ py: 1 }}>
        <Box display="flex" alignItems="end" justifyContent="space-between">
          <Box className="space-y" sx={{ flexBasis: '50%' }}>
            {/* Item display */}
            <Box display="flex" alignItems="center">
              <ItemTypeIcon item={typeIconItem} sx={{ color: 'info.main', mr: 1 }} />
              <Typography>{itemLabel}</Typography>
            </Box>
            {/* Item metadata */}
            <div>
              <Typography
                variant="body2"
                color="textSecondary"
                display="flex"
                alignItems="center"
                sx={{ flexWrap: 'wrap', em: { fontWeight: 600 } }}
              >
                <Box component="span" display="flex" alignItems="center" marginRight={1}>
                  <CalendarTodayRounded sx={{ mr: 0.25 }} fontSize="inherit" />
                  <span>
                    <FormattedMessage
                      defaultMessage="Created {when} by {who}"
                      values={{
                        who: <em title={formattedCreator.tooltip}>{formattedCreator.display}</em>,
                        when: formattedCreationDate
                      }}
                    />
                  </span>
                </Box>
                <Box component="span" display="flex" alignItems="center">
                  <EditOutlined sx={{ mr: 0.25 }} fontSize="inherit" />
                  <span>
                    <FormattedMessage
                      defaultMessage="Updated {when} by {who}"
                      values={{
                        who: <em title={formattedModifier.tooltip}>{formattedModifier.display}</em>,
                        when: formattedModifiedDate
                      }}
                    />
                  </span>
                </Box>
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                display="flex"
                alignItems="center"
                sx={{ flexWrap: 'wrap' }}
              >
                <Box component="span" display="flex" alignItems="center" marginRight={1}>
                  <ItemPublishingTargetIcon
                    fontSize="inherit"
                    styles={{ root: { marginRight: theme.spacing(0.25) } }}
                    item={item}
                  />{' '}
                  {getItemPublishingTargetText(item.stateMap)}
                </Box>
                <Box component="span" display="flex" alignItems="center">
                  <ItemStateIcon
                    fontSize="inherit"
                    styles={{ root: { marginRight: theme.spacing(0.25) } }}
                    item={item}
                  />{' '}
                  {getItemStateText(item.stateMap, { user: item.lockOwner?.username })}
                </Box>
              </Typography>
            </div>
          </Box>
          <Box className="space-y" display="flex" flexDirection="column" alignItems="end" sx={{ maxWidth: '50%' }}>
            <Typography
              component="span"
              variant="body2"
              color="textSecondary"
              display="flex"
              alignItems="center"
              sx={{ overflow: 'hidden', maxWidth: '100%' }}
            >
              <Box
                component="span"
                title={item.path}
                sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
              >
                {item.path}
                {/* Super-long test path: /Lorem/Ipsum/is/simply/dummy/text/of/the/printing/and/typesetting/industry/Lorem/Ipsum/has/been/the/industrys/standard/dummy/text/ever/since/the/1500s/when/an/unknown/printer/took/a/galley/of/type/and/scrambled/it/to/make/a/type/specimen/book.xml */}
              </Box>
              <Tooltip title={<FormattedMessage defaultMessage="Copy path to clipboard" />}>
                <IconButton size="small" onClick={() => copyToClipboard(item.path)} sx={{ padding: '1px', ml: 1 }}>
                  <ContentCopyRounded fontSize="inherit" sx={{ color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            </Typography>
            <Typography
              component="span"
              variant="body2"
              color="textSecondary"
              display="flex"
              alignItems="center"
              sx={{ overflow: 'hidden', maxWidth: '100%' }}
            >
              <Box
                component="span"
                title={objectId}
                sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
              >
                {objectId}
              </Box>
              <Tooltip title={<FormattedMessage defaultMessage="Copy ID to clipboard" />}>
                <IconButton
                  size="small"
                  sx={{ padding: '1px', ml: 1 }}
                  onClick={() => copyToClipboard(getInnerHtml(state.contentDom.querySelector(':scope > objectId')))}
                >
                  <ContentCopyRounded fontSize="inherit" sx={{ color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            </Typography>
          </Box>
        </Box>
      </Container>
      <Container maxWidth="xl">
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 0 }}>
          <DenseTab label={<FormattedMessage defaultMessage="Form" />} />
          <DenseTab label={<FormattedMessage defaultMessage="Preview" />} />
          <DenseTab label={<FormattedMessage defaultMessage="History" />} />
          <DenseTab label={<FormattedMessage defaultMessage="References" />} />
        </Tabs>
      </Container>
    </>
  );
}
// endregion

// region CreateModeHeader
const itemTypeTranslations = defineMessages({
  component: { defaultMessage: 'Component' },
  page: { defaultMessage: 'Page' },
  taxonomy: { defaultMessage: 'Taxonomy' }
});
function CreateModeHeader({ contentType, path }: { path: string; contentType: ContentType }) {
  const { formatMessage } = useIntl();
  const itemType = contentType.type;
  return (
    <Container sx={{ py: 1 }}>
      <Typography variant="h6" component="h2" display="flex" alignItems="center">
        <ItemTypeIcon item={{ systemType: itemType, mimeType: 'application/xml' }} sx={{ color: 'info.main', mr: 1 }} />
        <FormattedMessage
          defaultMessage='Create new "{name}" {type}'
          values={{
            name: contentType.name,
            type:
              itemType in itemTypeTranslations ? formatMessage(itemTypeTranslations[itemType]).toLowerCase() : itemType
          }}
        />
      </Typography>
      <Typography color="textSecondary" variant="body2" children={path} />
    </Container>
  );
}
// endregion
