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

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { FormattedMessage, useIntl } from 'react-intl';
import useEnv from '../../hooks/useEnv';
import { useDispatch } from 'react-redux';
import useActiveSite from '../../hooks/useActiveSite';
import useItemsByPath from '../../hooks/useItemsByPath';
import useContentTypes from '../../hooks/useContentTypes';
import React, { SyntheticEvent, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ContentTypeField } from '../../models';
import {
  FormEngineContext,
  FormEngineContextApi,
  FormEngineContextProps,
  FormEngineContextType,
  useFormEngineContext
} from './formEngineContext';
import { fetchContentXML, fetchSandboxItem, lock } from '../../services/content';
import { catchError, map, tap } from 'rxjs/operators';
import { fetchSandboxItemComplete } from '../../state/actions/content';
import { forkJoin, of, switchMap } from 'rxjs';
import { deserialize, fromString, getInnerHtml } from '../../utils/xml';
import LoadingState from '../LoadingState';
import Paper, { paperClasses } from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Backdrop, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import MinimizeIconRounded from '@mui/icons-material/RemoveRounded';
import MaximiseIcon from '@mui/icons-material/OpenInFullRounded';
import CloseFullscreenOutlined from '@mui/icons-material/CloseFullscreenOutlined';
import Close from '@mui/icons-material/Close';
import ItemTypeIcon from '../ItemTypeIcon';
import CalendarTodayRounded from '@mui/icons-material/CalendarTodayRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
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
import { controlMap } from './controlMap';
import Drawer from '@mui/material/Drawer';
import MenuRounded from '@mui/icons-material/MenuRounded';
import { EnhancedDialogProps } from '../EnhancedDialog';
import useEnhancedDialogContext from '../EnhancedDialog/useEnhancedDialogContext';
import apiResponse from '../../models/ApiResponse';

export interface FormsEngineProps {
  path: string;
  modelId?: string;
  /**
   * Show dialog controls (minimise, fullscreen, close)
   **/
  isDialog?: boolean;
  onClose?: EnhancedDialogProps['onClose'];
  onFullScreen?: EnhancedDialogProps['onFullScreen'];
  onCancelFullScreen?: EnhancedDialogProps['onCancelFullScreen'];
  onMinimize?: EnhancedDialogProps['onMinimize'];
}

function getScrollContainer(container: HTMLElement): HTMLElement {
  return container;
}

