/*
 * Copyright (C) 2007-2021 Crafter Software Corporation. All Rights Reserved.
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

import LauncherTile from '../LauncherTile';
import React from 'react';
import { SystemIconDescriptor } from '../SystemIcon';
import TranslationOrText from '../../models/TranslationOrText';
import { useDispatch } from 'react-redux';
import { closeLauncher, showWidgetDialog } from '../../state/actions/dialogs';
import { batchActions } from '../../state/actions/misc';
import { useActiveSiteId } from '../../utils/hooks/useActiveSiteId';
import { useEnv } from '../../utils/hooks/useEnv';
import { usePossibleTranslation } from '../../utils/hooks/usePossibleTranslation';
import { getSystemLink, SystemLinkId } from '../../utils/system';
import { useLegacyPreviewPreference } from '../../utils/hooks/useLegacyPreviewPreference';

export interface LauncherLinkTileProps {
  title: TranslationOrText;
  icon: SystemIconDescriptor;
  link?: string;
  systemLinkId?: SystemLinkId;
}

const LauncherLinkTile = (props: LauncherLinkTileProps) => {
  const { icon, systemLinkId, title: propTitle } = props;
  const { authoringBase } = useEnv();
  const site = useActiveSiteId();
  const useLegacy = useLegacyPreviewPreference();
  const dispatch = useDispatch();
  const title = usePossibleTranslation(propTitle);

  const onClick = ['siteDashboardDialog', 'siteToolsDialog', 'siteSearchDialog'].includes(systemLinkId)
    ? (e) => {
        e.preventDefault();
        dispatch(
          batchActions([
            closeLauncher(),
            showWidgetDialog({
              id: systemLinkId,
              title,
              ...(systemLinkId === 'siteDashboardDialog'
                ? {
                    widget: {
                      id: 'craftercms.components.Dashboard'
                    }
                  }
                : systemLinkId === 'siteToolsDialog'
                ? {
                    widget: {
                      id: 'craftercms.components.EmbeddedSearchIframe'
                    }
                  }
                : {
                    widget: {
                      id: 'craftercms.components.EmbeddedSiteTools'
                    }
                  })
            })
          ])
        );
      }
    : null;

  const link = ['siteDashboard', 'siteTools', 'siteSearch'].includes(systemLinkId)
    ? null
    : props.link ?? getSystemLink({ systemLinkId, authoringBase, site, useLegacy });

  return <LauncherTile icon={icon} onClick={onClick} title={usePossibleTranslation(title)} link={link} />;
};

export default LauncherLinkTile;
