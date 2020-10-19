/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
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

import React, { useEffect, useMemo, useState } from 'react';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import KeyboardArrowLeftRounded from '@material-ui/icons/KeyboardArrowLeftRounded';
import KeyboardArrowRightRounded from '@material-ui/icons/KeyboardArrowRightRounded';
import RefreshRounded from '@material-ui/icons/RefreshRounded';
import MoreVertRounded from '@material-ui/icons/MoreVertRounded';
import ToolbarGlobalNav from '../../components/Navigation/ToolbarGlobalNav';
import CustomMenu from '../../components/Icons/CustomMenu';
import {
  changeCurrentUrl,
  closeTools,
  openTools,
  RELOAD_REQUEST,
  setPreviewEditMode
} from '../../state/actions/preview';
import { useDispatch } from 'react-redux';
import { Site } from '../../models/Site';
import { LookupTable } from '../../models/LookupTable';
import {
  useActiveSiteId,
  usePermissions,
  usePreviewGuest,
  usePreviewState,
  useSelection
} from '../../utils/hooks';
import { getHostToGuestBus } from './previewContext';
import { isBlank } from '../../utils/string';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import QuickCreate from './QuickCreate';
import { changeSite } from '../../state/reducers/sites';
import Switch from '@material-ui/core/Switch';
import Tooltip from '@material-ui/core/Tooltip';
import withStyles from '@material-ui/core/styles/withStyles';
import { useSnackbar } from 'notistack';
import palette from '../../styles/palette';
import SingleItemSelector from '../Content/Authoring/SingleItemSelector';
import { DetailedItem, SandboxItem } from '../../models/Item';
import { ItemMenu } from '../../components/ItemMenu/ItemMenu';
import SearchAhead from '../../components/Controls/SearchAhead';

const translations = defineMessages({
  openToolsPanel: {
    id: 'openToolsPanel.label',
    defaultMessage: 'Open tools panel'
  },
  toggleEditMode: {
    id: 'previewToolbar.toggleEditMode',
    defaultMessage: 'Toggle edit mode'
  },
  editModeOn: {
    id: 'previewToolbar.editModeOn',
    defaultMessage: 'Edit mode switched on'
  },
  editModeOff: {
    id: 'previewToolbar.editModeOff',
    defaultMessage: 'Edit mode switched off'
  }
});

const foo = () => void 0;

const EditSwitch = withStyles({
  checked: {
    color: palette.green.tint
  }
})(Switch);

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    toolBar: {
      placeContent: 'center space-between'
      // background: palette.gray.dark4
    },
    addressBarInput: {
      width: 400,
      padding: '2px 4px',
      // margin: '0 5px 0 0 ',
      display: 'flex',
      alignItems: 'center'
      // backgroundColor: palette.gray.dark6
    },
    inputContainer: {
      marginLeft: theme.spacing(1)
    },
    input: {
      border: 'none',
      '&:focus:invalid, &:focus': {
        border: 'none',
        boxShadow: 'none'
      }
    },
    iconButton: {
    },
    divider: {
      height: 28,
      margin: 4
    },
    addressBarContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    actionButtonSection: {
      display: 'flex',
      alignItems: 'center',

      '& > *': {
        marginRight: theme.spacing(1)
      }
    },
    globalNavSection: {
      display: 'flex',
      alignItems: 'center'
    },
    selectorPopoverRoot: {
      width: 400,
      marginLeft: '4px'
    },
    hidden: {
      visibility: 'hidden'
    }
  })
);

interface AddressBarProps {
  site: string;
  url: string;
  item?: Partial<SandboxItem>;
  onSiteChange: (siteId: string) => any;
  onUrlChange: (value: string) => any;
  onRefresh: (e) => any;
  sites: { id: string; name: string }[];
}

