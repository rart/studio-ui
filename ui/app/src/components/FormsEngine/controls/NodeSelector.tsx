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
import { ElementType, MouseEvent as ReactMouseEvent, ReactNode, useMemo, useRef, useState } from 'react';
import BrowseFilesDialog, { BrowseFilesDialogProps } from '../../BrowseFilesDialog';
import Menu from '@mui/material/Menu';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import ListSubheader, { listSubheaderClasses } from '@mui/material/ListSubheader';
import LookupTable from '../../../models/LookupTable';
import AllowedContentTypesData from '../../../models/AllowedContentTypesData';
import { asArray } from '../../../utils/array';
import ListItemIcon, { listItemIconClasses } from '@mui/material/ListItemIcon';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import { svgIconClasses } from '@mui/material';

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

interface DataSourceOptions {
  sections: {
    id: string;
    title: ReactNode;
    options: {
      key: 'newEmbedded' | 'newShared' | 'browse' | 'search';
      label: ReactNode;
      args?: Partial<{ baseBrowsePath: string; allowedTypes: string[]; contentTypeId: string; baseSearchPath: string }>;
    }[];
  }[];
}

const iconByKey: Record<DataSourceOptions['sections'][0]['options'][0]['key'], ElementType> = {
  browse: TravelExploreOutlined,
  newEmbedded: AddRounded,
  newShared: AddRounded,
  search: SearchRounded
};

export function NodeSelector(props: NodeSelectorProps) {
  const { field, contentType, value, setValue } = props;
  const [{ item: contextItem }, apiRef] = useFormEngineContext();
  const hasContent = value.length;
  const [addMenuOpen, setAddMenuOpen] = useState(false);
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
  const dataSourceOptions = useMemo<DataSourceOptions>(() => {
    const dataSourceOptions = { sections: [] };
    // In dropdown, the `itemManager` "property" is called datasource
    const dataSourceIds = field.properties.itemManager.value.split(',');
    contentTypes[contentType.id].dataSources.forEach((ds) => {
      if (dataSourceIds.includes(ds.id)) {
        const section: DataSourceOptions['sections'][0] = { id: ds.id, title: ds.title, options: [] };
        switch (ds.type) {
          case 'components': {
            const allowedContentTypesData: LookupTable<AllowedContentTypesData> =
              field.validations.allowedContentTypes?.value ?? [];
            const allowedContentTypes: string[] = Object.keys(allowedContentTypesData);
            const allowedSharedTypes: string[] = [];
            allowedContentTypes.forEach((contentTypeId) => {
              if (allowedContentTypesData[contentTypeId].embedded) {
                section.options.push({
                  key: 'newEmbedded',
                  label: (
                    <FormattedMessage
                      defaultMessage="Create embedded {contentType}"
                      values={{ contentType: contentTypes[contentTypeId].name }}
                    />
                  ),
                  args: { contentTypeId }
                });
              }
              if (allowedContentTypesData[contentTypeId].shared) {
                section.options.push({
                  key: 'newShared',
                  label: (
                    <FormattedMessage
                      defaultMessage="Create shared {contentType}"
                      values={{ contentType: contentTypes[contentTypeId].name }}
                    />
                  ),
                  args: { contentTypeId }
                });
              }
              if (allowedContentTypesData[contentTypeId].sharedExisting) {
                allowedSharedTypes.push(contentTypeId);
              }
            });
            if (ds.properties.enableBrowse) {
              section.options.push({
                key: 'browse',
                label: <FormattedMessage defaultMessage="Browse" />,
                args: { ...ds.properties, allowedTypes: allowedSharedTypes }
              });
            }
            if (ds.properties.enableSearch) {
              section.options.push({
                key: 'search',
                label: <FormattedMessage defaultMessage="Search" />,
                args: { ...ds.properties, allowedTypes: allowedSharedTypes }
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
            // - type ("Default Type" property)
            if (ds.properties.enableBrowseExisting) {
              section.options.push({
                key: 'browse',
                label: <FormattedMessage defaultMessage="Browse" />,
                args: {
                  baseBrowsePath: ds.properties.browsePath,
                  allowedTypes: [ds.properties.type].filter(Boolean)
                }
              });
            }
            if (ds.properties.enableSearchExisting) {
              section.options.push({
                key: 'search',
                label: <FormattedMessage defaultMessage="Search" />,
                args: {
                  baseSearchPath: ds.properties.repoPath
                }
              });
            }
            if (ds.properties.enableCreateNew) {
              section.options.push({
                key: 'newShared',
                label: <FormattedMessage defaultMessage="Create shared content" />,
                args: {}
              });
            }
            break;
          }
          case 'embedded-content': {
            // Embedded content DS properties: contentType
            section.options.push({
              key: 'newShared',
              label: <FormattedMessage defaultMessage="Create embedded content" />,
              args: { allowedTypes: [ds.properties.contentType] }
            });
            break;
          }
          default:
            console.warn(`Unknown data source type "${ds.type}" for Item Selector control`, ds);
            return;
        }
        dataSourceOptions.sections.push(section);
      }
    });
    return dataSourceOptions;
  }, [contentType.id, contentTypes, field]);
  const handleDataSourceOptionClick = (
    event: ReactMouseEvent<HTMLLIElement, MouseEvent>,
    option: DataSourceOptions['sections'][0]['options'][0]
  ) => {
    setAddMenuOpen(false);
    switch (option.key) {
      case 'browse': {
        const { allowedTypes, baseBrowsePath } = option.args;
        setBrowseDialogState({ ...browseDialogState, open: true, contentTypes: allowedTypes, path: baseBrowsePath });
        break;
      }
      case 'search': {
        break;
      }
      case 'newEmbedded': {
        break;
      }
      case 'newShared': {
        break;
      }
    }
  };
  const handleRemoveItem = (event: ReactMouseEvent, index: number) => {
    event.stopPropagation();
    const nextValue = value.concat();
    nextValue.splice(index, 1);
    setValue(nextValue);
  };
  const menuOptions = dataSourceOptions.sections.flatMap((section, index) => {
    return [
      <ListSubheader disableSticky key={`${section.title}_header_${index}`} sx={{ backgroundColor: 'inherit' }}>
        {section.title}
      </ListSubheader>,
      <div key={`${section.title}_items_${index}`} className="datasource-menu-options">
        {section.options.map((option) => {
          const Icon = iconByKey[option.key];
          return (
            <MenuItem
              key={`${section.id}-${option.key}`}
              onClick={(event) => handleDataSourceOptionClick(event, option)}
            >
              <ListItemIcon sx={{ mr: 0 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText children={option.label} />
            </MenuItem>
          );
        })}
      </div>
    ];
  });
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
        sx={{
          [`.${menuItemClasses.root}`]: { pl: 3 }
        }}
      >
        {menuOptions}
      </Menu>
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
              sx={{
                [`.${listSubheaderClasses.root}`]: {
                  textAlign: 'center',
                  bgcolor: 'background.default',
                  lineHeight: 2.5
                },
                '.datasource-menu-options': {
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
                }
              }}
            >
              {menuOptions}
            </Box>
          )}
        </Box>
      </FormEngineField>
    </>
  );
}

export default NodeSelector;