export function FormsEngine(props: FormsEngineProps) {
  const { path, modelId, isDialog = false, isStacked = false } = props;
  const theme = useTheme();
  const { formatMessage } = useIntl();
  const { guestBase } = useEnv();
  const dispatch = useDispatch();
  const { id: siteId, name: siteName } = useActiveSite();
  const item = useItemsByPath()?.[path];
  const contentTypesById = useContentTypes();
  const [requirementsFetched, setRequirementsFetched] = useState(false);
  const containerRef = useRef<HTMLDivElement>();
  const [containerStats, setContainerStats] = useState<{
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
    isLargeContainer: boolean;
  }>(null);
  const [isLargeContainer, setIsLargeContainer] = useState(true);
  const [openDrawerSidebar, setOpenDrawerSidebar] = useState(false);
  const isFullScreen = useEnhancedDialogContext()?.isFullScreen;

  // region Context
  const [, parentContextApiRef] = useContext(FormEngineContext) ?? [];
  const [state, setState] = useState<FormEngineContextProps>({
    activeTab: 0,
    values: null,
    contentDom: null,
    contentXml: null,
    contentType: null,
    contentTypeXml: null,
    fieldExpandedState: {},
    formsEngineExtensions: null,
    formsStack: [],
    item: null,
    locked: false,
    lockError: null,
    sectionExpandedState: {}
  });
  const contextApiRef = useRef<FormEngineContextApi>(null);
  const context = useMemo<FormEngineContextType>(() => {
    const update = <K extends keyof FormEngineContextProps>(
      newStateOrKey: K | Partial<FormEngineContextProps>,
      newState?: FormEngineContextProps[K]
    ) => {
      if (typeof newStateOrKey === 'string') {
        setState({ ...state, [newStateOrKey]: newState });
      } else {
        setState({ ...state, ...newStateOrKey });
      }
    };
    const api: FormEngineContextApi = {
      update,
      pushForm(formProps: FormsEngineProps) {
        console.log(formProps);
        update('formsStack', [...state.formsStack, formProps]);
      },
      popForm() {
        update('formsStack', state.formsStack.slice(0, -1));
      },
      updateValue(fieldId: string, value: unknown) {
        update('values', { ...state.values, [fieldId]: value });
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
        update('fieldExpandedState', { ...state.fieldExpandedState, [key]: !state.fieldExpandedState[key] });
      },
      setAccordionExpandedState(sectionId: string, expanded: boolean) {
        update('sectionExpandedState', {
          ...state.sectionExpandedState,
          [sectionId]: expanded
        });
      }
    };
    if (parentContextApiRef?.current) {
      api.pushForm = parentContextApiRef.current.pushForm;
      api.popForm = parentContextApiRef.current.popForm;
    }
    contextApiRef.current = api;
    return [state, contextApiRef];
  }, [state, parentContextApiRef]);
  // endregion

  // TODO: Consider backend that provides all form requirements: form def xml, context xml, sandbox/detailed item. Lock too?
  useEffect(() => {
    const subscription = fetchSandboxItem(siteId, path)
      // region forkJoin
      .pipe(
        tap((item) => dispatch(fetchSandboxItemComplete({ item }))),
        switchMap((item) =>
          forkJoin([
            of(item),
            lock(siteId, path).pipe(
              map(() => ({ locked: true, error: null })),
              catchError((error) => of({ locked: false, error: error.response?.response }))
            ),
            fetchContentXML(siteId, path)
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
        let contentDom: XMLDocument | Element = fromString(contentXml);
        let rootTagName = contentDom.documentElement.tagName;
        if (modelId) {
          contentDom = contentDom.querySelector(`[id="${modelId}"]`);
          rootTagName = contentDom.tagName;
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
        const values = JSON.parse(JSON.stringify(contentObject));
        const sectionExpandedState: Record<string, boolean> = {};
        const contentType = contentTypesById[getInnerHtml(contentDom.querySelector(':scope > content-type'))];
        contentType.sections.forEach((section) => {
          sectionExpandedState[section.title] = section.expandByDefault;
        });
        setRequirementsFetched(true);
        contextApiRef.current.update({
          item,
          values,
          contentDom,
          locked: lockResult.locked,
          lockError: lockResult.error,
          contentXml,
          contentTypeXml: null,
          contentType,
          sectionExpandedState,
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
  }, [siteId, path, modelId, dispatch, contentTypesById]);

  // Resize observer attached to the [scroll] container
  useLayoutEffect(() => {
    if (containerRef.current) {
      const container: HTMLElement = getScrollContainer(containerRef.current);
      const setValues = (rect: DOMRect) => {
        const width = rect.width;
        container.style.setProperty('--container-width', `${width}px`);
        container.style.setProperty('--container-height', `${rect.height}px`);
        setIsLargeContainer(width >= theme.breakpoints.values.lg);
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
      return () => resizeObserver.disconnect();
    }
  }, [requirementsFetched, theme.breakpoints.values.lg]);

  // const [freezeScroll, setFreezeScroll] = useState(true);
  const hasStackedForms = state.formsStack.length > 0;
  useEffect(() => {
    if (requirementsFetched && hasStackedForms) {
      const scrollContainer = getScrollContainer(containerRef.current);

      // Store the current scroll position
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

  if (!requirementsFetched) {
    return (
      <LoadingState
        sx={{ height: `calc(100vh - ${theme.spacing(4)})` }}
        title={<FormattedMessage defaultMessage="Please wait" />}
        subtitle={<FormattedMessage defaultMessage="Gathering content information" />}
      />
    );
  }

  // const isLargeContainer = containerStats.isLargeContainer;
  const contentType = state.contentType;
  const contentTypeFields = contentType.fields;
  const contentTypeSections = contentType.sections;
  const { handleTabChange, handleToggleSectionAccordion } = contextApiRef.current;
  const objectId = getInnerHtml(state.contentDom.querySelector(':scope > objectId'));
  const { activeTab, sectionExpandedState } = state;
  const expandedSectionIds = Object.entries(sectionExpandedState).flatMap(([key, expanded]) => (expanded ? [key] : []));
  const handleSectionTreeItemClick = (event: SyntheticEvent) => {
    setOpenDrawerSidebar(false);
    const sectionId = event.currentTarget.parentElement.getAttribute('data-section-id');
    if (!sectionExpandedState[sectionId]) {
      contextApiRef.current.setAccordionExpandedState(sectionId, true);
    }
    getScrollContainer(containerRef.current)
      .querySelector(`[data-area-id="formBody"] [data-section-id="${sectionId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };
  const handleFieldTreeItemClick = (event: SyntheticEvent) => {
    const fieldId = event.currentTarget.parentElement.getAttribute('data-field-id');
    setOpenDrawerSidebar(false);
    getScrollContainer(containerRef.current)
      .querySelector(`[data-area-id="formBody"] [data-field-id="${fieldId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };
  const handleItemExpansionToggle = (event: SyntheticEvent, itemId: string, expanded: boolean) => {
    event.stopPropagation(); // Avoid accordion expansion
    contextApiRef.current.setAccordionExpandedState(itemId, expanded);
    setOpenDrawerSidebar(false);
  };
  const sectionIndex = (
    <SimpleTreeView
      expansionTrigger="iconContainer"
      onItemExpansionToggle={handleItemExpansionToggle}
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
            const isRequired = Boolean(field.validations.required?.value);
            return (
              <TreeItem
                key={fieldId}
                itemId={fieldId}
                data-field-id={fieldId}
                onClick={handleFieldTreeItemClick}
                label={
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <span>{field.name}</span>
                    {isRequired && <FieldRequiredStateIndicator isValid />}
                  </Box>
                }
              />
            );
          })}
        />
      ))}
    </SimpleTreeView>
  );
  const currentStackedForm = hasStackedForms ? state.formsStack[state.formsStack.length - 1] : null;

  // return 'Hello';

  return (
    <FormEngineContext.Provider value={context}>
      <Box
        data-form-id={objectId}
        data-area-id="formContainer"
        data-area-mode={isDialog ? 'dialog' : 'inset'}
        ref={containerRef}
        sx={{
          display: 'flex',
          height: isDialog ? `calc(100vh - ${theme.spacing(4)})` : '100%',
          flexDirection: 'column',
          position: 'relative',
          overflowX: 'hidden',
          overflowY: 'auto'
        }}
      >
        <Paper square component="header" data-area-id="formHeader">
          <Container
            sx={{
              py: 1,
              px: 1,
              '& > :not([hidden]) ~ :not([hidden]), .space-y > :not([hidden]) ~ :not([hidden])': { mt: 1 },
              '.space-x > :not([hidden]) ~ :not([hidden])': { ml: 1 },
              position: 'relative'
            }}
          >
            {/* Top row with site name, content type name, and dialog controls */}
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">
                {siteName} / {contentType.name}
              </Typography>
              {isDialog && (
                <Box>
                  <Tooltip title={<FormattedMessage defaultMessage="Miminize" />}>
                    <IconButton size="small" onClick={props.onMinimize}>
                      <MinimizeIconRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={<FormattedMessage defaultMessage="Maximize" />}>
                    <IconButton size="small" onClick={isFullScreen ? props.onCancelFullScreen : props.onFullScreen}>
                      {isFullScreen ? <CloseFullscreenOutlined fontSize="small" /> : <MaximiseIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={<FormattedMessage defaultMessage="Close" />}>
                    <IconButton size="small" onClick={(e) => props.onClose(e, '')}>
                      <Close fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            {/* Item info */}
            <Box display="flex" alignItems="start" justifyContent="space-between">
              <Box className="space-y" sx={{ flexBasis: '50%' }}>
                {/* Item display */}
                <Box display="flex" alignItems="center">
                  <ItemTypeIcon item={item} sx={{ color: 'info.main', mr: 1 }} />
                  <Typography>{item.label}</Typography>
                </Box>
                {/* Item metadata */}
                <div>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    display="flex"
                    alignItems="center"
                    sx={{ flexWrap: 'wrap' }}
                  >
                    <Box component="span" display="flex" alignItems="center" marginRight={1}>
                      <CalendarTodayRounded sx={{ mr: 0.5 }} fontSize="inherit" /> Created Today
                    </Box>
                    <Box component="span" display="flex" alignItems="center">
                      <AccessTimeRounded sx={{ mr: 0.5 }} fontSize="inherit" /> Updated Today by admin
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
                        styles={{ root: { marginRight: theme.spacing(0.5) } }}
                        item={item}
                      />{' '}
                      {getItemPublishingTargetText(item.stateMap)}
                    </Box>
                    <Box component="span" display="flex" alignItems="center">
                      <ItemStateIcon
                        fontSize="inherit"
                        styles={{ root: { marginRight: theme.spacing(0.5) } }}
                        item={item}
                      />{' '}
                      {getItemStateText(item.stateMap, { user: item.lockOwner?.username })}
                    </Box>
                  </Typography>
                </div>
              </Box>
              {/* Item path and id */}
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
          {/* Header tabs */}
          <Container maxWidth="xl">
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label={<FormattedMessage defaultMessage="Form" />} />
              <Tab label={<FormattedMessage defaultMessage="Preview" />} />
              <Tab label={<FormattedMessage defaultMessage="History" />} />
              <Tab label={<FormattedMessage defaultMessage="References" />} />
            </Tabs>
          </Container>
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
          <Container
            maxWidth={isLargeContainer ? 'xl' : undefined}
            sx={{
              '.space-y > :not([hidden]) ~ :not([hidden])': { mt: 1 },
              '.space-y-2 > :not([hidden]) ~ :not([hidden])': { mt: 2 }
            }}
          >
            <Drawer
              open={openDrawerSidebar}
              variant="temporary"
              keepMounted={false}
              onClose={() => setOpenDrawerSidebar(false)}
              sx={{
                top: 0,
                left: 0,
                zIndex: theme.zIndex.modal,
                [`& > .${paperClasses.root}`]: {
                  p: 2,
                  width: 300
                }
              }}
            >
              {sectionIndex}
            </Drawer>
            <Grid container spacing={2}>
              <Grid item xs={isLargeContainer ? true : 'auto'}>
                <StickyBox data-area-id="stickySidebar">
                  {isLargeContainer ? (
                    sectionIndex
                  ) : (
                    <Box sx={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <IconButton size="small" onClick={() => setOpenDrawerSidebar(true)}>
                        <MenuRounded />
                      </IconButton>
                    </Box>
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
                  >
                    <AccordionSummary
                      // sx={{ borderLeftColor: toColor(section.title), borderLeftWidth: 5, borderLeftStyle: 'solid' }}
                      data-section-id={section.title}
                    >
                      {section.title}
                    </AccordionSummary>
                    <AccordionDetails
                      // sx={{ borderLeftColor: toColor(section.title), borderLeftWidth: 5, borderLeftStyle: 'solid' }}
                      className="space-y-2"
                    >
                      {section.fields.map((fieldId) => {
                        const field = contentTypeFields[fieldId];
                        const Control = controlMap[field.type] ?? controlMap.__UNKNOWN__;
                        return <Control key={fieldId} field={contentTypeFields[fieldId]} contentType={contentType} />;
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
                    <Button fullWidth variant="contained">
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
        {activeTab === 1 && (
          <IFrame
            url={guestBase}
            title="Preview"
            sx={{ display: 'flex', flex: '1' }}
            styles={{ iframe: { height: null } }}
          />
        )}
        {!isStacked && (
          <Backdrop
            open={hasStackedForms}
            sx={{
              zIndex: theme.zIndex.drawer
              // position: 'absolute',
              // top: 'var(--scroll-top)',
              // height: 'var(--container-height)'
            }}
          />
        )}
        <Drawer
          open={hasStackedForms}
          anchor="right"
          variant="persistent"
          sx={{
            width: 0,
            height: 0,
            [`& > .${paperClasses.root}`]: {
              position: 'absolute',
              top: hasStackedForms ? 'var(--scroll-top)' : 0,
              width: 'calc(var(--container-width) - 50px)',
              height: `calc(100vh - ${theme.spacing(8)})`
            }
          }}
          // variant="temporary"
          // sx={{
          //   zIndex: theme.zIndex.modal,
          //   [`& > .${paperClasses.root}`]: {
          //     top: containerStats?.top,
          //     left: containerStats?.left + 50,
          //     width: containerStats?.width - 50,
          //     height: containerStats?.height,
          //     right: theme.spacing(4),
          //     borderTopRightRadius: theme.shape.borderRadius,
          //     borderBottomRightRadius: theme.shape.borderRadius
          //   }
          // }}
        >
          {hasStackedForms && (
            <FormsEngine
              key={`${currentStackedForm.path}_${currentStackedForm.modelId}`}
              {...currentStackedForm}
              isDialog
              isStacked
              onClose={() => {
                contextApiRef.current.popForm();
              }}
            />
          )}
        </Drawer>
      </Box>
    </FormEngineContext.Provider>
  );
}
