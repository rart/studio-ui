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

import { useFormEngineContext } from '../formEngineContext';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { AddRounded, DeleteOutlined, EditOutlined, SearchRounded } from '@mui/icons-material';
import { FormEngineField } from '../common/FormEngineField';
import { ControlProps } from '../types';
import { MediaItem, Primitive } from '../../../models';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemButton from '@mui/material/ListItemButton';
import { FormattedMessage } from 'react-intl';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import Tooltip from '@mui/material/Tooltip';
import useContentTypes from '../../../hooks/useContentTypes';
import { MouseEvent as ReactMouseEvent, SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import BrowseFilesDialog, { BrowseFilesDialogProps } from '../../BrowseFilesDialog';
import Menu from '@mui/material/Menu';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import LookupTable from '../../../models/LookupTable';
import AllowedContentTypesData from '../../../models/AllowedContentTypesData';
import { asArray } from '../../../utils/array';
import ListItemIcon, { listItemIconClasses } from '@mui/material/ListItemIcon';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import { svgIconClasses } from '@mui/material/SvgIcon';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Grid from '@mui/material/Grid';
import ContentType from '../../../models/ContentType';
import { fetchLegacyContentTypes } from '../../../services/contentTypes';
import useActiveSiteId from '../../../hooks/useActiveSiteId';
import { forkJoin } from 'rxjs';
import Dialog from '@mui/material/Dialog';
import { DialogHeader } from '../../DialogHeader';
import { DialogFooter } from '../../DialogFooter';
import PrimaryButton from '../../PrimaryButton';
import SecondaryButton from '../../SecondaryButton';
import { DialogBody } from '../../DialogBody';
import Typography from '@mui/material/Typography';

// TODO: process path macros

export interface NodeSelectorProps extends ControlProps {
  value: NodeSelectorItem[];
}

export interface NodeSelectorItem {
  key: string;
  value: string;
  include?: string;
  disableFlattening?: boolean;
  component?: Record<string, Primitive>;
}

const oppositeStrategy = {
  embedded: 'shared',
  shared: 'embedded'
};

function ItemSelectorCreatePicker(props: {
  siteId: string;
  contentTypesLookup: LookupTable<ContentType>;
  allowedCreateTypes: LookupTable<AllowedContentTypesData>;
  allowedCreatePaths: string[];
  onChange(e, choice: { contentTypeId: string; strategy: string }): void;
}) {
  const { siteId, allowedCreatePaths, contentTypesLookup, onChange } = props;
  const [allowedTypes, setAllowedTypes] = useState<string[]>();
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [allowedCreateTypes, setAllowedCreateTypes] = useState<LookupTable<AllowedContentTypesData>>(
    props.allowedCreateTypes
  );
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [allowedStrategies, setAllowedStrategies] = useState({ embedded: false, shared: false });
  const handleTypeChange = (event: SyntheticEvent) => {
    const value = (event.target as HTMLInputElement).value;
    setSelectedContentType(value);
    onChange?.(event, { contentTypeId: value, strategy: selectedStrategy });
  };
  const handleStrategyChange = (event: SyntheticEvent) => {
    const value = (event.target as HTMLInputElement).value;
    setSelectedStrategy(value);
    onChange?.(event, { contentTypeId: selectedContentType, strategy: value });
  };
  useEffect(() => {
    if (allowedCreatePaths.length) {
      const sub = forkJoin(allowedCreatePaths.map((path) => fetchLegacyContentTypes(siteId, path))).subscribe(
        (responses) => {
          const result = [
            ...new Set(
              responses.flatMap((types) => types.map((type) => type.name)).concat(Object.keys(props.allowedCreateTypes))
            )
          ];
          const allowedLookup = { ...props.allowedCreateTypes };
          result.forEach((contentTypeId) => {
            allowedLookup[contentTypeId] = allowedLookup[contentTypeId] ?? {};
            allowedLookup[contentTypeId].shared = true;
          });
          setAllowedTypes(result);
          setSelectedContentType(result[0]);
          setAllowedCreateTypes(allowedLookup);
          setSelectedStrategy(allowedLookup[result[0]].embedded ? 'embedded' : 'shared');
        }
      );
      return () => sub.unsubscribe();
    } else {
      const result = Object.keys(props.allowedCreateTypes);
      setAllowedTypes(result);
      setSelectedContentType(result[0]);
      setSelectedStrategy(props.allowedCreateTypes[result[0]].embedded ? 'embedded' : 'shared');
    }
  }, [siteId, allowedCreatePaths, props.allowedCreateTypes]);
  useEffect(() => {
    // Note: effect will run twice when selectedContentType changes and the strategy is changed by the effect.
    if (selectedContentType) {
      if (!allowedCreateTypes[selectedContentType][selectedStrategy]) {
        setSelectedStrategy(oppositeStrategy[selectedStrategy]);
      }
      setAllowedStrategies({
        shared: allowedCreateTypes[selectedContentType].shared,
        embedded: allowedCreateTypes[selectedContentType].embedded
      });
    }
  }, [allowedCreateTypes, selectedContentType, selectedStrategy]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={7}>
        <FormControl>
          <FormLabel id="contentTypeLabel">
            <FormattedMessage defaultMessage="Content Type" />
          </FormLabel>
          <RadioGroup aria-labelledby="contentTypeLabel" name="contentType" value={selectedContentType}>
            {allowedTypes?.map((contentTypeId) => (
              <FormControlLabel
                key={contentTypeId}
                value={contentTypeId}
                control={<Radio />}
                label={contentTypesLookup[contentTypeId].name}
                onChange={handleTypeChange}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid item xs={5}>
        <FormControl sx={{ position: 'sticky' }}>
          <FormLabel id="creationStrategyLabel">
            <FormattedMessage defaultMessage="Creation Strategy" />
          </FormLabel>
          <RadioGroup aria-labelledby="creationStrategyLabel" name="creationStrategy" value={selectedStrategy}>
            <FormControlLabel
              disabled={!allowedStrategies.embedded}
              value="embedded"
              control={<Radio onChange={handleStrategyChange} />}
              label="Embedded"
            />
            <FormControlLabel
              disabled={!allowedStrategies.shared}
              value="shared"
              control={<Radio onChange={handleStrategyChange} />}
              label="Shared"
            />
          </RadioGroup>
        </FormControl>
      </Grid>
    </Grid>
  );
}

// Note: browse and search now consolidate all allowed types and strategies.
// Would that be an issue for content modellers?

interface AllowedPathsData {
  title: string;
  path: string;
  allowedContentTypes: string[];
}

function ItemSelectorBrowsePicker(props: {
  allowedBrowsePaths: AllowedPathsData[];
  onChange(e, choice: AllowedPathsData): void;
}) {
  const { allowedBrowsePaths, onChange } = props;
  const handleChange = (event: SyntheticEvent) =>
    onChange?.(event, allowedBrowsePaths[(event.target as HTMLInputElement).value]);
  return (
    <FormControl>
      <FormLabel id="contentTypeLabel">
        <FormattedMessage defaultMessage="Browse Settings" />
      </FormLabel>
      <RadioGroup aria-labelledby="contentTypeLabel" name="contentType">
        {allowedBrowsePaths?.map((data, index) => (
          <FormControlLabel
            disableTypography
            key={index}
            value={index}
            control={<Radio />}
            label={
              <Box display="flex" flexDirection="column">
                <Typography component="span">{data.title}</Typography>
                <Typography variant="body2" color="textSecondary" component="span">
                  {data.path}
                </Typography>
              </Box>
            }
            onChange={handleChange}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

function ItemSelectorSearchPicker(props: {}) {}

type PickerType = 'search' | 'browse' | 'create';

export function NodeSelector(props: NodeSelectorProps) {
  const { field, contentType, value, setValue } = props;
  const [{ item: contextItem }, apiRef] = useFormEngineContext();
  const hasContent = value.length;
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [openPickerDialog, setOpenPickerDialog] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>(null);
  const [browseDialogState, setBrowseDialogState] = useState<BrowseFilesDialogProps>({
    path: '',
    open: false,
    multiSelect: true,
    contentTypes: [],
    allowUpload: false
  });
  const handleBrowseDialogClose = () => setBrowseDialogState({ ...browseDialogState, open: false });
  const handleBrowseDialogSuccess = (items: MediaItem | MediaItem[]) => {
    const nextValue = value.concat();
    const existingKeys = nextValue.map((item) => item.key);
    asArray(items).forEach((item) => {
      !existingKeys.includes(item.path) &&
        nextValue.push({
          key: item.path,
          value: item.name,
          include: item.path,
          disableFlattening: Boolean(field.properties?.disableFlattening?.value)
        });
    });
    setValue(nextValue);
    handleBrowseDialogClose();
  };
  const addMenuButtonRef = useRef<HTMLButtonElement>();
  const contentTypes = useContentTypes();
  const siteId = useActiveSiteId();
  const { menuOptions, allowedCreateTypes, allowedCreatePaths, allowedBrowsePaths } = useMemo(() => {
    let createAllowed = false;
    const allowedCreateTypes: LookupTable<AllowedContentTypesData> = {};
    const allowedCreatePaths = new Set<string>();
    const allowedBrowsePaths: AllowedPathsData[] = [];
    const allowedSearchPaths: AllowedPathsData[] = [];

    // In dropdown, the `itemManager` "property" is called datasource
    const dataSourceIds = field.properties.itemManager.value.split(',');
    contentTypes[contentType.id].dataSources.forEach((ds) => {
      if (dataSourceIds.includes(ds.id)) {
        switch (ds.type) {
          case 'components': {
            const allowedContentTypesData: LookupTable<AllowedContentTypesData> =
              field.validations.allowedContentTypes?.value ?? [];
            const allowedContentTypes: string[] = Object.keys(allowedContentTypesData);
            const allowedSharedExisingTypes: string[] = [];
            allowedContentTypes.forEach((contentTypeId) => {
              if (allowedContentTypesData[contentTypeId].embedded) {
                createAllowed = true;
                allowedCreateTypes[contentTypeId] = allowedCreateTypes[contentTypeId] ?? {};
                allowedCreateTypes[contentTypeId].embedded = true;
              }
              if (allowedContentTypesData[contentTypeId].shared) {
                allowedCreateTypes[contentTypeId] = allowedCreateTypes[contentTypeId] ?? {};
                allowedCreateTypes[contentTypeId].shared = true;
              }
              if (allowedContentTypesData[contentTypeId].sharedExisting) {
                createAllowed = true;
                allowedSharedExisingTypes.push(contentTypeId);
              }
            });
            if (ds.properties.enableBrowse) {
              allowedBrowsePaths.push({
                title: ds.title,
                path: ds.properties.baseBrowsePath,
                allowedContentTypes: allowedSharedExisingTypes
              });
            }
            if (ds.properties.enableSearch) {
              allowedSearchPaths.push({
                title: ds.title,
                path: ds.properties.baseBrowsePath,
                allowedContentTypes: allowedSharedExisingTypes
              });
            }
            break;
          }
          case 'shared-content': {
            // Shared content DS properties:
            // - enableBrowseExisting
            // - enableCreateNew
            // - enableSearchExisting
            // - browsePath
            // - repoPath
            // - type ("Default Type" property, refers to a content type)
            const contentTypeId = ds.properties.type?.trim();
            if (ds.properties.enableBrowseExisting) {
              allowedBrowsePaths.push({
                title: ds.title,
                path: ds.properties.browsePath || ds.properties.repoPath,
                allowedContentTypes: contentTypeId ? [contentTypeId] : []
              });
            }
            if (ds.properties.enableSearchExisting) {
              allowedSearchPaths.push({
                title: ds.title,
                path: ds.properties.browsePath,
                allowedContentTypes: contentTypeId ? [contentTypeId] : []
              });
            }
            if (ds.properties.enableCreateNew) {
              createAllowed = true;
              // If the datasource has a specific type, add as an allowed, if not, add the repoPath so later on
              // the system can calculate the types allowed on that path.
              if (contentTypeId) {
                allowedCreateTypes[contentTypeId] = allowedCreateTypes[contentTypeId] ?? {};
                allowedCreateTypes[contentTypeId].shared = true;
              } else {
                allowedCreatePaths.add(ds.properties.repoPath);
              }
            }
            break;
          }
          case 'embedded-content': {
            createAllowed = true;
            // Embedded content DS properties: contentType
            const contentTypeId = ds.properties.contentType.trim();
            allowedCreateTypes[contentTypeId] = allowedCreateTypes[contentTypeId] ?? {};
            allowedCreateTypes[contentTypeId].embedded = true;
            break;
          }
          default:
            console.warn(`Unknown data source type "${ds.type}" for Item Selector control`, ds);
            return;
        }
      }
    });

    const menuOptions = [];
    const handleDataSourceOptionClick = (event: ReactMouseEvent<HTMLLIElement, MouseEvent>, option: PickerType) => {
      setAddMenuOpen(false);
      switch (option) {
        case 'browse': {
          if (allowedBrowsePaths.length === 1) {
            setBrowseDialogState({
              open: true,
              contentTypes: allowedBrowsePaths[0].allowedContentTypes,
              path: allowedBrowsePaths[0].path || '/'
            });
          } else {
            // Open browse picker
            setPickerType('browse');
            setOpenPickerDialog(true);
          }
          break;
        }
        case 'search': {
          if (allowedSearchPaths.length === 1) {
            // Open search dialog
          } else {
            // Open search picker
            setPickerType('search');
            setOpenPickerDialog(true);
          }
          break;
        }
        case 'create': {
          setPickerType('create');
          setOpenPickerDialog(true);
          break;
        }
      }
    };

    if (allowedSearchPaths.length > 0) {
      menuOptions.push(
        <MenuItem key="search" onClick={(event) => handleDataSourceOptionClick(event, 'search')}>
          <ListItemIcon sx={{ mr: 0 }}>
            <SearchRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText children={<FormattedMessage defaultMessage="Search" />} />
        </MenuItem>
      );
    }
    if (allowedBrowsePaths.length > 0) {
      menuOptions.push(
        <MenuItem key="browse" onClick={(event) => handleDataSourceOptionClick(event, 'browse')}>
          <ListItemIcon sx={{ mr: 0 }}>
            <TravelExploreOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText children={<FormattedMessage defaultMessage="Browse" />} />
        </MenuItem>
      );
    }
    if (createAllowed) {
      menuOptions.push(
        <MenuItem key="create" onClick={(event) => handleDataSourceOptionClick(event, 'create')}>
          <ListItemIcon sx={{ mr: 0 }}>
            <AddRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText children={<FormattedMessage defaultMessage="Create" />} />
        </MenuItem>
      );
    }

    return {
      menuOptions,
      allowedCreateTypes,
      allowedCreatePaths: Array.from(allowedCreatePaths),
      allowedBrowsePaths,
      allowedSearchPaths
    };
  }, [contentType.id, contentTypes, field]);
  const handleRemoveItem = (event: ReactMouseEvent, index: number) => {
    event.stopPropagation();
    const nextValue = value.concat();
    nextValue.splice(index, 1);
    setValue(nextValue);
  };
  const handleEditItem = (event: ReactMouseEvent, item: NodeSelectorItem) => {
    // console.log('Edit item', item);
    if (item.component) {
      apiRef.current.pushForm({
        update: { path: contextItem.path, modelId: item.component.objectId as string }
      });
    } else if (item.include) {
      apiRef.current.pushForm({
        update: { path: item.include }
      });
    } else {
      console.log('Is file', item);
    }
  };
  const handleClosePickerDialog = () => setOpenPickerDialog(false);
  return (
    <>
      <BrowseFilesDialog
        {...browseDialogState}
        onClose={handleBrowseDialogClose}
        onSuccess={handleBrowseDialogSuccess}
      />
      <Menu
        anchorEl={addMenuButtonRef.current}
        open={addMenuOpen}
        onClose={() => {
          setAddMenuOpen(false);
        }}
        children={menuOptions}
      />
      <Dialog open={openPickerDialog} onClose={handleClosePickerDialog} fullWidth maxWidth="sm">
        <DialogHeader
          title={<FormattedMessage defaultMessage="Choose how to proceed" />}
          onCloseButtonClick={handleClosePickerDialog}
        />
        <DialogBody>
          {(() => {
            switch (pickerType) {
              case 'browse':
                return <ItemSelectorBrowsePicker allowedBrowsePaths={allowedBrowsePaths} />;
              case 'search':
                return <div>Picker not ready</div>;
              case 'create':
                return (
                  <ItemSelectorCreatePicker
                    siteId={siteId}
                    allowedCreateTypes={allowedCreateTypes}
                    allowedCreatePaths={allowedCreatePaths}
                    contentTypesLookup={contentTypes}
                  />
                );
            }
          })()}
        </DialogBody>
        {pickerType === 'create' && (
          <DialogFooter>
            <SecondaryButton onClick={handleClosePickerDialog}>
              <FormattedMessage defaultMessage="Cancel" />
            </SecondaryButton>
            <PrimaryButton>
              <FormattedMessage defaultMessage="Accept" />
            </PrimaryButton>
          </DialogFooter>
        )}
      </Dialog>
      <FormEngineField
        field={field}
        min={field.validations.minCount?.value}
        max={field.validations.maxCount?.value}
        length={value.length}
        actions={
          <Tooltip title={<FormattedMessage defaultMessage="Add items" />}>
            <IconButton
              ref={addMenuButtonRef}
              size="small"
              color="primary"
              onClick={() => {
                setAddMenuOpen(true);
              }}
            >
              <AddRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      >
        <Box
          sx={{
            border: 1,
            display: 'flex',
            borderColor: 'divider',
            borderRadius: 1,
            ...(hasContent ? { flexDirection: 'column' } : { flexDirection: 'column' })
          }}
        >
          {hasContent ? (
            <List dense>
              {value.map((item, index) => {
                const isEmbedded = Boolean(item.component);
                const Icon = isEmbedded ? DeleteOutlined : LinkOffRoundedIcon;
                const iconTooltip = isEmbedded ? (
                  <FormattedMessage defaultMessage="Delete" />
                ) : (
                  <FormattedMessage defaultMessage="Unlink" />
                );
                return (
                  <ListItemButton
                    key={item.key}
                    divider={index !== value.length - 1}
                    onClick={(e) => handleEditItem(e, item)}
                  >
                    <ListItemText
                      primary={item.value}
                      secondary={
                        isEmbedded ? (
                          <em>
                            <FormattedMessage defaultMessage="Embedded" />
                          </em>
                        ) : (
                          (item.include ?? item.key)
                        )
                      }
                    />
                    <ListItemSecondaryAction sx={{ position: 'static', display: 'flex', transform: 'none' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={iconTooltip}>
                        <IconButton size="small" onClick={(e) => handleRemoveItem(e, index)}>
                          <Icon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItemButton>
                );
              })}
            </List>
          ) : (
            <Box
              children={menuOptions}
              sx={{
                p: 1,
                gap: 1,
                py: 0.5,
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                color: 'primary.main',
                justifyContent: 'center',
                [`.${svgIconClasses.root}`]: {
                  color: 'primary.main'
                },
                [`.${menuItemClasses.root}`]: {
                  flexDirection: 'column',
                  justifyContent: 'center',
                  borderRadius: 1
                },
                [`.${listItemIconClasses.root}`]: {
                  justifyContent: 'center'
                }
              }}
            />
          )}
        </Box>
      </FormEngineField>
    </>
  );
}

export default NodeSelector;