export function AddressBar(props: AddressBarProps) {
  const classes = useStyles({});
  const {
    site,
    url = '',
    sites = [],
    item,
    onSiteChange = foo,
    onUrlChange = foo,
    onRefresh = foo
  } = props;
  const noSiteSet = isBlank(site);
  const [internalUrl, setInternalUrl] = useState(url);
  const [anchorEl, setAnchorEl] = useState(null);
  const path = useSelection<string>((state) => state.preview.guest?.path);
  const [openSelector, setOpenSelector] = useState(false);

  useEffect(() => {
    url && setInternalUrl(url);
  }, [url]);

  const onSiteChangeInternal = (value) => !isBlank(value) && value !== site && onSiteChange(value);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton className={classes.iconButton} aria-label="search">
        <KeyboardArrowLeftRounded />
      </IconButton>
      <IconButton className={classes.iconButton} aria-label="search">
        <KeyboardArrowRightRounded />
      </IconButton>
      <IconButton className={classes.iconButton} aria-label="search" onClick={onRefresh}>
        <RefreshRounded />
      </IconButton>
      <Paper className={classes.addressBarInput}>
        <Select
          value={site}
          classes={{ select: classes.input }}
          onChange={({ target: { value } }) => onSiteChangeInternal(value)}
          displayEmpty
        >
          {noSiteSet && (
            <MenuItem value="">
              <FormattedMessage
                id="previewToolBar.siteSelectorNoSiteSelected"
                defaultMessage="Choose site"
              />
            </MenuItem>
          )}
          {sites.map(({ id, name }) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
        </Select>
        <SearchAhead
          value={internalUrl}
          placeholder={noSiteSet ? '' : '/'}
          disabled={noSiteSet}
          onEnter={(value) => onUrlChange(value)}
          classes={{
            input: classes.input
          }}
        />
        <SingleItemSelector
          disabled={noSiteSet}
          rootPath="/site/website"
          selectedItem={item as DetailedItem}
          open={openSelector}
          onClose={() => setOpenSelector(false)}
          onDropdownClick={() => setOpenSelector(!openSelector)}
          onItemClicked={(item) => {
            setOpenSelector(false);
            setInternalUrl(item.previewUrl);
            onUrlChange(item.previewUrl);
          }}
          hideUI
          classes={{
            popoverRoot: classes.selectorPopoverRoot
          }}
        />
      </Paper>
      <IconButton className={classes.iconButton} aria-label="search" onClick={handleClick}>
        <MoreVertRounded />
      </IconButton>
      {Boolean(anchorEl) && (
        <ItemMenu
          open={true}
          anchorEl={anchorEl}
          onClose={handleClose}
          path={path}
          loaderItems={13}
        />
      )}
    </>
  );
}

export default function ToolBar() {
  const { formatMessage } = useIntl();
  const classes = useStyles({});
  const dispatch = useDispatch();
  const site = useActiveSiteId();
  const sitesTable = useSelection<LookupTable<Site>>((state) => state.sites.byId);
  const editMode = useSelection((state) => state.preview.editMode);
  const sites = useMemo(() => Object.values(sitesTable), [sitesTable]);
  const { computedUrl, showToolsPanel } = usePreviewState();
  const guest = usePreviewGuest();
  const modelId = guest?.modelId;
  const models = guest?.models;
  const item = models?.[modelId]
    ? {
        id: models[modelId].craftercms.id,
        path: models[modelId].craftercms.path,
        label: models[modelId].craftercms.label
      }
    : null;
  const { enqueueSnackbar } = useSnackbar();

  // region permissions
  const permissions = usePermissions();
  const write = permissions?.[item?.path]?.['write'];
  const createContent = permissions?.[item?.path]?.['create_content'];
  // endregion

  return (
    <AppBar position="static" color="default">
      <Toolbar className={classes.toolBar}>
        <section className={classes.actionButtonSection}>
          <IconButton
            aria-label={formatMessage(translations.openToolsPanel)}
            onClick={() => dispatch(showToolsPanel ? closeTools() : openTools())}
          >
            <CustomMenu />
          </IconButton>
          <section className={!createContent ? classes.hidden : ''}>
            <QuickCreate />
          </section>
          <Tooltip
            title={formatMessage(translations.toggleEditMode)}
            className={!write ? classes.hidden : ''}
          >
            <EditSwitch
              color="default"
              checked={editMode}
              onChange={(e) => {
                // prettier-ignore
                enqueueSnackbar(formatMessage(
                  e.target.checked
                    ? translations.editModeOn
                    : translations.editModeOff
                ));
                dispatch(setPreviewEditMode({ editMode: e.target.checked }));
              }}
            />
          </Tooltip>
        </section>
        <section className={classes.addressBarContainer}>
          <AddressBar
            site={site ?? ''}
            sites={sites}
            url={computedUrl}
            item={item}
            onSiteChange={(site) => dispatch(changeSite(site))}
            onUrlChange={(url) => dispatch(changeCurrentUrl(url))}
            onRefresh={() => getHostToGuestBus().next({ type: RELOAD_REQUEST })}
          />
        </section>
        <div className={classes.globalNavSection}>
          <ToolbarGlobalNav />
        </div>
      </Toolbar>
    </AppBar>
  );
}
